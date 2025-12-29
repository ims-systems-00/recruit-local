import { Job, IJobInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { IListParams } from "@inrm/types";

type IListJobParams = IListParams<IJobInput>;

export const list = ({ query = {}, options }: IListJobParams) => {
  return Job.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async (id: string) => {
  const job = await Job.findOneWithExcludeDeleted({ _id: id });
  if (!job) throw new NotFoundException("Job not found.");
  return job;
};

export const create = async (payload: IJobInput) => {
  // if no title Create a default title
  if (!payload.title) {
    const numberOfJobs = await Job.countDocuments({
      tenantId: payload.tenantId,
    });
    payload.title = `Untitled Job ${numberOfJobs + 1}`;
  }
  let job = new Job(payload);
  job = await job.save();

  return job;
};

export const update = async (id: string, payload: Partial<IJobInput>) => {
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
