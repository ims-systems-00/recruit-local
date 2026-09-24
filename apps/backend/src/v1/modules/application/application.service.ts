/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession, Types } from "mongoose";
import { VISIBILITY_ENUM } from "@rl/types";
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
} from "./application.interface";
import * as statusService from "../status/status.service";

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
    ...applicationProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const applications = await aggregate;

  if (applications.length === 0) throw new NotFoundException("Application not found in trash.");
  return applications[0];
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

  // get the default status for the job to set on the application
  const defaultStatus = await statusService.getOne({
    query: {
      collectionName: modelNames.JOB,
      collectionId: payload.jobId,
    },
    session,
  });

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
 * read does not pay again.
 */
export const assertStageOnBoard = async ({
  applicationIds,
  statusId,
  session,
}: IApplicationMoveToStageParams): Promise<{ applications: any[]; jobId: string }> => {
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
    .select("_id label")
    .session(session ?? null);

  if (!status) {
    throw new BadRequestException("That status is not a column on this job's board.");
  }

  return { applications, jobId };
};

/**
 * Moves applications into a column, at the top of it.
 *
 * Each application is moved by `moveToPosition`, which runs its own transaction,
 * so the batch is not atomic as a whole — but every reason a move could be
 * refused has already been checked by `assertStageOnBoard` above, so a partial
 * batch means the database went away mid-loop rather than an input being wrong.
 * Index 0 is the top of the column, which is where a card dropped by hand lands.
 */
export const moveToStage = async ({ applicationIds, statusId, session }: IApplicationMoveToStageParams) => {
  const { applications } = await assertStageOnBoard({ applicationIds, statusId, session });

  for (const application of applications) {
    try {
      await Application.moveToPosition(String(application._id), String(statusId), 0);
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
  await assertStageOnBoard({ applicationIds: [itemId], statusId: targetStatusId });

  return Application.moveToPosition(itemId, targetStatusId, targetIndex);
};
