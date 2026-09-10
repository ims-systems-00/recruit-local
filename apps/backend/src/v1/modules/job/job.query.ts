import { PipelineStage, Types } from "mongoose";
import { projectQuery, ListQuerySpec, eq, gte, lt, lte, objectId, oneOf, range } from "../../../common/query";
import { omit } from "lodash";
import { IJobDoc, Job } from "../../../models";
import { JobAbilityBuilder, JobAuthZEntity } from "@rl/authz";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction, JOBS_STATUS_ENUMS } from "@rl/types";
import { modelNames } from "../../../models/constants";
import { VISIBILITY_ENUM } from "@rl/types";

export const jobRoleScopedSecurityQuery = (ability: ReturnType<JobAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(JobAuthZEntity);
  return query;
};

export const jobProjectionQuery = (allowedFields?: string[]): PipelineStage[] => {
  let selectedFields: string[] = [];

  if (allowedFields && allowedFields.length > 0) {
    selectedFields = [...allowedFields];
  } else {
    // `embedding` is ~1536 floats per document. jobProjectionQuery feeds every
    // list and getOne, so leaving it in would put it on the wire for each job.
    const fieldsToExclude: (keyof IJobDoc | "__v")[] = ["__v", "embedding"];
    selectedFields = Object.keys(omit(Job.schema.paths, fieldsToExclude));
  }

  return projectQuery(selectedFields);
};

export const jobAttachmentsLookupQuery = (): PipelineStage[] => {
  const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL || "";

  return [
    {
      $lookup: {
        from: modelNames.FILE_MEDIA,
        let: { attachmentIds: "$attachmentIds" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $in: ["$_id", { $ifNull: ["$$attachmentIds", []] }] }],
              },
            },
          },
          {
            $addFields: {
              src: {
                $cond: {
                  if: { $eq: ["$visibility", VISIBILITY_ENUM.PUBLIC] },
                  then: { $concat: [baseUrl, "/", "$storageInformation.Key"] },
                  else: null,
                },
              },
            },
          },
          // FIX: Use exclusion ONLY to avoid the "mixed projection" error
          {
            $project: {
              deleteMarker: 0,
              __v: 0,
              collectionName: 0,
              collectionDocument: 0,
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
        as: "attachments",
      },
    },
  ];
};

export const alreadyAlliped = (jobProfileId?: string): PipelineStage[] => {
  if (!jobProfileId || !Types.ObjectId.isValid(jobProfileId)) {
    return [{ $addFields: { alreadyApplied: false } }];
  }

  const jobProfileObjectId = new Types.ObjectId(jobProfileId);

  return [
    {
      $lookup: {
        from: modelNames.APPLICATION,
        let: { currentJobId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$jobId", "$$currentJobId"] }, { $eq: ["$jobProfileId", jobProfileObjectId] }],
              },
            },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: "alreadyAppliedLookup",
      },
    },
    {
      $addFields: {
        alreadyApplied: {
          $gt: [{ $size: "$alreadyAppliedLookup" }, 0],
        },
      },
    },
    {
      $project: {
        alreadyAppliedLookup: 0,
      },
    },
  ];
};

export const alreadysaved = (tenantId?: string, jobProfileId?: string): PipelineStage[] => {
  // A favourite is owned by exactly one context: a jobProfile (candidate) or a tenant (employer).
  // Match on whichever owner the current viewer is.
  const ownerCondition =
    jobProfileId && Types.ObjectId.isValid(jobProfileId)
      ? { $eq: ["$jobProfileId", new Types.ObjectId(jobProfileId)] }
      : tenantId && Types.ObjectId.isValid(tenantId)
        ? { $eq: ["$tenantId", new Types.ObjectId(tenantId)] }
        : null;

  if (!ownerCondition) {
    return [{ $addFields: { alreadySaved: false, alreadySavedId: null } }];
  }

  const matchConditions: any[] = [
    ownerCondition,
    { $eq: ["$itemType", modelNames.JOB] },
    { $eq: ["$itemId", "$$currentJobId"] },
    // Favourites are soft-deleted, so an unsaved job must stop matching — without
    // this the flag stays `true` forever after `DELETE /favourites/:id/soft`.
    { $ne: ["$deleteMarker.status", true] },
  ];

  return [
    {
      $lookup: {
        from: modelNames.FAVOURITE,
        let: { currentJobId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: matchConditions,
              },
            },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: "alreadySavedLookup",
      },
    },
    {
      $addFields: {
        alreadySaved: {
          $gt: [{ $size: "$alreadySavedLookup" }, 0],
        },
        // Id of that favourite, so a client can undo the save with
        // `DELETE /favourites/:id/soft` without first looking it up. `null` when
        // the job is not saved. Mirrors `alreadySavedQuery` in the post module.
        alreadySavedId: {
          $ifNull: [{ $arrayElemAt: ["$alreadySavedLookup._id", 0] }, null],
        },
      },
    },
    {
      $project: {
        alreadySavedLookup: 0,
      },
    },
  ];
};

