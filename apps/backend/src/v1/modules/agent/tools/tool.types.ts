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

  /** Whether this tool writes. Used for logging today; gating later. */
  mutating: boolean;

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
