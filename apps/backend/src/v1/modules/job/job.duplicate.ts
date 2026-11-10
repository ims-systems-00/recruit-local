import { AnyAbility } from "@casl/ability";
import { Types } from "mongoose";
import { JobAuthZEntity } from "@rl/authz";
import { AbilityAction, JOB_VALUE_PRIORITY_ENUMS, JOBS_STATUS_ENUMS } from "@rl/types";
import { sanitizeDocument } from "../../../common/helper/authz";
import { IJobInput, IJobSkill, IJobValue } from "../../../models/job.model";
import { getOne as getTenant } from "../tenant/tenant.service";
import * as skillCatalogService from "../skill-catalog/skill-catalog.service";
import * as valueService from "../value/value.service";
import { refId } from "./match/ref-id";

/**
 * Another organisation's ranking of its values is never copied, so each value
 * starts on this tier and the recruiter re-ranks them in the editor.
 */
const DEFAULT_COPIED_VALUE_PRIORITY = JOB_VALUE_PRIORITY_ENUMS.IMPORTANT;

/**
 * Only the fields a Duplicate rule names. A rule that names none (an admin's
 * `manage`) gives none, so a copy can never carry the whole job by accident.
 */
const copyFieldOptions = { fieldsFrom: (rule: { fields?: string[] }) => rule.fields ?? [] };

/** A job's fields as `getOne` reads them: skill and value rows are populated. */
type CopiedFields = Omit<Partial<IJobInput>, "skills" | "values"> & {
  skills?: { skill: unknown; level: IJobSkill["level"]; requirement: IJobSkill["requirement"] }[];
  values?: { value: unknown; priority?: IJobValue["priority"] }[];
};

/** The copy's contents. The caller adds the `tenantId`, the same way job creation does. */
type JobCopy = Omit<IJobInput, "tenantId">;

/** The ids in `refs` that are still live, active catalogue entries. */
const activeIds = async (refs: unknown[], findActiveByIds: (ids: string[]) => Promise<{ _id: unknown }[]>) => {
  const ids = refs.map(refId).filter((id): id is string => id !== null);
  if (!ids.length) return new Set<string>();
  return new Set((await findActiveByIds(ids)).map(({ _id }) => String(_id)));
};

/**
 * Builds a new draft from `source` (a job as `jobService.getOne` reads it) for
 * the organisation `tenantId`. Reads only — saving it is the caller's job.
 *
 * - Fields: only those the caller's Duplicate rule allows (see `job.authz.ts`).
 *   From another organisation's job that leaves out its contact details, the
 *   expected answers to its questions and its value priorities.
 * - Skills and values no longer active in the catalogue are dropped, so the
 *   copy passes the same checks as any new job.
 * - Missing contact details are filled from the copier's own organisation,
 *   where it has them.
 * - Always a draft. Status, dates, attachments and applications are never copied.
 */
export const buildJobCopy = async ({
  source,
  ability,
  tenantId,
}: {
  source: unknown;
  ability: AnyAbility;
  tenantId: string;
}): Promise<JobCopy> => {
  const {
    skills = [],
    values = [],
    ...fields
  } = sanitizeDocument<CopiedFields>(source, ability, AbilityAction.Duplicate, JobAuthZEntity, copyFieldOptions);

  const [activeSkillIds, activeValueIds] = await Promise.all([
    activeIds(
      skills.map(({ skill }) => skill),
      skillCatalogService.findActiveByIds
    ),
    activeIds(
      values.map(({ value }) => value),
      valueService.findActiveByIds
    ),
  ]);

  const copiedSkills: IJobSkill[] = skills.flatMap(({ skill, level, requirement }) => {
    const id = refId(skill);
    return id && activeSkillIds.has(id) ? [{ skill: new Types.ObjectId(id), level, requirement }] : [];
  });

  const copiedValues: IJobValue[] = values.flatMap(({ value, priority }) => {
    const id = refId(value);
    return id && activeValueIds.has(id)
      ? [{ value: new Types.ObjectId(id), priority: priority ?? DEFAULT_COPIED_VALUE_PRIORITY }]
      : [];
  });

  // Only looked up when something is missing, which is always the case for
  // another organisation's job and rarely for one's own.
  const ownOrganisation =
    fields.email && fields.number && fields.aboutUs ? null : await getTenant({ query: { _id: tenantId } });

  return {
    ...fields,
    email: fields.email || ownOrganisation?.email,
    number: fields.number || ownOrganisation?.phone,
    aboutUs: fields.aboutUs || ownOrganisation?.description,
    skills: copiedSkills,
    values: copiedValues,
    status: JOBS_STATUS_ENUMS.DRAFT,
  };
};
