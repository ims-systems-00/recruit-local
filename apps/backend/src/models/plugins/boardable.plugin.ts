import { Schema, Document, Model, Types, ClientSession } from "mongoose";
import { modelNames } from "../constants";
import { withTransaction } from "../../common/helper/database-transaction";
import { Status } from "../status.model";
import { logger } from "../../common/helper";

const BOARD_CONFIG = {
  REBALANCE_BASE_GAP: parseFloat(process.env.KANBAN_REBALANCE_BASE_GAP || "1"),
  MIN_RANK_GAP: parseFloat(process.env.KANBAN_MIN_RANK_GAP || "0.005"),
  EDGE_RANK_GAP: parseFloat(process.env.KANBAN_EDGE_RANK_GAP || "1"),
};

export interface IBoardableInput {
  statusId: Types.ObjectId;
  rank: number;
}

export interface IBoardableDoc extends IBoardableInput, Document {}

export interface BoardableOptions {
  parentModelName: string;
  foreignKey: string;
}

export interface IBoardableModel<T extends IBoardableDoc> extends Model<T> {
  rebalanceColumn(statusId: Types.ObjectId, session: ClientSession): Promise<boolean>;
  moveToPosition(
    itemId: string | Types.ObjectId,
    targetStatusId: string | Types.ObjectId,
    targetIndex: number
  ): Promise<{ success: boolean; rank: number; rebalanced: boolean }>;
  findAllByParent(parentId: Types.ObjectId): Promise<T[]>;
  findAllByColumn(statusId: Types.ObjectId): Promise<T[]>;
}

export const boardablePlugin = <T extends IBoardableDoc>(schema: Schema<T>, options: BoardableOptions): void => {
  if (!(schema instanceof Schema)) throw new Error("Schema must be an instance of mongoose schema");

  schema.add({
    statusId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.STATUS,
      required: true,
      index: true,
    },
    rank: {
      type: Number,
      required: true,
    },
  } as any);

  schema.index({ statusId: 1, rank: -1 });

  schema.static("findAllByParent", function (parentId: Schema.Types.ObjectId) {
    return this.find({ [options.foreignKey]: parentId } as Record<string, unknown>).sort({ rank: -1 });
  });

  schema.static("findAllByColumn", function (statusId: Schema.Types.ObjectId) {
    return this.find({ statusId }).sort({ rank: -1 });
  });

  schema.static("rebalanceColumn", async function (statusId: Types.ObjectId, session: ClientSession) {
    const items = await this.find({ statusId }).sort({ rank: 1, createdAt: -1 }).session(session);
    const status = await Status.findById(statusId).select("weight").session(session);
    if (!status) throw new Error("Status not found");

    let currentRank = status.weight + BOARD_CONFIG.REBALANCE_BASE_GAP;

    const bulkOps = items.map((doc) => {
      const update = { updateOne: { filter: { _id: doc._id }, update: { rank: currentRank } } };
      currentRank += BOARD_CONFIG.REBALANCE_BASE_GAP;
      return update;
    });

    if (bulkOps.length > 0) {
      await this.bulkWrite(bulkOps, { session });
    }
    return true;
  });

  schema.static(
    "moveToPosition",
    async function (
      this: IBoardableModel<T>,
      itemId: string | Types.ObjectId,
      targetStatusId: string | Types.ObjectId,
      targetIndex: number
    ) {
      return withTransaction(async (session: ClientSession) => {
        const item = await this.findById(itemId).session(session);
        if (!item) throw new Error("Item not found");

        const parentId = item.get(options.foreignKey);

        const ParentModel = item.db.model(options.parentModelName);

        const parentDoc = await ParentModel.findById(parentId).select("columnOrder sortBy").session(session);

        if (!parentDoc) throw new Error(`${options.parentModelName} not found`);

        // GUARD: If board is not sorted by rank, disable manual moving
        if (parentDoc.sortBy && parentDoc.sortBy !== "rank") {
          throw new Error(`Cannot manually move items when sorted by ${parentDoc.sortBy}`);
        }

        const targetStatusObjectId = new Types.ObjectId(targetStatusId);
        const status = await Status.findById(targetStatusObjectId).select("_id weight").session(session);
        if (!status) throw new Error("Target status not found");

        // 3. Get Neighbors
        const columnItems = await this.find({
          statusId: targetStatusObjectId,
          [options.foreignKey]: parentId,
        })
          .select("_id rank")
          .sort({ rank: -1, createdAt: 1 })
          .session(session);

        const existingItems = columnItems.filter((i) => i._id.toString() !== item._id.toString());

        if (targetIndex < 0 || targetIndex > existingItems.length) {
          throw new Error(`Target index ${targetIndex} out of bounds`);
        }

        let newRank: number;
        let rebalanced = false;
        const movingWithinSameColumn = item.statusId.equals(targetStatusObjectId);

        // 4. Calculate Rank
        if (!movingWithinSameColumn && existingItems.length == 0) {
          // Moving to an empty column
          const columnOrder = parentDoc.columnOrder || [];

          const fromIndex = columnOrder.findIndex((colId: any) => colId.toString() === item.statusId.toString());
          const toIndex = columnOrder.findIndex((colId: any) => colId.toString() === status._id.toString());

          // If moving to a column "to the left" (higher priority usually), add weight
          // If moving "to the right", subtract weight
          const movingToHigherPriority = toIndex < fromIndex;
          const targetedStatus = await Status.findById(targetStatusObjectId).select("weight").session(session);

          if (movingToHigherPriority) {
            newRank = item.rank + (targetedStatus?.weight || 0);
          } else {
            newRank = item.rank - (targetedStatus?.weight || 0);
          }
        } else {
          // Moving between existing items
          if (targetIndex == 0) {
            newRank = existingItems[0].rank + BOARD_CONFIG.EDGE_RANK_GAP;
          } else if (targetIndex === existingItems.length) {
            newRank = existingItems[existingItems.length - 1].rank - BOARD_CONFIG.EDGE_RANK_GAP;
          } else {
            const prevRank = existingItems[targetIndex - 1].rank;
            const nextRank = existingItems[targetIndex].rank;
            newRank = (prevRank + nextRank) / 2;

            if ((prevRank - nextRank) / 2 < BOARD_CONFIG.MIN_RANK_GAP) {
              rebalanced = true;
            }
          }
        }

        item.statusId = targetStatusObjectId;
        item.rank = newRank;
        await item.save({ session });

        if (rebalanced) {
          logger.info(`Rebalancing column for statusId: ${targetStatusObjectId.toString()}`);
          await this.rebalanceColumn(targetStatusObjectId, session);
        }

        return { success: true, rank: newRank, rebalanced };
      });
    }
  );
};
