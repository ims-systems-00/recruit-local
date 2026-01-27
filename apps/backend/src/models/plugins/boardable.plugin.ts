import { Schema, Document, Model, Types, ClientSession } from "mongoose";
import { modelNames } from "../constants";
import { withTransaction } from "../../common/helper/database-transaction";
import { Status } from "../status.model";
import { Board } from "../kanban-board.model";
import { logger } from "../../common/helper";

const BOARD_CONFIG = {
  REBALANCE_BASE_GAP: parseFloat(process.env.KANBAN_REBALANCE_BASE_GAP || "1"),
  MIN_RANK_GAP: parseFloat(process.env.KANBAN_MIN_RANK_GAP || "0.005"),
  EDGE_RANK_GAP: parseFloat(process.env.KANBAN_EDGE_RANK_GAP || "1"),
};

export interface IBoardableInput {
  boardId: Types.ObjectId;
  statusId: Types.ObjectId;
  rank: number;
}

export interface IBoardableDoc extends IBoardableInput, Document {}

export interface IBoardableModel<T extends IBoardableDoc> extends Model<T> {
  rebalanceColumn(statusId: Types.ObjectId, session: ClientSession): Promise<boolean>;
  moveToPosition(
    itemId: string | Types.ObjectId,
    targetStatusId: string | Types.ObjectId,
    targetIndex: number
  ): Promise<{ success: boolean; rank: number; rebalanced: boolean }>;
  findAllByBoard(boardId: Types.ObjectId): Promise<T[]>;
  findAllByColumn(statusId: Types.ObjectId): Promise<T[]>;
}

export const boardablePlugin = <T extends IBoardableDoc>(schema: Schema<T>): void => {
  if (!(schema instanceof Schema)) throw new Error("Schema must be an instance of mongoose schema");

  const boardableSchema = new Schema<IBoardableDoc>({
    boardId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.BOARD,
      required: true,
      index: true,
    },
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
  });

  schema.add(boardableSchema);

  // --- Indexes (DESCENDING: -1) ---
  schema.index({ statusId: 1, rank: -1 });

  // --- Static Helpers ---
  schema.static("findAllByBoard", function (boardId: Schema.Types.ObjectId) {
    return this.find({ boardId }).sort({ rank: -1 });
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

  // --- Main Logic: Move To Position  ---
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

        const targetStatusObjectId = new Types.ObjectId(targetStatusId);

        const status = await Status.findById(targetStatusObjectId).select("_id weight").session(session); // todo: probably does not need session
        if (!status) throw new Error("Target status not found");

        // Get all items in the target column to determine neighbors
        const columnItems = await this.find({ statusId: targetStatusObjectId })
          .select("_id rank")
          .sort({ rank: -1, createdAt: 1 })
          .session(session);

        logger.info(`Column items count: ${columnItems.length}`);

        // Remove the item being moved from the list if it's already in the target column
        const existingItems = columnItems.filter((i) => i._id.toString() !== item._id.toString());

        if (targetIndex < 0 || targetIndex > existingItems.length) {
          throw new Error(`Target index ${targetIndex} out of bounds`);
        }

        let newRank: number;
        let rebalanced = false;

        // check if moving within the same column
        const movingWithinSameColumn = item.statusId.equals(targetStatusObjectId);

        if (!movingWithinSameColumn && existingItems.length == 0) {
          const boardId = item.boardId;
          const board = await Board.findById(boardId).select("_id columnOrder").session(session);
          if (!board) throw new Error("Board not found");

          // from column order find if it's moving to a higher priority column or lower priority column
          const fromIndex = board.columnOrder.findIndex((colId) => colId.toString() === item.statusId.toString());
          const toIndex = board.columnOrder.findIndex((colId) => colId.toString() === status._id.toString());

          const movingToHigherPriority = toIndex < fromIndex;

          // this means this is the first item in the column
          const targetedStatus = await Status.findById(targetStatusObjectId).select("weight").session(session);
          if (movingToHigherPriority) {
            newRank = item.rank + (targetedStatus?.weight || 0);
          } else {
            newRank = item.rank - (targetedStatus?.weight || 0);
          }
        } else {
          if (targetIndex == 0) {
            newRank = existingItems[0].rank + BOARD_CONFIG.EDGE_RANK_GAP; // ! adding only one could be dangerous
          } else if (targetIndex === existingItems.length) {
            newRank = existingItems[existingItems.length - 1].rank - BOARD_CONFIG.EDGE_RANK_GAP;
          } else {
            const prevRank = existingItems[targetIndex - 1].rank;
            const nextRank = existingItems[targetIndex].rank;
            newRank = (prevRank + nextRank) / 2;
            // if the gap is too small, need to rebalance
            if ((prevRank - nextRank) / 2 < BOARD_CONFIG.MIN_RANK_GAP) {
              rebalanced = true;
            }
          }
        }

        // update the item with the new status and rank
        item.statusId = targetStatusObjectId;
        item.rank = newRank;
        await item.save({ session });

        // rebalancing if needed // ?Q move this part to a queue job
        if (rebalanced) {
          logger.info(`Rebalancing column for statusId: ${targetStatusObjectId.toString()}`);
          await this.rebalanceColumn(targetStatusObjectId, session);
        }

        return { success: true, rank: newRank, rebalanced };
      });
    }
  );
};
