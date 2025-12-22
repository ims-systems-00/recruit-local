import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { VISIBILITY, language } from "@inrm/types";

export interface JobProfileInput {
  userId: Schema.Types.ObjectId;
  headline?: string;
  summary?: string;
  keywords?: string[];
  languages?: language[];
}

export interface IJobProfileDoc extends JobProfileInput, ISoftDeleteDoc, Document {
  id: string;
  visibility: VISIBILITY;
  createdAt: Date;
  updatedAt: Date;
}

interface IJobProfileModel
  extends Model<IJobProfileDoc>,
    ISoftDeleteModel<IJobProfileDoc>,
    PaginateModel<IJobProfileDoc>,
    AggregatePaginateModel<IJobProfileDoc> {}

// 1. Define the sub-schema
const languageSchema = new Schema(
  {
    name: { type: String, required: true },
    proficiencyLevel: { type: String, required: true },
  },
  {
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

const jobProfileSchema = new Schema<IJobProfileDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
    },
    headline: {
      type: String,
    },
    summary: {
      type: String,
    },
    keywords: [
      {
        type: String,
      },
    ],
    languages: [languageSchema],
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY),
      default: VISIBILITY.PRIVATE,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Apply plugins
jobProfileSchema.plugin(softDeletePlugin);
jobProfileSchema.plugin(mongoosePaginate);
jobProfileSchema.plugin(aggregatePaginate);

// Create and export the model
export const JobProfile = model<IJobProfileDoc, IJobProfileModel>(modelNames.JOB_PROFILE, jobProfileSchema);
