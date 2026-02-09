import { IListParams } from "@rl/types";
import { NotFoundException } from "../../../common/helper";
import { ApplicationInput, Application } from "../../../models";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { applicationProjectionQuery } from "./application.query";
import * as jobService from "../job/job.service";
import * as boardService from "../board/board.service";
import * as statusService from "../status/status.service";

type IListApplicationParams = IListParams<ApplicationInput>;
type IApplicationQueryParams = Partial<ApplicationInput & { _id: string }>;

export const list = ({ query = {}, options }: IListApplicationParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  return Application.aggregatePaginate(
    [...matchQuery(sanitizedQuery), ...excludeDeletedQuery(), ...applicationProjectionQuery()],
    options
  );
};

export const listSoftDeleted = async (query = {}) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const applications = await Application.aggregate([
    ...matchQuery(sanitizedQuery),
    ...onlyDeletedQuery(),
    ...applicationProjectionQuery(),
  ]);
  return applications;
};

export const getOne = async (query: IApplicationQueryParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const applications = await Application.aggregate([
    ...matchQuery(sanitizedQuery),
    ...excludeDeletedQuery(),
    ...applicationProjectionQuery(),
  ]);
  if (applications.length === 0) throw new NotFoundException("Application not found.");
  return applications[0];
};

export const getOneSoftDeleted = async (query: IApplicationQueryParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const applications = await Application.aggregate([
    ...matchQuery(sanitizedQuery),
    ...onlyDeletedQuery(),
    ...applicationProjectionQuery(),
  ]);
  if (applications.length === 0) throw new NotFoundException("Application not found in trash.");
  return applications[0];
};

export const create = async (payload: ApplicationInput) => {
  // check if job exists
  const job = await jobService.getOne({
    query: { _id: payload.jobId! },
  });

  payload.statusId = job.boardColumnOrder[0];

  // get the status
  const status = await statusService.getOne({
    query: { _id: payload.statusId },
  });

  // create a random number 1 - 10
  const merit = Math.floor(Math.random() * 10) + 1;
  payload.rank = merit + status.weight;

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
  const application = await getOne({ _id: id });
  const { deleted } = await Application.softDelete({ _id: id });

  return { application, deleted };
};

export const hardRemove = async (id: string) => {
  const application = await getOne({ _id: id });
  await Application.findOneAndDelete({ _id: id });

  return application;
};

export const restore = async (id: string) => {
  const { restored } = await Application.restore({ _id: id });
  if (!restored) throw new NotFoundException("Application not found in trash.");

  const application = await getOne({ _id: id });

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

export const moveItemOnBoard = async (itemId: string, targetStatusId: string, targetIndex: number) => {
  return Application.moveToPosition(itemId, targetStatusId, targetIndex);
};
