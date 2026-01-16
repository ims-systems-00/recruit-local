import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

export interface IActionInput {
  statusId: Schema.Types.ObjectId;
  actionType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

export interface IActionDoc extends IActionInput, ISoftDeleteDoc {}

interface IActionModel
  extends Model<IActionDoc>,
    ISoftDeleteModel<IActionDoc>,
    PaginateModel<IActionDoc>,
    AggregatePaginateModel<IActionDoc> {}

const actionSchema = new Schema<IActionDoc>(
  {
    statusId: { type: Schema.Types.ObjectId, required: true, ref: modelNames.STATUS },
    actionType: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

actionSchema.plugin(softDeletePlugin);
actionSchema.plugin(mongoosePaginate);
actionSchema.plugin(aggregatePaginate);

export const Action = model<IActionDoc, IActionModel>(modelNames.ACTION, actionSchema);
