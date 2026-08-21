/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction, ISession, JOBS_STATUS_ENUMS } from "@rl/types";
import { JobAbilityBuilder, JobAuthZEntity } from "@rl/authz";
import { ForbiddenException } from "../../../../common/helper";
import { sanitizeDocuments } from "../../../../common/helper/authz";
import { buildKeywords } from "../../../../common/helper/keywords";
import * as jobService from "../../job/job.service";
import { jobRoleScopedSecurityQuery } from "../../job/job.query";
import { getProfileKeywords } from "../../job/keyword.service";
import { readFeedIds } from "../../job/feed.service";
import { enqueueProfileFeedRebuild } from "../../../../queue/profileFeedRebuildQueue";
import { AgentTool, AgentToolContext } from "./tool.types";
import { jobFieldOptions, rulesCollapsed, present, JOB_SUMMARY_FIELDS } from "./tool.shared";

const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 10;

/**
 * Over-fetch before dropping the jobs already applied to, so filtering does not
 * silently return fewer than asked for. Bounded rather than looping: the feed is
 * ranked, so the good matches are at the front either way.
 */
const OVERFETCH = 2;

interface RecommendJobsInput {
  keywords?: string;
  limit?: number;
  excludeApplied?: boolean;
}

/** The same row shape `list_jobs` returns, plus the match fields added below. */
const RESULT_FIELDS = JOB_SUMMARY_FIELDS;

/**
 * Recommends open jobs to the signed-in candidate, best match first.
 *
 * This is the tool form of the jobs list's `matched` mode, and reuses the same
 * three pieces: the profile's `keywords`, the precomputed Redis feed that
 * narrows the collection to jobs already known to overlap it, and Mongo's
 * `$setIntersection` scoring over `Job.keywords`. Both sides of that
 * intersection are built by `buildKeywords`, which is what makes the vocabulary
 * comparable at all.
 *
 * The one thing it adds is the reason: the list endpoint sorts by overlap but
 * never says which words overlapped, and "you match this job" is not an answer a
 * candidate can act on. `matchedKeywords` is recomputed here from the sanitized
 * document, so it can only ever name words the caller was allowed to read.
 */
export const recommendJobsTool: AgentTool<RecommendJobsInput> = {
  name: "recommend_jobs",
  description:
    "Recommend open jobs for the user to apply to, best match first, by keyword overlap between their profile " +
    "and the job. Use for what they should apply for or what suits them. " +
    'Pass `keywords` when the question narrows the ask ("remote react jobs") — matched in addition to their ' +
    "profile, not instead of it. " +
    "Each result carries `matchedKeywords` and `matchStrength`, a count of shared terms — not a percentage, and " +
    "not the match score an employer sees. Explain a recommendation from those words. " +
    "An empty result means too few profile keywords, which analyze_my_profile diagnoses — not that no jobs are open.",

  parameters: {
    type: "object",
    properties: {
      keywords: {
        type: "string",
        description:
          "Optional. Extra words to match on, from what the user asked for. Free text. Omit to match on their " +
          "profile alone.",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: MAX_LIMIT,
        description: `Optional. Max jobs to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}).`,
      },
      excludeApplied: {
        type: "boolean",
        description:
          "Optional, default true. Leave out jobs already applied to. Set false when the question is about how " +
          "well they match jobs generally.",
      },
    },
    required: [],
    additionalProperties: false,
  },

  inputSchema: Joi.object({
    keywords: Joi.string().trim().min(1).max(300).optional().label("Keywords"),
    limit: Joi.number().integer().min(1).max(MAX_LIMIT).optional().label("Limit"),
    excludeApplied: Joi.boolean().optional().label("Exclude applied"),
  }),

  mutating: false,

  /**
   * Offered only to accounts that have a candidate profile. Recommendations are
   * computed *from* that profile, so without one the tool has nothing to match
   * with and would burn a turn returning an empty list.
   */
  isAvailable: (session: ISession) => Boolean(session.jobProfileId),

  async execute(input: RecommendJobsInput, ctx: AgentToolContext) {
    const ability = new JobAbilityBuilder(ctx.session).getAbility();

    if (!ability.can(AbilityAction.Read, JobAuthZEntity) || rulesCollapsed(ability, JobAuthZEntity)) {
      throw new ForbiddenException("You are not authorized to read jobs.");
    }

    const jobProfileId = ctx.session.jobProfileId;
    if (!jobProfileId) {
      throw new ForbiddenException("This account has no candidate profile, so there is nothing to match against.");
    }

    const profileKeywords = await getProfileKeywords(jobProfileId);
    // Tokenised through the same function that built both stored keyword sets,
    // so a word the user typed is normalised into the same vocabulary.
    const askedKeywords = input.keywords ? buildKeywords([input.keywords]) : [];
    const matchKeywords = [...new Set([...profileKeywords, ...askedKeywords])];

    if (matchKeywords.length === 0) {
      return {
        totalMatching: 0,
        returned: 0,
        jobs: [],
        note:
          "This profile carries no keywords yet, so there is nothing to match jobs against. Filling in job titles, " +
          "industries, work modes and skills is what generates them.",
      };
    }

    // Narrow to the precomputed feed so Mongo scores only jobs already known to
    // overlap. A cold or evicted feed is rebuilt in the background and this run
    // falls through to matching the whole collection — correct, just not
    // accelerated. Skipped entirely when the user supplied their own keywords,
    // since the feed was built from the profile alone and would exclude the very
    // jobs they just asked for.
    let feedIds: string[] = [];
    if (askedKeywords.length === 0) {
      feedIds = await readFeedIds(jobProfileId);
      if (!feedIds.length) await enqueueProfileFeedRebuild(jobProfileId);
    }

    const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const excludeApplied = input.excludeApplied ?? true;

    const results = await jobService.list({
      query: {
        $and: [
          { status: JOBS_STATUS_ENUMS.OPEN },
          jobRoleScopedSecurityQuery(ability),
          ...(feedIds.length ? [{ _id: { $in: feedIds } }] : []),
        ],
      },
      options: {
        page: 1,
        limit: excludeApplied ? limit * OVERFETCH : limit,
        sort: "-matchScore -createdAt",
      },
      tenantId: ctx.session.tenantId,
      jobProfileId,
      matchKeywords,
    });

    const jobs = sanitizeDocuments<Record<string, any>>(
      results.docs,
      ability,
      AbilityAction.Read,
      JobAuthZEntity,
      jobFieldOptions
    );

    // The aggregation's own `matchScore` does not survive sanitization — it is
    // computed per query and is not a field on the Job model, so it is absent
    // from `ALL_JOB_FIELDS`. Recomputing the overlap from the sanitized document
    // gets the words as well as the count, which is the half worth reporting.
    const wanted = new Set(matchKeywords);
    const recommended = jobs
      .filter((job) => !(excludeApplied && job.alreadyApplied))
      .slice(0, limit)
      .map((job) => {
        const matched = (job.keywords ?? []).filter((keyword: string) => wanted.has(String(keyword).toLowerCase()));
        return {
          ...present(job, RESULT_FIELDS),
          matchedKeywords: matched,
          matchStrength: matched.length,
        };
      });

    return {
      totalMatching: results.totalDocs,
      returned: recommended.length,
      matchedOn: matchKeywords,
      jobs: recommended,
      ...(askedKeywords.length
        ? { note: "Matched on the words in the question as well as the profile's own keywords." }
        : {}),
    };
  },
};
