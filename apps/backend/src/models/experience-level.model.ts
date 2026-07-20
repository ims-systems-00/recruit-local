import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { IExperienceLevel } from "@rl/types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExperienceLevelInput extends IExperienceLevel {}

export interface IExperienceLevelDoc extends ExperienceLevelInput, ISoftDeleteDoc, IBaseDoc {}

interface IExperienceLevelModel
  extends Model<IExperienceLevelDoc>,
    ISoftDeleteModel<IExperienceLevelDoc>,
    PaginateModel<IExperienceLevelDoc>,
    AggregatePaginateModel<IExperienceLevelDoc> {}

const experienceLevelSchema = new Schema<IExperienceLevelDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

experienceLevelSchema.plugin(softDeletePlugin);
experienceLevelSchema.plugin(mongoosePaginate);
experienceLevelSchema.plugin(aggregatePaginate);

export const ExperienceLevel = model<IExperienceLevelDoc, IExperienceLevelModel>(
  modelNames.EXPERIENCE_LEVEL,
  experienceLevelSchema
);