/**
 * The query params `GET /jobs` accepts, and what each one means.
 *
 * `matched` and `semantic` are deliberately absent — they switch modes rather than
 * filter, so the controller reads them directly. Anything not listed here never
 * reaches `$match`; `listQuerySchema` is what turns an unknown key into a 400.
 */
export const jobListQuerySpec: ListQuerySpec = {
  filters: {
    status: eq("status"),
    category: eq("category"),
    employmentType: oneOf("employmentType"),
    workplace: oneOf("workplace"),
    period: oneOf("period"),
    salary: range("salary"),
    yearOfExperience: range("yearOfExperience"),

    // Three keys narrowing one field. `buildListQuery` merges them, so
    // `?endDateFrom=…&endDateTo=…` becomes a single `{ $gte, $lte }` condition
    // instead of the last one winning.
    endDateFrom: gte("endDate"),
    endDateTo: lte("endDate"),
    endDateBefore: lt("endDate"),

    postedAfter: gte("createdAt"),
    postedBefore: lte("createdAt"),

    minVacancy: gte("vacancy"),

    // `formId` would be cast by `sanitizeQueryIds` on its name alone, but saying so
    // here keeps it working if the field is ever renamed to something that does not
    // end in `Id` — which is exactly how the same filter is silently broken on
    // `job-profile.jobTitle` and `file-media.collectionDocument`.
    formId: objectId("formId"),

    /**
     * A default view baseline rather than a filter: hide dead postings unless the
     * caller asked for a specific status, in which case their choice wins.
     *
     * Reads `query.status` — the validated request — rather than the filter being
     * accumulated, so it does not depend on the order builders happen to run in.
     */
    excludeClosed: (value, query) =>
      value === true && !query.status
        ? { status: { $nin: [JOBS_STATUS_ENUMS.CLOSED, JOBS_STATUS_ENUMS.ARCHIVED] } }
        : undefined,
  },
  sortable: ["createdAt", "updatedAt", "salary", "endDate"],
  defaultSort: "-createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
};

/** Atlas index names. Created by `scripts/ensure-search-indexes.ts`. */
export const JOB_SEARCH_INDEX = "job_search_index";
export const JOB_VECTOR_INDEX = "job_vector_index";

/** Candidates pulled from each branch before fusion. */
const SEARCH_CANDIDATES = 200;

/**
 * Cosine floor a semantic-only hit must clear to stay in the results.
 *
 * `$vectorSearch` ranks but never rejects, so without this every search returned
 * the whole collection reordered — "website" surfaced all 100 open jobs, with a
 * construction role third. Measured against text-embedding-3-small over 100 seeded
 * jobs (kept / 100):
 *
 *   term                0.60  0.63  0.65  0.70
 *   website               34     2     0     0
 *   SEO                   38     7     3     1
 *   marketing             53    29    13     1
 *   qwertyuiop             2     0     0     0
 *
 * 0.63 is the point where "website" keeps its two real answers, gibberish returns
 * nothing, and broad terms stay usable. Raise it to tighten; the relevant jobs sit
 * within ~0.02 of the noise band, so changes of 0.01 move results a lot.
 */
const MIN_SEMANTIC_SCORE = 0.63;

export interface JobSearchPreFilter {
  status?: JOBS_STATUS_ENUMS;
  tenantId?: Types.ObjectId;
}

/**
 * A narrow pre-filter pushed *into* the search stages.
 *
 * This exists for recall, not security. Without it the vector branch returns its
 * global top 200 and the security `$match` afterwards can whittle that down to a
 * handful. The authoritative gate is still the `$match` that follows the search
 * stage — never treat this as the boundary.
 */
export const jobSearchPreFilter = (session?: { tenantId?: string; jobProfileId?: string }): JobSearchPreFilter => {
  if (session?.tenantId && Types.ObjectId.isValid(session.tenantId)) {
    return { tenantId: new Types.ObjectId(session.tenantId) };
  }
  // Candidates and the public list only ever see open jobs.
  return { status: JOBS_STATUS_ENUMS.OPEN };
};

