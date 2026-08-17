import OpenAI from "openai";
import {
  AGENT_LLM_CALL_PURPOSE,
  AGENT_MESSAGE_ROLE,
  AGENT_STOPPED_REASON,
  AGENT_TRACE_STATUS,
  AgentStepDto,
  AgentUsageDto,
  PROMPT_NAME,
} from "@rl/types";
import { logger } from "../../../common/helper";
import { validate } from "../../../common/helper/validate";
import { llm, AGENT_MODEL } from "./llm/client";
import { findTool, toolDefinitionsFor } from "./tools";
import {
  buildSystemPrompt,
  CONTEXT_BUDGET_TOKENS,
  MAX_OUTPUT_TOKENS,
  MAX_STEPS,
  RUN_DEADLINE_MS,
  TOOL_RESULT_MAX_CHARS,
} from "./agent.constants";
import { fitToBudget, truncate } from "./context";
import * as conversationService from "./conversation.service";
import { createTraceCollector } from "./trace.collector";
import { IAgentRunParams, IAgentRunResult, IAgentTraceCollector } from "./agent.interface";

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
// The SDK's tool-call type is a union of function and "custom" calls. Only
// function calls are ever requested here, so narrow once at the boundary.
type ToolCall = OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall;

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * Turns a tool failure into something the model can read and react to.
 * A tool that throws must not fail the run — the model is usually able to
 * correct itself (bad id, wrong filter) if it is told what went wrong.
 */
const errorPayload = (error: unknown): string => {
  return JSON.stringify({ ok: false, error: messageOf(error) });
};

const accumulateUsage = (total: AgentUsageDto, usage?: OpenAI.Completions.CompletionUsage): AgentUsageDto => {
  if (!usage) return total;
  return {
    promptTokens: (total.promptTokens ?? 0) + (usage.prompt_tokens ?? 0),
    completionTokens: (total.completionTokens ?? 0) + (usage.completion_tokens ?? 0),
    totalTokens: (total.totalTokens ?? 0) + (usage.total_tokens ?? 0),
  };
};

/**
 * The single door to the model, so latency and per-call tokens are captured the
 * same way wherever the loop calls out.
 *
 * Per-call usage is the point: `accumulateUsage` only ever keeps a running
 * total, which cannot tell you whether the tenth step is the expensive one.
 *
 * Both token brakes live here rather than at the call sites, for the same reason
 * tracing does. A cap that has to be remembered at each `create` is a cap that a
 * future call site ships without: applying them at the one door makes "every
 * request is bounded on both sides" true by construction instead of by review.
 * `max_completion_tokens` rather than the deprecated `max_tokens` — note that a
 * gateway behind `AGENT_LLM_BASE_URL` may only accept the older field.
 */
const callLlm = async (
  trace: IAgentTraceCollector,
  purpose: AGENT_LLM_CALL_PURPOSE,
  body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
) => {
  const startedAt = Date.now();
  const fitted = fitToBudget(body.messages, CONTEXT_BUDGET_TOKENS);

  if (fitted.trimmed > 0) {
    // Not an error — the run continues on a shortened transcript. It does mean a
    // tool is returning more than it needs to, which is worth fixing at source.
    logger.warn("[agent] trimmed context to fit the budget", {
      runId: String(trace.runId),
      purpose,
      trimmedMessages: fitted.trimmed,
      estimatedTokens: fitted.estimatedTokens,
      budgetTokens: CONTEXT_BUDGET_TOKENS,
    });
  }

  try {
    const completion = await llm.chat.completions.create({
      max_completion_tokens: MAX_OUTPUT_TOKENS,
      ...body,
      messages: fitted.messages,
    });

    trace.recordLlmCall({
      purpose,
      llmModel: body.model,
      ok: true,
      durationMs: Date.now() - startedAt,
      finishReason: completion.choices[0]?.finish_reason ?? null,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    });

    return completion;
  } catch (error) {
    trace.recordLlmCall({
      purpose,
      llmModel: body.model,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: messageOf(error),
    });
    throw error;
  }
};

/**
 * Runs one tool call: validate the model's arguments, execute under the
 * caller's session, persist the result. Always resolves — failures come back as
 * a serialized error for the model rather than as a throw.
 */
