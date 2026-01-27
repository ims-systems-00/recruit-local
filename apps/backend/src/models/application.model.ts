import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";
import { boardablePlugin, IBoardableInput, IBoardableModel } from "./plugins/boardable.plugin";

export interface ApplicationInput extends JobProfileInput, IBoardableInput {
  jobId: Types.ObjectId;
  coverLetter?: string;
  resumeSrc?: string;
  resumeStorage?: AwsStorageTemplate;
  feedback?: string;
  appliedAt?: Date;
}

export interface IApplicationDoc extends ApplicationInput, ISoftDeleteDoc, IBaseDoc {}

interface IApplicationModel
  extends Model<IApplicationDoc>,
    ISoftDeleteModel<IApplicationDoc>,
    PaginateModel<IApplicationDoc>,
    AggregatePaginateModel<IApplicationDoc>,
    IBoardableModel<IApplicationDoc> {}

const applicationSchema = new Schema<IApplicationDoc>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.JOB,
      required: true,
      index: true,
    },
    coverLetter: { type: String },
    resumeSrc: { type: String },
    resumeStorage: { type: awsStorageTemplateMongooseDefinition },
    feedback: { type: String },
    appliedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// --- Plugins ---
applicationSchema.plugin(softDeletePlugin);
applicationSchema.plugin(mongoosePaginate);
applicationSchema.plugin(aggregatePaginate);
applicationSchema.plugin(jobProfilePlugin);
applicationSchema.plugin(boardablePlugin);

// --- Indexes ---
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

export const Application = model<IApplicationDoc, IApplicationModel>(modelNames.APPLICATION, applicationSchema);
