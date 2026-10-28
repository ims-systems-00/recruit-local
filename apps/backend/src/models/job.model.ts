import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { boardSettingsSchema, IBoardSettings } from "./schema/board-settings.schema";
import { geoPointSchema, IGeoPoint } from "./schema/geo-point.schema";
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
  JOB_SKILL_LEVEL_ENUMS,
  JOB_SKILL_REQUIREMENT_ENUMS,
  JOB_VALUE_PRIORITY_ENUMS,
} from "@rl/types";

export interface IAdditionalQuery {
  /**
   * Assigned by Mongoose — the subdocument schema below is `{ _id: true }`, and
   * `Application.answers[].queryId` joins back to it.
   */
  _id?: Types.ObjectId;
  question: string;
  type: QUERY_TYPE_ENUMS;
  options?: string[];
  isRequired: boolean;
  expectedAnswer?: string;
}

/** One of a job's skills: a skill catalogue entry and how much of it the job asks for. */
export interface IJobSkill {
  skill: Types.ObjectId;
  level: JOB_SKILL_LEVEL_ENUMS;
  requirement: JOB_SKILL_REQUIREMENT_ENUMS;
}

/**
 * One of a job's values: a value catalogue entry and how much it matters. The
 * tier's weight is derived on read (`JOB_VALUE_PRIORITY_WEIGHT`), never stored.
 */
export interface IJobValue {
  value: Types.ObjectId;
  priority: JOB_VALUE_PRIORITY_ENUMS;
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
  skills?: IJobSkill[];
  values?: IJobValue[];
}

export interface IJobDoc
  extends IJobInput, ITenantDoc, ISoftDeleteDoc, IBaseDoc, IBoardSettings, IAutomaticReferenceDoc {
  keywords?: string[];
  /** 1536-d embedding backing $vectorSearch. Never returned to clients. */
  embedding?: number[];
  embeddingUpdatedAt?: Date;
  totalApplications?: number;
  /** Where `location` is on the map, set by the geocode queue. Not in ALL_JOB_FIELDS, so never returned to clients. */
  geo?: IGeoPoint;
  /** The `location` text `geo` was computed from, so an unchanged location is not geocoded again. */
  geocodedFrom?: string;
}

export interface IJobModel
  extends
    Model<IJobDoc>,
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

// No `_id`: the validator keeps each catalogue skill to one row per job, so
// `skill` already identifies the row.
const jobSkillSchema = new Schema<IJobSkill>(
  {
    skill: { type: Schema.Types.ObjectId, ref: modelNames.SKILL_CATALOG, required: true },
    level: { type: String, enum: Object.values(JOB_SKILL_LEVEL_ENUMS), required: true },
    requirement: { type: String, enum: Object.values(JOB_SKILL_REQUIREMENT_ENUMS), required: true },
  },
  { _id: false }
);

// No `_id`, for the same reason: each value appears at most once per job. Array
// order is display order only — `priority` is what ranks a value.
const jobValueSchema = new Schema<IJobValue>(
  {
    value: { type: Schema.Types.ObjectId, ref: modelNames.VALUE, required: true },
    priority: { type: String, enum: Object.values(JOB_VALUE_PRIORITY_ENUMS), required: true },
  },
  { _id: false }
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
    // select:false keeps ~1536 floats out of every find(). Aggregations bypass
    // select, so jobProjectionQuery() excludes it explicitly.
    embedding: { type: [Number], select: false, default: undefined },
    embeddingUpdatedAt: { type: Date },
    // Written only by the geocode queue, from `location`.
    geo: { type: geoPointSchema },
    geocodedFrom: { type: String },
    totalApplications: { type: Number, default: 0 },
    additionalQueries: [additionalQuerySchema],
    skills: [jobSkillSchema],
    values: [jobValueSchema],
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

// Backs the keyword `$in` lookup used by profile feed rebuild (profile -> matching jobs).
jobSchema.index({ keywords: 1 });

// Backs "which jobs use this catalogue skill?" — the check before a skill is
// hard-deleted, and skill matching.
jobSchema.index({ "skills.skill": 1 });

// The same for values: "which jobs use this value?", for value matching.
jobSchema.index({ "values.value": 1 });

// Back the default cursor page: the keyset walks (createdAt, _id) under whichever
// scope the security $match applies — status for candidates and the public list,
// tenantId for an employer.
jobSchema.index({ status: 1, createdAt: -1, _id: -1 });
jobSchema.index({ tenantId: 1, createdAt: -1, _id: -1 });

export const Job = model<IJobDoc, IJobModel>(modelNames.JOB, jobSchema);
