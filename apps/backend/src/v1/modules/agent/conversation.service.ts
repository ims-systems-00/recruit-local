import { Types } from "mongoose";
import OpenAI from "openai";
import { AGENT_MESSAGE_ROLE } from "@rl/types";
import { AgentConversation, AgentMessage, IAgentConversationDoc, AgentMessageInput } from "../../../models";
import { IAgentSessionFingerprint } from "../../../models/agent-conversation.model";
import { NotFoundException, ConflictException } from "../../../common/helper";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { HISTORY_LIMIT, REPLAYED_TOOL_RESULT_MAX_CHARS, RUN_DEADLINE_MS, TITLE_MAX_CHARS } from "./agent.constants";
import { truncate } from "./context";
import {
  ICreateConversationParams,
  IListAgentConversationParams,
  IAgentConversationGetParams,
} from "./agent.interface";
import { ISession } from "@rl/types";

/**
 * The authorization-relevant slice of a session. Stored on the conversation and
 * re-checked on every turn — see `assertFingerprintMatches`.
 */
export const fingerprintOf = (session: ISession): IAgentSessionFingerprint => ({
  userType: session.user?.type ?? "",
  tenantId: session.tenantId ?? null,
  jobProfileId: session.jobProfileId ?? null,
});

export const titleFrom = (instruction: string): string => {
  const trimmed = instruction.trim().replace(/\s+/g, " ");
  return trimmed.length > TITLE_MAX_CHARS ? `${trimmed.slice(0, TITLE_MAX_CHARS - 1)}…` : trimmed;
};

export const create = async ({ session, title }: ICreateConversationParams): Promise<IAgentConversationDoc> => {
  return AgentConversation.create({
    userId: new Types.ObjectId(session.user._id),
    tenantId: session.tenantId ? new Types.ObjectId(session.tenantId) : null,
    title,
    sessionFingerprint: fingerprintOf(session),
    lastMessageAt: new Date(),
  });
};

export const list = ({ query = {}, options }: IListAgentConversationParams) => {
  return AgentConversation.paginateAndExcludeDeleted(sanitizeQueryIds(query), {
    ...options,
    sort: options?.sort ?? { lastMessageAt: -1 },
  });
};

export const getOne = async ({ query = {} }: IAgentConversationGetParams): Promise<IAgentConversationDoc> => {
  const conversation = await AgentConversation.findOneWithExcludeDeleted(sanitizeQueryIds(query));
  if (!conversation) throw new NotFoundException("Conversation not found.");
  return conversation;
};

export const softDelete = async ({ query = {} }: IAgentConversationGetParams) => {
  const conversation = await getOne({ query });
  const { deleted } = await AgentConversation.softDelete({ _id: conversation._id });
  return { conversation, deleted };
};

/**
 * Refuses to continue a conversation whose authorization context has changed.
 *
 * Stored tool output is already-sanitized JSON with no retained link to the
 * entity it came from, so it cannot be re-checked against a new ability.
 * Replaying it after a role change, tenant switch, or profile change would leak
 * data the user may no longer be entitled to. Refusing is the only sound
 * option, and the case is rare enough that forcing a new conversation is a fine
 * outcome.
 */
export const assertFingerprintMatches = (conversation: IAgentConversationDoc, session: ISession): void => {
  const current = fingerprintOf(session);
  const stored = conversation.sessionFingerprint;

  const matches =
    stored?.userType === current.userType &&
    (stored?.tenantId ?? null) === current.tenantId &&
    (stored?.jobProfileId ?? null) === current.jobProfileId;

  if (!matches) {
    throw new ConflictException(
      "Your account context has changed since this conversation started. Please start a new conversation."
    );
  }
};

/**
 * Claims the run lock atomically. A conversation may only have one run in
 * flight — two concurrent runs would interleave the transcript and double any
 * side effects.
 *
 * A lock older than the run deadline is treated as abandoned (crashed process)
 * and reclaimed, so a conversation can never be wedged permanently.
 */
export const claimRunLock = async (conversationId: Types.ObjectId, userId: string): Promise<IAgentConversationDoc> => {
  const staleBefore = new Date(Date.now() - RUN_DEADLINE_MS);

  const claimed = await AgentConversation.findOneAndUpdate(
    {
      _id: conversationId,
      userId: new Types.ObjectId(userId),
      "deleteMarker.status": { $ne: true },
      $or: [{ runningSince: null }, { runningSince: { $lt: staleBefore } }],
    },
    { $set: { runningSince: new Date() } },
    { new: true }
  );

  if (!claimed) {
    throw new ConflictException("This conversation is already processing a message. Please wait for it to finish.");
  }

  return claimed;
};

export const releaseRunLock = async (conversationId: Types.ObjectId): Promise<void> => {
  await AgentConversation.updateOne(
    { _id: conversationId },
    { $set: { runningSince: null, lastMessageAt: new Date() } }
  );
};

export const addMessage = async (payload: AgentMessageInput) => {
  return AgentMessage.create(payload);
};

export const listMessages = async (conversationId: Types.ObjectId, limit = HISTORY_LIMIT) => {
  // Take the newest `limit`, then flip back into chronological order.
  const recent = await AgentMessage.find({ conversationId }).sort({ createdAt: -1, _id: -1 }).limit(limit).lean();
  return recent.reverse();
};

export const listAllMessages = async (conversationId: Types.ObjectId) => {
  return AgentMessage.find({ conversationId }).sort({ createdAt: 1, _id: 1 }).lean();
};

/**
 * Rebuilds prior turns as OpenAI chat messages.
 *
 * Persisted tool results are replayed truncated: they are the bulky part of a
 * transcript and full replay makes a long conversation grow linearly in tokens.
 *
 * An assistant message carrying `toolCalls` must be followed by a `tool`
 * message for every one of those calls or the API rejects the request, so any
 * assistant turn whose tool results fell outside the history window is dropped
 * along with its orphans.
 */
export const replayHistory = async (
  conversationId: Types.ObjectId
): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> => {
  const stored = await listMessages(conversationId);

  const availableToolCallIds = new Set(
    stored.filter((m) => m.role === AGENT_MESSAGE_ROLE.TOOL && m.toolCallId).map((m) => m.toolCallId as string)
  );

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  const includedToolCallIds = new Set<string>();

  for (const message of stored) {
    if (message.role === AGENT_MESSAGE_ROLE.USER) {
      messages.push({ role: "user", content: message.content ?? "" });
      continue;
    }

    if (message.role === AGENT_MESSAGE_ROLE.ASSISTANT) {
      const toolCalls = message.toolCalls ?? [];

      if (toolCalls.length > 0) {
        // Drop the turn entirely if any of its results were trimmed away.
        const allResultsPresent = toolCalls.every((call) => availableToolCallIds.has(call.id));
        if (!allResultsPresent) continue;

        toolCalls.forEach((call) => includedToolCallIds.add(call.id));
        messages.push({
          role: "assistant",
          content: message.content ?? null,
          tool_calls: toolCalls as OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall[],
        });
        continue;
      }

      if (message.content) messages.push({ role: "assistant", content: message.content });
      continue;
    }

    if (message.role === AGENT_MESSAGE_ROLE.TOOL && message.toolCallId) {
      // Only replay a result whose originating assistant turn survived.
      if (!includedToolCallIds.has(message.toolCallId)) continue;
      messages.push({
        role: "tool",
        tool_call_id: message.toolCallId,
        content: truncate(message.content ?? "", REPLAYED_TOOL_RESULT_MAX_CHARS),
      });
    }
  }

  return messages;
};