const toSearchFilterClauses = (preFilter: JobSearchPreFilter) => {
  const clauses: Record<string, unknown>[] = [];
  // `equals`, not `text`: the index maps `status` as a `token`, which is stored
  // unanalyzed, and the `text` operator only matches analyzed `string` fields. It
  // returned zero rows for every term rather than erroring — which silently
  // emptied the whole keyword branch for any caller without a tenantId
  // (candidates, admins, and /public/jobs), leaving hybrid search vector-only.
  if (preFilter.status) clauses.push({ equals: { value: preFilter.status, path: "status" } });
  if (preFilter.tenantId) clauses.push({ equals: { value: preFilter.tenantId, path: "tenantId" } });
  return clauses;
};

const toVectorFilter = (preFilter: JobSearchPreFilter) => {
  const filter: Record<string, unknown> = {};
  if (preFilter.status) filter.status = preFilter.status;
  if (preFilter.tenantId) filter.tenantId = preFilter.tenantId;
  return Object.keys(filter).length ? filter : undefined;
};

/** Pulls one field of one branch out of the `scoreDetails` array `$rankFusion` attaches. */
const branchDetail = (pipelineName: string, field: "rank" | "value") => ({
  $map: {
    input: {
      $filter: {
        input: "$_scoreDetails.details",
        as: "detail",
        cond: { $eq: ["$$detail.inputPipelineName", pipelineName] },
      },
    },
    as: "detail",
    in: `$$detail.${field}`,
  },
});

/**
 * Hybrid search: Lucene keyword matching fused with vector similarity by
 * reciprocal rank fusion, so "work from home frontend" can surface a job titled
 * "Remote React Developer" that shares no words with the query.
 *
 * MUST be the first stage of the pipeline — `$search` and `$vectorSearch` are only
 * legal there. Falls back to keyword-only when no vector is supplied (embedding
 * call failed, or `?semantic=false`).
 *
 * Requires MongoDB 8.1+ for `$rankFusion`.
 */
export const hybridSearchStages = (
  term: string,
  vector: number[],
  preFilter: JobSearchPreFilter = {}
): PipelineStage[] => {
  const filterClauses = toSearchFilterClauses(preFilter);

  const keywordPipeline = [
    {
      $search: {
        index: JOB_SEARCH_INDEX,
        compound: {
          must: [
            {
              text: {
                query: term,
                path: ["title", "description", "location", "category"],
                fuzzy: { maxEdits: 1 },
              },
            },
          ],
          ...(filterClauses.length ? { filter: filterClauses } : {}),
        },
      },
    },
    { $limit: SEARCH_CANDIDATES },
  ];

  if (!vector.length) {
    return keywordPipeline as PipelineStage[];
  }

  const vectorFilter = toVectorFilter(preFilter);

  return [
    {
      $rankFusion: {
        input: {
          pipelines: {
            keyword: keywordPipeline,
            semantic: [
              {
                $vectorSearch: {
                  index: JOB_VECTOR_INDEX,
                  path: "embedding",
                  queryVector: vector,
                  // Atlas guidance: oversample the ANN search well past the limit.
                  numCandidates: SEARCH_CANDIDATES * 5,
                  limit: SEARCH_CANDIDATES,
                  ...(vectorFilter ? { filter: vectorFilter } : {}),
                },
              },
            ],
          },
        },
        combination: { weights: { keyword: 1, semantic: 1 } },
        // Carries each branch's raw score through the fusion. The floor below is
        // the only reason this is on.
        scoreDetails: true,
      },
    },

    // The floor has to be applied out here, not inside the semantic branch:
    // $rankFusion only accepts selection stages, so the $addFields that reads
    // $meta is rejected in there, and a $match/$expr reading $meta directly
    // matches nothing at all rather than erroring.
    { $addFields: { _scoreDetails: { $meta: "scoreDetails" } } },
    {
      $addFields: {
        // A branch that did not return this document still gets a details entry,
        // with rank 0 and no value.
        _keywordRank: {
          $ifNull: [{ $first: branchDetail("keyword", "rank") }, 0],
        },
        _semanticScore: {
          $ifNull: [{ $first: branchDetail("semantic", "value") }, 0],
        },
      },
    },
    {
      // A literal match always survives — someone typing "foreman" expects the job
      // called Site Foreman whatever the embedding thinks. The floor only judges
      // hits the semantic branch found on its own.
      $match: {
        $expr: {
          $or: [{ $gt: ["$_keywordRank", 0] }, { $gte: ["$_semanticScore", MIN_SEMANTIC_SCORE] }],
        },
      },
    },
    { $project: { _scoreDetails: 0, _keywordRank: 0, _semanticScore: 0 } },
  ] as unknown as PipelineStage[];
};
