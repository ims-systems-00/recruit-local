/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession, Types } from "mongoose";
import {
  JobOverviewMatchScoreDto,
  JobOverviewRange,
  JobOverviewResponseDto,
  JobOverviewStageDto,
  MATCH_SCORE_BAND_FLOORS,
  VISIBILITY_ENUM,
} from "@rl/types";
import { BadRequestException, NotFoundException } from "../../../common/helper";
import { Application, Status } from "../../../models";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import {
  applicationProjectionQuery,
  populateJobProfileQuery,
  populateFilesQuery,
  populateStatusQuery,
  populateAnswerQueriesQuery,
} from "./application.query";
import * as jobService from "../job/job.service";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import {
  IListApplicationParams,
  IApplicationGetParams,
  IApplicationCreateParams,
  IApplicationUpdateParams,
  IApplicationStatusUpdateParams,
  IApplicationMoveToStageParams,
  IMoveBoardItemParams,
  IApplicationOverviewParams,
} from "./application.interface";

export const list = async ({ query = {}, options, session, offset = 0 }: IListApplicationParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const aggregate = Application.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateJobProfileQuery(),
    ...populateStatusQuery(),
    ...applicationProjectionQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  if (session) aggregate.session(session);

  return toCursorPage(await aggregate, limit);
};

/** How many match, ignoring paging. Used by the agent tools to report `totalMatching`. */
export const count = ({ query = {} }: IListApplicationParams) =>
  Application.countDocuments({ $and: [sanitizeQueryIds(query), { "deleteMarker.status": { $ne: true } }] });

export const getOne = async ({ query = {}, session }: IApplicationGetParams) => {
  const aggregate = Application.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateJobProfileQuery(),
    ...populateFilesQuery(),
    ...populateStatusQuery(),
    ...populateAnswerQueriesQuery(),
    ...applicationProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const applications = await aggregate;

  if (applications.length === 0) throw new NotFoundException("Application not found.");
  return applications[0];
};

export const listSoftDeleted = async ({ query = {}, options, session, offset = 0 }: IListApplicationParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const aggregate = Application.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateJobProfileQuery(),
    ...populateStatusQuery(),
    ...applicationProjectionQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  if (session) aggregate.session(session);

  return toCursorPage(await aggregate, limit);
};

export const getOneSoftDeleted = async ({ query = {}, session }: IApplicationGetParams) => {
  const aggregate = Application.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateJobProfileQuery(),
    ...populateStatusQuery(),
    ...populateFilesQuery(),
    ...populateAnswerQueriesQuery(),
    ...applicationProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const applications = await aggregate;

  if (applications.length === 0) throw new NotFoundException("Application not found in trash.");
  return applications[0];
};

/**
 * The stage a new application lands in: the job's default stage, the triage
 * column the board reads best match first. Job creation seeds one and it cannot
 * be deleted, so a job without one should not exist; if one does, its first
 * column takes the application rather than the candidate being turned away.
 */
export const findArrivalStage = async (jobId: unknown, session?: ClientSession | null) => {
  const jobStages = {
    collectionName: modelNames.JOB,
    collectionId: jobId,
    "deleteMarker.status": { $ne: true },
  };

  return (
    (await Status.findOne({ ...jobStages, default: true })
      .select("_id")
      .session(session || null)) ??
    (await Status.findOne(jobStages)
      .sort({ weight: 1, _id: 1 })
      .select("_id")
      .session(session || null))
  );
};

