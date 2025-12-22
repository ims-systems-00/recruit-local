import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwned } from "./plugins/userOwned.plugin";

export interface ExperienceInput extends IUserOwned {
  company: string;
  location?: string;
  workMode?: string;
  employmentType?: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

export interface IExperienceDoc extends ExperienceInput, ISoftDeleteDoc, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

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

experienceSchema.plugin(softDeletePlugin);
experienceSchema.plugin(mongoosePaginate);
experienceSchema.plugin(aggregatePaginate);
experienceSchema.plugin(userOwnedPlugin);

export const ExperienceModel = model<IExperienceDoc, IExperienceModel>(modelNames.EXPERIENCE, experienceSchema);
