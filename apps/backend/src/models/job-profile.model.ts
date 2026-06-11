import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { VISIBILITY, language, JOB_PROFILE_STATUS_ENUM, INDUSTRY_ENUMS, JOB_TITLE_ENUMS } from "@rl/types";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";
import { IBaseDoc } from "./interfaces/base.interface";

export interface JobProfileInput extends IUserOwnedInput {
  name?: string;
  jobTitle?: JOB_TITLE_ENUMS[];
  industry?: INDUSTRY_ENUMS[];
  address?: string;
  email?: string;
  contactNumber?: string;
  summary?: string;
  portfolioUrl?: string;
  keywords?: string[];
  languages?: language[];
  status: JOB_PROFILE_STATUS_ENUM;
  skills?: string;
  interests?: string;
  values?: Types.ObjectId[];
}

export interface IJobProfileDoc extends JobProfileInput, ISoftDeleteDoc, IBaseDoc {
  visibility: VISIBILITY;
}

interface IJobProfileModel
  extends Model<IJobProfileDoc>,
    ISoftDeleteModel<IJobProfileDoc>,
    PaginateModel<IJobProfileDoc>,
    AggregatePaginateModel<IJobProfileDoc> {}

const languageSchema = new Schema({
  name: { type: String, required: true },
  proficiencyLevel: { type: String, required: true },
});

const jobProfileSchema = new Schema<IJobProfileDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
    },
    name: {
      type: String,
    },
    jobTitle: {
      type: [String],
      enum: Object.values(JOB_TITLE_ENUMS),
    },
    address: {
      type: String,
    },
    email: {
      type: String,
    },
    contactNumber: {
      type: String,
    },
    summary: {
      type: String,
    },
    portfolioUrl: {
      type: String,
    },
    keywords: [
      {
        type: String,
      },
    ],
    languages: [languageSchema],
    skills: {
      type: String,
    },
    interests: {
      type: String,
    },
    values: [{ type: Schema.Types.ObjectId, ref: modelNames.VALUE }],
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY),
      default: VISIBILITY.PRIVATE,
    },
    status: {
      type: String,
      enum: Object.values(JOB_PROFILE_STATUS_ENUM),
      default: JOB_PROFILE_STATUS_ENUM.UNVERIFIED,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        return ret;
      },
    },
  }
);

// Apply plugins
jobProfileSchema.plugin(softDeletePlugin);
jobProfileSchema.plugin(mongoosePaginate);
jobProfileSchema.plugin(aggregatePaginate);
jobProfileSchema.plugin(userOwnedPlugin);

// Create and export the model
export const JobProfile = model<IJobProfileDoc, IJobProfileModel>(modelNames.JOB_PROFILE, jobProfileSchema);
