import { Types } from "mongoose";
import { Job, IJobInput } from "../../../models";
import { getOne as getTenant } from "../tenant/tenant.service";
import { NotFoundException } from "../../../common/helper";
import { IListParams, ListQueryParams } from "@rl/types";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { jobProjectionQuery } from "./job.query";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { VISIBILITY_ENUM } from "@rl/types";

// --- Standardized Parameter Interfaces ---
type IListJobParams = IListParams<IJobInput>;
type IJobQueryParams = ListQueryParams<IJobInput>;

export interface IJobUpdateParams {
  query: IJobQueryParams;
  payload: Partial<IJobInput> & {
    autoFill?: boolean;
    bannerStorage?: AwsStorageTemplate;
    attachmentsStorage?: AwsStorageTemplate[];
  };
}

export interface IJobGetParams {
  query: IJobQueryParams;
}

export interface IJobCreateParams {
  payload: IJobInput & {
    autoFill?: boolean;
    bannerStorage?: AwsStorageTemplate;
    attachmentsStorage?: AwsStorageTemplate[];
  };
}

const _autoFill = async (tenantId: string) => {
  const tenant = await getTenant({ query: { _id: tenantId } });
  if (!tenant || !tenant.email || !tenant.phone || !tenant.description)
    throw new NotFoundException("Organization data not found for auto fill.");

  return {
    email: tenant.email,
    number: tenant.phone,
    aboutUs: tenant.description,
  };
};

export const list = ({ query = {}, options }: IListJobParams) => {
  return Job.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...jobProjectionQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IJobGetParams) => {
  const jobs = await Job.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...jobProjectionQuery(),
  ]);
  if (jobs.length === 0) throw new NotFoundException("Job not found.");
  return jobs[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListJobParams) => {
  return Job.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...jobProjectionQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IJobGetParams) => {
  const jobs = await Job.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...jobProjectionQuery(),
  ]);
  if (jobs.length === 0) throw new NotFoundException("Job not found in trash.");
  return jobs[0];
};

export const create = async ({ payload }: IJobCreateParams) => {
  if (!payload.title) {
    const numberOfJobs = await Job.countDocuments({ tenantId: payload.tenantId });
    payload.title = `Untitled Job ${numberOfJobs + 1}`;
  }

  // 2. Handle AutoFill
  if (payload.autoFill) {
    const autoFillData = await _autoFill(payload.tenantId!.toString());
    payload = { ...payload, ...autoFillData };
  }

  // 3. Pre-generate the Job ID
  const jobId = new Types.ObjectId();
  let attachmentIds: Types.ObjectId[] = [];

  // 5. Intercept Multiple Attachments
  if (payload.attachmentsStorage && payload.attachmentsStorage.length > 0) {
    const attachmentPromises = payload.attachmentsStorage.map((storage) =>
      FileMediaService.create({
        payload: {
          collectionName: modelNames.JOB,
          collectionDocument: jobId,
          storageInformation: storage,
          visibility: VISIBILITY_ENUM.PUBLIC,
        },
      })
    );
    const createdAttachments = await Promise.all(attachmentPromises);
    attachmentIds = createdAttachments.map((file: any) => file._id) as Types.ObjectId[];
  }

  const { attachmentsStorage, autoFill, ...cleanPayload } = payload;

  let job = new Job({
    ...cleanPayload,
    _id: jobId,
    attachmentIds: attachmentIds,
  });

  job = await job.save();

  return job;
};

export const update = async ({ query, payload }: IJobUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const job = await getOne({ query: sanitizedQuery });

  if (payload.autoFill) {
    const autoFillData = await _autoFill(job.tenantId!.toString());
    payload = { ...payload, ...autoFillData };
  }

  let updatedAttachmentIds = job.attachmentIds || [];

  if (payload.attachmentsStorage) {
    if (job.attachmentIds && job.attachmentIds.length > 0) {
      try {
        await Promise.all(
          job.attachmentIds.map((id) => FileMediaService.hardDelete({ query: { _id: id.toString() } }))
        );
      } catch (error) {
        console.error(`Failed to delete old attachments for Job ${job._id}`, error);
      }
    }

    // 2. Create new attachments
    const attachmentPromises = payload.attachmentsStorage.map((storage) =>
      FileMediaService.create({
        payload: {
          collectionName: modelNames.JOB,
          collectionDocument: job._id,
          storageInformation: storage,
          visibility: VISIBILITY_ENUM.PUBLIC,
        },
      })
    );
    const newAttachments = await Promise.all(attachmentPromises);
    updatedAttachmentIds = newAttachments.map((file) => file._id);
  }

  const { attachmentsStorage, autoFill, ...cleanPayload } = payload;

  const updatedJob = await Job.findOneAndUpdate(
    { _id: job._id },
    {
      $set: {
        ...cleanPayload,
        attachmentIds: updatedAttachmentIds,
      },
    },
    { new: true }
  );

  if (!updatedJob) throw new NotFoundException("Job not found.");
  return updatedJob;
};

export const softDelete = async ({ query }: IJobGetParams) => {
  const { deleted } = await Job.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Job not found to delete.");
  return { deleted };
};

export const hardDelete = async ({ query }: IJobGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const job = await getOneSoftDeleted({ query: sanitizedQuery });

  if (job.attachmentIds && job.attachmentIds.length > 0) {
    try {
      await Promise.all(job.attachmentIds.map((id) => FileMediaService.hardDelete({ query: { _id: id.toString() } })));
    } catch (error) {
      console.error("Failed to delete attachments array for Job:", error);
    }
  }

  const deletedJob = await Job.findOneAndDelete({ _id: job._id });
  if (!deletedJob) throw new NotFoundException("Job not found to delete.");
  return deletedJob;
};

export const restore = async ({ query }: IJobGetParams) => {
  const { restored } = await Job.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Job not found in trash.");
  return { restored };
};

/*
 - 
*/
