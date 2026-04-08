import { IListParams, VISIBILITY_ENUM } from "@rl/types";
import { Types } from "mongoose";
import { NotFoundException } from "../../../common/helper";
import { ApplicationInput, Application } from "../../../models";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { applicationProjectionQuery } from "./application.query";
import * as jobService from "../job/job.service";
import * as statusService from "../status/status.service";
import * as FileMediaService from "../file-media/file-media.service";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { modelNames } from "../../../models/constants";
import { withTransaction } from "../../../common/helper/database-transaction";

type IListApplicationParams = IListParams<ApplicationInput>;
type IApplicationQueryParams = Partial<ApplicationInput & { _id: string }>;

export interface IApplicationUpdateParams {
  query: IApplicationQueryParams;
  payload: Partial<ApplicationInput> & { resumeStorage?: AwsStorageTemplate };
}

export interface IApplicationGetParams {
  query: IApplicationQueryParams;
}

export interface IApplicationCreateParams {
  payload: ApplicationInput & { resumeStorage?: AwsStorageTemplate };
}

export interface IApplicationStatusUpdateParams {
  query: IApplicationQueryParams;
  status: string;
}

export interface IMoveBoardItemParams {
  itemId: string;
  targetStatusId: string;
  targetIndex: number;
}

export const list = ({ query = {}, options }: IListApplicationParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  return Application.aggregatePaginate(
    [...matchQuery(sanitizedQuery), ...excludeDeletedQuery(), ...applicationProjectionQuery()],
    options
  );
};

export const listSoftDeleted = async ({ query = {} }: Partial<IApplicationGetParams> = {}) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const applications = await Application.aggregate([
    ...matchQuery(sanitizedQuery),
    ...onlyDeletedQuery(),
    ...applicationProjectionQuery(),
  ]);
  return applications;
};

export const getOne = async ({ query }: IApplicationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const applications = await Application.aggregate([
    ...matchQuery(sanitizedQuery),
    ...excludeDeletedQuery(),
    ...applicationProjectionQuery(),
  ]);
  if (applications.length === 0) throw new NotFoundException("Application not found.");
  return applications[0];
};

export const getOneSoftDeleted = async ({ query }: IApplicationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const applications = await Application.aggregate([
    ...matchQuery(sanitizedQuery),
    ...onlyDeletedQuery(),
    ...applicationProjectionQuery(),
  ]);
  if (applications.length === 0) throw new NotFoundException("Application not found in trash.");
  return applications[0];
};

export const create = async ({ payload }: IApplicationCreateParams) => {
  return withTransaction(async (session) => {
    await jobService.getOne({
      query: { _id: payload.jobId!.toString() },
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
      });
      resumeId = fileMedia._id;
    }

    const { resumeStorage, ...cleanPayload } = payload;

    let application = new Application({
      ...cleanPayload,
      _id: applicationId,
      resumeId: resumeId,
    });

    application = await application.save();

    return application;
  });
};

export const update = async ({ query, payload }: IApplicationUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  const application = await getOne({ query: sanitizedQuery });

  let updatedResumeId = application.resumeId;

  if (payload.resumeStorage) {
    const newFileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.APPLICATION,
        collectionDocument: application._id,
        storageInformation: payload.resumeStorage,
        visibility: VISIBILITY_ENUM.PRIVATE,
      },
    });

    updatedResumeId = newFileMedia._id;

    if (application.resumeId) {
      try {
        await FileMediaService.hardDelete({
          query: { _id: application.resumeId.toString() },
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
    { new: true }
  );

  if (!updatedApplication) throw new NotFoundException("Application not found.");

  return updatedApplication;
};

export const softRemove = async ({ query }: IApplicationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const application = await getOne({ query: sanitizedQuery });
  const { deleted } = await Application.softDelete({ _id: application._id });

  return { application, deleted };
};

export const hardRemove = async ({ query }: IApplicationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const application = await getOne({ query: sanitizedQuery });
  await Application.findOneAndDelete({ _id: application._id });

  return application;
};

export const restore = async ({ query }: IApplicationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const application = await getOne({ query: sanitizedQuery });
  const { restored } = await Application.restore({ _id: application._id });
  if (!restored) throw new NotFoundException("Application not found in trash.");

  return { application, restored };
};

export const statusUpdate = async ({ query, status }: IApplicationStatusUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const application = await getOne({ query: sanitizedQuery });
  const updatedApplication = await Application.findOneAndUpdate(
    { _id: application._id },
    {
      $set: { status },
    },
    { new: true }
  );
  if (!updatedApplication) throw new NotFoundException("Application not found.");
  return updatedApplication;
};

export const moveItemOnBoard = async ({ itemId, targetStatusId, targetIndex }: IMoveBoardItemParams) => {
  return Application.moveToPosition(itemId, targetStatusId, targetIndex);
};
