import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwned } from "./plugins/userOwned.plugin";

export interface EducationInput extends IUserOwned {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  gpa?: string;
}
export interface IEducationDoc extends EducationInput, ISoftDeleteDoc, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    gpa: { type: String },
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

educationSchema.plugin(softDeletePlugin);
educationSchema.plugin(mongoosePaginate);
educationSchema.plugin(aggregatePaginate);
educationSchema.plugin(userOwnedPlugin);

export const EducationModel = model<IEducationDoc, IEducationModel>(modelNames.EDUCATION, educationSchema);
