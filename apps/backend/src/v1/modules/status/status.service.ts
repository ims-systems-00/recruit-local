import { ClientSession } from "mongoose";
import { Types } from "mongoose";
import { BadRequestException, ConflictException, NotFoundException } from "../../../common/helper";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { IListParams, ListQueryParams } from "@rl/types";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { withTransaction } from "../../../common/helper/database-transaction";
import { statusProjectionQuery } from "./status.query";
import { Application, IStatusDoc, IStatusInput, Job, Status } from "../../../models";
import { modelNames } from "../../../models/constants";

// --- Standardized Parameter Interfaces ---
type IStatusListParams = IListParams<IStatusInput> & { offset?: number };
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

export interface IStatusReorderParams {
  collectionName: IStatusInput["collectionName"];
  collectionId?: Types.ObjectId | string;
  statusIds: string[];
}

export const list = async ({ query = {}, options, offset = 0 }: IStatusListParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Status.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...statusProjectionQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
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

export const listSoftDeleted = async ({ query = {}, options, offset = 0 }: IStatusListParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Status.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...statusProjectionQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
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

/**
 * The tenant that owns a board — the tenant of the status's parent. Jobs are the
 * only parent that carries statuses; anything else has no tenant, which leaves it
 * to the platform admin.
 */
export const getBoardTenantId = async (
  collectionName: string,
  collectionId?: Types.ObjectId | string | null
): Promise<string | null> => {
  if (collectionName !== modelNames.JOB || !collectionId) return null;

  const job = await Job.findById(collectionId).select("tenantId").lean();
  if (!job) throw new NotFoundException("Job not found.");

  return job.tenantId ? String(job.tenantId) : null;
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

    // No weight given: append after the board's last column. Soft-deleted statuses
    // count too, so restoring one never lands it on the same weight as a newer one.
    if (payload.weight === undefined) {
      const last = await Status.findOne({
        collectionName: payload.collectionName,
        collectionId: payload.collectionId ?? null,
      })
        .sort({ weight: -1 })
        .select("weight")
        .session(session);

      payload = { ...payload, weight: last ? (last.weight ?? 0) + 1 : 0 };
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

/**
 * Rewrites a board's column order: `statusIds[i]` gets weight `i`.
 *
 * `statusIds` must be exactly the board's live statuses. A list built from a stale
 * board — a column added or deleted since the client loaded it — is rejected
 * rather than applied, because the missing or extra column has no sane weight.
 */
export const reorder = async ({ collectionName, collectionId, statusIds }: IStatusReorderParams) => {
  return withTransaction(async (session: ClientSession) => {
    const boardFilter = {
      collectionName,
      collectionId: collectionId ? new Types.ObjectId(String(collectionId)) : null,
      "deleteMarker.status": { $ne: true },
    };

    const live = await Status.find(boardFilter).select("_id").session(session);
    const liveIds = new Set(live.map((s) => String(s._id)));

    if (liveIds.size !== statusIds.length || !statusIds.every((id) => liveIds.has(id))) {
      throw new ConflictException("The board's statuses have changed. Refresh and try again.");
    }

    await Status.bulkWrite(
      statusIds.map((id, weight) => ({
        updateOne: { filter: { _id: new Types.ObjectId(id) }, update: { $set: { weight } } },
      })),
      { session }
    );

    return Status.find(boardFilter).sort({ weight: 1 }).session(session);
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
const applicationsLabel = (count: number) => (count === 1 ? "1 application" : `${count} applications`);

/**
 * A status can't be deleted while applications sit in it — they would drop off
 * the board, pointing at a status that no longer shows.
 *
 * `includeTrashed` is for hard delete: a trashed application still references its
 * status, and restoring it after the status is gone would leave it dangling.
 */
const assertNoApplicationsInStatus = async (
  statusId: Types.ObjectId | string,
  { includeTrashed = false, session }: { includeTrashed?: boolean; session?: ClientSession } = {}
) => {
  const statusObjectId = new Types.ObjectId(String(statusId));

  const live = await Application.countDocuments({
    statusId: statusObjectId,
    "deleteMarker.status": { $ne: true },
  }).session(session ?? null);

  if (live > 0) {
    throw new ConflictException(
      `This status has ${applicationsLabel(live)}. Move them to another status before deleting it.`
    );
  }

  if (!includeTrashed) return;

  const trashed = await Application.countDocuments({
    statusId: statusObjectId,
    "deleteMarker.status": true,
  }).session(session ?? null);

  if (trashed > 0) {
    throw new ConflictException(
      `This status still has ${applicationsLabel(trashed)} in the trash. Permanently delete or restore and move them before deleting it.`
    );
  }
};

export const softDelete = async ({ query }: IStatusGetParams) => {
  const status = await Status.findOne(sanitizeQueryIds(query));

  if (!status) throw new NotFoundException("Status not found.");

  if (status.default) {
    throw new BadRequestException(
      `Cannot delete the default status for ${status.collectionName}. Please assign another status as default first.`
    );
  }

  await assertNoApplicationsInStatus(status._id as Types.ObjectId);

  await Status.softDelete({ _id: status._id });
  const result = await getOneSoftDeleted({ query });
  return result;
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

    await assertNoApplicationsInStatus(status._id as Types.ObjectId, {
      includeTrashed: true,
      session: activeSession,
    });

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

    await Status.restore(sanitizeQueryIds(query));

    if (existing.default && hasDefault) {
      await Status.updateOne({ _id: existing._id }, { $set: { default: false } }).session(session);
    }

    return existing;
  });
};
