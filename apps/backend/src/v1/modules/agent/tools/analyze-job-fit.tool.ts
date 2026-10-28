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
 * The platform ranks an application on values, skills, role, location,
 * screening answers and experience. The first four a candidate already sees, as
 * the match percentage on their job list, scored from what both sides may read;
 * this tool reports gaps rather than repeating that number.
 *
 * - **Screening answers.** Grading them means comparing against the
 *   `expectedAnswer` the recruiter keyed, which CASL already strips from a
 *   candidate's copy of a job. A per-question score hands the same secret back in
 *   a different encoding.
 * - **The composite.** The employer's score folds the screening grade in, so it
 *   cannot be computed for a candidate without that secret, and a composite of
 *   only the readable parts would be reported as the employer's.
 *
 * Experience is safe from both directions: the job's `yearOfExperience` is in a
 * candidate's read fields and the level is their own. `matchExperience` is
 * called directly rather than through `runRankingPipeline` — with one matcher
 * there is no composite to compute, and a number named "fit" that measured only
 * experience would be reported as the whole answer.
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
    "Compare the user's own profile against one specific job and report what they are short on: experience " +
    "against the years asked for, keywords the job names that their profile lacks, required documents and " +
    "deadline, and the job's screening questions. " +
    "Use for whether they should apply, what they are missing, or how to strengthen an application. " +
    "Takes a job `_id` from list_jobs or recommend_jobs, not a title. " +
    "It does not score how well they match — report the gaps it returns, and never guess the expected answers " +
    "to screening questions.",

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

      // The candidate's OWN profile. Whether they have values set is worth
      // telling them — an empty list scores nothing on values, one of the two
      // most heavily weighted parts of the employer's ranking — and it reads
      // only their side.
      yourValuesSet: Array.isArray(profile.values) && profile.values.length > 0,

      // Stated in the payload and not only in the description, so the limit
      // travels with the data into the transcript rather than being something
      // the model has to remember.
      note:
        "This is not a match score. The match percentage on the job list compares skills, values, roles and " +
        "location; the employer's own score also grades screening answers against expected answers that are not " +
        "disclosed to candidates, so no ranking can be predicted from what is here.",
    };
  },
};
