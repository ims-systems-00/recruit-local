/**
 * Helpers for building the `state` a page reports to Alice.
 *
 * The server caps a page state at 2,000 serialized characters and rejects the
 * whole request when it is exceeded, rather than trimming it — see
 * `PAGE_STATE_MAX_CHARS` in the backend's `agent.validation.ts`. A single
 * filled-in cover letter or professional summary can pass that on its own, so
 * any free-text field goes in as an excerpt rather than in full.
 */

/** Longest a single text field may be in a page state. */
export const STATE_EXCERPT_CHARS = 100;

/**
 * A text field as Alice is shown it: null when empty, the text itself when
 * short, and a cut-off opening with the real length when not.
 *
 * The length matters on its own — it is how she can tell a one-line summary
 * from a finished one without being sent either in full.
 */
export const excerpt = (value?: string | null) => {
  const text = value?.trim();
  if (!text) return null;
  if (text.length <= STATE_EXCERPT_CHARS) return text;

  return {
    startsWith: `${text.slice(0, STATE_EXCERPT_CHARS)}…`,
    length: text.length,
  };
};
