import { VALUE_TYPE_ENUM } from "@rl/types";
import { Value } from "../models";
import { logger } from "../common/helper/logger";
import { VALUE_ASSESSMENTS } from "./value-assessments.content";

/**
 * Writes each value's self-evaluation questions from `value-assessments.content.ts`
 * onto the matching value document, found by type + label.
 *
 * The content file is the source of truth: re-running overwrites whatever is
 * stored, including an admin's edit through the values API. Editing the file and
 * reseeding *is* how a question is changed.
 *
 * Both directions of mismatch are logged — content with no matching value (a
 * renamed label), and active values with no content (one that cannot be
 * evaluated) — because either one fails silently otherwise.
 */
export const valueAssessmentSeeder = async () => {
  try {
    const entries = Object.entries(VALUE_ASSESSMENTS).flatMap(([type, byLabel]) =>
      Object.entries(byLabel).map(([label, assessment]) => ({ type: type as VALUE_TYPE_ENUM, label, assessment }))
    );

    const results = await Promise.all(
      entries.map(({ type, label, assessment }) => Value.updateOne({ type, label }, { $set: { assessment } }))
    );

    const unmatched = entries.filter((_, index) => results[index].matchedCount === 0);
    if (unmatched.length) {
      logger.warn(
        `Value assessments with no matching value: ${unmatched.map(({ type, label }) => `${type}/${label}`).join(", ")}`
      );
    }

    const missing = await Value.find({
      isActive: true,
      "deleteMarker.status": { $ne: true },
      assessment: { $exists: false },
    })
      .select("type label")
      .lean();
    if (missing.length) {
      logger.warn(
        `Active values with no assessment: ${missing.map(({ type, label }) => `${type}/${label}`).join(", ")}`
      );
    }

    logger.info(`Value assessment seeding completed. ${entries.length - unmatched.length} updated.`);
  } catch (error) {
    logger.error("Error seeding value assessments", error);
  }
};
