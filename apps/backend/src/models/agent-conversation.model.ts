import { Schema, model, Types } from "mongoose";
import { User } from "./user.model";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { IBaseDoc } from "./interfaces/base.interface";
import { modelNames } from "./constants";

/**
 * Snapshot of the authorization-relevant parts of the session that started the
 * conversation.
 *
 * Persisted transcripts hold tool output that was CASL-sanitized under the
 * permissions the user held at that moment. If those permissions later change,
 * replaying that output would leak data the user is no longer entitled to, and
 * CASL never gets a second look at it. Comparing this fingerprint against the
 * live session on every turn is what catches that.
 */
export interface IAgentSessionFingerprint {
  userType: string;
  tenantId: string | null;
  jobProfileId: string | null;
}

export interface AgentConversationInput {
  userId: Types.ObjectId;
  title: string;
  sessionFingerprint: IAgentSessionFingerprint;
  /** Snapshot for audit only — conversations are scoped by userId, never by tenant. */
  tenantId?: Types.ObjectId | null;
  lastMessageAt?: Date;
  /** Set while a run is in flight; acts as the concurrency lock. */
  runningSince?: Date | null;
}

export interface IAgentConversationDoc extends AgentConversationInput, ISoftDeleteDoc, IBaseDoc {}

type IAgentConversationModel = ISoftDeleteModel<IAgentConversationDoc>;

const agentConversationSchema = new Schema<IAgentConversationDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    // Deliberately not the tenantDataPlugin: a conversation belongs to a user.
    // Candidates have no tenant, so tenant-scoping would be wrong for half the
    // audience. Stored only so employer conversations can be traced to an org.
    tenantId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sessionFingerprint: {
      userType: { type: String, required: true },
      tenantId: { type: String, default: null },
      jobProfileId: { type: String, default: null },
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    runningSince: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

agentConversationSchema.index({ userId: 1, lastMessageAt: -1 });

agentConversationSchema.plugin(softDeletePlugin);

const AgentConversation = model<IAgentConversationDoc, IAgentConversationModel>(
  modelNames.AGENT_CONVERSATION,
  agentConversationSchema
);

export { AgentConversation };
