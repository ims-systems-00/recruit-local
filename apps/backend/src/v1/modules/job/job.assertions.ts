import { BadRequestException } from "../../../common/helper";
import * as skillCatalogService from "../skill-catalog/skill-catalog.service";

/** A skill row as it arrives in a request (`skill` is an id) or comes back from a read (populated). */
type JobSkillRow = { skill: unknown };

const toSkillId = (ref: unknown) => String((ref as { _id?: unknown } | null)?._id ?? ref);

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

  const ids = skills.map(({ skill }) => toSkillId(skill));
  const available = new Set((await skillCatalogService.findActiveByIds(ids)).map(({ _id }) => String(_id)));
  const unavailable = ids.filter((id) => !available.has(id));

  if (unavailable.length) {
    throw new BadRequestException(
      `These skills are not in the skill catalogue or are no longer available: ${unavailable.join(", ")}`
    );
  }
};
