import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { cvProjectQuery } from "./cv.query";
import { NotFoundException } from "../../../common/helper";
import { CV, CVInput } from "../../../models/cv.model";
import { IListParams, ListQueryParams } from "@rl/types";

type IListCVParams = IListParams<CVInput>;
type ICVQueryParams = ListQueryParams<CVInput>;

export const list = ({ query = {}, options }: IListCVParams) => {
  return CV.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...cvProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListCVParams) => {
  const cvs = await CV.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...cvProjectQuery(),
  ]);
  if (cvs.length === 0) throw new NotFoundException("CV not found.");
  return cvs[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListCVParams) => {
  const cvs = await CV.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...cvProjectQuery()],
    options
  );
  return cvs;
};

export const getOneSoftDeleted = async ({ query = {} }: IListCVParams) => {
  const cvs = await CV.aggregate([...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...cvProjectQuery()]);
  if (cvs.length === 0) throw new NotFoundException("CV not found in trash.");
  return cvs[0];
};

export const create = async (payload: CVInput) => {
  let cv = new CV(payload);
  cv = await cv.save();
  return cv;
};

export const update = async ({ query, payload }: { query: ICVQueryParams; payload: Partial<CVInput> }) => {
  const updatedCV = await CV.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updatedCV) throw new NotFoundException("CV not found.");
  return updatedCV;
};

export const softRemove = async ({ query }: { query: ICVQueryParams }) => {
  const { deleted } = await CV.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("CV not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: ICVQueryParams }) => {
  const deletedCV = await CV.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedCV) throw new NotFoundException("CV not found to delete.");
  return deletedCV;
};

export const restore = async ({ query }: { query: ICVQueryParams }) => {
  const { restored } = await CV.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("CV not found in trash.");
  return { restored };
};
