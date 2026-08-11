/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyAbility } from "@casl/ability";
import { AbilityAction, ISession } from "@rl/types";
import {
  ApplicationAbilityBuilder,
  ApplicationAuthZEntity,
  ALL_APPLICATION_FIELDS,
  JobAbilityBuilder,
  JobAuthZEntity,
  ALL_JOB_FIELDS,
} from "@rl/authz";
import { ForbiddenException } from "../../../../common/helper";
import { sanitizeDocuments } from "../../../../common/helper/authz";
import * as jobService from "../../job/job.service";
import { jobRoleScopedSecurityQuery } from "../../job/job.query";
import { applicationRoleScopedSecurityQuery } from "../../application/application.query";
import { toApplicationResponse } from "../../application/application.dto";

/**
 * Shared between list_applications and get_application: the scoping guard, the
 * job lookup both need to turn a `jobId` into a title, and the two response
 * shapes. Nothing here is a tool; the tools are the two files beside it.
 */

export const applicationFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_APPLICATION_FIELDS,
};

const jobFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_JOB_FIELDS,
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
const rulesCollapsed = (ability: AnyAbility, subjectType: unknown): boolean =>
  ability
    .rulesFor(AbilityAction.Read, subjectType as never)
    .some((rule) => rule.conditions && hasUndefinedValue(rule.conditions));

/**
 * The `$match` limiting a query to the applications this caller may read, plus
 * the assurance that it limits anything at all.
 */
export const applicationSecurityQuery = (ability: ReturnType<ApplicationAbilityBuilder["getAbility"]>) => {
  if (rulesCollapsed(ability, ApplicationAuthZEntity)) {
    throw new ForbiddenException("This account is not finished being set up, so its applications cannot be read yet.");
  }

  return applicationRoleScopedSecurityQuery(ability);
};

/**
 * The jobs behind a set of applications, keyed by id, read through the caller's
 * own job ability.
 *
 * An application stores only `jobId`, and nobody asks a question about
 * "68f3ab...". A job the caller may not read is simply absent from the map and
 * the application is reported without a title, rather than borrowing one the
 * caller was never allowed to fetch. That is not hypothetical for candidates,
 * whose Read rule covers open jobs only: a job closed after they applied to it
 * drops out here.
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

/** Keeps a field only when it survived sanitization and carries a value. */
const present = (source: Record<string, any>, keys: string[]): Record<string, any> => {
  const picked: Record<string, any> = {};
  for (const key of keys) if (source?.[key] != null) picked[key] = source[key];
  return picked;
};

const SUMMARY_FIELDS = [
  "_id",
  "reference",
  "jobId",
  "appliedAt",
  "createdAt",
  "portfolioUrl",
  "currentSalary",
  "expectedSalary",
];

/** Adds what only the detail view is worth spending tokens on. */
const DETAIL_FIELDS = [...SUMMARY_FIELDS, "updatedAt", "coverLetter", "feedback"];

/** The candidate behind an application, as the projection populates them. */
const toApplicant = (doc: Record<string, any>) =>
  doc.jobProfile ? { jobProfile: present(doc.jobProfile, ["_id", "name", "email"]) } : {};

/** The board column the application currently sits in, flattened to its label. */
const toStage = (doc: Record<string, any>) => (doc.status?.label ? { status: doc.status.label } : {});

/**
 * A populated FileMedia object is mostly S3 bookkeeping — bucket, key, delete
 * markers — which costs tokens and tells the model nothing. Attachments are
 * private, so `src` is null on all of them and only the filename survives.
 */
const toFileSummary = (file: Record<string, any>) => ({
  ...(file?._id != null ? { _id: String(file._id) } : {}),
  ...(file?.storageInformation?.Name ? { name: file.storageInformation.Name } : {}),
  ...(file?.src ? { src: file.src } : {}),
});

/**
 * One row of a list: enough to identify an application and answer "who applied,
 * to what, when, and where are they in the pipeline". The cover letter and
 * screening answers are deliberately left to get_application — at 25 rows they
 * would dominate the context window.
 */
export const toApplicationSummary = (doc: unknown, jobs: Record<string, any>) => {
  const application = toApplicationResponse(doc) as Record<string, any>;
  const job = application.jobId ? jobs[String(application.jobId)] : undefined;

  return {
    ...present(application, SUMMARY_FIELDS),
    ...(job?.title ? { jobTitle: job.title } : {}),
    ...toStage(application),
    ...toApplicant(application),
  };
};

/**
 * The full application, including the screening answers resolved against the
 * job's questions.
 *
 * Answers are stored as `{ queryId, answer }`, which is unreadable on its own —
 * the question text lives on the job. Only `question` is taken across, never
 * `expectedAnswer`: an employer may read their own answer key, but pairing it
 * with a candidate's answer is the agent grading the application, which is not
 * this tool's job.
 */
export const toApplicationDetail = (doc: unknown, job: Record<string, any> | undefined) => {
  const application = toApplicationResponse(doc) as Record<string, any>;

  const questions = new Map<string, string>(
    (job?.additionalQueries ?? [])
      .filter((query: any) => query?._id != null && query?.question)
      .map((query: any) => [String(query._id), query.question as string])
  );

  return {
    ...present(application, DETAIL_FIELDS),
    ...(job?.title ? { jobTitle: job.title } : {}),
    ...toStage(application),
    ...toApplicant(application),
    ...(Array.isArray(application.answers)
      ? {
          answers: application.answers.map((answer: any) => ({
            question: questions.get(String(answer?.queryId)) ?? null,
            answer: answer?.answer ?? null,
          })),
        }
      : {}),
    ...(application.resume ? { resume: toFileSummary(application.resume) } : {}),
    ...(Array.isArray(application.caseStudies) ? { caseStudies: application.caseStudies.map(toFileSummary) } : {}),
  };
};
