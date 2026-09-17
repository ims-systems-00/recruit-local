import Joi from "joi";
import { ISession } from "@rl/types";

export interface AgentToolContext {
  /** The caller's real session. Every tool rebuilds its CASL ability from this. */
  session: ISession;
}

/**
 * The extension point for agent capabilities.
 *
 * Contract every implementation must honour: a tool is not a service call, it
 * is a controller without HTTP. `execute` must build the domain ability from
 * `ctx.session`, gate the action, scope the DB query with that entity's
 * `*RoleScopedSecurityQuery`, and sanitize the result before returning it. The
 * model must never see a field the caller could not have fetched over REST.
 *
 * A tool must not branch on `session.user.type` to decide what data to return.
 * If it needs to, the CASL rule is wrong and belongs in `packages/authz`.
 */
export interface AgentTool<TInput = unknown> {
  /** snake_case; this is what the model calls. */
  name: string;

  /**
   * Shown to the model. This is prompt engineering, not documentation — it is
   * the only thing telling the model when to reach for this tool.
   */
  description: string;

  /** JSON Schema advertised to the model. Written for the model: descriptive. */
  parameters: Record<string, unknown>;

  /**
   * Server-side validation of what the model actually sent back. The trust
   * boundary — never assumes the model obeyed `parameters`.
   */
  inputSchema: Joi.ObjectSchema;

  /**
   * Whether this tool writes.
   *
   * A tool marked `true` is gated: the loop will not execute it until the user
   * has approved a preview of the exact values, and a tool that sets this
   * without implementing `preview` is refused outright. See `confirmation.ts`.
   */
  mutating: boolean;

  /**
   * Describes what `execute` would write, without writing it. Required on any
   * tool where `mutating` is true, and never called otherwise.
   *
   * This is what the user actually approves, so it must reflect the values that
   * will be stored — a date the tool parsed into a different year, or a field it
   * intends to default, has to show up here. A preview that is prettier than the
   * write is worse than no preview, because it buys a confirmation for something
   * the user did not agree to.
   *
   * Runs under the same authorization as `execute`: it reads what it needs to
   * resolve the preview and must gate those reads identically. Throwing is the
   * right response to input that could never be written — the user finds out
   * now rather than after saying yes.
   */
  preview?(input: TInput, ctx: AgentToolContext): Promise<IToolPreview>;

  /**
   * Set `false` to let a mutating tool write on its first call.
   *
   * A deliberate hole in the gate, and it stays narrow. The only writes that
   * qualify are ones where the confirmation turn costs more than it protects:
   * the change affects nobody but the caller, it is visible in the very next
   * reply, and undoing it is one sentence. Accessibility preferences are the
   * case this exists for — making someone who asked for one question at a time
   * answer an extra confirmation prompt is a worse outcome than the write.
   *
   * Anything written to a profile employers read fails all three tests, so it
   * does not qualify. Leave this unset and implement `preview` instead.
   *
   * `mutating` stays `true` regardless: the flag describes what the tool does,
   * not how it is gated, and tracing and review both read it that way.
   */
  requiresConfirmation?: boolean;

  /**
   * Omit to offer the tool to every account type.
   *
   * This is a UX and prompt-economy filter, not the security boundary: it keeps
   * irrelevant tools out of the context window and stops the model burning
   * turns on calls that would always throw. Write `execute` as if this did not
   * exist.
   */
  isAvailable?(session: ISession): boolean;

  execute(input: TInput, ctx: AgentToolContext): Promise<unknown>;
}

/**
 * What a mutating tool proposes, and what the user is actually agreeing to when
 * they say yes.
 *
 * The confirmation token is signed over the tool's *arguments*, not over this
 * shape, so the two only stay in step if `preview` derives everything here from
 * those same arguments. A preview that reaches for a value the arguments do not
 * carry can show one thing and write another.
 */
export interface IToolPreview {
  /** One line, in plain language: "Add Staff Nurse at St Mary's, Mar 2019 – Jun 2022". */
  summary: string;

  /**
   * The field-by-field values that will be written, for a client that renders a
   * confirmation card rather than relying on the model's prose.
   */
  details: Record<string, unknown>;

  /**
   * Anything the user should know before agreeing — a defaulted field, a date
   * that was interpreted from vague wording, an existing record this duplicates.
   */
  warnings?: string[];
}
