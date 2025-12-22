import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwned } from "./plugins/userOwned.plugin";

export interface SkillInput extends IUserOwned {
  name: string;
  proficiencyLevel?: string;
  description?: string;
}

export interface ISkillDoc extends SkillInput, ISoftDeleteDoc, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

skillSchema.plugin(softDeletePlugin);
skillSchema.plugin(mongoosePaginate);
skillSchema.plugin(aggregatePaginate);
skillSchema.plugin(userOwnedPlugin);

export const SkillModel = model<ISkillDoc, ISkillModel>(modelNames.SKILL, skillSchema);
