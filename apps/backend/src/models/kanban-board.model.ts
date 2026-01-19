import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { tenantDataPlugin, ITenantDoc } from "./plugins/tenant-data.plugin";
import { modelNames } from "./constants";

export interface IBoardInput {
  title: string;
  description?: string;
  collectionName?: string;
  collectionId?: Schema.Types.ObjectId;
  columnOrder: Schema.Types.ObjectId[];
  isTemplate: boolean;
  background?: string;
}

export interface IBoardDoc extends IBoardInput, ITenantDoc, ISoftDeleteDoc {}

interface IBoardModel
  extends Model<IBoardDoc>,
    ISoftDeleteModel<IBoardDoc>,
    PaginateModel<IBoardDoc>,
    AggregatePaginateModel<IBoardDoc> {}

const boardSchema = new Schema<IBoardDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    collectionName: { type: String, trim: true },
    collectionId: { type: String, trim: true },
    columnOrder: [{ type: Schema.Types.ObjectId, ref: modelNames.STATUS }],
    isTemplate: { type: Boolean, default: false },
    background: { type: String, default: "#ffffff" },
  },
  { timestamps: true }
);

boardSchema.plugin(softDeletePlugin);
boardSchema.plugin(mongoosePaginate);
boardSchema.plugin(aggregatePaginate);
boardSchema.plugin(tenantDataPlugin);

export const Board = model<IBoardDoc, IBoardModel>(modelNames.BOARD, boardSchema);
