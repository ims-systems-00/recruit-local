import { ClientSession } from "mongoose";
import { BadRequestException, NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { IListParams, ListQueryParams } from "@rl/types";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { withTransaction } from "../../../common/helper/database-transaction";
import { statusProjectionQuery } from "./status.query";
import { IStatusDoc, IStatusInput, Status } from "../../../models";

type IStatusListParams = IListParams<IStatusInput>;
type IStatusQueryParams = ListQueryParams<IStatusInput>;

export const list = ({ query = {}, options }: IStatusListParams) => {
  return Status.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...statusProjectionQuery()],
    options
  );
};

export const getOne = async ({
  query = {},
  session,
}: IStatusQueryParams & { session?: ClientSession }): Promise<IStatusDoc> => {
  const status = await Status.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...statusProjectionQuery(),
  ]).session(session);
  if (status.length === 0) throw new NotFoundException("Status not found.");
  return status[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IStatusListParams) => {
  return Status.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...statusProjectionQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {}, session }: IStatusListParams & { session?: ClientSession }) => {
  const status = await Status.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...statusProjectionQuery(),
  ]).session(session);
  if (status.length === 0) throw new NotFoundException("Status not found in trash.");
  return status[0];
};

export const create = async (payload: IStatusInput) => {
  return withTransaction(async (session) => {
    if (payload.default === true) {
      await Status.updateMany(
        {
          collectionName: payload.collectionName,
          default: true,
        },
        { $set: { default: false } },
        { session }
      );
    }
    const status = new Status(payload);

    await status.save({ session });

    return status;
  });
};

export const update = async ({ query, payload }: { query: IStatusQueryParams; payload: Partial<IStatusInput> }) => {
  return withTransaction(async (session) => {
    const existing = await Status.findOne(sanitizeQueryIds(query)).session(session);
    if (!existing) throw new NotFoundException("Status not found for update.");

    const targetCollection = payload.collectionName || existing.collectionName;

    if (payload.default === true) {
      await Status.updateMany(
        {
          collectionName: targetCollection,
          _id: { $ne: existing._id },
        },
        { $set: { default: false } },
        { session }
      );
    }

    const updatedStatus = await Status.findOneAndUpdate(
      { _id: existing._id },
      { $set: payload },
      { new: true, runValidators: true, session }
    );

    return updatedStatus;
  });
};

export const softRemove = async ({ query }: { query: IStatusQueryParams }) => {
  const status = await Status.findOne(sanitizeQueryIds(query));

  if (!status) throw new NotFoundException("Status not found.");

  // Guard: Prevent deletion of default status
  if (status.default) {
    throw new BadRequestException(
      `Cannot delete the default status for ${status.collectionName}. Please assign another status as default first.`
    );
  }

  const { deleted } = await Status.softDelete({ _id: status._id });
  return { deleted };
};

export const restore = async ({ query }: { query: IStatusQueryParams }) => {
  return withTransaction(async (session) => {
    const existing = await Status.findOne(sanitizeQueryIds(query)).session(session);
    if (!existing) throw new NotFoundException("Status not found in trash.");

    // Check if the collection already has a default
    const hasDefault = await Status.findOne({
      collectionName: existing.collectionName,
      default: true,
    }).session(session);

    const { restored } = await Status.restore(sanitizeQueryIds(query));

    if (hasDefault) {
      await Status.updateOne({ _id: existing._id }, { $set: { default: false } }).session(session);
    }

    return { restored };
  });
};

export const hardRemove = async ({ query }: { query: IStatusQueryParams }) => {
  return withTransaction(async (session) => {
    const status = await getOneSoftDeleted({
      query,
      session,
    });

    if (!status) throw new NotFoundException("Status not found.");

    if (status.default) {
      throw new BadRequestException(
        "Default status cannot be hard deleted. Change the default status to another item first."
      );
    }

    await Status.deleteOne({ _id: status._id }).session(session);
    return status;
  });
};
