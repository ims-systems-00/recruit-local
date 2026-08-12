import { Schema, model, Model, Types } from "mongoose";
import {
  AGENT_LLM_CALL_PURPOSE,
  AGENT_STOPPED_REASON,
  AGENT_TRACE_STATUS,
  AgentLlmCallDto,
  AgentToolTraceDto,
} from "@rl/types";
import { AgentConversation } from "./agent-conversation.model";
import { User } from "./user.model";
import { IBaseDoc } from "./interfaces/base.interface";
import { modelNames } from "./constants";

const agentToolTraceSchema = new Schema<AgentToolTraceDto>(
  {
    seq: { type: Number, required: true },
    tool: { type: String, required: true },
    ok: { type: Boolean, required: true },
    error: { type: String, default: null },
    durationMs: { type: Number, required: true },
  },
  { _id: false }
);

const agentLlmCallSchema = new Schema<AgentLlmCallDto>(
  {
    seq: { type: Number, required: true },
    purpose: { type: String, enum: Object.values(AGENT_LLM_CALL_PURPOSE), required: true },
    llmModel: { type: String, required: true },
    ok: { type: Boolean, required: true },
    error: { type: String, default: null },
    finishReason: { type: String, default: null },
    durationMs: { type: Number, required: true },
    usage: {
      promptTokens: { type: Number },
      completionTokens: { type: Number },
      totalTokens: { type: Number },
    },
  },
  { _id: false }
);

export interface AgentTraceInput {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  userType: string;
  tenantId?: Types.ObjectId | null;
  jobProfileId?: Types.ObjectId | null;
  prompt: string;
  llmModel: string;
  promptName?: string | null;
  promptVersion?: number | null;
  status: AGENT_TRACE_STATUS;
  stoppedReason?: AGENT_STOPPED_REASON | null;
  error?: string | null;
  steps: number;
  toolCallCount: number;
  llmCallCount: number;
  totalDurationMs: number;
  toolDurationMs: number;
  llmDurationMs: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  toolTrace: AgentToolTraceDto[];
  llmCalls: AgentLlmCallDto[];
}

export interface IAgentTraceDoc extends AgentTraceInput, IBaseDoc {}

/**
 * One document per agent run — per prompt, in other words.
 *
 * This is telemetry, not content. `AgentMessage` already stores the transcript,
 * but it is shaped for replaying a conversation into the model: there is no run
 * boundary, so it cannot answer "how long did that prompt take", "which tools
 * did it reach for", or "was the time spent in Mongo or in OpenAI". That is what
 * this collection is for.
 *
 * No soft-delete plugin, for the same reason `AgentMessage` has none: a trace
 * has no user-facing lifecycle. No paginate plugins either — the only read path
 * is an aggregation.
 */
const agentTraceSchema = new Schema<IAgentTraceDoc>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: AgentConversation.modelName,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    // Snapshot rather than a join: it lets usage be segmented by audience
    // (candidate vs employer) without touching the users collection, and it
    // stays correct if the account later changes type.
    //
    // Not `required`: Mongoose's required check rejects an empty string, and a
    // schema validator must never be the reason a trace fails to write. Losing
    // the record of a broken run is worse than recording it without a type.
    userType: { type: String, default: "" },
    tenantId: { type: Schema.Types.ObjectId, default: null },
    jobProfileId: { type: Schema.Types.ObjectId, default: null },
    prompt: { type: String, required: true },
    // The model as configured for *this* run, so a change of AGENT_MODEL can be
    // compared rather than silently mixed into the same averages.
    llmModel: { type: String, required: true },
    // Which stored prompt version framed this run. `promptVersion` is null when
    // the registry could not answer and the hardcoded fallback was used, which
    // makes "the prompt store was down" visible in the data rather than
    // indistinguishable from a normal run.
    promptName: { type: String, default: null },
    promptVersion: { type: Number, default: null },
    status: {
      type: String,
      enum: Object.values(AGENT_TRACE_STATUS),
      required: true,
    },
    // Null when the run threw before reaching any stop condition.
    stoppedReason: {
      type: String,
      enum: [...Object.values(AGENT_STOPPED_REASON), null],
      default: null,
    },
    error: { type: String, default: null },
    /** Loop iterations consumed, against MAX_STEPS. */
    steps: { type: Number, required: true, default: 0 },
    toolCallCount: { type: Number, required: true, default: 0 },
    llmCallCount: { type: Number, required: true, default: 0 },
    /** Wall clock for the whole run. */
    totalDurationMs: { type: Number, required: true, default: 0 },
    // Precomputed sums of the two arrays below. Denormalised on purpose: this is
    // the split every latency question starts from, and storing it turns the
    // stats query into a $sum instead of a nested $reduce.
    toolDurationMs: { type: Number, required: true, default: 0 },
    llmDurationMs: { type: Number, required: true, default: 0 },
    /** The run's total token spend — the per-prompt cost. */
    usage: {
      promptTokens: { type: Number },
      completionTokens: { type: Number },
      totalTokens: { type: Number },
    },
    toolTrace: { type: [agentToolTraceSchema], default: [] },
    llmCalls: { type: [agentLlmCallSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Runs of one conversation, newest first.
agentTraceSchema.index({ conversationId: 1, createdAt: -1 });
// Per-user usage over time.
agentTraceSchema.index({ userId: 1, createdAt: -1 });
// The stats aggregation scans a time window.
agentTraceSchema.index({ createdAt: -1 });
// Multikey: find the runs that used a given tool.
agentTraceSchema.index({ "toolTrace.tool": 1 });

const AgentTrace = model<IAgentTraceDoc, Model<IAgentTraceDoc>>(modelNames.AGENT_TRACE, agentTraceSchema);

export { AgentTrace };
