import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { tenantDataPlugin, TenantInput, ITenantDoc } from "./plugins/tenant-data.plugin";
import { modelNames, ModelNames } from "./constants";

// `tenantId` is the owning tenant of the parent (the job), copied on create so
// CASL can scope statuses without a lookup. Null for statuses with no tenant.
export interface IStatusInput extends TenantInput {
  collectionName: ModelNames;
  collectionId?: Types.ObjectId;
  label: string;
  weight?: number;
  default: boolean;
  backgroundColor?: string;
}

export interface IStatusDoc extends IStatusInput, ISoftDeleteDoc, ITenantDoc {}

interface IStatusModel
  extends
    Model<IStatusDoc>,
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
    backgroundColor: { type: String, required: false, default: "#FFFFFF" },
  },
  { timestamps: true }
);

statusSchema.index(
  { collectionName: 1, collectionId: 1, default: 1 },
  {
    unique: true,
    partialFilterExpression: { default: true },
    background: true,
  }
);

statusSchema.plugin(softDeletePlugin);
statusSchema.plugin(tenantDataPlugin);

// The board query: an employer's statuses for one job.
statusSchema.index({ tenantId: 1, collectionName: 1, collectionId: 1 });
statusSchema.plugin(mongoosePaginate);
statusSchema.plugin(aggregatePaginate);

export const Status = model<IStatusDoc, IStatusModel>(modelNames.STATUS, statusSchema);