export const create = async ({ payload, session }: IApplicationCreateParams) => {
  // 1. Validate Job Exists
  const job = await jobService.getOne({
    query: { _id: payload.jobId } as any,
    session,
  });

  const existingApplication = await Application.findOne({
    jobId: payload.jobId,
    jobProfileId: payload.jobProfileId,
  }).session(session || null);

  if (existingApplication) {
    throw new Error("An application already exists for the job.");
  }

  // 2. Start unranked. The application-ranking queue overwrites both of these
  // with the real match score once the transaction commits; until then every
  // new application sits at the bottom of the board rather than at a random spot.
  payload.rank = 0;
  payload.matchScore = 0;

  const applicationId = new Types.ObjectId();
  let resumeId = null;
  const caseStudyId: Types.ObjectId[] = [];

  // 3. Handle Resume File
  if (payload.resumeStorage) {
    const fileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.APPLICATION,
        collectionDocument: applicationId,
        storageInformation: payload.resumeStorage,
        visibility: VISIBILITY_ENUM.PRIVATE,
      },
      // session, // Pass session here
    });
    resumeId = fileMedia._id;
  }

  // 4. Handle Case Studies (Parallel Execution for speed)
  if (payload.caseStudyStorage && Array.isArray(payload.caseStudyStorage)) {
    const caseStudyPromises = payload.caseStudyStorage.map((storage) =>
      FileMediaService.create({
        payload: {
          collectionName: modelNames.APPLICATION,
          collectionDocument: applicationId,
          storageInformation: storage,
          visibility: VISIBILITY_ENUM.PRIVATE,
        },
        // session,
      })
    );

    const uploadedCaseStudies = await Promise.all(caseStudyPromises);

    // Extract IDs and push them to the array
    caseStudyId.push(...uploadedCaseStudies.map((file) => file._id as Types.ObjectId));
  }

  // 5. Clean payload and build document
  const { resumeStorage, caseStudyStorage, ...cleanPayload } = payload;

  const defaultStatus = await findArrivalStage(payload.jobId, session);
  if (!defaultStatus) throw new NotFoundException("Default status not found for the job.");

  const tenantId = job.tenantId;

  const application = new Application({
    ...cleanPayload,
    _id: applicationId,
    resumeId,
    caseStudyId,
    statusId: defaultStatus._id,
    tenantId,
  });

  // 6. Save and Return
  await application.save({ session });

  return getOne({
    query: { _id: application._id } as any,
    session,
  });
};

export const update = async ({ query, payload, session }: IApplicationUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const application = await getOne({ query: sanitizedQuery, session });

  let updatedResumeId = application.resumeId;
  let updatedCaseStudyId = application.caseStudyId || [];

  // --- 1. Handle Resume Update ---
  if (payload.resumeStorage) {
    const newFileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.APPLICATION,
        collectionDocument: application._id,
        storageInformation: payload.resumeStorage,
        visibility: VISIBILITY_ENUM.PRIVATE,
      },
      // session,
    });

    updatedResumeId = newFileMedia._id;

    if (application.resumeId) {
      try {
        await FileMediaService.hardDelete({
          query: { _id: application.resumeId.toString() },
          // session,
        });
      } catch (error) {
        console.error(`Failed to delete old resume ${application.resumeId} for Application ${application._id}`, error);
      }
    }
  }

  // --- 3. Handle Case Studies Update ---
  // We check for undefined so that if they pass an empty array, it clears the existing files
  if (payload.caseStudyStorage !== undefined) {
    // Create new case studies in parallel
    if (Array.isArray(payload.caseStudyStorage) && payload.caseStudyStorage.length > 0) {
      const caseStudyPromises = payload.caseStudyStorage.map((storage) =>
        FileMediaService.create({
          payload: {
            collectionName: modelNames.APPLICATION,
            collectionDocument: application._id,
            storageInformation: storage,
            visibility: VISIBILITY_ENUM.PRIVATE,
          },
        })
      );
      const uploadedCaseStudies = await Promise.all(caseStudyPromises);
      updatedCaseStudyId = uploadedCaseStudies.map((file) => file._id as Types.ObjectId);
    } else {
      updatedCaseStudyId = []; // Clear array if empty storage is passed
    }

    // Hard delete all old case studies
    if (application.caseStudyId && application.caseStudyId.length > 0) {
      for (const oldId of application.caseStudyId) {
        try {
          await FileMediaService.hardDelete({
            query: { _id: oldId.toString() },
            // session,
          });
        } catch (error) {
          console.error(`Failed to delete old case study ${oldId} for Application ${application._id}`, error);
        }
      }
    }
  }

  // Extract all storage payloads so they aren't saved directly to the Application document
  const { resumeStorage, caseStudyStorage, ...cleanPayload } = payload;

  const updatedApplication = await Application.findOneAndUpdate(
    { _id: application._id },
    {
      $set: {
        ...cleanPayload,
        resumeId: updatedResumeId,
        caseStudyId: updatedCaseStudyId,
      },
    },
    {
      new: true,
      session,
    }
  );

  if (!updatedApplication) throw new NotFoundException("Application not found.");

  const finalUpdatedApplication = await getOne({ query: { _id: updatedApplication._id } as any, session });

  return finalUpdatedApplication;
};

// Renamed from softRemove to match the User service standard
export const softDelete = async ({ query, session }: IApplicationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const applicationToSoftDelete = await getOne({ query: sanitizedQuery, session });

  const { deleted } = await Application.softDelete({ _id: applicationToSoftDelete._id }, { session });
  if (!deleted) throw new NotFoundException("Application not found to delete.");

  // Return sanitized document
  const application = await getOneSoftDeleted({ query: sanitizedQuery, session });
  return application;
};

