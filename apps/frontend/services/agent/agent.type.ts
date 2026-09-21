import type {
  AccessibilityPreferences,
  AgentClientActionDto,
  AgentPageContextDto,
  AgentStepDto,
  AgentUsageDto,
  AgentViewDto,
} from '@rl/types';

export { AGENT_VIEW_TYPE, ANSWER_LENGTH } from '@rl/types';
export type {
  AccessibilityPreferences,
  AgentClientActionDto,
  AgentPageContextDto,
  AgentStepDto,
  AgentViewDto,
} from '@rl/types';

export interface AgentResponse {
  message: string;
  statusCode: number;
  agent: AgentData;
}

/** Kept as aliases so existing imports of these names keep compiling. */
export type AgentStep = AgentStepDto;
export type AgentUsage = AgentUsageDto;

export interface AgentData {
  conversationId: string;
  answer: string;
  stoppedReason: string;
  steps: AgentStepDto[];
  /**
   * Renderable tool results. A `pending_write` view means Alice has proposed a
   * change and is waiting for the user to approve it; nothing is saved yet.
   */
  views?: AgentViewDto[];
  /** Page actions to run on the current page. Nothing has been saved. */
  clientActions?: AgentClientActionDto[];
  usage?: AgentUsageDto;
}

export interface AgentConversationInput {
  instruction: string;
  /** The page the user is on, and what Alice may do to it. */
  pageContext?: AgentPageContextDto;
}

/** One row of a `pending_write` view. */
export interface PendingWriteItem {
  summary: string;
  details: Record<string, string | string[]>;
  warnings?: string[];
}

export interface AccessibilityPreferencesResponse {
  message: string;
  statusCode: number;
  preferences: AccessibilityPreferences;
}

export type AccessibilityPreferencesInput = Partial<AccessibilityPreferences>;

export interface SpeechInput {
  text: string;
  voice?: string;
  speed?: number;
}

/**
 * Audio travels as base64 because it passes through a server action, and a
 * string is the one payload those serialize without caveats.
 */
export interface SpeechData {
  audioBase64: string;
  contentType: string;
}
