import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

export interface IUserInterestSurveyInput {
  userId: Types.ObjectId;
  interest: string;
  isSkipped?: boolean;
}

export interface IUserInterestSurveyDoc extends IUserInterestSurveyInput, ISoftDeleteDoc, Document {
  createdAt: Date;
  updatedAt: Date;
}

interface IUserInterestSurveyModel
  extends Model<IUserInterestSurveyDoc>,
    ISoftDeleteModel<IUserInterestSurveyDoc>,
    PaginateModel<IUserInterestSurveyDoc>,
    AggregatePaginateModel<IUserInterestSurveyDoc> {}

const userInterestSurveySchema = new Schema<IUserInterestSurveyDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
      unique: true,
    },
    interest: {
      type: String,
      required: true,
    },
    isSkipped: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userInterestSurveySchema.plugin(softDeletePlugin);
userInterestSurveySchema.plugin(mongoosePaginate);
userInterestSurveySchema.plugin(aggregatePaginate);

export const UserInterestSurvey = model<IUserInterestSurveyDoc, IUserInterestSurveyModel>(
  "UserInterestSurvey",
  userInterestSurveySchema
);
