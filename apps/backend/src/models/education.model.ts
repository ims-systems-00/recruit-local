import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwned } from "./plugins/userOwned.plugin";
import { baseSchemaOptions } from "./options/schema.options";
import { IBaseDoc } from "./interfaces/base.interface";

export interface EducationInput extends IUserOwned {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  grade?: string;
}
export interface IEducationDoc extends EducationInput, IBaseDoc, ISoftDeleteDoc {}

interface IEducationModel
  extends Model<IEducationDoc>,
    ISoftDeleteModel<IEducationDoc>,
    PaginateModel<IEducationDoc>,
    AggregatePaginateModel<IEducationDoc> {}

const educationSchema = new Schema<IEducationDoc>(
  {
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    description: { type: String },
    grade: { type: String },
  },
  {
    ...baseSchemaOptions,
  }
);

educationSchema.plugin(softDeletePlugin);
educationSchema.plugin(mongoosePaginate);
educationSchema.plugin(aggregatePaginate);
educationSchema.plugin(userOwnedPlugin);

export const Education = model<IEducationDoc, IEducationModel>(modelNames.EDUCATION, educationSchema);
