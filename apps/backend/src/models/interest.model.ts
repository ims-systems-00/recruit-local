import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";
import { baseSchemaOptions } from "./options/schema.options";
import { IBaseDoc } from "./interfaces/base.interface";
import { IInterest } from "@inrm/types";

export interface InterestInput extends IInterest, IUserOwnedInput, JobProfileInput {}

export interface IInterestDoc extends InterestInput, ISoftDeleteDoc, IBaseDoc {}

interface IInterestModel
  extends Model<IInterestDoc>,
    ISoftDeleteModel<IInterestDoc>,
    PaginateModel<IInterestDoc>,
    AggregatePaginateModel<IInterestDoc> {}

const interestSchema = new Schema<IInterestDoc>(
  {
    name: { type: String, required: true },
    description: { type: String },
  },
  {
    ...baseSchemaOptions,
  }
);

interestSchema.plugin(softDeletePlugin);
interestSchema.plugin(mongoosePaginate);
interestSchema.plugin(aggregatePaginate);
interestSchema.plugin(userOwnedPlugin);
interestSchema.plugin(jobProfilePlugin);

export const Interest = model<IInterestDoc, IInterestModel>(modelNames.INTEREST, interestSchema);
