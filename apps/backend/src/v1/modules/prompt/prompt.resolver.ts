import { PromptResolutionDto } from "@rl/types";
import { logger } from "../../../common/helper";
import { getCachedPrompt, setCachedPrompt } from "./prompt.cache";
import { findForResolution } from "./prompt.service";
import { renderPrompt } from "./prompt.render";

export interface IResolvePromptOptions {
  /** Preferred label. Falls through to `production` then `latest` on a miss. */
  label?: string;
  /** Values for the prompt's `{{placeholders}}`. */
  variables?: Record<string, string>;
  /** The hardcoded text to use when the store cannot answer. Required. */
  fallback: string;
}

/** What is worth caching: the stored text and where it came from. */
type CachedResolution = Pick<PromptResolutionDto, "version" | "label" | "content">;

/**
 * The single entry point every caller outside this module uses to read a
 * prompt.
 *
 * Two properties matter more than anything else here:
 *
 * 1. **It never throws.** Prompt resolution sits on the agent's request path,
 *    so a Mongo outage, a deleted prompt, or a name that was never seeded must
 *    degrade to the caller's hardcoded fallback rather than fail the run. A
 *    logged warning is the correct response to a missing prompt; a 500 is not.
 *
 * 2. **It bypasses CASL.** The agent runs under a candidate or employer
 *    session, neither of which has any permission on prompts. This is an
 *    internal read, not a user-facing one, so it goes straight to the service
 *    and never through a controller.
 *
 * Rendering happens after the cache, not before, because `variables` differ per
 * call while the stored text does not.
 */
export const resolvePrompt = async (
  name: string,
  { label, variables, fallback }: IResolvePromptOptions
): Promise<PromptResolutionDto> => {
  const cached = getCachedPrompt<CachedResolution>(name, label);
  if (cached) {
    return { name, ...cached, content: renderPrompt(cached.content, variables), fallback: false };
  }

  try {
    const found = await findForResolution({ name, label });

    if (found) {
      const resolution: CachedResolution = {
        version: found.prompt.version,
        label: found.label,
        content: found.prompt.content,
      };
      setCachedPrompt(name, label, resolution);

      return { name, ...resolution, content: renderPrompt(resolution.content, variables), fallback: false };
    }

    logger.warn("[prompt] no stored version resolved; using code fallback", { name, label: label ?? null });
  } catch (error) {
    logger.warn("[prompt] resolution failed; using code fallback", {
      name,
      label: label ?? null,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Not cached: a fallback means the store is unavailable or incomplete, and
  // caching that would extend a transient outage by the full TTL.
  return { name, version: null, label: null, content: renderPrompt(fallback, variables), fallback: true };
};
