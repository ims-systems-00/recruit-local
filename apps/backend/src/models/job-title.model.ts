import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { IJobTitle } from "@rl/types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface JobTitleInput extends IJobTitle {}

export interface IJobTitleDoc extends JobTitleInput, ISoftDeleteDoc, IBaseDoc {}

interface IJobTitleModel
  extends Model<IJobTitleDoc>,
    ISoftDeleteModel<IJobTitleDoc>,
    PaginateModel<IJobTitleDoc>,
    AggregatePaginateModel<IJobTitleDoc> {}

const jobTitleSchema = new Schema<IJobTitleDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

jobTitleSchema.plugin(softDeletePlugin);
jobTitleSchema.plugin(mongoosePaginate);
jobTitleSchema.plugin(aggregatePaginate);

export const JobTitle = model<IJobTitleDoc, IJobTitleModel>(modelNames.JOB_TITLE, jobTitleSchema);
