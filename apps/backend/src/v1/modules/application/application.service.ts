/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession, Types } from "mongoose";
import { VISIBILITY_ENUM } from "@rl/types";
import { NotFoundException } from "../../../common/helper";
import { Application } from "../../../models";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { applicationProjectionQuery } from "./application.query";
import * as jobService from "../job/job.service";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import {
  IListApplicationParams,
  IApplicationGetParams,
  IApplicationCreateParams,
  IApplicationUpdateParams,
  IApplicationStatusUpdateParams,
  IMoveBoardItemParams,
} from "./application.interface";

export const list = ({ query = {}, options, session }: IListApplicationParams) => {
  const aggregate = Application.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...applicationProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Application.aggregatePaginate(aggregate, options);
};

export const getOne = async ({ query = {}, session }: IApplicationGetParams) => {
  const aggregate = Application.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...applicationProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const applications = await aggregate;

  if (applications.length === 0) throw new NotFoundException("Application not found.");
  return applications[0];
};

export const listSoftDeleted = async ({ query = {}, options, session }: IListApplicationParams) => {
  const aggregate = Application.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...applicationProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Application.aggregatePaginate(aggregate, options);
};

export const getOneSoftDeleted = async ({ query = {}, session }: IApplicationGetParams) => {
  const aggregate = Application.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...applicationProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const applications = await aggregate;

  if (applications.length === 0) throw new NotFoundException("Application not found in trash.");
  return applications[0];
};

export const create = async ({ payload, session }: IApplicationCreateParams) => {
  // 1. Validate Job Exists
  await jobService.getOne({
    query: { _id: payload.jobId!.toString() } as any,
    session,
  });

  // 2. Generate initial metrics
  const merit = Math.floor(Math.random() * 10) + 1;
  payload.rank = merit;

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

  const application = new Application({
    ...cleanPayload,
    _id: applicationId,
    resumeId,
    caseStudyId,
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

  return updatedApplication;
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

// Custom Action: Status Update
export const statusUpdate = async ({
  query,
  status,
  session,
}: IApplicationStatusUpdateParams & { session?: ClientSession }) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const application = await getOne({ query: sanitizedQuery, session });

  const updatedApplication = await Application.findOneAndUpdate(
    { _id: application._id },
    { $set: { status } },
    {
      new: true,
      session,
    }
  );

  if (!updatedApplication) throw new NotFoundException("Application not found.");
  return updatedApplication;
};

// Custom Action: Move Item on Board
export const moveItemOnBoard = async (
  { itemId, targetStatusId, targetIndex }: IMoveBoardItemParams
  // session?: ClientSession
) => {
  return Application.moveToPosition(itemId, targetStatusId, targetIndex);
};
