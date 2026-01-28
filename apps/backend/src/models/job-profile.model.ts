import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { modelNames } from "./constants";
import { VISIBILITY, language } from "@rl/types";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";
import { baseSchemaOptions } from "./options/schema.options";
import { IBaseDoc } from "./interfaces/base.interface";

export enum STATUS_ENUM {
  VERIFIED = "verified",
  UNVERIFIED = "unverified",
  PENDING = "pending",
  REJECTED = "rejected",
}

export interface JobProfileInput extends IUserOwnedInput {
  headline?: string;
  summary?: string;
  keywords?: string[];
  languages?: language[];
  kycDocumentUrl?: string;
  kycDocumentStorage?: AwsStorageTemplate;
}

export interface IJobProfileDoc extends JobProfileInput, ISoftDeleteDoc, IBaseDoc {
  visibility: VISIBILITY;
  status: STATUS_ENUM;
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
    ...baseSchemaOptions,
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
    status: {
      type: String,
      enum: Object.values(STATUS_ENUM),
      default: STATUS_ENUM.PENDING,
    },
    kycDocumentUrl: {
      type: String,
    },
    kycDocumentStorage: {
      type: Schema.Types.Mixed,
      default: awsStorageTemplateMongooseDefinition,
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
jobProfileSchema.plugin(userOwnedPlugin);

// Create and export the model
export const JobProfile = model<IJobProfileDoc, IJobProfileModel>(modelNames.JOB_PROFILE, jobProfileSchema);
