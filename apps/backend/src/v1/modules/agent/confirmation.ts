import { createHmac, timingSafeEqual } from "crypto";

/**
 * The confirmation gate for mutating tools.
 *
 * The problem this solves: a model asked to "add my job at St Mary's" will
 * cheerfully invent a start date, and prose instructions to confirm first are
 * followed right up until the turn they are not. A user's profile is not a
 * reasonable place to discover that.
 *
 * So a mutating tool cannot write on its first call. The first call returns a
 * preview and a signed token; only a later call carrying that token executes.
 * Two properties make the gate real rather than advisory:
 *
 * 1. **Unforgeable.** The token is an HMAC over a server-held secret, so the
 *    model cannot manufacture one. It can only echo back a token it was handed.
 * 2. **Not self-confirmable.** The token is bound to the turn that issued it and
 *    is rejected if presented on that same turn. Since a turn is one user
 *    message, redeeming a token means a user spoke in between — the model cannot
 *    call the tool, read its own token out of the result and immediately apply
 *    it in the same breath.
 *
 * The token also covers the arguments, so a preview of "Nurse at St Mary's" and
 * an apply of "Consultant at St Mary's" do not share a token. Approval is of a
 * specific write, not of a general intention.
 *
 * Deliberately stateless: no pending-write collection, nothing to expire, and
 * nothing that can be left behind by a crashed run. Everything the check needs
 * is either in the token or recomputed from the call.
 */

/** Marker for a token the model has mangled, so the message can say so plainly. */
const MALFORMED = "malformed";

const secretCache = { value: "" };

/**
 * Resolved on first use rather than at import.
 *
 * Reuses the access-token secret instead of introducing an env var of its own.
 * A new optional secret is a security control that is off by default on every
 * existing deployment and reports nothing when it is — whereas `ACCESS_TOKEN_SECRET`
 * is already required for anyone to be logged in at all, so it cannot be missing
 * in an environment where this code can be reached.
 */
const secret = (): string => {
  if (secretCache.value) return secretCache.value;

  const resolved = process.env.AGENT_CONFIRMATION_SECRET || process.env.ACCESS_TOKEN_SECRET;
  if (!resolved) {
    // Fails the tool call, not the process. A deployment this broken cannot
    // authenticate anyone, so this will never be the first error it reports.
    throw new Error("Confirmation tokens cannot be issued: no ACCESS_TOKEN_SECRET is configured.");
  }

  secretCache.value = resolved;
  return resolved;
};

/**
 * Stable serialization of the tool arguments.
 *
 * Keys are sorted because `{a,b}` and `{b,a}` are the same write and must share
 * a token — the model does not guarantee key order between turns, and a
 * confirmation that failed on reordering would be an unfixable loop for the user.
 *
 * Nested objects are sorted too. Arrays keep their order, which is correct:
 * reordering a list of skills is a different write.
 */
const canonical = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    // `undefined` is absent once serialized, so a key holding it must not change
    // the signature — otherwise a model that sends `endDate: undefined` on one
    // turn and omits it on the next gets a mismatch on an identical write.
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
};

export interface IConfirmationScope {
  conversationId: string;
  toolName: string;
  /** The id of the user message being answered. One turn, one id. */
  turnId: string;
  /** The tool arguments, with `confirmationToken` already removed. */
  input: unknown;
}

const sign = (scope: IConfirmationScope): string =>
  createHmac("sha256", secret())
    .update(`${scope.conversationId}|${scope.toolName}|${scope.turnId}|${canonical(scope.input)}`)
    .digest("base64url");

/**
 * Mints the token handed back with a preview.
 *
 * `turnId` is baked into the string as well as the signature so the verifier
 * knows which turn to check the signature against — the alternative is testing
 * the signature against every prior turn of the conversation.
 */
export const issueConfirmationToken = (scope: IConfirmationScope): string => `${scope.turnId}.${sign(scope)}`;

/**
 * A single shape rather than a `{ ok: true } | { ok: false; reason }` union.
 *
 * The backend compiles with `strictNullChecks` off, and without it TypeScript
 * does not narrow a union on a boolean discriminant — `verified.reason` after an
 * `if (verified.ok)` guard is a compile error rather than a `string`. An
 * optional field that is documented as paired with `ok: false` costs a little
 * precision and actually compiles here.
 */
export interface ConfirmationResult {
  ok: boolean;
  /** Set whenever `ok` is false, and written for the model rather than for a log. */
  reason?: string;
}

/**
 * Checks a token presented on `currentTurnId`.
 *
 * Every rejection message is written for the model to read and act on, since
 * that is where it goes. They say what to do next — re-preview — because a
 * model told only "invalid token" will usually retry the identical call.
 */
export const verifyConfirmationToken = (
  token: string,
  scope: Omit<IConfirmationScope, "turnId"> & { currentTurnId: string }
): ConfirmationResult => {
  const separator = token.indexOf(".");
  const issuedTurnId = separator > 0 ? token.slice(0, separator) : MALFORMED;
  const presented = separator > 0 ? token.slice(separator + 1) : "";

  if (issuedTurnId === MALFORMED || !presented) {
    return {
      ok: false,
      reason:
        "That confirmation token is not in a valid form. Call this tool again without a token to produce a fresh preview, and ask the user to confirm it.",
    };
  }

  // Checked before the signature so the message is specific. This is the case
  // that fires when a model tries to approve its own proposal: the preview and
  // the apply are on the same turn, and nobody has agreed to anything yet.
  if (issuedTurnId === scope.currentTurnId) {
    return {
      ok: false,
      reason:
        "This confirmation was issued on the current turn, so the user has not seen it yet. Show them the preview, and wait for them to reply before calling this tool again with the token.",
    };
  }

  const expected = sign({
    conversationId: scope.conversationId,
    toolName: scope.toolName,
    turnId: issuedTurnId,
    input: scope.input,
  });

  const presentedBuffer = Buffer.from(presented);
  const expectedBuffer = Buffer.from(expected);

  // Length-checked first: timingSafeEqual throws on a mismatch rather than
  // returning false, and a wrong length is public information anyway.
  const matches = presentedBuffer.length === expectedBuffer.length && timingSafeEqual(presentedBuffer, expectedBuffer);

  if (!matches) {
    return {
      ok: false,
      reason:
        "That confirmation does not match these values — the token belongs to a different set of details. If you changed anything after the user approved it, call this tool again without a token so they can confirm the corrected version.",
    };
  }

  return { ok: true };
};