const runToolCall = async ({
  toolCall,
  session,
  conversationId,
}: {
  toolCall: ToolCall;
  session: IAgentRunParams["session"];
  conversationId: IAgentRunParams["conversation"]["_id"];
}): Promise<{ step: AgentStepDto; content: string }> => {
  const startedAt = Date.now();
  const name = toolCall.function.name;
  let input: Record<string, unknown> | undefined;

  const persist = async (content: string, ok: boolean) => {
    await conversationService.addMessage({
      conversationId: conversationId as never,
      role: AGENT_MESSAGE_ROLE.TOOL,
      content,
      toolCallId: toolCall.id,
      toolName: name,
      ok,
      durationMs: Date.now() - startedAt,
    });
  };

  const fail = async (message: string): Promise<{ step: AgentStepDto; content: string }> => {
    const content = JSON.stringify({ ok: false, error: message });
    await persist(content, false);
    return {
      step: { tool: name, input, ok: false, error: message, durationMs: Date.now() - startedAt },
      content,
    };
  };

  const tool = findTool(session, name);
  if (!tool) {
    // Either a hallucinated name or one the model was never offered.
    return fail(`Unknown tool "${name}". Use only the tools provided to you.`);
  }

  try {
    input = JSON.parse(toolCall.function.arguments || "{}");
  } catch {
    return fail("Tool arguments were not valid JSON.");
  }

  // The model's output is untrusted input, whatever the JSON Schema advertised.
  const errors = validate(tool.inputSchema, input);
  if (errors) return fail(Object.values(errors).join(", "));

  try {
    const result = await tool.execute(input, { session });
    const content = JSON.stringify({ ok: true, result });

    logger.debug(`[agent] tool ${name} succeeded`, { conversationId: String(conversationId), input, result });
    await persist(content, true);

    return {
      step: { tool: name, input, ok: true, durationMs: Date.now() - startedAt },
      content,
    };
  } catch (error) {
    const content = errorPayload(error);
    logger.warn(`[agent] tool ${name} failed`, {
      conversationId: String(conversationId),
      input,
      error: messageOf(error),
    });
    await persist(content, false);

    return {
      step: {
        tool: name,
        input,
        ok: false,
        error: messageOf(error),
        durationMs: Date.now() - startedAt,
      },
      content,
    };
  }
};

/**
 * The agent loop.
 *
 * Pure in the sense that matters: it takes a conversation, an instruction and a
 * session, and touches no `req`/`res`. That is what makes moving it onto a
 * BullMQ worker later an additive change.
 *
 * The caller is responsible for the ownership check, the fingerprint check, the
 * run lock, and persisting the user's own message.
 *
 * This wrapper exists for the `finally`: the loop below returns from three
 * places and can also throw, so bracketing it is the only way to guarantee one
 * trace per run. A run that blows up still records the spans it managed.
 */
export const runAgent = async (params: IAgentRunParams): Promise<IAgentRunResult> => {
  const trace = createTraceCollector(params);

  try {
    const result = await execute(params, trace);
    trace.setOutcome({ status: AGENT_TRACE_STATUS.SUCCEEDED, stoppedReason: result.stoppedReason });
    return result;
  } catch (error) {
    trace.setOutcome({ status: AGENT_TRACE_STATUS.FAILED, error: messageOf(error) });
    // Rethrown unchanged — tracing observes the run, it does not handle it.
    throw error;
  } finally {
    await trace.flush();
  }
};

