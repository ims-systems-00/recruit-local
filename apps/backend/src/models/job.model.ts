import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { boardSettingsSchema, IBoardSettings } from "./schema/board-settings.schema";
import { IBaseDoc } from "./interfaces/base.interface";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { automaticReferencePlugin, IAutomaticReferenceDoc } from "./plugins/automatic-reference.plugin";

import {
  WORKPLACE_ENUMS,
  WORKING_DAYS_ENUMS,
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  REQUIRED_DOCUMENTS_ENUMS,
  WorkingHours,
  JOBS_STATUS_ENUMS,
  QUERY_TYPE_ENUMS,
} from "@rl/types";

export interface IAdditionalQuery {
  question: string;
  type: QUERY_TYPE_ENUMS;
  options?: string[];
  isRequired: boolean;
  expectedAnswer?: string;
}

export interface IJobInput extends TenantInput {
  title?: string;
  description?: string; // about
  responsibility?: string;
  // contact info
  email?: string;
  number?: string;
  aboutUs?: string;

  endDate?: Date;
  yearOfExperience?: number;
  attachmentIds?: Types.ObjectId[];
  category?: string;
  vacancy?: number;
  location?: string;
  locationAdditionalInfo?: string;
  workplace?: WORKPLACE_ENUMS;
  workingDays?: number;
  weekends?: WORKING_DAYS_ENUMS[];
  workingHours?: WorkingHours;
  employmentType?: EMPLOYMENT_TYPE;
  salary?: number;
  period?: PERIOD_ENUMS;
  requiredDocuments?: REQUIRED_DOCUMENTS_ENUMS[];
  status: JOBS_STATUS_ENUMS;
  formId?: Types.ObjectId;
  additionalQueries?: IAdditionalQuery[];
}

export interface IJobDoc
  extends IJobInput,
    ITenantDoc,
    ISoftDeleteDoc,
    IBaseDoc,
    IBoardSettings,
    IAutomaticReferenceDoc {
  keywords?: string[];
  totalApplications?: number;
}

export interface IJobModel
  extends Model<IJobDoc>,
    ISoftDeleteModel<IJobDoc>,
    PaginateModel<IJobDoc>,
    AggregatePaginateModel<IJobDoc>,
    ITenantModel<IJobDoc> {}

const additionalQuerySchema = new Schema<IAdditionalQuery>(
  {
    question: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(QUERY_TYPE_ENUMS),
      required: true,
    },
    options: [{ type: String }],
    isRequired: { type: Boolean, default: false },
    expectedAnswer: { type: String },
  },
  { _id: true }
);

const jobSchema = new Schema<IJobDoc>(
  {
    title: { type: String },
    description: { type: String },
    email: { type: String },
    number: { type: String },
    aboutUs: { type: String },
    endDate: { type: Date },
    yearOfExperience: { type: Number },
    responsibility: { type: String },

    attachmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: modelNames.FILE_MEDIA,
      },
    ],

    category: { type: String },
    vacancy: { type: Number },
    location: { type: String },
    locationAdditionalInfo: { type: String },
    workplace: { type: String, enum: Object.values(WORKPLACE_ENUMS) },
    workingDays: { type: Number },
    weekends: { type: [String], enum: Object.values(WORKING_DAYS_ENUMS) },
    workingHours: {
      startTime: { type: String },
      endTime: { type: String },
    },
    employmentType: { type: String, enum: Object.values(EMPLOYMENT_TYPE) },
    salary: { type: Number },
    period: { type: String, enum: Object.values(PERIOD_ENUMS) },

    requiredDocuments: { type: [String], enum: Object.values(REQUIRED_DOCUMENTS_ENUMS) },
    status: { type: String, enum: Object.values(JOBS_STATUS_ENUMS), default: JOBS_STATUS_ENUMS.DRAFT },
    formId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.FORM,
    },
    keywords: { type: [String], default: [] },
    totalApplications: { type: Number, default: 0 },
    additionalQueries: [additionalQuerySchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

jobSchema.add(boardSettingsSchema);
jobSchema.plugin(softDeletePlugin);
jobSchema.plugin(mongoosePaginate);
jobSchema.plugin(aggregatePaginate);
jobSchema.plugin(tenantDataPlugin);
jobSchema.plugin(automaticReferencePlugin({ model: modelNames.JOB, referencePrefix: "JOB" }));

export const Job = model<IJobDoc, IJobModel>(modelNames.JOB, jobSchema);
