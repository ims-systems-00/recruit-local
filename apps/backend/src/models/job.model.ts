import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { baseSchemaOptions } from "./options/schema.options";
import { IBaseDoc } from "./interfaces/base.interface";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import {
  WORKPLACE_ENUMS,
  WORKING_DAYS_ENUMS,
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  REQUIRED_DOCUMENTS_ENUMS,
  WorkingHours,
  Education,
  Skill,
  Salary,
} from "@rl/types";

export interface IJobInput extends TenantInput {
  title?: string;
  bannerSrc?: string;
  bannerStorage?: AwsStorageTemplate;
  description?: string;
  email?: string;
  number?: string;
  aboutUs?: string;
  startDate?: Date;
  endDate?: Date;
  responsibility?: string;
  attachmentsSrc?: string[];
  attachmentsStorage?: AwsStorageTemplate[];
  category?: string;
  vacancy?: number;
  location?: string;
  workplace?: WORKPLACE_ENUMS;
  workingDays?: WORKING_DAYS_ENUMS[];
  weekends?: WORKING_DAYS_ENUMS[];
  workingHours?: WorkingHours;
  employmentType?: EMPLOYMENT_TYPE;
  salary?: Salary;
  period?: PERIOD_ENUMS;
  minEducationalQualification?: Education;
  requiredDocuments?: REQUIRED_DOCUMENTS_ENUMS[];
  skills?: Skill[];
}

export interface IJobDoc extends IJobInput, ITenantDoc, ISoftDeleteDoc, IBaseDoc {
  status?: string;
  keywords?: string[]; // todo: keywords should be generated
}

export interface IJobModel
  extends Model<IJobDoc>,
    ISoftDeleteModel<IJobDoc>,
    PaginateModel<IJobDoc>,
    AggregatePaginateModel<IJobDoc>,
    ITenantModel<IJobDoc> {}

const jobSchema = new Schema<IJobDoc>(
  {
    title: { type: String },
    bannerSrc: { type: String },
    bannerStorage: { type: Schema.Types.Mixed, default: awsStorageTemplateMongooseDefinition },
    description: { type: String },
    email: { type: String },
    number: { type: String },
    aboutUs: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    responsibility: { type: String },
    attachmentsSrc: { type: [String], default: [] },
    attachmentsStorage: {
      type: [awsStorageTemplateMongooseDefinition],
      default: [],
    },
    category: { type: String },
    vacancy: { type: Number },
    location: { type: String },
    workplace: { type: String, enum: Object.values(WORKPLACE_ENUMS) },
    workingDays: { type: [String], enum: Object.values(WORKING_DAYS_ENUMS) },
    weekends: { type: [String], enum: Object.values(WORKING_DAYS_ENUMS) },
    workingHours: {
      startTime: { type: String },
      endTime: { type: String },
    },
    employmentType: { type: String, enum: Object.values(EMPLOYMENT_TYPE) },
    salary: {
      mode: { type: String, required: true },
      amount: { type: Number },
      min: { type: Number },
      max: { type: Number },
    },
    period: { type: String, enum: Object.values(PERIOD_ENUMS) },
    minEducationalQualification: {
      degree: { type: String },
      fieldOfStudy: { type: String },
      gpa: { type: String },
    },
    requiredDocuments: { type: [String], enum: Object.values(REQUIRED_DOCUMENTS_ENUMS) },
    skills: {
      type: [
        {
          name: { type: String },
          years: { type: Number },
        },
      ],
      default: [],
    },
    status: { type: String },
    keywords: { type: [String], default: [] },
  },
  {
    ...baseSchemaOptions,
    toJSON: {
      virtuals: false,
      transform: function (doc, ret) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ret.skills?.forEach((skill: any) => {
          skill.id = skill._id;
          delete skill._id;
        });
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

jobSchema.plugin(softDeletePlugin);
jobSchema.plugin(mongoosePaginate);
jobSchema.plugin(aggregatePaginate);
jobSchema.plugin(tenantDataPlugin);

export const Job = model<IJobDoc, IJobModel>(modelNames.JOB, jobSchema);
