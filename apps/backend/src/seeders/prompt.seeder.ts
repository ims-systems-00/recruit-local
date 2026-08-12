import { PROMPT_LABEL, PROMPT_NAME } from "@rl/types";
import { Prompt } from "../models";
import { logger } from "../common/helper/logger";
import {
  DEFAULT_BASE_PROMPT,
  DEFAULT_CANDIDATE_PROMPT,
  DEFAULT_EMPLOYER_PROMPT,
} from "../v1/modules/agent/agent.constants";
import { DEFAULT_CV_EXTRACT_SYSTEM_PROMPT } from "../v1/modules/cv/cv.constants";
import { extractPromptVariables } from "../v1/modules/prompt/prompt.render";

/**
 * Seeds v1 of every prompt the runtime resolves, from the same constants the
 * code falls back to. That equivalence is the point: on a fresh database the
 * agent behaves identically whether it reads from the registry or from code, so
 * introducing the registry changes nothing until someone deliberately publishes
 * a new version.
 *
 * Idempotent by name — an existing prompt is left alone rather than reset,
 * since seeding must never clobber a version someone published.
 */
export const promptSeeder = async () => {
  try {
    const prompts = [
      { name: PROMPT_NAME.AGENT_SYSTEM_BASE, content: DEFAULT_BASE_PROMPT },
      { name: PROMPT_NAME.AGENT_SYSTEM_EMPLOYER, content: DEFAULT_EMPLOYER_PROMPT },
      { name: PROMPT_NAME.AGENT_SYSTEM_CANDIDATE, content: DEFAULT_CANDIDATE_PROMPT },
      { name: PROMPT_NAME.CV_EXTRACT_SYSTEM, content: DEFAULT_CV_EXTRACT_SYSTEM_PROMPT },
    ];

    // Sequential rather than Promise.all: concurrent inserts would race on the
    // unique {name, labels} index for `latest`.
    for (const { name, content } of prompts) {
      const existing = await Prompt.findOne({ name });
      if (existing) continue;

      await Prompt.create({
        name,
        version: 1,
        content,
        variables: extractPromptVariables(content),
        // Both labels on v1, so the runtime resolves to it immediately and
        // `production` is already there to be moved on the first publish.
        labels: [PROMPT_LABEL.LATEST, PROMPT_LABEL.PRODUCTION],
        commitMessage: "Seeded from the in-code default.",
      });
    }

    logger.info("Prompt seeding completed.");
  } catch (error) {
    logger.error("Error seeding prompts", error);
  }
};
