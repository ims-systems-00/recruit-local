import { Job, IJobInput } from "../../../models";
import { getTenant } from "../tenant/tenant.service";
import { NotFoundException } from "../../../common/helper";
import { IListParams } from "@inrm/types";

type IListJobParams = IListParams<IJobInput>;
type ICreateJobPayload = IJobInput & { autoFill?: boolean };
type IUpdateJobPayload = Partial<IJobInput> & {
  autoFill?: boolean;
};

const _autoFill = async (tenantId: string) => {
  const tenant = await getTenant(tenantId);
  // throw error that can't auto fill
  if (!tenant || !tenant.email || !tenant.phone || !tenant.description)
    throw new NotFoundException("Organization data not found for auto fill.");

  return {
    email: tenant.email,
    number: tenant.phone,
    aboutUs: tenant.description,
  };
};

export const list = ({ query = {}, options }: IListJobParams) => {
  return Job.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async (id: string) => {
  const job = await Job.findOneWithExcludeDeleted({ _id: id });
  if (!job) throw new NotFoundException("Job not found.");
  return job;
};

export const create = async (payload: ICreateJobPayload) => {
  // if no title Create a default title
  if (!payload.title) {
    const numberOfJobs = await Job.countDocuments({
      tenantId: payload.tenantId,
    });
    payload.title = `Untitled Job ${numberOfJobs + 1}`;
  }
  if (payload.autoFill) {
    const autoFillData = await _autoFill(payload.tenantId!.toString());
    payload = { ...payload, ...autoFillData };
  }
  let job = new Job(payload);
  job = await job.save();

  return job;
};

export const update = async (id: string, payload: IUpdateJobPayload) => {
  if (payload.autoFill) {
    console.log("Auto filling job data...");
    const job = await getOne(id);
    const autoFillData = await _autoFill(job.tenantId!.toString());
    // also remove autoFill from payload to avoid overwriting again
    payload = { ...payload, ...autoFillData };
    delete payload.autoFill;
    console.log("Auto fill data:", payload);
  }
  const updatedJob = await Job.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  if (!updatedJob) throw new NotFoundException("Job not found.");
  return updatedJob;
};
export const softRemove = async (id: string) => {
  const job = await getOne(id);
  const { deleted } = await Job.softDelete({ _id: id });

  return { job, deleted };
};

export const hardRemove = async (id: string) => {
  const job = await getOne(id);
  await Job.findOneAndDelete({ _id: id });

  return job;
};

export const restore = async (id: string) => {
  const { restored } = await Job.restore({ _id: id });
  if (!restored) throw new NotFoundException("Job not found in trash.");

  const job = await getOne(id);

  return { job, restored };
};

export const post = async (id: string) => {
  const job = await getOne(id);
  job.status = "Posted";
  await job.save();
  return job;
};
