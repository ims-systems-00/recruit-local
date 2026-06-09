import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { IWorkMode } from "@rl/types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WorkModeInput extends IWorkMode {}

export interface IWorkModeDoc extends WorkModeInput, ISoftDeleteDoc, IBaseDoc {}

interface IWorkModeModel
  extends Model<IWorkModeDoc>,
    ISoftDeleteModel<IWorkModeDoc>,
    PaginateModel<IWorkModeDoc>,
    AggregatePaginateModel<IWorkModeDoc> {}

const workModeSchema = new Schema<IWorkModeDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

workModeSchema.plugin(softDeletePlugin);
workModeSchema.plugin(mongoosePaginate);
workModeSchema.plugin(aggregatePaginate);

export const WorkMode = model<IWorkModeDoc, IWorkModeModel>(modelNames.WORK_MODE, workModeSchema);
