import { Types, ClientSession } from "mongoose";
import { Job } from "../../../models";
import { getOne as getTenant } from "../tenant/tenant.service";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { jobAttachmentsLookupQuery, jobProjectionQuery } from "./job.query";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import { VISIBILITY_ENUM } from "@rl/types";
import {
  IJobListParams,
  IJobGetParams,
  IJobUpdateParams,
  IJobCreateParams,
  IJobIncrementStatsParams,
} from "./job.interface";
import * as statusService from "../status/status.service";

/**
 * Helper to fetch tenant data for job autofill
 */
const _autoFill = async (tenantId: string, session?: ClientSession) => {
  const tenant = await getTenant({ query: { _id: tenantId }, session });
  if (!tenant || !tenant.email || !tenant.phone || !tenant.description)
    throw new NotFoundException("Organization data not found for auto fill.");

  return {
    email: tenant.email,
    number: tenant.phone,
    aboutUs: tenant.description,
  };
};

export const list = ({ query = {}, options, session }: IJobListParams) => {
  const aggregate = Job.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...jobProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Job.aggregatePaginate(aggregate, options);
};

export const getOne = async ({ query = {}, session }: IJobGetParams) => {
  const aggregate = Job.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...jobProjectionQuery(),
    ...jobAttachmentsLookupQuery(),
  ]);

  if (session) aggregate.session(session);

  const jobs = await aggregate;
  if (jobs.length === 0) throw new NotFoundException("Job not found.");
  return jobs[0];
};

export const listSoftDeleted = ({ query = {}, options, session }: IJobListParams) => {
  const aggregate = Job.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...jobProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Job.aggregatePaginate(aggregate, options);
};

export const getOneSoftDeleted = async ({ query = {}, session }: IJobGetParams) => {
  const aggregate = Job.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...jobProjectionQuery(),
    ...jobAttachmentsLookupQuery(),
  ]);

  if (session) aggregate.session(session);

  const jobs = await aggregate;
  if (jobs.length === 0) throw new NotFoundException("Job not found in trash.");
  return jobs[0];
};

export const create = async ({ payload, session }: IJobCreateParams) => {
  // 1. Generate Title if missing
  if (!payload.title) {
    const numberOfJobs = await Job.countDocuments({ tenantId: payload.tenantId }).session(session || null);
    payload.title = `Untitled Job ${numberOfJobs + 1}`;
  }

  // 2. Handle AutoFill
  if (payload.autoFill) {
    const autoFillData = await _autoFill(payload.tenantId!.toString(), session);
    payload = { ...payload, ...autoFillData };
  }

  // 3. Pre-generate ID for attachment relationship
  const jobId = new Types.ObjectId();
  let attachmentIds: Types.ObjectId[] = [];

  // 4. Handle Attachments
  if (payload.attachmentsStorage && payload.attachmentsStorage.length > 0) {
    const attachmentPromises = payload.attachmentsStorage.map((storage) =>
      FileMediaService.create({
        payload: {
          collectionName: modelNames.JOB,
          collectionDocument: jobId,
          storageInformation: storage,
          visibility: VISIBILITY_ENUM.PUBLIC,
        },
        // session,
      })
    );
    const createdAttachments = await Promise.all(attachmentPromises);
    attachmentIds = createdAttachments.map((file: any) => file._id);
  }

  const { attachmentsStorage, autoFill, ...cleanPayload } = payload;

  let job = new Job({
    ...cleanPayload,
    _id: jobId,
    attachmentIds,
  });

  // create the first status named new applicants - default one
  await statusService.create({
    payload: {
      collectionName: modelNames.JOB,
      collectionId: job._id as Types.ObjectId,
      label: "New Applicants",
      default: true,
    },
    // session,
  });

  job = await job.save({ session });
  return job;
};

export const update = async ({ query, payload, session }: IJobUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const job = await getOne({ query: sanitizedQuery, session });

  // 1. Handle AutoFill
  if (payload.autoFill) {
    const autoFillData = await _autoFill(job.tenantId!.toString(), session);
    payload = { ...payload, ...autoFillData };
  }

  let updatedAttachmentIds = job.attachmentIds || [];

  // 2. Handle Attachments (Replace logic)
  if (payload.attachmentsStorage) {
    // Delete old
    if (job.attachmentIds && job.attachmentIds.length > 0) {
      await Promise.all(
        job.attachmentIds.map((id: Types.ObjectId) => FileMediaService.hardDelete({ query: { _id: id.toString() } }))
      );
    }

    // Create new
    const attachmentPromises = payload.attachmentsStorage.map((storage) =>
      FileMediaService.create({
        payload: {
          collectionName: modelNames.JOB,
          collectionDocument: job._id,
          storageInformation: storage,
          visibility: VISIBILITY_ENUM.PUBLIC,
        },
        // session,
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
    { new: true, session }
  );

  if (!updatedJob) throw new NotFoundException("Job not found.");

  const jobResponse = await getOne({ query: { _id: (updatedJob as any)._id.toString() }, session });
  return jobResponse;
};

export const softDelete = async ({ query, session }: IJobGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const { deleted } = await Job.softDelete(sanitizedQuery, { session });

  if (!deleted) throw new NotFoundException("Job not found to delete.");
  return { deleted };
};

export const hardDelete = async ({ query, session }: IJobGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const job = await getOneSoftDeleted({ query: sanitizedQuery, session });

  // Cleanup Attachments
  if (job.attachmentIds && job.attachmentIds.length > 0) {
    await Promise.all(
      job.attachmentIds.map((id: Types.ObjectId) => FileMediaService.hardDelete({ query: { _id: id.toString() } }))
    );
  }

  const deletedJob = await Job.findOneAndDelete({ _id: job._id }, { session });
  if (!deletedJob) throw new NotFoundException("Job not found to delete.");
  return deletedJob;
};

export const restore = async ({ query, session }: IJobGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const { restored } = await Job.restore(sanitizedQuery, { session });

  if (!restored) throw new NotFoundException("Job not found in trash.");
  return { restored };
};

export const incrementStats = async ({ query, payload, session }: IJobIncrementStatsParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  const updatedJob = await Job.findOneAndUpdate({ ...sanitizedQuery }, { $inc: payload }, { new: true, session });

  if (!updatedJob) throw new NotFoundException("Job not found.");
  return updatedJob;
};
