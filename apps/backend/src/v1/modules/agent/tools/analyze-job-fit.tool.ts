/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction, ISession } from "@rl/types";
import { JobAbilityBuilder, JobAuthZEntity } from "@rl/authz";
import { ForbiddenException, NotFoundException } from "../../../../common/helper";
import { matchExperience } from "../../application/ranking/matching/experience";
import { AgentTool, AgentToolContext } from "./tool.types";
import { readJobById, readMyJobProfile, present } from "./tool.shared";

interface AnalyzeJobFitInput {
  jobId: string;
}

/**
 * What this deliberately does not compare, and why it is not merely omitted from
 * the output.
 *
 * The platform ranks an application on three signals: how the candidate's values
 * line up with the hiring organisation's, how they answered the screening
 * questions, and whether their experience meets the requirement. Only the third
 * can be shown to a candidate.
 *
 * - **Values.** `values` is absent from `TENANT_PUBLIC_READ_FIELDS`, so a
 *   candidate may not read an organisation's values. Reporting the *intersection*
 *   would honour the letter of that and break it in practice: add one value to
 *   your profile, re-run this, and see whether it appeared. Repeat across the
 *   catalog and the organisation's whole set falls out. The composite score is
 *   the same oracle run slower, because a matching value moves the number. So
 *   the matcher is not run at all — sanitizing the output cannot fix a leak that
 *   is in the computation.
 * - **Screening answers.** Grading them means comparing against the
 *   `expectedAnswer` the recruiter keyed, which CASL already strips from a
 *   candidate's copy of a job. A per-question score hands the same secret back in
 *   a different encoding.
 *
 * That leaves experience, which is safe from both directions: the job's
 * `yearOfExperience` is in a candidate's read fields and the level is their own.
 * `matchExperience` is called directly rather than through `runRankingPipeline` —
 * with one matcher there is no composite to compute, and a number named "fit"
 * that measured only experience would be reported as the whole answer.
 */
/**
 * The words a job names that the profile does not carry.
 *
 * Both sides are built by `buildKeywords` from their own text and catalog
 * selections, so this is the same overlap that decides whether the job is ever
 * recommended — stated as the concrete terms to go and add. Both sides are also
 * readable by the candidate, so unlike values this can be named outright.
 */
const keywordGaps = (jobKeywords: string[] | undefined, profileKeywords: string[] | undefined): string[] => {
  const held = new Set((profileKeywords ?? []).map((keyword) => String(keyword).toLowerCase()));
  return [...new Set((jobKeywords ?? []).map((keyword) => String(keyword).toLowerCase()))].filter(
    (keyword) => !held.has(keyword)
  );
};

/**
 * Compares the caller's own profile against one job and reports the gap.
 *
 * Every field returned is derived from data both parties may read — the job as
 * the candidate is allowed to see it, and their own profile — so there is
 * nothing here to probe at. See the note above `present` for what was left out
 * and why.
 *
 * Everything the model learns about the job comes from `readJobById`, which
 * sanitizes. That is the boundary keeping the recruiter's answer key out of this
 * answer, and it is why nothing here reads `Job.findById`.
 */
export const analyzeJobFitTool: AgentTool<AnalyzeJobFitInput> = {
  name: "analyze_job_fit",
  description:
    "Compare the current user's own profile against one specific job and report what they are short on. " +
    "Take the id from list_jobs or recommend_jobs first — this accepts only a job's `_id`, not a title. " +
    "Returns how their experience measures against the years the job asks for, the keywords the job names that " +
    "their profile does not carry, what the job requires in documents and deadline, and its screening questions. " +
    "Use this for any question about whether they should apply, what they are missing, or how to strengthen an " +
    "application. " +
    "This does NOT score how well they match, and does not predict where their application will rank. Employers " +
    "rank applicants partly on how a candidate's values line up with their organisation's, and an organisation's " +
    "values are not visible to candidates — so that comparison is absent here by design. Say it is not available " +
    "rather than estimating it, and never guess at, infer, or describe what the hiring organisation values, from " +
    "this payload or from the job's wording. " +
    "An experience result marked `applicable: false` was not measured, usually because the user has not set an " +
    "experience level — report it as not measurable and point at analyze_my_profile, not as a poor match. " +
    "The expected answers to the screening questions are likewise not available and must never be guessed at.",

  parameters: {
    type: "object",
    properties: {
      jobId: {
        type: "string",
        description: "Required. The `_id` of the job, as returned by list_jobs or recommend_jobs.",
      },
    },
    required: ["jobId"],
    additionalProperties: false,
  },

  inputSchema: Joi.object({
    jobId: Joi.string().hex().length(24).required().label("Job id"),
  }),

  mutating: false,

  /**
   * Offered only to accounts with a candidate profile — this compares against
   * one, so there is nothing to answer without it. Not the security boundary:
   * `readJobById` and `readMyJobProfile` each rebuild their own ability.
   */
  isAvailable: (session: ISession) => Boolean(session.jobProfileId),

  async execute(input: AnalyzeJobFitInput, ctx: AgentToolContext) {
    const jobAbility = new JobAbilityBuilder(ctx.session).getAbility();
    if (!jobAbility.can(AbilityAction.Read, JobAuthZEntity)) {
      throw new ForbiddenException("You are not authorized to read jobs.");
    }

    const [job, jobProfile] = await Promise.all([readJobById(input.jobId, ctx.session), readMyJobProfile(ctx.session)]);

    if (!job) throw new NotFoundException("No job with that id is available to this account.");

    const profile = jobProfile as Record<string, any>;

    // Pure and synchronous: the job's stated requirement in years against the
    // band of years the candidate's own level covers.
    const experience = matchExperience(job.yearOfExperience, profile.experienceLevel);

    return {
      job: {
        _id: job._id,
        ...present(job, ["title", "yearOfExperience", "requiredDocuments", "alreadyApplied"]),
        ...(job.endDate ? { endDate: job.endDate, closed: new Date(job.endDate) < new Date() } : {}),
      },

      experience: {
        applicable: experience.applicable,
        standing: experience.standing,
        required: experience.required,
        band: experience.band,
        level: experience.level,
        shortfall: experience.shortfall,
        excess: experience.excess,
      },

      keywordGaps: keywordGaps(job.keywords, profile.keywords),

      screeningQuestions: Array.isArray(job.additionalQueries)
        ? job.additionalQueries.map((query: any) => ({
            question: query?.question ?? null,
            type: query?.type ?? null,
            isRequired: Boolean(query?.isRequired),
            ...(Array.isArray(query?.options) && query.options.length ? { options: query.options } : {}),
          }))
        : [],

      // The candidate's OWN profile, never the organisation's. Whether they have
      // values set is worth telling them — an empty list costs them the most
      // heavily weighted signal in the employer's ranking — and it discloses
      // nothing, because it reads their side of a comparison they are not shown.
      yourValuesSet: Array.isArray(profile.values) && profile.values.length > 0,

      // Stated in the payload and not only in the description, so the limit
      // travels with the data into the transcript rather than being something
      // the model has to remember.
      note:
        "This is not a match score. Employers also weigh how a candidate's values line up with their " +
        "organisation's, and an organisation's values are not disclosed to candidates, so no ranking can be " +
        "predicted from what is here.",
    };
  },
};
