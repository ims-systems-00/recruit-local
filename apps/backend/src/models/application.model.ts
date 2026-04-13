import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";
import { boardablePlugin, IBoardableInput, IBoardableModel } from "./plugins/boardable.plugin";

export interface ApplicationInput extends JobProfileInput, IBoardableInput {
  jobId: Types.ObjectId;
  coverLetter?: string;
  resumeId?: Types.ObjectId;
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
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.FILE_MEDIA,
      default: null,
    },
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
applicationSchema.plugin(boardablePlugin, {
  parentModelName: modelNames.JOB,
  foreignKey: "jobId",
});

// --- Indexes ---
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ resumeId: 1 });

export const Application = model<IApplicationDoc, IApplicationModel>(modelNames.APPLICATION, applicationSchema);
