/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApplicationAbilityBuilder, ApplicationAuthZEntity, ALL_APPLICATION_FIELDS } from "@rl/authz";
import { ForbiddenException } from "../../../../common/helper";
import { applicationRoleScopedSecurityQuery } from "../../application/application.query";
import { toApplicationResponse } from "../../application/application.dto";
import { RANKING_SCALE } from "../../application/ranking/pipeline";
import { rulesCollapsed, present } from "./tool.shared";

/**
 * Shared between list_applications and get_application: the scoping guard and
 * the two response shapes. Nothing here is a tool; the tools are the two files
 * beside it.
 *
 * `readJobsById` — the lookup both need to turn a `jobId` into a title — moved
 * to `tool.shared.ts` once the job tools started needing it too. It is still
 * imported from here by the two tools, so their import lists did not change.
 */

export { readJobsById } from "./tool.shared";

export const applicationFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_APPLICATION_FIELDS,
};

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

const SUMMARY_FIELDS = [
  "_id",
  "reference",
  "jobId",
  "appliedAt",
  "createdAt",
  "portfolioUrl",
  "currentSalary",
  "expectedSalary",
  "matchScore",
];

/** Adds what only the detail view is worth spending tokens on. */
const DETAIL_FIELDS = [...SUMMARY_FIELDS, "updatedAt", "coverLetter", "feedback"];

/** The candidate behind an application, as the projection populates them. */
const toApplicant = (doc: Record<string, any>) =>
  doc.jobProfile ? { jobProfile: present(doc.jobProfile, ["_id", "name", "email"]) } : {};

/** The board column the application currently sits in, flattened to its label. */
const toStage = (doc: Record<string, any>) => (doc.status?.label ? { status: doc.status.label } : {});

/**
 * The denominator the match score is out of. `matchScore` itself rides in
 * `SUMMARY_FIELDS`; this puts the scale beside it so a bare 640 is readable, and
 * only when the score survived sanitization — a candidate's read fields omit
 * `matchScore`, and a lone `matchScoreOutOf` would imply a number they are not
 * being shown.
 */
const toMatchScale = (doc: Record<string, any>) => (doc.matchScore != null ? { matchScoreOutOf: RANKING_SCALE } : {});

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
    ...toMatchScale(application),
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
    ...toMatchScale(application),
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
