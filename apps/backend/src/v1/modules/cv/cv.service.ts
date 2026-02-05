import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateStatusQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { cvProjectQuery } from "./cv.query";
import { NotFoundException } from "../../../common/helper";
import { CV, CVInput } from "../../../models/cv.model";
import { IListParams, ListQueryParams } from "@rl/types";
import * as StatusService from "../status/status.service";
import { modelNames } from "../../../models/constants";

type IListCVParams = IListParams<CVInput>;
type ICVQueryParams = ListQueryParams<CVInput>;

export const list = ({ query = {}, options }: IListCVParams) => {
  return CV.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...populateStatusQuery(), ...cvProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListCVParams) => {
  const cvs = await CV.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateStatusQuery(),
    ...cvProjectQuery(),
  ]);
  if (cvs.length === 0) throw new NotFoundException("CV not found.");
  return cvs[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListCVParams) => {
  const cvs = await CV.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...populateStatusQuery(), ...cvProjectQuery()],
    options
  );
  return cvs;
};

export const getOneSoftDeleted = async ({ query = {} }: IListCVParams) => {
  const cvs = await CV.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateStatusQuery(),
    ...cvProjectQuery(),
  ]);
  if (cvs.length === 0) throw new NotFoundException("CV not found in trash.");
  return cvs[0];
};

export const create = async (payload: CVInput) => {
  const statusId = payload.statusId;
  if (!statusId) throw new NotFoundException("Status ID is required for the CV.");
  const status = await StatusService.getOne({ query: { _id: statusId } });
  if (!status) throw new NotFoundException("Status not found for the CV.");

  if (status.collectionName !== modelNames.CV) {
    throw new NotFoundException("Invalid status for the CV.");
  }

  let cv = new CV(payload);
  cv = await cv.save();
  return cv;
};

export const update = async ({ query, payload }: { query: ICVQueryParams; payload: Partial<CVInput> }) => {
  if (payload.statusId) {
    const status = await StatusService.getOne({ query: { _id: payload.statusId } });
    if (!status) throw new NotFoundException("Status not found for the CV.");

    if (status.collectionName !== modelNames.CV) {
      throw new NotFoundException("Invalid status for the CV.");
    }
  }

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
