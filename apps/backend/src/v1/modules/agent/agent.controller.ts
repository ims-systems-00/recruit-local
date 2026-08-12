import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  UnauthorizedException,
  NotFoundException,
} from "../../../common/helper";
import {
  AgentAbilityBuilder,
  AgentConversationAuthZEntity,
  AgentTraceAbilityBuilder,
  AgentTraceAuthZEntity,
  ALL_AGENT_CONVERSATION_FIELDS,
} from "@rl/authz";
import { AbilityAction, AGENT_MESSAGE_ROLE } from "@rl/types";
import { sanitizeDocument, sanitizeDocuments } from "../../../common/helper/authz";
import { agentConversationRoleScopedSecurityQuery } from "./agent.query";
import * as conversationService from "./conversation.service";
import * as agentService from "./agent.service";
import * as traceService from "./trace.service";
import { IAgentConversationDoc } from "../../../models/agent-conversation.model";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_AGENT_CONVERSATION_FIELDS,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sanitizeConversation = (doc: any, ability: any) =>
  sanitizeDocument<AgentConversationAuthZEntity>(
    doc,
    ability,
    AbilityAction.Read,
    AgentConversationAuthZEntity,
    caslFieldOptions
  );

/**
 * Loads a conversation the caller is allowed to read.
 *
 * Fetching by id alone would be an IDOR — the row-level `can(Read, entity)`
 * check against the CASL `{ userId }` condition is what makes another user's id
 * indistinguishable from a missing one.
 */
const loadOwnedConversation = async (id: string, ability: ReturnType<AgentAbilityBuilder["getAbility"]>) => {
  const conversation = await conversationService.getOne({ query: { _id: id } });

  if (!ability.can(AbilityAction.Read, new AgentConversationAuthZEntity(conversation))) {
    throw new NotFoundException("Conversation not found.");
  }

  return conversation;
};

/**
 * Runs one turn: claim the lock, persist the user's message, run the loop,
 * release the lock. Shared by both entry points.
 */
const runTurn = async ({
  conversation,
  instruction,
  session,
}: {
  conversation: IAgentConversationDoc;
  instruction: string;
  session: ControllerParams["req"]["session"];
}) => {
  conversationService.assertFingerprintMatches(conversation, session);

  const locked = await conversationService.claimRunLock(conversation._id as Types.ObjectId, session.user._id as string);

  try {
    await conversationService.addMessage({
      conversationId: locked._id as Types.ObjectId,
      role: AGENT_MESSAGE_ROLE.USER,
      content: instruction,
    });

    return await agentService.runAgent({ conversation: locked, instruction, session });
  } finally {
    await conversationService.releaseRunLock(locked._id as Types.ObjectId);
  }
};

export const createConversation = async ({ req }: ControllerParams) => {
  const ability = new AgentAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Create, AgentConversationAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to use the agent.`);
  }

  const instruction: string | undefined = req.body.instruction;

  const conversation = await conversationService.create({
    session: req.session,
    title: instruction ? conversationService.titleFrom(instruction) : "New conversation",
  });

  // No instruction: just open the conversation.
  if (!instruction) {
    return new ApiResponse({
      message: "Conversation created.",
      statusCode: StatusCodes.CREATED,
      data: { conversation: sanitizeConversation(conversation, ability) },
      fieldName: "agent",
    });
  }

  const result = await runTurn({ conversation, instruction, session: req.session });

  return new ApiResponse({
    message: "Agent run complete.",
    statusCode: StatusCodes.CREATED,
    data: { conversationId: String(conversation._id), ...result },
    fieldName: "agent",
  });
};

export const sendMessage = async ({ req }: ControllerParams) => {
  const ability = new AgentAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Create, AgentConversationAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to use the agent.`);
  }

  const conversation = await loadOwnedConversation(req.params.id, ability);
  const result = await runTurn({ conversation, instruction: req.body.instruction, session: req.session });

  return new ApiResponse({
    message: "Agent run complete.",
    statusCode: StatusCodes.OK,
    data: { conversationId: String(conversation._id), ...result },
    fieldName: "agent",
  });
};

export const listConversations = async ({ req }: ControllerParams) => {
  const ability = new AgentAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Read, AgentConversationAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read conversations.`);
  }

  const filter = new MongoQuery(req.query, { searchFields: ["title"] }).build();

  const results = await conversationService.list({
    query: { $and: [filter.getFilterQuery(), agentConversationRoleScopedSecurityQuery(ability)] },
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<AgentConversationAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    AgentConversationAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Conversations retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "conversations",
    pagination,
  });
};

export const getConversation = async ({ req }: ControllerParams) => {
  const ability = new AgentAbilityBuilder(req.session).getAbility();
  const conversation = await loadOwnedConversation(req.params.id, ability);

  const messages = await conversationService.listAllMessages(conversation._id as Types.ObjectId);

  return new ApiResponse({
    message: "Conversation retrieved.",
    statusCode: StatusCodes.OK,
    data: {
      ...sanitizeConversation(conversation, ability),
      // Messages are the user's own transcript; the conversation-level
      // ownership check above is the gate. Internal bookkeeping is dropped.
      messages: messages.map((message) => ({
        _id: message._id,
        role: message.role,
        content: message.content,
        toolName: message.toolName ?? null,
        ok: message.ok ?? null,
        durationMs: message.durationMs ?? null,
        createdAt: message.createdAt,
      })),
    },
    fieldName: "conversation",
  });
};

/**
 * Aggregate view of how the agent is actually behaving: per-tool call counts,
 * failure rates and latency percentiles, plus the run-level tool-vs-model time
 * split.
 *
 * Only steps 1 and 2 of the usual authz sequence apply here. There is no query
 * scoping because the rule is admin-only, and no field sanitization because the
 * payload is aggregate rows rather than entity documents — `sanitizeDocument`
 * has no entity to project. The action gate is the entire boundary, which is
 * also why no prompt text is ever selected by the pipeline.
 */
export const getToolStats = async ({ req }: ControllerParams) => {
  const ability = new AgentTraceAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Read, AgentTraceAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read agent traces.`);
  }

  // Joi validates the query string but does not coerce it, so the conversion
  // happens here.
  const { from, to } = req.query as { from?: string; to?: string };

  const stats = await traceService.toolStats({
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });

  return new ApiResponse({
    message: "Agent trace statistics retrieved.",
    statusCode: StatusCodes.OK,
    data: stats,
    fieldName: "stats",
  });
};

export const softRemoveConversation = async ({ req }: ControllerParams) => {
  const ability = new AgentAbilityBuilder(req.session).getAbility();
  const existing = await loadOwnedConversation(req.params.id, ability);

  if (!ability.can(AbilityAction.SoftDelete, new AgentConversationAuthZEntity(existing))) {
    throw new UnauthorizedException("You do not have permission to delete this conversation.");
  }

  const { conversation, deleted } = await conversationService.softDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Conversation deleted.",
    statusCode: StatusCodes.OK,
    data: { conversation: sanitizeConversation(conversation, ability), deleted },
    fieldName: "conversation",
  });
};
