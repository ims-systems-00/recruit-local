import { CV, CVInput } from "../../../models/cv.model";
import { NotFoundException } from "../../../common/helper";
import { IListParams } from "@rl/types";

type IListCVParams = IListParams<CVInput>;

export const list = ({ query = {}, options }: IListCVParams) => {
  return CV.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async ({ query = {} }: IListCVParams) => {
  const cv = await CV.findOneWithExcludeDeleted(query);
  if (!cv) throw new NotFoundException("CV not found.");
  return cv;
};

export const create = async (payload: CVInput) => {
  let cv = new CV(payload);
  cv = await cv.save();
  return cv;
};

export const update = async (id: string, payload: Partial<CVInput>) => {
  const updatedCV = await CV.findOneAndUpdate({ _id: id }, { $set: { ...payload } }, { new: true });
  if (!updatedCV) throw new NotFoundException("CV not found.");
  return updatedCV;
};

export const softRemove = async (id: string) => {
  const cv = await getOne({ query: { _id: id } });
  const { deleted } = await CV.softDelete({ _id: id });
  return { cv, deleted };
};

export const hardRemove = async (id: string) => {
  const cv = await getOne({ query: { _id: id } });
  await CV.findOneAndDelete({ _id: id });
  return cv;
};

export const restore = async (id: string) => {
  const { restored } = await CV.restore({ _id: id });
  if (!restored) throw new NotFoundException("CV not found in trash.");
  const cv = await getOne({ query: { _id: id } });
  return { cv, restored };
};
