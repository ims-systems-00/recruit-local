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
 * One tool invocation inside a run. Deliberately carries no tool *output*: this
 * is a measurement of the call, and the rows a client is meant to render travel
 * in `AgentViewDto` instead, where they are whitelisted per tool.
 */
export interface AgentStepDto {
  tool: string;
  input?: Record<string, unknown>;
  ok: boolean;
  error?: string;
  durationMs?: number;
}

/**
 * Which renderer a view is asking for. Not a tool name — `list_jobs` and
 * `recommend_jobs` both produce `job_list`, because the client draws them the
 * same way and should not have to know which tool the model happened to pick.
 */
export enum AGENT_VIEW_TYPE {
  APPLICATION_LIST = 'application_list',
  APPLICATION_DETAIL = 'application_detail',
  JOB_LIST = 'job_list',
}

/**
 * A tool result carried through to the client so the UI can render it as
 * components instead of re-reading the model's prose.
 *
 * Why this is safe to send when `AgentStepDto` deliberately sends nothing: rows
 * are already CASL-sanitized against the caller's own ability before they leave
 * the tool, so a view discloses nothing that the same session could not fetch
 * from the domain endpoint directly. Size is bounded by the tools' own
 * `MAX_LIMIT` and again when the view is built.
 *
 * Why it is worth sending at all: the model retyping fetched values into prose
 * is what lets it state things the data never said — a currency beside a bare
 * `Number`, for instance. Rendering from the rows makes that class of error
 * impossible rather than merely less likely.
 *
 * `items` is deliberately loose. The rows are the tool's own narrowed shapes,
 * and a field the caller may not read is *absent* rather than null — so a
 * stricter type here would promise keys that legitimately do not arrive.
 */
export interface AgentViewDto {
  type: AGENT_VIEW_TYPE;
  /** Heading for the block; omitted when the tool had nothing to name it with. */
  title?: string;
  /** The tool's own paging, so a client can say "showing 10 of 34". */
  totalMatching?: number;
  returned?: number;
  items: Record<string, unknown>[];
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
  /**
   * Renderable results from this run's tool calls, in call order. Additive: a
   * client that only reads `answer` is unaffected, and an empty array is the
   * normal case for a question no listing tool served.
   */
  views: AgentViewDto[];
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

/* ------------------------------------------------------------------------- *
 * Tracing
 *
 * One trace is recorded per run, carrying every tool call and every LLM call
 * that run made. The transcript (AgentMessage) exists to be replayed into the
 * model; these shapes exist to be aggregated.
 * ------------------------------------------------------------------------- */

/**
 * Outcome of a run as a whole. `failed` means the loop itself threw — an LLM
 * API error, a database error — and the trace is partial.
 *
 * A *tool* returning an error is not a failure: the loop is designed to hand
 * the error back to the model and let it recover, so that is recorded per tool
 * call and leaves the run `succeeded`.
 */
export enum AGENT_TRACE_STATUS {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

/**
 * Why an LLM call was made. `step` is the loop asking the model what to do
 * next; `summary` is the single tool-less call that wraps up a run which hit
 * MAX_STEPS or the deadline.
 */
export enum AGENT_LLM_CALL_PURPOSE {
  STEP = 'step',
  SUMMARY = 'summary',
}

/**
 * One tool invocation. Deliberately carries neither the arguments nor the
 * result: both already live in the transcript, and arguments can contain
 * user-typed PII. This is a measurement, not a copy of the call.
 */
export interface AgentToolTraceDto {
  /** Position within the run, so ordering survives independently of duration. */
  seq: number;
  tool: string;
  ok: boolean;
  error?: string | null;
  durationMs: number;
}

export interface AgentLlmCallDto {
  seq: number;
  purpose: AGENT_LLM_CALL_PURPOSE;
  /** Named `llmModel`, not `model`, because `model` is a method on Mongoose documents. */
  llmModel: string;
  ok: boolean;
  error?: string | null;
  finishReason?: string | null;
  durationMs: number;
  /** This call's own tokens, unlike the run-level total. */
  usage?: AgentUsageDto;
}

/** Per-tool rollup: how often it is reached, how often it fails, how slow it is. */
export interface AgentToolStatsDto {
  tool: string;
  calls: number;
  failures: number;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
}

export interface AgentRunStatsDto {
  runs: number;
  failedRuns: number;
  avgTotalDurationMs: number;
  avgStepsPerRun: number;
  toolCalls: number;
  llmCalls: number;
  /** The two together are the "was it my tools or the model" answer. */
  totalToolDurationMs: number;
  totalLlmDurationMs: number;
  totalTokens: number;
}

export interface AgentStoppedReasonStatsDto {
  stoppedReason: AGENT_STOPPED_REASON | null;
  count: number;
}

export interface AgentTraceStatsDto {
  from: string | null; // ISO
  to: string | null; // ISO
  runs: AgentRunStatsDto;
  tools: AgentToolStatsDto[];
  stoppedReasons: AgentStoppedReasonStatsDto[];
}
