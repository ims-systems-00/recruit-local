import { BadRequestException } from "../../../common/helper";
import * as skillCatalogService from "../skill-catalog/skill-catalog.service";

/**
 * The check on a profile's skills that Joi cannot make, because it needs the
 * database: every skill must be a live, active catalogue entry — the rule a
 * job's skills are held to, so the two can be matched.
 *
 * Only the request's skills are checked. A save that does not send `skills`
 * leaves the stored ones alone, so an entry deactivated after the candidate
 * picked it does not block unrelated profile edits.
 */
export const assertProfileSkills = async (skills?: { skill: string }[]): Promise<void> => {
  if (!skills?.length) return;

  const ids = skills.map(({ skill }) => String(skill));
  const available = new Set((await skillCatalogService.findActiveByIds(ids)).map(({ _id }) => String(_id)));
  const unavailable = ids.filter((id) => !available.has(id));

  if (unavailable.length) {
    throw new BadRequestException(
      `These skills are not in the skill catalogue or are no longer available: ${unavailable.join(", ")}`
    );
  }
};
