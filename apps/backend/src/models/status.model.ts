import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

export interface IStatusInput {
  collectionName: string;
  collectionId: Schema.Types.ObjectId;
  label: string;
}

export interface IStatusDoc extends IStatusInput, ISoftDeleteDoc {}

interface IStatusModel
  extends Model<IStatusDoc>,
    ISoftDeleteModel<IStatusDoc>,
    PaginateModel<IStatusDoc>,
    AggregatePaginateModel<IStatusDoc> {}

const statusSchema = new Schema<IStatusDoc>(
  {
    // todo: control collectionName values via enum
    collectionName: { type: String, required: true },
    collectionId: { type: Schema.Types.ObjectId, required: true, refPath: "collectionName" },
    label: { type: String, required: true },
  },
  { timestamps: true }
);

statusSchema.plugin(softDeletePlugin);
statusSchema.plugin(mongoosePaginate);
statusSchema.plugin(aggregatePaginate);

export const Status = model<IStatusDoc, IStatusModel>(modelNames.STATUS, statusSchema);
