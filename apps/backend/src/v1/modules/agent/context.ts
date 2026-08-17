import OpenAI from "openai";

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

/**
 * Keeping a request inside the model's context window.
 *
 * Three brakes, in increasing order of bluntness: `truncate` caps one tool
 * result as it is produced, the history window caps how many prior messages
 * come back (see `replayHistory`), and `fitToBudget` is the backstop that runs
 * immediately before every call and is allowed to damage the transcript to
 * avoid a hard failure.
 */

/**
 * Rough token count from character length.
 *
 * Deliberately not a real tokenizer. `tiktoken` would be accurate but adds a
 * megabyte of BPE tables to the bundle to serve a number that only ever feeds a
 * budget check, and the budget already carries a wide safety margin. Four
 * characters per token is the standard English approximation and errs high on
 * the JSON that dominates a run's context, which is the safe direction.
 */
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

export const truncate = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max)}\n…[truncated]` : value;

/** Stands in for a result dropped by the budget. Valid JSON, like a real one. */
const DROPPED_RESULT = JSON.stringify({
  ok: true,
  note: "[earlier result dropped to fit the context window]",
});

/** Only `string` content is measurable and shrinkable; parts arrays are left alone. */
const textOf = (message: ChatMessage): string => (typeof message.content === "string" ? message.content : "");

const sizeOf = (message: ChatMessage): number => {
  const toolCalls = "tool_calls" in message && message.tool_calls ? JSON.stringify(message.tool_calls) : "";
  return estimateTokens(textOf(message)) + estimateTokens(toolCalls);
};

export const estimateMessagesTokens = (messages: ChatMessage[]): number =>
  messages.reduce((total, message) => total + sizeOf(message), 0);

export interface IFitResult {
  messages: ChatMessage[];
  /** How many messages were shrunk. Zero means the array is the one passed in. */
  trimmed: number;
  estimatedTokens: number;
}

/** What a clipped message keeps. Enough to stay meaningful, small enough to converge. */
const FLOOR_CHARS = 500;

/**
 * Shrinks a message array until it fits `budgetTokens`.
 *
 * Shrinks content in place and never removes a message. That is the load-bearing
 * constraint, not a preference: the API rejects a request in which an assistant
 * message carrying `tool_calls` is not followed by a `tool` message for every
 * one of those calls, so dropping a message can invalidate the whole request.
 * `replayHistory` can drop turns because it drops an assistant turn together
 * with its orphaned results; mid-run there is no equivalent, so replacing
 * content is the only safe move.
 *
 * Sacrificed in order of how little the next call needs it:
 *
 * 1. Old tool results, oldest first — a result the model has already reasoned
 *    about and summarised is the most redundant thing in the array.
 * 2. User and assistant prose, clipped to `FLOOR_CHARS`.
 * 3. The newest tool result, clipped rather than stubbed.
 *
 * Two messages are exempt. The system prompt frames the run, and a run that
 * silently loses its framing is worse than one that fails. The final *user*
 * message is the question being answered — but note the exemption is on the
 * role, not the position: mid-loop the last message is a tool result, and that
 * is precisely the one step 3 exists to cut.
 *
 * Because those two are exempt, the result fits the budget *unless the system
 * prompt and the question alone already exceed it* — around 1.1k tokens today.
 * A budget below that floor is a misconfiguration, not a case to handle: the
 * default is 60k against gpt-4o's 128k window.
 */
export const fitToBudget = (messages: ChatMessage[], budgetTokens: number): IFitResult => {
  let estimatedTokens = estimateMessagesTokens(messages);
  if (estimatedTokens <= budgetTokens) return { messages, trimmed: 0, estimatedTokens };

  // Copied so the caller's array — the loop's running transcript — is never
  // mutated. A trim is a property of one request, not of the run.
  const fitted = [...messages];
  const lastIndex = fitted.length - 1;
  let trimmed = 0;

  const replace = (index: number, content: string) => {
    const before = sizeOf(fitted[index]);
    fitted[index] = { ...fitted[index], content } as ChatMessage;
    estimatedTokens -= before - sizeOf(fitted[index]);
    trimmed += 1;
  };

  const isSpared = (index: number) =>
    fitted[index].role === "system" || (index === lastIndex && fitted[index].role === "user");

  const newestToolIndex = fitted.reduce((found, message, i) => (message.role === "tool" ? i : found), -1);

  // 1. Stub every tool result but the newest.
  for (let i = 0; i < fitted.length && estimatedTokens > budgetTokens; i++) {
    if (isSpared(i) || i === newestToolIndex || fitted[i].role !== "tool") continue;
    if (textOf(fitted[i]) === DROPPED_RESULT) continue;
    replace(i, DROPPED_RESULT);
  }

  // 2. Results are gone and it still does not fit, so the prose is the problem.
  for (let i = 0; i < fitted.length && estimatedTokens > budgetTokens; i++) {
    if (isSpared(i) || i === newestToolIndex) continue;
    const text = textOf(fitted[i]);
    if (text.length <= FLOOR_CHARS) continue;
    replace(i, truncate(text, FLOOR_CHARS));
  }

  // 3. The newest result is now the only thing left to give. Clipped to whatever
  //    room remains rather than stubbed: the model just asked for this data, and
  //    a truncated answer is worth more to it than a note saying it was dropped.
  //
  //    Re-measured rather than computed in one shot. `truncate` appends a marker
  //    and `estimateTokens` rounds up, so a single subtraction lands just over
  //    the line; halving until it fits is a handful of iterations and exact.
  //
  //    The `clipped.length >= text.length` break is what makes this terminate,
  //    and it is not defensive padding. At the floor, `truncate` re-appends its
  //    marker to an already-clipped string and hands back the same length
  //    forever — so "stop when a pass stops shrinking" is the only condition
  //    that holds. Every other path strictly halves.
  while (estimatedTokens > budgetTokens && newestToolIndex >= 0) {
    const text = textOf(fitted[newestToolIndex]);
    const overBy = (estimatedTokens - budgetTokens) * 4;
    const keep = Math.max(FLOOR_CHARS, Math.min(text.length - overBy, Math.floor(text.length / 2)));

    const clipped = truncate(text, keep);
    if (clipped.length >= text.length) break;
    replace(newestToolIndex, clipped);
  }

  return { messages: fitted, trimmed, estimatedTokens };
};
