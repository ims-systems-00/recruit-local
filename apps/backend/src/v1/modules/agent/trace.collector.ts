import { Types } from "mongoose";
import {
  AGENT_LLM_CALL_PURPOSE,
  AGENT_STOPPED_REASON,
  AGENT_TRACE_STATUS,
  AgentLlmCallDto,
  AgentToolTraceDto,
  AgentUsageDto,
} from "@rl/types";
import { logger } from "../../../common/helper";
import { AGENT_MODEL } from "./llm/client";
import * as traceService from "./trace.service";
import { IAgentRunParams, IAgentTraceCollector, IAgentTraceOutcome } from "./agent.interface";

/**
 * Accumulates one run's measurements in memory, then writes them once.
 *
 * In memory rather than a row per span because a run is the unit of analysis,
 * and because a DB round trip inside the tool loop would add latency to the very
 * thing being measured.
 *
 * The collector is created before any work starts and flushed from a `finally`,
 * so a run that throws still produces a trace. A partial trace of a run that
 * died on step 4 still shows steps 1-3 were slow, which is the whole point.
 */
export const createTraceCollector = ({ conversation, instruction, session }: IAgentRunParams): IAgentTraceCollector => {
  // Pre-generated so it can be logged before the document exists: this is the
  // correlation id the agent had no way to produce until now.
  const runId = new Types.ObjectId();
  const startedAt = Date.now();

  const toolTrace: AgentToolTraceDto[] = [];
  const llmCalls: AgentLlmCallDto[] = [];

  // Pessimistic default: a run only becomes `succeeded` by explicitly saying so,
  // so an exit path nobody thought about records as a failure rather than
  // quietly claiming success.
  let status: AGENT_TRACE_STATUS = AGENT_TRACE_STATUS.FAILED;
  let stoppedReason: AGENT_STOPPED_REASON | null = null;
  let error: string | null = null;
  let flushed = false;

  const sum = <T>(entries: T[], pick: (entry: T) => number | undefined) =>
    entries.reduce((total, entry) => total + (pick(entry) ?? 0), 0);

  /**
   * Summed from the calls themselves rather than taken from the loop's running
   * total, so the figure is still right when the run threw half way through.
   */
  const totalUsage = (): AgentUsageDto => ({
    promptTokens: sum(llmCalls, (call) => call.usage?.promptTokens),
    completionTokens: sum(llmCalls, (call) => call.usage?.completionTokens),
    totalTokens: sum(llmCalls, (call) => call.usage?.totalTokens),
  });

  return {
    runId,

    recordTool(entry: Omit<AgentToolTraceDto, "seq">) {
      toolTrace.push({ ...entry, seq: toolTrace.length });
    },

    recordLlmCall(entry: Omit<AgentLlmCallDto, "seq">) {
      llmCalls.push({ ...entry, seq: llmCalls.length });
    },

    setOutcome(outcome: IAgentTraceOutcome) {
      status = outcome.status;
      stoppedReason = outcome.stoppedReason ?? null;
      error = outcome.error ?? null;
    },

    /**
     * Never rejects and never throws. Tracing must not be able to turn a working
     * agent run into a 500 — a lost trace is an acceptable outcome, a lost
     * answer is not.
     */
    async flush() {
      if (flushed) return;
      flushed = true;

      try {
        await traceService.record({
          _id: runId,
          conversationId: conversation._id as Types.ObjectId,
          userId: new Types.ObjectId(session.user._id),
          userType: session.user?.type ?? "",
          tenantId: session.tenantId ? new Types.ObjectId(session.tenantId) : null,
          jobProfileId: session.jobProfileId ? new Types.ObjectId(session.jobProfileId) : null,
          prompt: instruction,
          // The run's configured model, not one read back off a response, so it
          // is recorded even when every call failed.
          llmModel: AGENT_MODEL,
          status,
          stoppedReason,
          error,
          // One `step` call per loop iteration, which makes this an accurate
          // count on the failure path too — unlike anything passed in at the end.
          steps: llmCalls.filter((call) => call.purpose === AGENT_LLM_CALL_PURPOSE.STEP).length,
          toolCallCount: toolTrace.length,
          llmCallCount: llmCalls.length,
          totalDurationMs: Date.now() - startedAt,
          toolDurationMs: sum(toolTrace, (entry) => entry.durationMs),
          llmDurationMs: sum(llmCalls, (call) => call.durationMs),
          usage: totalUsage(),
          toolTrace,
          llmCalls,
        });
      } catch (flushError) {
        logger.warn("[agent] failed to write run trace", {
          runId: String(runId),
          conversationId: String(conversation._id),
          error: flushError instanceof Error ? flushError.message : String(flushError),
        });
      }
    },
  };
};
