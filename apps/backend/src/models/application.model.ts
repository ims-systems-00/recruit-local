import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { baseSchemaOptions } from "./options/schema.options";
import { IBaseDoc } from "./interfaces/base.interface";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { APPLICATION_STATUS_ENUM } from "@rl/types";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";

export interface ApplicationInput extends JobProfileInput {
  jobId: Types.ObjectId;
  coverLetter?: string;
  resumeSrc?: string;
  resumeStorage?: AwsStorageTemplate;
  feedback?: string;
  appliedAt?: Date;
}

export interface IApplicationDoc extends ApplicationInput, ISoftDeleteDoc, IBaseDoc {
  status?: APPLICATION_STATUS_ENUM;
}

interface IApplicationModel
  extends Model<IApplicationDoc>,
    ISoftDeleteModel<IApplicationDoc>,
    PaginateModel<IApplicationDoc>,
    AggregatePaginateModel<IApplicationDoc> {}

const applicationSchema = new Schema<IApplicationDoc>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.JOB,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS_ENUM),
      default: APPLICATION_STATUS_ENUM.APPLIED,
      index: true,
    },
    coverLetter: { type: String },
    resumeSrc: { type: String },
    resumeStorage: { type: awsStorageTemplateMongooseDefinition },
    feedback: { type: String },
    appliedAt: { type: Date, default: Date.now },
  },
  {
    ...baseSchemaOptions,
    timestamps: true,
  }
);

// --- Plugins ---
applicationSchema.plugin(softDeletePlugin);
applicationSchema.plugin(mongoosePaginate);
applicationSchema.plugin(aggregatePaginate);
applicationSchema.plugin(jobProfilePlugin);

export const Application = model<IApplicationDoc, IApplicationModel>(modelNames.APPLICATION, applicationSchema);
