import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";
import { baseSchemaOptions } from "./options/schema.options";
import { IBaseDoc } from "./interfaces/base.interface";
import { ISkill } from "@inrm/types";

export interface SkillInput extends ISkill, IUserOwnedInput, JobProfileInput {}

export interface ISkillDoc extends SkillInput, ISoftDeleteDoc, IBaseDoc {}

interface ISkillModel
  extends Model<ISkillDoc>,
    ISoftDeleteModel<ISkillDoc>,
    PaginateModel<ISkillDoc>,
    AggregatePaginateModel<ISkillDoc> {}

const skillSchema = new Schema<ISkillDoc>(
  {
    name: { type: String, required: true },
    proficiencyLevel: { type: String },
    description: { type: String },
  },
  { ...baseSchemaOptions }
);

skillSchema.plugin(softDeletePlugin);
skillSchema.plugin(mongoosePaginate);
skillSchema.plugin(aggregatePaginate);
skillSchema.plugin(userOwnedPlugin);
skillSchema.plugin(jobProfilePlugin);

export const Skill = model<ISkillDoc, ISkillModel>(modelNames.SKILL, skillSchema);