// Renamed from hardRemove to match the User service standard
export const hardDelete = async ({ query, session }: IApplicationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  // Fetch sanitized document before deleting it
  const application = await getOneSoftDeleted({ query: sanitizedQuery, session });

  // 1. Collect all associated file IDs
  const filesToDelete: Types.ObjectId[] = [];

  if (application.resumeId) filesToDelete.push(application.resumeId);
  if (application.caseStudyId && Array.isArray(application.caseStudyId)) {
    filesToDelete.push(...application.caseStudyId);
  }

  // 2. Clean up related files in S3 / FileMedia Service
  for (const fileId of filesToDelete) {
    try {
      await FileMediaService.hardDelete({
        query: { _id: fileId.toString() },
        // session,
      });
    } catch (error) {
      console.error(`Failed to delete attached file ${fileId} for Application ${application._id}`, error);
    }
  }

  // 3. Delete the actual application document
  const deletedApplication = await Application.findOneAndDelete({ _id: application._id }, { session });
  if (!deletedApplication) throw new NotFoundException("Application not found to delete.");

  return application;
};

export const restore = async ({ query, session }: IApplicationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const { restored } = await Application.restore(sanitizedQuery, { session });

  if (!restored) throw new NotFoundException("Application not found in trash.");

  // Return sanitized document
  const application = await getOne({ query: sanitizedQuery, session });
  return application;
};

/**
 * The guard every board move goes through, whoever asks for it.
 *
 * `moveToPosition` only checks that the target status exists — not that it is a
 * column on *this* application's board. Without the check below, a status id
 * from another job, or another tenant's job, is a perfectly valid move, and the
 * application lands on a board nobody expected it on. The check lives here
 * rather than in a controller because three callers need it: the status route,
 * the drag-and-drop route, and the agent's move tool.
 *
 * Returns the applications as loaded, so a caller that has already paid for the
 * read does not pay again, and whether the column is the default stage, which
 * decides how a card is placed in it (`placeInStage`).
 */
export const assertStageOnBoard = async ({
  applicationIds,
  statusId,
  session,
}: IApplicationMoveToStageParams): Promise<{ applications: any[]; jobId: string; isDefaultStage: boolean }> => {
  const ids = [...new Set(applicationIds.map(String))];

  if (ids.length === 0) throw new BadRequestException("No applications were given to move.");

  const invalid = ids.filter((id) => !Types.ObjectId.isValid(id));
  if (invalid.length > 0) throw new BadRequestException(`Not an application id: ${invalid.join(", ")}.`);

  if (!Types.ObjectId.isValid(String(statusId))) throw new BadRequestException(`Not a status id: ${String(statusId)}.`);

  const applications = await Application.find({
    _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
    "deleteMarker.status": { $ne: true },
  })
    .select("_id jobId statusId rank")
    .session(session ?? null);

  if (applications.length !== ids.length) {
    const found = new Set(applications.map((application) => String(application._id)));
    throw new NotFoundException(`Application not found: ${ids.filter((id) => !found.has(id)).join(", ")}.`);
  }

  // One move, one board. Applications to different jobs sit on different boards
  // with different columns, so a single target status cannot be right for both.
  const jobIds = [...new Set(applications.map((application) => String(application.jobId)))];
  if (jobIds.length > 1) {
    throw new BadRequestException(
      "These applications are to different jobs, and each job has its own board. Move the ones on each job separately."
    );
  }

  const jobId = jobIds[0];

  const status = await Status.findOne({
    _id: new Types.ObjectId(String(statusId)),
    collectionName: modelNames.JOB,
    collectionId: new Types.ObjectId(jobId),
    "deleteMarker.status": { $ne: true },
  })
    .select("_id label default")
    .session(session ?? null);

  if (!status) {
    throw new BadRequestException("That status is not a column on this job's board.");
  }

  return { applications, jobId, isDefaultStage: Boolean(status.default) };
};

/**
 * Puts one application into a column that `assertStageOnBoard` has cleared.
 *
 * The default stage is read best match first (`boardColumnSort`), so a card
 * moved there takes its match position wherever it was dropped: only its stage
 * changes, and its `rank` is reset to its `matchScore` in the same atomic
 * write, so the column starts in match order should it stop being the default.
 * There is no neighbour to place it against, so no column is rebalanced. Every
 * other column keeps the drop position, through `moveToPosition`.
 */
