import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";
import { baseSchemaOptions } from "./options/schema.options";
import { IBaseDoc } from "./interfaces/base.interface";

export interface ExperienceInput extends IUserOwnedInput, JobProfileInput {
  company: string;
  location?: string;
  workMode?: string; // e.g., Remote, On-site, Hybrid
  employmentType?: string;
  position: string; // todo: job title
  startDate: Date;
  endDate?: Date;
  description?: string;
  isActive?: boolean; // todo: add isActive field
}

export interface IExperienceDoc extends ExperienceInput, ISoftDeleteDoc, IBaseDoc {}

interface IExperienceModel
  extends Model<IExperienceDoc>,
    ISoftDeleteModel<IExperienceDoc>,
    PaginateModel<IExperienceDoc>,
    AggregatePaginateModel<IExperienceDoc> {}

const experienceSchema = new Schema<IExperienceDoc>(
  {
    company: { type: String, required: true },
    location: { type: String },
    workMode: { type: String },
    employmentType: { type: String },
    position: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    description: { type: String },
  },
  {
    ...baseSchemaOptions,
  }
);

experienceSchema.plugin(softDeletePlugin);
experienceSchema.plugin(mongoosePaginate);
experienceSchema.plugin(aggregatePaginate);
experienceSchema.plugin(userOwnedPlugin);
experienceSchema.plugin(jobProfilePlugin);

export const Experience = model<IExperienceDoc, IExperienceModel>(modelNames.EXPERIENCE, experienceSchema);
