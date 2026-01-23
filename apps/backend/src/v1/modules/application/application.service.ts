import { IListParams } from "@rl/types";
import { NotFoundException } from "../../../common/helper";
import { ApplicationInput, Application } from "../../../models/application.model";
import * as jobService from "../job/job.service";
import * as boardService from "../board/board.service";
import * as statusService from "../status/status.service";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";

type IListApplicationParams = IListParams<ApplicationInput>;

export const list = ({ query = {}, options }: IListApplicationParams) => {
  return Application.paginateAndExcludeDeleted(query, { ...options });
};

export const getOne = async (id: string) => {
  const application = await Application.findOneWithExcludeDeleted({ _id: id });
  if (!application) throw new NotFoundException("Application not found.");
  return application;
};

export const create = async (payload: ApplicationInput) => {
  // check if job exists
  const job = await jobService.getOne(payload.jobId.toString());
  // check if boardId and statusId are valid if exists
  const board = await boardService.getOne({
    collectionId: job._id,
  });
  // get the first status of the board

  // ! this is keeping in mind that they exist
  payload.boardId = board._id as any;
  payload.statusId = board.columnOrder[0] as any;

  console.log("payload.statusId", sanitizeQueryIds(payload.statusId!));
  // get the status
  const status = await statusService.getOne({
    ...sanitizeQueryIds({
      _id: payload.statusId!,
    }),
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

export const moveItemOnBoard = async (itemId: string, targetStatusId: string, targetIndex: number) => {
  return Application.moveToPosition(itemId, targetStatusId, targetIndex);
};
