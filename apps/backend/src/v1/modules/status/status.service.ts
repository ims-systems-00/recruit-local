import { ClientSession } from "mongoose";
import { Types } from "mongoose";
import { BadRequestException, NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { IListParams, ListQueryParams } from "@rl/types";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { withTransaction } from "../../../common/helper/database-transaction";
import { statusProjectionQuery } from "./status.query";
import { IStatusDoc, IStatusInput, Status } from "../../../models";

// --- Standardized Parameter Interfaces ---
type IStatusListParams = IListParams<IStatusInput>;
type IStatusQueryParams = ListQueryParams<IStatusInput>;

export interface IStatusUpdateParams {
  query: IStatusQueryParams;
  payload: Partial<IStatusInput>;
}

export interface IStatusGetParams {
  query: IStatusQueryParams;
  session?: ClientSession;
}

export interface IStatusCreateParams {
  payload: IStatusInput;
}

export interface IStatusCreateManyParams {
  payloads: IStatusInput[];
}

export const list = ({ query = {}, options }: IStatusListParams) => {
  return Status.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...statusProjectionQuery()],
    options
  );
};

export const getOne = async ({ query = {}, session }: IStatusGetParams): Promise<IStatusDoc> => {
  const status = await Status.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...statusProjectionQuery(),
  ]).session(session || null);

  if (status.length === 0) throw new NotFoundException("Status not found.");
  return status[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IStatusListParams) => {
  return Status.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...statusProjectionQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {}, session }: IStatusGetParams) => {
  const status = await Status.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...statusProjectionQuery(),
  ]).session(session || null);

  if (status.length === 0) throw new NotFoundException("Status not found in trash.");
  return status[0];
};

export const create = async ({ payload }: IStatusCreateParams) => {
  return withTransaction(async (session: ClientSession) => {
    if (payload.default === true) {
      const filter: any = {
        collectionName: payload.collectionName,
        default: true,
      };

      if (payload.collectionId) {
        filter.collectionId = payload.collectionId;
      } else {
        filter.collectionId = null;
      }

      await Status.updateMany(filter, { $set: { default: false } }, { session });
    }

    const status = new Status(payload);
    await status.save({ session });

    return status;
  });
};

export const createMany = async ({ payloads }: IStatusCreateManyParams) => {
  return withTransaction(async (session) => {
    const payloadsWithIds = payloads.map((p) => ({
      ...p,
      _id: new Types.ObjectId(),
    }));

    const bulkOps = payloadsWithIds.flatMap((payload) => {
      const ops = [];

      if (payload.default === true) {
        const filter: any = {
          collectionName: payload.collectionName,
          default: true,
        };

        if (payload.collectionId) {
          filter.collectionId = payload.collectionId;
        } else {
          filter.collectionId = null;
        }

        ops.push({
          updateMany: {
            filter: filter,
            update: { $set: { default: false } },
          },
        });
      }

      ops.push({
        insertOne: {
          document: payload,
        },
      });

      return ops;
    });

    if (bulkOps.length > 0) {
      await Status.bulkWrite(bulkOps, { session, ordered: true });
    }

    return payloadsWithIds;
  });
};

export const update = async ({ query, payload }: IStatusUpdateParams) => {
  return withTransaction(async (session: ClientSession) => {
    const existing = await Status.findOne(sanitizeQueryIds(query)).session(session);
    if (!existing) throw new NotFoundException("Status not found for update.");

    const targetCollectionName = payload.collectionName || existing.collectionName;
    const targetCollectionId = payload.collectionId !== undefined ? payload.collectionId : existing.collectionId;

    if (payload.default === true) {
      const filter: any = {
        collectionName: targetCollectionName,
        default: true,
        _id: { $ne: existing._id },
      };

      if (targetCollectionId) {
        filter.collectionId = targetCollectionId;
      } else {
        filter.collectionId = null;
      }

      await Status.updateMany(filter, { $set: { default: false } }, { session });
    }

    const updatedStatus = await Status.findOneAndUpdate(
      { _id: existing._id },
      { $set: payload },
      { new: true, runValidators: true, session }
    );

    return updatedStatus;
  });
};

// Renamed to match the softDelete standard
export const softDelete = async ({ query }: IStatusGetParams) => {
  const status = await Status.findOne(sanitizeQueryIds(query));

  if (!status) throw new NotFoundException("Status not found.");

  if (status.default) {
    throw new BadRequestException(
      `Cannot delete the default status for ${status.collectionName}. Please assign another status as default first.`
    );
  }

  const { deleted } = await Status.softDelete({ _id: status._id });
  return { deleted };
};

// Renamed to match the hardDelete standard
export const hardDelete = async ({ query, session }: IStatusGetParams) => {
  return withTransaction(async (sessionTx) => {
    const activeSession = session || sessionTx;

    const status = await getOneSoftDeleted({
      query,
      session: activeSession,
    });

    if (!status) throw new NotFoundException("Status not found.");

    await Status.deleteOne({ _id: status._id }).session(activeSession);
    return status;
  });
};

export const restore = async ({ query }: IStatusGetParams) => {
  return withTransaction(async (session) => {
    const existing = await Status.findOne(sanitizeQueryIds(query)).session(session);
    if (!existing) throw new NotFoundException("Status not found in trash.");

    const defaultFilter: any = {
      collectionName: existing.collectionName,
      default: true,
    };

    if (existing.collectionId) {
      defaultFilter.collectionId = existing.collectionId;
    } else {
      defaultFilter.collectionId = null;
    }

    const hasDefault = await Status.findOne(defaultFilter).session(session);

    const { restored } = await Status.restore(sanitizeQueryIds(query));

    if (existing.default && hasDefault) {
      await Status.updateOne({ _id: existing._id }, { $set: { default: false } }).session(session);
    }

    return { restored };
  });
};
