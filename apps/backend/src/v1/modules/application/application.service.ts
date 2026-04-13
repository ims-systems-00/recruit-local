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
  // Assuming jobService has also been updated to accept sessions
  await jobService.getOne({
    query: { _id: payload.jobId!.toString() } as any,
    session,
  });

  const merit = Math.floor(Math.random() * 10) + 1;
  payload.rank = merit;

  const applicationId = new Types.ObjectId();
  let resumeId = null;

  if (payload.resumeStorage) {
    const fileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.APPLICATION,
        collectionDocument: applicationId,
        storageInformation: payload.resumeStorage,
        visibility: VISIBILITY_ENUM.PRIVATE,
      },
      // session, // Pass session here if FileMediaService supports it
    });
    resumeId = fileMedia._id;
  }

  const { resumeStorage, ...cleanPayload } = payload;

  const application = new Application({
    ...cleanPayload,
    _id: applicationId,
    resumeId: resumeId,
  });

  await application.save({ session });

  // Return the sanitized document
  return getOne({
    query: { _id: application._id } as any,
    session,
  });
};

export const update = async ({ query, payload, session }: IApplicationUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const application = await getOne({ query: sanitizedQuery, session });

  let updatedResumeId = application.resumeId;

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

  const { resumeStorage, ...cleanPayload } = payload;

  const updatedApplication = await Application.findOneAndUpdate(
    { _id: application._id },
    {
      $set: {
        ...cleanPayload,
        resumeId: updatedResumeId,
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

  // Clean up related files in S3
  if (application.resumeId) {
    try {
      await FileMediaService.hardDelete({
        query: { _id: application.resumeId.toString() },
        // session,
      });
    } catch (error) {
      console.error(`Failed to delete attached resume for Application ${application._id}`, error);
    }
  }

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
