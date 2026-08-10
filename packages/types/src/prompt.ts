/**
 * Shared shapes for the prompt registry — the DB-backed store the agent reads
 * its instructions from.
 *
 * The model is: a prompt `name` is a stable address, a `version` is an
 * immutable snapshot of its content, and a `label` is a movable pointer onto
 * one version. Runtime code resolves by name + label and never by version
 * number, which is what lets a prompt change without a deploy.
 */

/**
 * Reserved labels. `LATEST` is system-managed — it follows the newest version
 * automatically and cannot be moved by hand. `PRODUCTION` is what the runtime
 * asks for by default and is moved deliberately, so publishing and rolling back
 * are the same one-step operation in opposite directions.
 *
 * Any other label (`staging`, `old`, …) is free-form; these two are the only
 * ones the code itself depends on.
 */
export const PROMPT_LABEL = {
  LATEST: 'latest',
  PRODUCTION: 'production',
} as const;

export type PromptLabel = (typeof PROMPT_LABEL)[keyof typeof PROMPT_LABEL];

/**
 * Every prompt the runtime resolves, by its stable address. Adding an entry
 * here plus a seeder entry is how a new prompt enters the system; the string
 * values are persisted, so they must never change once shipped.
 */
export const PROMPT_NAME = {
  AGENT_SYSTEM_BASE: 'agent.system.base',
  AGENT_SYSTEM_EMPLOYER: 'agent.system.employer',
  AGENT_SYSTEM_CANDIDATE: 'agent.system.candidate',
  CV_EXTRACT_SYSTEM: 'cv.extract.system',
} as const;

export type PromptName = (typeof PROMPT_NAME)[keyof typeof PROMPT_NAME];

/** Optional per-prompt model overrides, applied by whoever resolves the prompt. */
export interface PromptConfigDto {
  model?: string;
  temperature?: number;
}

/**
 * All fields optional — prompt responses are CASL field-sanitized, so a caller
 * only receives what it may read.
 */
export interface PromptResponseDto {
  _id?: string;
  id?: string;
  name?: string;
  version?: number;
  content?: string;
  variables?: string[];
  labels?: string[];
  commitMessage?: string;
  config?: PromptConfigDto;
  createdBy?: string | null;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

/**
 * The registry view: one row per prompt name rather than per version, for a
 * list screen that wants "what exists and where do its labels point".
 */
export interface PromptNameSummaryDto {
  name: string;
  latestVersion: number;
  versionCount: number;
  /** label -> the version it currently points at, e.g. { production: 3 }. */
  labels: Record<string, number>;
  updatedAt: string; // ISO
}

/** What `resolve` returns: the text to send to the model, and its provenance. */
export interface PromptResolutionDto {
  name: string;
  /** null when no stored version matched and the code fallback was used. */
  version: number | null;
  label: string | null;
  content: string;
  /** True when the content came from the hardcoded fallback, not the database. */
  fallback: boolean;
}
