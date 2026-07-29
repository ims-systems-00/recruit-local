import { Schema, model, Model, Types } from "mongoose";
import { AGENT_MESSAGE_ROLE } from "@rl/types";
import { AgentConversation } from "./agent-conversation.model";
import { IBaseDoc } from "./interfaces/base.interface";
import { modelNames } from "./constants";

/**
 * The OpenAI tool_call shape, stored verbatim on assistant messages so a
 * conversation can be replayed into the model without reconstruction.
 */
export interface IAgentToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

const agentToolCallSchema = new Schema<IAgentToolCall>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    function: {
      name: { type: String, required: true },
      arguments: { type: String, required: true },
    },
  },
  { _id: false }
);

export interface AgentMessageInput {
  conversationId: Types.ObjectId;
  role: AGENT_MESSAGE_ROLE;
  content?: string | null;
  /** Assistant messages only — the calls the model asked for. */
  toolCalls?: IAgentToolCall[];
  /** Tool messages only — pairs the result back to its call. */
  toolCallId?: string;
  toolName?: string;
  ok?: boolean;
  durationMs?: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface IAgentMessageDoc extends AgentMessageInput, IBaseDoc {}

/**
 * No soft-delete plugin: messages have no independent lifecycle. They are
 * reached only through their conversation, so soft-deleting the conversation
 * hides them, and the retention job removes both together.
 */
const agentMessageSchema = new Schema<IAgentMessageDoc>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: AgentConversation.modelName,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(AGENT_MESSAGE_ROLE),
      required: true,
    },
    content: {
      type: String,
      default: null,
    },
    toolCalls: {
      type: [agentToolCallSchema],
      default: undefined,
    },
    toolCallId: {
      type: String,
    },
    toolName: {
      type: String,
    },
    ok: {
      type: Boolean,
    },
    durationMs: {
      type: Number,
    },
    usage: {
      promptTokens: { type: Number },
      completionTokens: { type: Number },
      totalTokens: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

// Replay always reads one conversation in insertion order.
agentMessageSchema.index({ conversationId: 1, createdAt: 1 });

const AgentMessage = model<IAgentMessageDoc, Model<IAgentMessageDoc>>(modelNames.AGENT_MESSAGE, agentMessageSchema);

export { AgentMessage };
