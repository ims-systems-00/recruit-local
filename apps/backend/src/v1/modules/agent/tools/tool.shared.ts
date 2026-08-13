/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyAbility } from "@casl/ability";
import { AbilityAction, ISession } from "@rl/types";
import {
  JobAbilityBuilder,
  JobAuthZEntity,
  ALL_JOB_FIELDS,
  JobProfileAbilityBuilder,
  JobProfileAuthZEntity,
  ALL_JOB_PROFILE_FIELDS,
} from "@rl/authz";
import { ForbiddenException } from "../../../../common/helper";
import { sanitizeDocument, sanitizeDocuments } from "../../../../common/helper/authz";
import * as jobService from "../../job/job.service";
import { jobRoleScopedSecurityQuery } from "../../job/job.query";
import * as jobProfileService from "../../job-profile/job-profile.service";
import { RankingJobProfile } from "../../application/ranking/pipeline";

/**
 * The guards and reads more than one tool needs.
 *
 * Nothing here is a tool. What lands in this file is what would otherwise be
 * copied: the fail-closed check every read tool depends on, and the two entity
 * reads (a job, the caller's own profile) that four of them start from.
 * Entity-specific shaping stays with its own tools — see `application.shared.ts`.
 */

/**
 * Makes a model-supplied string safe to drop into a `$regex`. Every search term
 * reaching Mongo from a tool goes through this — unescaped, `c++` fails to
 * compile and a term of nested quantifiers is a denial of service.
 */
export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const jobFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_JOB_FIELDS,
};

export const jobProfileFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_JOB_PROFILE_FIELDS,
};

const hasUndefinedValue = (value: unknown): boolean => {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.some(hasUndefinedValue);
  if (value && typeof value === "object") return Object.values(value).some(hasUndefinedValue);
  return false;
};

/**
 * True when a rule meant to be scoped to this caller silently is not.
 *
 * An employer's Read rule is conditioned on `session.tenantId` and a candidate's
 * on `session.jobProfileId`, either of which is `undefined` on an account that
 * has not finished setting itself up. CASL drops a condition whose value is
 * undefined instead of treating it as unmatchable, so `accessibleBy` returns
 * `{ $or: [{}] }` — every row on the platform rather than none.
 *
 * Detected on the rules rather than on the generated query because by then the
 * evidence is gone: a legitimately unconditioned platform-admin rule and a
 * collapsed employer rule produce the identical `{ $or: [{}] }`. The row check
 * in `ability.can` fails closed on the same rule, so only query scoping is at
 * risk — which is the half a read tool relies on.
 */
export const rulesCollapsed = (ability: AnyAbility, subjectType: unknown): boolean =>
  ability
    .rulesFor(AbilityAction.Read, subjectType as never)
    .some((rule) => rule.conditions && hasUndefinedValue(rule.conditions));

/**
 * The jobs behind a set of ids, keyed by id, read through the caller's own job
 * ability.
 *
 * A job the caller may not read is simply absent from the map, rather than
 * borrowing one they were never allowed to fetch. That is not hypothetical for
 * candidates, whose Read rule covers open jobs only: a job closed after they
 * applied to it drops out here.
 */
export const readJobsById = async (jobIds: string[], session: ISession): Promise<Record<string, any>> => {
  const ids = [...new Set(jobIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const ability = new JobAbilityBuilder(session).getAbility();
  if (!ability.can(AbilityAction.Read, JobAuthZEntity) || rulesCollapsed(ability, JobAuthZEntity)) return {};

  const results = await jobService.list({
    query: { $and: [{ _id: { $in: ids } }, jobRoleScopedSecurityQuery(ability)] },
    options: { page: 1, limit: ids.length, sort: { createdAt: -1 } },
    tenantId: session.tenantId,
    jobProfileId: session.jobProfileId,
  });

  const jobs = sanitizeDocuments<any>(results.docs, ability, AbilityAction.Read, JobAuthZEntity, jobFieldOptions);

  return Object.fromEntries(jobs.filter((job) => job?._id != null).map((job) => [String(job._id), job]));
};

/**
 * One job, sanitized, or `undefined` when it does not exist or is not this
 * caller's to read — the two are indistinguishable by design, so an id belonging
 * to another tenant cannot be confirmed to exist.
 *
 * Every downstream reader must take the job from here rather than from
 * `Job.findById`. Sanitization is what strips `additionalQueries.expectedAnswer`
 * — the answer key to a job's screening questions — from a candidate's copy, and
 * a raw read would hand it straight to the model.
 */
export const readJobById = async (jobId: string, session: ISession): Promise<any | undefined> => {
  const jobs = await readJobsById([jobId], session);
  return jobs[String(jobId)];
};

/**
 * The caller's own candidate profile, populated for the ranking matchers.
 *
 * `jobProfileService.getOne` already resolves `values` into full value documents
 * (carrying the `type` and `weight` the value matcher scores on) and
 * `experienceLevel` into the level itself (carrying the `minYears`/`maxYears`
 * span the experience matcher needs), so the result drops straight into a
 * `RankingContext` without reshaping.
 *
 * CASL does the ownership work: a candidate's Read rule is conditioned on
 * `{ _id: session.jobProfileId }`, so a mismatched id fails the row check.
 */
export const readMyJobProfile = async (session: ISession): Promise<RankingJobProfile> => {
  if (!session.jobProfileId) {
    throw new ForbiddenException("This account has no candidate profile, so there is nothing to compare against.");
  }

  const ability = new JobProfileAbilityBuilder(session).getAbility();
  const profile: any = await jobProfileService.getOne({ query: { _id: session.jobProfileId } });

  if (!ability.can(AbilityAction.Read, new JobProfileAuthZEntity(profile))) {
    throw new ForbiddenException("You do not have permission to read your job profile.");
  }

  return sanitizeDocument<RankingJobProfile>(
    profile,
    ability,
    AbilityAction.Read,
    JobProfileAuthZEntity,
    jobProfileFieldOptions
  );
};
