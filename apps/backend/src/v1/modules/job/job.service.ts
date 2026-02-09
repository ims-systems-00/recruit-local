import { Job, IJobInput } from "../../../models";
import { getTenant } from "../tenant/tenant.service";
import { NotFoundException } from "../../../common/helper";
import { IListParams, ListQueryParams } from "@rl/types";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateStatusQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { jobProjectionQuery } from "./job.query";
import * as StatusService from "../status/status.service";
import { Schema, Types } from "mongoose";
import { modelNames } from "../../../models/constants";

type IListJobParams = IListParams<IJobInput>;
type IJobQueryParams = ListQueryParams<IJobInput>;

type ICreateJobPayload = IJobInput & { autoFill?: boolean };
type IUpdateJobPayload = Partial<IJobInput> & {
  autoFill?: boolean;
};

const DEFAULT_JOB_BOARD_STATUS = [
  {
    collectionName: modelNames.JOB,
    label: "pending",
    weight: 100,
    default: false,
  },
  {
    collectionName: modelNames.JOB,
    label: "interviewing",
    weight: 200,
    default: false,
  },
  {
    collectionName: modelNames.JOB,
    label: "rejected",
    weight: 300,
    default: false,
  },
];

const _autoFill = async (tenantId: string) => {
  const tenant = await getTenant(tenantId);
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
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...excludeDeletedQuery(),
      ...populateStatusQuery(),
      ...jobProjectionQuery(),
    ],
    options
  );
};

export const getOne = async ({ query = {} }: IJobQueryParams) => {
  const jobs = await Job.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateStatusQuery(),
    ...jobProjectionQuery(),
  ]);
  if (jobs.length === 0) throw new NotFoundException("Job not found.");
  return jobs[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListJobParams) => {
  return Job.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...populateStatusQuery(), ...jobProjectionQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListJobParams) => {
  const jobs = await Job.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateStatusQuery(),
    ...jobProjectionQuery(),
  ]);
  if (jobs.length === 0) throw new NotFoundException("Job not found in trash.");
  return jobs[0];
};

export const create = async (payload: ICreateJobPayload) => {
  // 1. Handle Default Title
  if (!payload.title) {
    const numberOfJobs = await Job.countDocuments({
      tenantId: payload.tenantId,
    });
    payload.title = `Untitled Job ${numberOfJobs + 1}`;
  }

  const status = await StatusService.getOne({ query: { label: "draft", collectionName: modelNames.JOB } });
  if (!status) throw new NotFoundException("Default status 'Draft' not found for the tenant.");

  payload.statusId = status._id as unknown as Schema.Types.ObjectId;

  // 2. Handle AutoFill
  if (payload.autoFill) {
    const autoFillData = await _autoFill(payload.tenantId!.toString());
    payload = { ...payload, ...autoFillData };
  }

  let job = new Job(payload);
  job = await job.save();

  const createdStatuses = await StatusService.createMany(
    DEFAULT_JOB_BOARD_STATUS.map((status) => ({
      ...status,
      collectionId: job._id as unknown as Schema.Types.ObjectId,
    }))
  );

  job.boardColumnOrder = createdStatuses.map((s) => s._id as Types.ObjectId);
  await job.save();

  return job;
};

export const update = async ({ query, payload }: { query: IJobQueryParams; payload: IUpdateJobPayload }) => {
  if (payload.autoFill) {
    const job = await getOne({ query });
    const autoFillData = await _autoFill(job.tenantId!.toString());

    payload = { ...payload, ...autoFillData };
    delete payload.autoFill;
  }

  const updatedJob = await Job.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });

  if (!updatedJob) throw new NotFoundException("Job not found.");
  return updatedJob;
};

export const softRemove = async ({ query }: { query: IJobQueryParams }) => {
  const { deleted } = await Job.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Job not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: IJobQueryParams }) => {
  const deletedJob = await Job.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedJob) throw new NotFoundException("Job not found to delete.");
  return deletedJob;
};

export const restore = async ({ query }: { query: IJobQueryParams }) => {
  const { restored } = await Job.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Job not found in trash.");
  return { restored };
};

export const post = async ({ query }: { query: IJobQueryParams }) => {
  const job = await getOne({ query });
  if (!job) throw new NotFoundException("Job not found.");

  job.status = "Posted";
  await job.save();
  return job;
};
