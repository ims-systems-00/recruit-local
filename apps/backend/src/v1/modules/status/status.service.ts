import { ClientSession } from "mongoose";
import { Types } from "mongoose";
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
  return withTransaction(async (session: ClientSession) => {
    //  Only run update logic if this new status claims to be default
    if (payload.default === true) {
      const filter: any = {
        collectionName: payload.collectionName,
        default: true,
      };

      if (payload.collectionId) {
        // Specific Scope: Only unset defaults for this specific ID
        filter.collectionId = payload.collectionId;
      } else {
        // Global Scope: Only unset defaults that are truly global (no ID)
        filter.collectionId = null;
      }

      await Status.updateMany(filter, { $set: { default: false } }, { session });
    }

    const status = new Status(payload);
    await status.save({ session });

    return status;
  });
};

export const createMany = async (payloads: IStatusInput[]) => {
  return withTransaction(async (session) => {
    const payloadsWithIds = payloads.map((p) => ({
      ...p,
      _id: new Types.ObjectId(),
    }));

    // 2. Create Bulk Operations
    // We use flatMap because one payload might need TWO operations (Unset old default + Insert new)
    const bulkOps = payloadsWithIds.flatMap((payload) => {
      const ops = [];

      // If this new status claims to be the default, unset any existing default in that collection first
      if (payload.default === true) {
        const filter: any = {
          collectionName: payload.collectionName,
          default: true,
        };

        if (payload.collectionId) {
          // CASE 1: SPECIFIC DEFAULT
          filter.collectionId = payload.collectionId;
        } else {
          // CASE 2: GLOBAL DEFAULT
          filter.collectionId = null;
        }
        ops.push({
          updateMany: {
            filter: filter,
            update: { $set: { default: false } },
          },
        });
      }

      // Always insert the new status
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

export const update = async ({ query, payload }: { query: IStatusQueryParams; payload: Partial<IStatusInput> }) => {
  return withTransaction(async (session: ClientSession) => {
    // 1. Fetch Existing to know current scope
    const existing = await Status.findOne(sanitizeQueryIds(query)).session(session);
    if (!existing) throw new NotFoundException("Status not found for update.");

    // 2. Determine Target Scope (Merge Payload with Existing)
    // If payload has a new name/ID, use it. Otherwise use existing.
    const targetCollectionName = payload.collectionName || existing.collectionName;

    // Check if payload explicitly changes collectionId (could be null or an ID)
    // We use !== undefined because payload.collectionId could be null (Global)
    const targetCollectionId = payload.collectionId !== undefined ? payload.collectionId : existing.collectionId;

    // 3. Handle Default Logic with Scope
    if (payload.default === true) {
      const filter: any = {
        collectionName: targetCollectionName,
        default: true,
        _id: { $ne: existing._id }, // Don't touch self
      };

      if (targetCollectionId) {
        // Specific Scope
        filter.collectionId = targetCollectionId;
      } else {
        // Global Scope
        filter.collectionId = null;
      }

      await Status.updateMany(filter, { $set: { default: false } }, { session });
    }

    // 4. Perform the Update
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

export const hardRemove = async ({ query }: { query: IStatusQueryParams }) => {
  return withTransaction(async (session) => {
    const status = await getOneSoftDeleted({
      query,
      session,
    });

    if (!status) throw new NotFoundException("Status not found.");

    await Status.deleteOne({ _id: status._id }).session(session);
    return status;
  });
};
