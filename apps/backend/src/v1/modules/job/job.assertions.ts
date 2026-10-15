import { JOB_VALUES_MAX_PER_TYPE, VALUE_TYPE_ENUM, VALUE_TYPE_LABELS } from "@rl/types";
import { BadRequestException } from "../../../common/helper";
import * as skillCatalogService from "../skill-catalog/skill-catalog.service";
import * as valueService from "../value/value.service";

/** A skill row as it arrives in a request (`skill` is an id) or comes back from a read (populated). */
type JobSkillRow = { skill: unknown };

/** The same for a value row. */
type JobValueRow = { value: unknown };

/** An id, whether bare (request), an ObjectId (stored) or a populated `{ _id, ... }` (read). */
const toRefId = (ref: unknown) => String((ref as { _id?: unknown } | null)?._id ?? ref);

/**
 * The checks on a job's skills that Joi cannot make, because they need the
 * database: every skill must be a live, active catalogue entry, and a job being
 * published must have at least one.
 *
 * `skills` is what the job will hold once the write lands — the request's when
 * it sends some, otherwise (when publishing) the ones already saved. Re-checking
 * saved skills on publish catches one deactivated since the draft was saved.
 */
export const assertJobSkills = async ({
  skills,
  publishing,
}: {
  skills?: JobSkillRow[];
  publishing: boolean;
}): Promise<void> => {
  if (publishing && !skills?.length) {
    throw new BadRequestException("Add at least one skill before publishing this job.");
  }

  if (!skills?.length) return;

  const ids = skills.map(({ skill }) => toRefId(skill));
  const available = new Set((await skillCatalogService.findActiveByIds(ids)).map(({ _id }) => String(_id)));
  const unavailable = ids.filter((id) => !available.has(id));

  if (unavailable.length) {
    throw new BadRequestException(
      `These skills are not in the skill catalogue or are no longer available: ${unavailable.join(", ")}`
    );
  }
};

/**
 * The values counterpart of `assertJobSkills`, with one more rule: at most
 * `JOB_VALUES_MAX_PER_TYPE` values from any one value type, which needs each
 * value's `type` from the database. `values` is chosen the same way.
 */
export const assertJobValues = async ({
  values,
  publishing,
}: {
  values?: JobValueRow[];
  publishing: boolean;
}): Promise<void> => {
  if (publishing && !values?.length) {
    throw new BadRequestException("Add at least one value before publishing this job.");
  }

  if (!values?.length) return;

  const ids = values.map(({ value }) => toRefId(value));
  const available = await valueService.findActiveByIds(ids);
  const availableIds = new Set(available.map(({ _id }) => String(_id)));
  const unavailable = ids.filter((id) => !availableIds.has(id));

  if (unavailable.length) {
    throw new BadRequestException(
      `These values are not in the value catalogue or are no longer available: ${unavailable.join(", ")}`
    );
  }

  // Joi already rejects a repeated value, so each found entry is one of the job's values.
  const countByType = new Map<string, number>();
  for (const { type } of available) countByType.set(type, (countByType.get(type) ?? 0) + 1);

  const overCap = [...countByType].filter(([, count]) => count > JOB_VALUES_MAX_PER_TYPE);
  if (overCap.length) {
    throw new BadRequestException(
      `Choose at most ${JOB_VALUES_MAX_PER_TYPE} values from each category. Too many from: ${overCap
        .map(([type, count]) => `${VALUE_TYPE_LABELS[type as VALUE_TYPE_ENUM] ?? type} (${count})`)
        .join(", ")}`
    );
  }
};