const execute = async (
  { conversation, instruction, session }: IAgentRunParams,
  trace: IAgentTraceCollector
): Promise<IAgentRunResult> => {
  const deadline = Date.now() + RUN_DEADLINE_MS;
  const steps: AgentStepDto[] = [];
  let usage: AgentUsageDto = {};

  const history = await conversationService.replayHistory(conversation._id as never);

  // Recorded on the trace so a bad answer is traceable to the exact instructions
  // that produced it. Only the base prompt's version is tracked: it carries the
  // substantive rules, while the role block is a short framing paragraph.
  const systemPrompt = await buildSystemPrompt(session);
  trace.recordPrompt({ name: PROMPT_NAME.AGENT_SYSTEM_BASE, version: systemPrompt.version });

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt.content },
    ...history,
    // The instruction is a user message. It is never interpolated into the
    // system prompt, so it cannot rewrite the agent's framing.
    { role: "user", content: instruction },
  ];

  const tools = toolDefinitionsFor(session);

  for (let step = 0; step < MAX_STEPS; step++) {
    if (Date.now() > deadline) {
      return finish(conversation, messages, steps, usage, AGENT_STOPPED_REASON.DEADLINE, trace);
    }

    const completion = await callLlm(trace, AGENT_LLM_CALL_PURPOSE.STEP, {
      model: AGENT_MODEL,
      messages,
      ...(tools.length > 0 ? { tools } : {}),
    });

    usage = accumulateUsage(usage, completion.usage);

    const choice = completion.choices[0]?.message;
    const toolCalls = (choice?.tool_calls ?? []).filter((call): call is ToolCall => call.type === "function");

    // No tool calls means the model considers itself done.
    if (toolCalls.length === 0) {
      const answer = choice?.content ?? "";
      await conversationService.addMessage({
        conversationId: conversation._id as never,
        role: AGENT_MESSAGE_ROLE.ASSISTANT,
        content: answer,
        usage,
      });
      return { answer, stoppedReason: AGENT_STOPPED_REASON.COMPLETED, steps, usage };
    }

    messages.push({
      role: "assistant",
      content: choice?.content ?? null,
      tool_calls: toolCalls,
    });
    await conversationService.addMessage({
      conversationId: conversation._id as never,
      role: AGENT_MESSAGE_ROLE.ASSISTANT,
      content: choice?.content ?? null,
      toolCalls: toolCalls as never,
      usage,
    });

    for (const toolCall of toolCalls) {
      const { step: stepResult, content } = await runToolCall({
        toolCall,
        session,
        conversationId: conversation._id,
      });
      steps.push(stepResult);
      // Fields picked rather than spread: `input` stays out of the trace, since
      // it can carry user-typed PII and is already in the transcript.
      trace.recordTool({
        tool: stepResult.tool,
        ok: stepResult.ok,
        error: stepResult.error ?? null,
        durationMs: stepResult.durationMs ?? 0,
      });
      // Truncated for the model only. `runToolCall` has already persisted the
      // full result, so the stored transcript stays complete for debugging while
      // the context stays bounded — do not collapse these two into one string.
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: truncate(content, TOOL_RESULT_MAX_CHARS),
      });
    }
  }

  return finish(conversation, messages, steps, usage, AGENT_STOPPED_REASON.MAX_STEPS, trace);
};

/**
 * Wraps up a run that hit a brake rather than finishing naturally. Asks the
 * model once, without tools, to summarise what it has so the user gets a real
 * answer instead of an empty string.
 */
const finish = async (
  conversation: IAgentRunParams["conversation"],
  messages: ChatMessage[],
  steps: AgentStepDto[],
  usage: AgentUsageDto,
  stoppedReason: AGENT_STOPPED_REASON,
  trace: IAgentTraceCollector
): Promise<IAgentRunResult> => {
  let answer = "";

  try {
    const completion = await callLlm(trace, AGENT_LLM_CALL_PURPOSE.SUMMARY, {
      model: AGENT_MODEL,
      messages: [
        ...messages,
        {
          role: "user",
          content:
            "Stop calling tools. Summarise what you found so far in plain prose, and say clearly what you were unable to finish.",
        },
      ],
    });
    usage = accumulateUsage(usage, completion.usage);
    answer = completion.choices[0]?.message?.content ?? "";
  } catch (error) {
    // Swallowed on purpose — a failed summary should still return the canned
    // answer rather than losing the whole run. The error itself is not lost:
    // `callLlm` has already recorded it on the trace as a failed span.
    logger.error("[agent] failed to summarise an interrupted run", error);
    answer = "I ran out of time before I could finish that. Please try narrowing the request.";
  }

  await conversationService.addMessage({
    conversationId: conversation._id as never,
    role: AGENT_MESSAGE_ROLE.ASSISTANT,
    content: answer,
    usage,
  });

  logger.info("[agent] run stopped early", {
    runId: String(trace.runId),
    conversationId: String(conversation._id),
    stoppedReason,
    steps: steps.length,
  });

  return { answer, stoppedReason, steps, usage };
};
