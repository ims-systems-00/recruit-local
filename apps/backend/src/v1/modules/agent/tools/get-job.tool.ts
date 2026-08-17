/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction } from "@rl/types";
import { JobAbilityBuilder, JobAuthZEntity } from "@rl/authz";
import { ForbiddenException, NotFoundException } from "../../../../common/helper";
import { AgentTool, AgentToolContext } from "./tool.types";
import { readJobById, present } from "./tool.shared";

interface GetJobInput {
  jobId: string;
}

/** The fields worth spending tokens on: what the job asks for, and who it is. */
const JOB_FIELDS = [
  "_id",
  "reference",
  "title",
  "description",
  "responsibility",
  "aboutUs",
  "category",
  "location",
  "locationAdditionalInfo",
  "workplace",
  "employmentType",
  "yearOfExperience",
  "salary",
  "period",
  "vacancy",
  "workingDays",
  "weekends",
  "workingHours",
  "requiredDocuments",
  "keywords",
  "endDate",
  "totalApplications",
  "status",
  "alreadyApplied",
  "createdAt",
];

/**
 * The screening questions, as the caller is allowed to see them.
 *
 * `expectedAnswer` is not stripped here — it is already gone by the time this
 * runs, because `readJobById` sanitizes and a candidate's read fields omit it.
 * An employer keeps it, which is correct: it is their own answer key.
 */
const toQuestions = (job: Record<string, any>) =>
  Array.isArray(job.additionalQueries)
    ? {
        additionalQueries: job.additionalQueries.map((query: any) =>
          present(query, ["_id", "question", "type", "options", "isRequired", "expectedAnswer"])
        ),
      }
    : {};

/**
 * The detail view behind list_jobs, and the other half of ranking a job's
 * applicants.
 *
 * `list_applications` can order candidates by the platform's stored
 * `matchScore`, but the score alone says nothing about what it measured. This
 * supplies the criteria — the years of experience asked for, the screening
 * questions, the documents required — so a recommendation can be explained
 * rather than just asserted.
 *
 * The fetch is scoped in the `$match` rather than checked against a document
 * already loaded, as get_application does, so a job belonging to another tenant
 * reports "not found" instead of "forbidden" and the model cannot use the
 * difference to confirm that a job it may not read exists.
 */
export const getJobTool: AgentTool<GetJobInput> = {
  name: "get_job",
  description:
    "Get the full detail of a single job posting: what it asks for in experience, salary and documents, its " +
    "description and responsibilities, its screening questions, and how many applications it has received. " +
    "Take the id from list_jobs first — this accepts only a job's `_id`, not a title or a reference code. " +
    "Pair this with list_applications when asked who to interview, shortlist or recommend for a job: " +
    "list_applications ranks the candidates by `matchScore`, and this says what they were ranked against, which is " +
    "what turns a score into a reason. " +
    "Employers can open their own organisation's jobs in any state; candidates can open jobs that are open for " +
    "applications. A job outside that is reported as not found.",

  parameters: {
    type: "object",
    properties: {
      jobId: {
        type: "string",
        description: "Required. The `_id` of the job, as returned in the results of list_jobs.",
      },
    },
    required: ["jobId"],
    additionalProperties: false,
  },

  inputSchema: Joi.object({
    jobId: Joi.string().hex().length(24).required().label("Job id"),
  }),

  mutating: false,

  async execute(input: GetJobInput, ctx: AgentToolContext) {
    const ability = new JobAbilityBuilder(ctx.session).getAbility();

    if (!ability.can(AbilityAction.Read, JobAuthZEntity)) {
      throw new ForbiddenException("You are not authorized to read jobs.");
    }

    const job = await readJobById(input.jobId, ctx.session);

    // Absent because it does not exist, is soft-deleted, or is not this
    // caller's to read — the three are indistinguishable by design.
    if (!job) throw new NotFoundException("No job with that id is available to this account.");

    return {
      ...present(job, JOB_FIELDS),
      ...toQuestions(job),
    };
  },
};