const placeInStage = async (
  applicationId: string,
  statusId: string,
  targetIndex: number,
  isDefaultStage: boolean
): Promise<{ success: boolean; rank: number; rebalanced: boolean }> => {
  if (!isDefaultStage) return Application.moveToPosition(applicationId, statusId, targetIndex);

  const placed = await Application.findOneAndUpdate(
    { _id: new Types.ObjectId(applicationId) },
    [{ $set: { statusId: new Types.ObjectId(statusId), rank: { $ifNull: ["$matchScore", 0] } } }],
    { new: true, projection: { rank: 1 } }
  ).lean();
  if (!placed) throw new NotFoundException("Application not found.");

  return { success: true, rank: placed.rank, rebalanced: false };
};

/**
 * Moves applications into a column, at the top of it — or, in the default
 * stage, at their match position (`placeInStage`).
 *
 * Each application is moved on its own write — `moveToPosition` runs its own
 * transaction — so the batch is not atomic as a whole, but every reason a move
 * could be refused has already been checked by `assertStageOnBoard` above, so a
 * partial batch means the database went away mid-loop rather than an input
 * being wrong. Index 0 is the top of the column, which is where a card dropped
 * by hand lands.
 */
export const moveToStage = async ({ applicationIds, statusId, session }: IApplicationMoveToStageParams) => {
  const { applications, isDefaultStage } = await assertStageOnBoard({ applicationIds, statusId, session });

  for (const application of applications) {
    try {
      await placeInStage(String(application._id), String(statusId), 0, isDefaultStage);
    } catch (error) {
      // The plugin throws bare `Error`s — a board locked to a non-rank sort
      // order is the one a caller can act on, and a 500 does not say so.
      throw new BadRequestException(error instanceof Error ? error.message : "The application could not be moved.");
    }
  }

  return Promise.all(applications.map((application) => getOne({ query: { _id: String(application._id) } as any })));
};

// Custom Action: Status Update
export const statusUpdate = async ({
  query,
  statusId,
  session,
}: IApplicationStatusUpdateParams & { session?: ClientSession }) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const application = await getOne({ query: sanitizedQuery, session });

  const [moved] = await moveToStage({
    applicationIds: [String(application._id)],
    statusId,
    session,
  });

  return moved;
};

// Custom Action: Move Item on Board
export const moveItemOnBoard = async ({ itemId, targetStatusId, targetIndex }: IMoveBoardItemParams) => {
  // Scoped first: the plugin would otherwise accept a column from another board.
  const { isDefaultStage } = await assertStageOnBoard({ applicationIds: [itemId], statusId: targetStatusId });

  return placeInStage(itemId, targetStatusId, targetIndex, isDefaultStage);
};

/** Board order: how a column is read unless the caller asks for another sort. */
export const BOARD_ORDER_SORT = "-rank";

/** The default stage's order: best match first, and newest first among equal scores (the `_id` tie-break). */
export const DEFAULT_STAGE_SORT = "-matchScore";

/**
 * The sort that board order means for one column.
 *
 * The default stage, where every new application lands, is a triage inbox: it
 * is always read best match first, so a new applicant shows up in the right
 * place as soon as they are ranked, whatever has been dragged around it. Every
 * other stage is the recruiter's own and keeps the order they dragged it into.
 */
export const boardColumnSort = async (statusId: unknown): Promise<string> => {
  const id = String(statusId ?? "");
  if (!Types.ObjectId.isValid(id)) return BOARD_ORDER_SORT;

  const isDefaultStage = await Status.exists({ _id: id, default: true, "deleteMarker.status": { $ne: true } });
  return isDefaultStage ? DEFAULT_STAGE_SORT : BOARD_ORDER_SORT;
};

