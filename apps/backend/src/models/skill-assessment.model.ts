import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { modelNames } from "./constants";
import { SKILL_ASSESSMENT_LEVEL_ENUM, SKILL_ASSESSMENT_CATEGORY_ENUM, QUESTION_TYPE_ENUM } from "@inrm/types";

export interface IQuestion {
  questionText: string;
  type: QUESTION_TYPE_ENUM;
  points: number;
  options?: string[];
  correctOptionIndex?: number;
  correctAnswerText?: string;
}

export interface ISkillAssessmentInput {
  title: string;
  description?: string;
  level: SKILL_ASSESSMENT_LEVEL_ENUM;
  category: SKILL_ASSESSMENT_CATEGORY_ENUM;
  questions: IQuestion[];
  attachment?: AwsStorageTemplate;
}

export interface ISkillAssessmentDoc extends ISkillAssessmentInput, Document, ISoftDeleteDoc {
  totalPoints?: number;
}

export interface ISkillAssessmentModel
  extends Model<ISkillAssessmentDoc>,
    ISoftDeleteModel<ISkillAssessmentDoc>,
    PaginateModel<ISkillAssessmentDoc>,
    AggregatePaginateModel<ISkillAssessmentDoc> {}

const SkillAssessmentSchema = new Schema<ISkillAssessmentDoc>(
  {
    title: { type: String, required: true },
    description: { type: String },
    level: {
      type: String,
      enum: Object.values(SKILL_ASSESSMENT_LEVEL_ENUM),
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(SKILL_ASSESSMENT_CATEGORY_ENUM),
      required: true,
    },
    questions: [
      {
        questionText: { type: String, required: true },
        type: {
          type: String,
          enum: Object.values(QUESTION_TYPE_ENUM),
          required: true,
        },
        points: { type: Number, required: true },
        options: [{ type: String }],
        correctOptionIndex: { type: Number },
        correctAnswerText: { type: String },
      },
    ],
    attachment: { type: awsStorageTemplateMongooseDefinition, required: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

SkillAssessmentSchema.virtual("totalPoints").get(function () {
  return this.questions.reduce((sum, question) => sum + (question.points || 0), 0);
});

SkillAssessmentSchema.plugin(softDeletePlugin);
SkillAssessmentSchema.plugin(mongoosePaginate);
SkillAssessmentSchema.plugin(aggregatePaginate);

export const SkillAssessment = model<ISkillAssessmentDoc, ISkillAssessmentModel>(
  modelNames.SKILL_ASSESSMENT,
  SkillAssessmentSchema
);
