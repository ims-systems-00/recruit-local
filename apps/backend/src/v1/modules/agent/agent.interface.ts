import { Types } from "mongoose";
import {
  ISession,
  AGENT_STOPPED_REASON,
  AGENT_TRACE_STATUS,
  AgentLlmCallDto,
  AgentStepDto,
  AgentToolTraceDto,
  AgentUsageDto,
} from "@rl/types";
import { IServiceListParams, IServiceGetParams } from "../../../common/interface/service.interface";
import { AgentConversationInput, IAgentConversationDoc } from "../../../models/agent-conversation.model";
import { AgentTraceInput } from "../../../models/agent-trace.model";

export type IListAgentConversationParams = IServiceListParams<AgentConversationInput>;
export type IAgentConversationGetParams = IServiceGetParams<AgentConversationInput>;

export interface ICreateConversationParams {
  session: ISession;
  title: string;
}

export interface IAgentRunParams {
  conversation: IAgentConversationDoc;
  instruction: string;
  session: ISession;
}

export interface IAgentRunResult {
  answer: string;
  stoppedReason: AGENT_STOPPED_REASON;
  steps: AgentStepDto[];
  usage?: AgentUsageDto;
}

/** The `_id` is supplied by the collector so a run can be logged before it is written. */
export type IRecordTraceParams = AgentTraceInput & { _id: Types.ObjectId };

export interface ITraceStatsParams {
  from?: Date;
  to?: Date;
}

export interface IAgentTraceOutcome {
  status: AGENT_TRACE_STATUS;
  stoppedReason?: AGENT_STOPPED_REASON | null;
  error?: string | null;
}

/**
 * Write-only, from the loop's point of view: the loop reports spans and never
 * reads the trace back. `flush` resolves even when the write failed.
 */
export interface IAgentTraceCollector {
  readonly runId: Types.ObjectId;
  /** Which stored prompt version framed the run; `version` is null on fallback. */
  recordPrompt(entry: { name: string; version: number | null }): void;
  recordTool(entry: Omit<AgentToolTraceDto, "seq">): void;
  recordLlmCall(entry: Omit<AgentLlmCallDto, "seq">): void;
  setOutcome(outcome: IAgentTraceOutcome): void;
  flush(): Promise<void>;
}
