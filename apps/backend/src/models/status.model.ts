import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

type ModelName = (typeof modelNames)[keyof typeof modelNames];

export interface IStatusInput {
  collectionName: ModelName;
  collectionId?: Schema.Types.ObjectId;
  label: string;
  weight?: number;
  default: boolean;
}

export interface IStatusDoc extends IStatusInput, ISoftDeleteDoc {}

interface IStatusModel
  extends Model<IStatusDoc>,
    ISoftDeleteModel<IStatusDoc>,
    PaginateModel<IStatusDoc>,
    AggregatePaginateModel<IStatusDoc> {}

const statusSchema = new Schema<IStatusDoc>(
  {
    collectionName: { type: String, required: true, enum: Object.values(modelNames) },
    collectionId: { type: Schema.Types.ObjectId, required: false, refPath: "collectionName" },
    label: { type: String, required: true },
    weight: { type: Number, default: 0 },
    default: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

statusSchema.index(
  { collectionName: 1, default: 1 },
  {
    unique: true,
    partialFilterExpression: { default: true },
  }
);

statusSchema.plugin(softDeletePlugin);
statusSchema.plugin(mongoosePaginate);
statusSchema.plugin(aggregatePaginate);

export const Status = model<IStatusDoc, IStatusModel>(modelNames.STATUS, statusSchema);
