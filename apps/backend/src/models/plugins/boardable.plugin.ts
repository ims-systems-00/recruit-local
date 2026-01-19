import { Schema, Document, Model } from "mongoose";
import { modelNames } from "../constants";

export interface IBoardableInput {
  boardId: Schema.Types.ObjectId;
  statusId: Schema.Types.ObjectId;
  rank: string;
}

export interface IBoardableDoc extends IBoardableInput, Document {}

export interface IBoardableModel<T extends IBoardableDoc> extends Model<T> {
  findAllByBoard(boardId: Schema.Types.ObjectId): Promise<T[]>;
  findAllByColumn(statusId: Schema.Types.ObjectId): Promise<T[]>;
}

export const boardablePlugin = <T extends IBoardableDoc>(schema: Schema<T>): void => {
  if (!(schema instanceof Schema)) throw new Error("Schema must be an instance of mongoose schema");

  const boardableSchema = new Schema<IBoardableDoc>(
    {
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
        type: String,
        required: true,
      },
    },
    { _id: false, autoIndex: false }
  );

  schema.add(boardableSchema);

  // --- Indexes ---
  schema.index({ statusId: 1, rank: 1 });

  // --- Static Helpers ---
  schema.static("findAllByBoard", function (boardId: Schema.Types.ObjectId) {
    return this.find({ boardId }).sort({ rank: 1 });
  });

  schema.static("findAllByColumn", function (statusId: Schema.Types.ObjectId) {
    return this.find({ statusId }).sort({ rank: 1 });
  });
};