const OVERVIEW_RANGE_DAYS: Record<JobOverviewRange, number> = { week: 7, month: 30 };
const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` of `date` as seen in `tz` — the same key `$dateToString` produces. */
const dayKeyInTz = (date: Date, tz: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

/** How far `tz` is ahead of UTC at `date`, in ms. */
const tzOffsetMs = (date: Date, tz: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
};

/** The instant local midnight starts on the day containing `date`, in `tz`. */
const startOfDayInTz = (date: Date, tz: string) => {
  const [y, m, d] = dayKeyInTz(date, tz).split("-").map(Number);
  const midnightAsUtc = Date.UTC(y, m - 1, d);
  // Re-read the offset at the candidate instant so a DST switch that day lands right.
  const guess = midnightAsUtc - tzOffsetMs(new Date(midnightAsUtc), tz);
  return new Date(midnightAsUtc - tzOffsetMs(new Date(guess), tz));
};

const changePct = (current: number, previous: number) =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;

/**
 * Aggregates for the recruiter's job overview tab: totals against the previous
 * period, a daily trend, the count in each board column and a match-score split.
 *
 * The period is rolling — the last 7 or 30 days including today — and days are
 * cut at midnight in `tz`. An application's day is its `appliedAt`, falling back
 * to `createdAt` for any document written before `appliedAt` had a default.
 */
export const getOverview = async ({
  query,
  jobId,
  range,
  tz,
  statusQuery,
  includeMatchScore,
}: IApplicationOverviewParams): Promise<JobOverviewResponseDto> => {
  const days = OVERVIEW_RANGE_DAYS[range];
  const now = new Date();
  const periodStart = startOfDayInTz(new Date(now.getTime() - (days - 1) * DAY_MS), tz);
  const previousStart = startOfDayInTz(new Date(periodStart.getTime() - days * DAY_MS + DAY_MS / 2), tz);

  const countStage = [{ $count: "n" }];
  const [facets] = await Application.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    { $addFields: { _at: { $ifNull: ["$appliedAt", "$createdAt"] } } },
    {
      $facet: {
        total: countStage,
        beforePeriod: [{ $match: { _at: { $lt: periodStart } } }, ...countStage],
        current: [{ $match: { _at: { $gte: periodStart } } }, ...countStage],
        previous: [{ $match: { _at: { $gte: previousStart, $lt: periodStart } } }, ...countStage],
        daily: [
          { $match: { _at: { $gte: periodStart } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$_at", timezone: tz } }, n: { $sum: 1 } } },
        ],
        byStatus: statusQuery ? [{ $group: { _id: "$statusId", n: { $sum: 1 } } }] : [{ $limit: 0 }],
        matchBands: includeMatchScore
          ? [
              {
                $group: {
                  _id: {
                    $switch: {
                      branches: [
                        { case: { $gte: ["$matchScore", MATCH_SCORE_BAND_FLOORS.strong] }, then: "strong" },
                        { case: { $gte: ["$matchScore", MATCH_SCORE_BAND_FLOORS.good] }, then: "good" },
                      ],
                      default: "weak",
                    },
                  },
                  n: { $sum: 1 },
                },
              },
            ]
          : [{ $limit: 0 }],
      },
    },
  ]);

  const count = (facet: { n: number }[]) => facet[0]?.n ?? 0;
  const total = count(facets.total);
  const beforePeriod = count(facets.beforePeriod);
  const current = count(facets.current);
  const previous = count(facets.previous);

  const perDay = new Map<string, number>(facets.daily.map((d: { _id: string; n: number }) => [d._id, d.n]));
  let running = beforePeriod;
  const daily = Array.from({ length: days }, (_, i) => {
    // Noon of each day, so a 23- or 25-hour DST day still maps to its own key.
    const date = dayKeyInTz(new Date(periodStart.getTime() + i * DAY_MS + DAY_MS / 2), tz);
    const added = perDay.get(date) ?? 0;
    running += added;
    return { date, total: running, new: added };
  });

  let stages: JobOverviewStageDto[] | null = null;
  if (statusQuery) {
    const statuses = await Status.find({
      $and: [
        sanitizeQueryIds({ collectionName: modelNames.JOB, collectionId: jobId }),
        { "deleteMarker.status": { $ne: true } },
        statusQuery,
      ],
    })
      .select("_id label backgroundColor weight")
      .sort({ weight: 1, createdAt: 1 })
      .lean();
    const perStatus = new Map<string, number>(
      facets.byStatus.map((s: { _id: Types.ObjectId; n: number }) => [String(s._id), s.n])
    );
    stages = statuses.map((s) => ({
      statusId: String(s._id),
      label: s.label,
      backgroundColor: s.backgroundColor ?? "#FFFFFF",
      count: perStatus.get(String(s._id)) ?? 0,
    }));
  }

  let matchScore: JobOverviewMatchScoreDto | null = null;
  if (includeMatchScore) {
    matchScore = { strong: 0, good: 0, weak: 0 };
    for (const band of facets.matchBands as { _id: keyof JobOverviewMatchScoreDto; n: number }[]) {
      matchScore[band._id] = band.n;
    }
  }

  return {
    range,
    periodStart: periodStart.toISOString(),
    periodEnd: now.toISOString(),
    totals: {
      total,
      totalChangePct: changePct(total, beforePeriod),
      newApplicants: current,
      newChangePct: changePct(current, previous),
    },
    daily,
    stages,
    matchScore,
  };
};
