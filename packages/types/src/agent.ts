/**
 * Shared HTTP shapes for the AI agent. Consumed by both the backend (response
 * construction) and the frontend (typed clients).
 */

export enum AGENT_MESSAGE_ROLE {
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
}

/**
 * Why a run stopped. `completed` is the model deciding it was done; the other
 * two are the runtime's brakes engaging and mean the answer may be partial.
 */
export enum AGENT_STOPPED_REASON {
  COMPLETED = 'completed',
  MAX_STEPS = 'max_steps',
  DEADLINE = 'deadline',
}

/**
 * One tool invocation inside a run. Deliberately carries no tool *output* —
 * results are large and contain candidate PII, so they stay in the persisted
 * transcript and the debug log rather than the HTTP response.
 */
export interface AgentStepDto {
  tool: string;
  input?: Record<string, unknown>;
  ok: boolean;
  error?: string;
  durationMs?: number;
}

export interface AgentUsageDto {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AgentRunResultDto {
  conversationId: string;
  answer: string;
  stoppedReason: AGENT_STOPPED_REASON;
  steps: AgentStepDto[];
  usage?: AgentUsageDto;
}

/**
 * All fields optional — conversation responses are CASL field-sanitized, so a
 * caller only receives what it may read.
 */
export interface AgentConversationResponseDto {
  _id?: string;
  id?: string;
  userId?: string;
  tenantId?: string | null;
  title?: string;
  lastMessageAt?: string; // ISO
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

export interface AgentMessageResponseDto {
  _id?: string;
  id?: string;
  conversationId?: string;
  role?: AGENT_MESSAGE_ROLE;
  content?: string | null;
  toolName?: string | null;
  ok?: boolean | null;
  durationMs?: number | null;
  createdAt?: string; // ISO
}

export interface AgentConversationWithMessagesDto extends AgentConversationResponseDto {
  messages?: AgentMessageResponseDto[];
}
