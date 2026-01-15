import { IListParams } from "@rl/types";
import { NotFoundException } from "../../../common/helper";
import { ApplicationInput, Application } from "../../../models/application.model";

type IListApplicationParams = IListParams<ApplicationInput>;

export const list = ({ query = {}, options }: IListApplicationParams) => {
  return Application.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async (id: string) => {
  const application = await Application.findOneWithExcludeDeleted({ _id: id });
  if (!application) throw new NotFoundException("Application not found.");
  return application;
};

export const create = async (payload: ApplicationInput) => {
  let application = new Application(payload);
  application = await application.save();

  return application;
};

export const update = async (id: string, payload: Partial<ApplicationInput>) => {
  const updatedApplication = await Application.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );
  if (!updatedApplication) throw new NotFoundException("Application not found.");
  return updatedApplication;
};

export const softRemove = async (id: string) => {
  const application = await getOne(id);
  const { deleted } = await Application.softDelete({ _id: id });

  return { application, deleted };
};

export const hardRemove = async (id: string) => {
  const application = await getOne(id);
  await Application.findOneAndDelete({ _id: id });

  return application;
};

export const restore = async (id: string) => {
  const { restored } = await Application.restore({ _id: id });
  if (!restored) throw new NotFoundException("Application not found in trash.");

  const application = await getOne(id);

  return { application, restored };
};

export const statusUpdate = async (id: string, status: string) => {
  const updatedApplication = await Application.findOneAndUpdate(
    { _id: id },
    {
      $set: { status },
    },
    { new: true }
  );
  if (!updatedApplication) throw new NotFoundException("Application not found.");
  return updatedApplication;
};
