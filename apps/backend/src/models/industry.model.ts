import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { IIndustry } from "@rl/types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IndustryInput extends IIndustry {}

export interface IIndustryDoc extends IndustryInput, ISoftDeleteDoc, IBaseDoc {}

interface IIndustryModel
  extends Model<IIndustryDoc>,
    ISoftDeleteModel<IIndustryDoc>,
    PaginateModel<IIndustryDoc>,
    AggregatePaginateModel<IIndustryDoc> {}

const industrySchema = new Schema<IIndustryDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

industrySchema.plugin(softDeletePlugin);
industrySchema.plugin(mongoosePaginate);
industrySchema.plugin(aggregatePaginate);

export const Industry = model<IIndustryDoc, IIndustryModel>(modelNames.INDUSTRY, industrySchema);
