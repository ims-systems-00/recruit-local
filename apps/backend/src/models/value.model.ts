import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { IValue } from "@rl/types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ValueInput extends IValue {}

export interface IValueDoc extends ValueInput, ISoftDeleteDoc, IBaseDoc {}

interface IValueModel
  extends Model<IValueDoc>,
    ISoftDeleteModel<IValueDoc>,
    PaginateModel<IValueDoc>,
    AggregatePaginateModel<IValueDoc> {}

const valueSchema = new Schema<IValueDoc>(
  {
    type: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

valueSchema.plugin(softDeletePlugin);
valueSchema.plugin(mongoosePaginate);
valueSchema.plugin(aggregatePaginate);

export const Value = model<IValueDoc, IValueModel>(modelNames.VALUE, valueSchema);
