import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";
import { boardablePlugin, IBoardableInput, IBoardableModel } from "./plugins/boardable.plugin";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { automaticReferencePlugin, IAutomaticReferenceDoc } from "./plugins/automatic-reference.plugin";

export interface IApplicationAnswer {
  queryId: Types.ObjectId;
  answer: string | string[] | number | boolean;
}

export interface ApplicationInput extends JobProfileInput, IBoardableInput, TenantInput {
  jobId: Types.ObjectId;
  coverLetter?: string;
  caseStudyId?: [Types.ObjectId];
  resumeId?: Types.ObjectId;
  feedback?: string;
  appliedAt?: Date;
  answers?: IApplicationAnswer[];
  portfolioUrl?: string;
  currentSalary?: number;
  expectedSalary?: number;
}

export interface IApplicationDoc
  extends ApplicationInput,
    ISoftDeleteDoc,
    IBaseDoc,
    ITenantDoc,
    IAutomaticReferenceDoc {}

interface IApplicationModel
  extends Model<IApplicationDoc>,
    ISoftDeleteModel<IApplicationDoc>,
    PaginateModel<IApplicationDoc>,
    AggregatePaginateModel<IApplicationDoc>,
    IBoardableModel<IApplicationDoc>,
    ITenantModel<IApplicationDoc> {}

const answerSchema = new Schema<IApplicationAnswer>(
  {
    queryId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    answer: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

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
    caseStudyId: [
      {
        type: Schema.Types.ObjectId,
        ref: modelNames.FILE_MEDIA,
      },
    ],
    answers: [answerSchema],
    feedback: { type: String },
    appliedAt: { type: Date, default: Date.now },
    portfolioUrl: { type: String },
    currentSalary: { type: Number },
    expectedSalary: { type: Number },
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
applicationSchema.plugin(tenantDataPlugin);

applicationSchema.plugin(
  automaticReferencePlugin({
    model: modelNames.APPLICATION,
    referencePrefix: "APP",
  })
);
// --- Indexes ---
applicationSchema.index({ tenantId: 1 });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ resumeId: 1 });
applicationSchema.index({ reference: 1 });

export const Application = model<IApplicationDoc, IApplicationModel>(modelNames.APPLICATION, applicationSchema);
