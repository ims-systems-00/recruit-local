import { IListJobProfileParams } from "./job-profile.interface";
import { JobProfile, JobProfileInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";

export const list = ({ query = {}, options }: IListJobProfileParams) => {
  return JobProfile.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async (id: string) => {
  const jobProfile = await JobProfile.findOneWithExcludeDeleted({ _id: id });
  if (!jobProfile) throw new NotFoundException("Job Profile not found.");
  return jobProfile;
};

export const create = async (payload: JobProfileInput) => {
  let jobProfile = new JobProfile(payload);
  jobProfile = await jobProfile.save();

  return jobProfile;
};

export const update = async (id: string, payload: Partial<JobProfileInput>) => {
  const updatedJobProfile = await JobProfile.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  if (!updatedJobProfile) throw new NotFoundException("Job Profile not found.");
  return updatedJobProfile;
};

export const softRemove = async (id: string) => {
  const jobProfile = await getOne(id);
  const { deleted } = await JobProfile.softDelete({ _id: id });

  return { jobProfile, deleted };
};

export const hardRemove = async (id: string) => {
  const jobProfile = await getOne(id);
  await JobProfile.findOneAndDelete({ _id: id });

  return jobProfile;
};

export const restore = async (id: string) => {
  const { restored } = await JobProfile.restore({ _id: id });
  if (!restored) throw new NotFoundException("Job Profile not found in trash.");

  const jobProfile = await getOne(id);

  return { jobProfile, restored };
};
