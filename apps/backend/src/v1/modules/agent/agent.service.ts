import OpenAI from "openai";
import { AGENT_MESSAGE_ROLE, AGENT_STOPPED_REASON, AgentStepDto, AgentUsageDto } from "@rl/types";
import { logger } from "../../../common/helper";
import { validate } from "../../../common/helper/validate";
import { llm, AGENT_MODEL } from "./llm/client";
import { findTool, toolDefinitionsFor } from "./tools";
import { buildSystemPrompt, MAX_STEPS, RUN_DEADLINE_MS } from "./agent.constants";
import * as conversationService from "./conversation.service";
import { IAgentRunParams, IAgentRunResult } from "./agent.interface";

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
// The SDK's tool-call type is a union of function and "custom" calls. Only
// function calls are ever requested here, so narrow once at the boundary.
type ToolCall = OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall;

/**
 * Turns a tool failure into something the model can read and react to.
 * A tool that throws must not fail the run — the model is usually able to
 * correct itself (bad id, wrong filter) if it is told what went wrong.
 */
const errorPayload = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  return JSON.stringify({ ok: false, error: message });
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
      error: error instanceof Error ? error.message : String(error),
    });
    await persist(content, false);

    return {
      step: {
        tool: name,
        input,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
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
 */
export const runAgent = async ({ conversation, instruction, session }: IAgentRunParams): Promise<IAgentRunResult> => {
  const deadline = Date.now() + RUN_DEADLINE_MS;
  const steps: AgentStepDto[] = [];
  let usage: AgentUsageDto = {};

  const history = await conversationService.replayHistory(conversation._id as never);

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(session) },
    ...history,
    // The instruction is a user message. It is never interpolated into the
    // system prompt, so it cannot rewrite the agent's framing.
    { role: "user", content: instruction },
  ];

  const tools = toolDefinitionsFor(session);

  for (let step = 0; step < MAX_STEPS; step++) {
    if (Date.now() > deadline) {
      return finish(conversation, messages, steps, usage, AGENT_STOPPED_REASON.DEADLINE);
    }

    const completion = await llm.chat.completions.create({
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
      messages.push({ role: "tool", tool_call_id: toolCall.id, content });
    }
  }

  return finish(conversation, messages, steps, usage, AGENT_STOPPED_REASON.MAX_STEPS);
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
  stoppedReason: AGENT_STOPPED_REASON
): Promise<IAgentRunResult> => {
  let answer = "";

  try {
    const completion = await llm.chat.completions.create({
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
    conversationId: String(conversation._id),
    stoppedReason,
    steps: steps.length,
  });

  return { answer, stoppedReason, steps, usage };
};
