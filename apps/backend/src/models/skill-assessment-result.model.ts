import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { modelNames } from "./constants";

export interface ISkillAssessmentResultInput {
  skillAssessmentId: Schema.Types.ObjectId;
  jobProfileId: Schema.Types.ObjectId;
  score: number;
  recommendations: string[];
}

export interface ISkillAssessmentResultDoc extends ISkillAssessmentResultInput, ISoftDeleteDoc, Document {
  awsStorageTemplate: AwsStorageTemplate;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISkillAssessmentResultModel
  extends Model<ISkillAssessmentResultDoc>,
    ISoftDeleteModel<ISkillAssessmentResultDoc>,
    PaginateModel<ISkillAssessmentResultDoc>,
    AggregatePaginateModel<ISkillAssessmentResultDoc> {}

const SkillAssessmentResultSchema = new Schema<ISkillAssessmentResultDoc>(
  {
    skillAssessmentId: { type: Schema.Types.ObjectId, required: true, ref: modelNames.SKILL_ASSESSMENT },
    jobProfileId: { type: Schema.Types.ObjectId, required: true, ref: modelNames.JOB_PROFILE },
    score: { type: Number, required: true },
    recommendations: { type: [String], required: true },
    awsStorageTemplate: { type: awsStorageTemplateMongooseDefinition, required: false },
    deleteMarker: {
      status: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
      dateScheduled: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

SkillAssessmentResultSchema.plugin(softDeletePlugin);
SkillAssessmentResultSchema.plugin(mongoosePaginate);
SkillAssessmentResultSchema.plugin(aggregatePaginate);

export const SkillAssessmentResult = model<ISkillAssessmentResultDoc, ISkillAssessmentResultModel>(
  modelNames.SKILL_ASSESSMENT_RESULT,
  SkillAssessmentResultSchema
);
