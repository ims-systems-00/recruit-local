import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import {
  VISIBILITY,
  language,
  JOB_PROFILE_STATUS_ENUM,
  ONBOARDING_STEP_ENUMS,
  StoredCompletion,
  IValueScoreAnswer,
  JOB_SKILL_LEVEL_ENUMS,
} from "@rl/types";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";
import { IBaseDoc } from "./interfaces/base.interface";
import { completionMongooseDefinition } from "./templates/completion.template";
import { geoPointSchema, IGeoPoint } from "./schema/geo-point.schema";

export interface IValueScore {
  value: Types.ObjectId;
  score: number;
  feedback?: string;
  answers: IValueScoreAnswer[];
  evaluatedAt: Date;
}

/**
 * One of a profile's skills: a skill catalogue entry and the candidate's level
 * in it. The same catalogue and level scale a job's skills use, so the two
 * compare directly.
 */
export interface IProfileSkill {
  skill: Types.ObjectId;
  level: JOB_SKILL_LEVEL_ENUMS;
}

export interface JobProfileInput extends IUserOwnedInput {
  name?: string;
  jobTitle?: Types.ObjectId[];
  industry?: Types.ObjectId[];
  workMode?: Types.ObjectId[];
  experienceLevel?: Types.ObjectId;
  address?: string;
  email?: string;
  contactNumber?: string;
  summary?: string;
  portfolioUrl?: string;
  keywords?: string[];
  languages?: language[];
  status: JOB_PROFILE_STATUS_ENUM;
  skills?: IProfileSkill[];
  interests?: string;
  values?: Types.ObjectId[];
  valueScores?: IValueScore[];
  onboardingStep?: ONBOARDING_STEP_ENUMS;
  profileImageId?: Types.ObjectId;
  coverPhotoId?: Types.ObjectId;
}

export interface IJobProfileDoc extends JobProfileInput, ISoftDeleteDoc, IBaseDoc {
  visibility: VISIBILITY;
  completion?: StoredCompletion;
  /**
   * Where `address` is on the map, set by the geocode queue. A candidate's home,
   * so it stays server-side: it is not in ALL_JOB_PROFILE_FIELDS, and the lookups
   * that join profiles into other responses project named fields only.
   */
  geo?: IGeoPoint;
  /** The `address` text `geo` was computed from, so an unchanged address is not geocoded again. */
  geocodedFrom?: string;
}

interface IJobProfileModel
  extends
    Model<IJobProfileDoc>,
    ISoftDeleteModel<IJobProfileDoc>,
    PaginateModel<IJobProfileDoc>,
    AggregatePaginateModel<IJobProfileDoc> {}

const languageSchema = new Schema({
  name: { type: String, required: true },
  proficiencyLevel: { type: String, required: true },
});

// One self-evaluated value. Written only by the evaluate endpoint — never by a
// client update — and replaced wholesale on a retake.
const valueScoreSchema = new Schema<IValueScore>(
  {
    value: { type: Schema.Types.ObjectId, ref: modelNames.VALUE, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String },
    answers: [
      {
        _id: false,
        key: { type: String, required: true },
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    evaluatedAt: { type: Date, required: true },
  },
  { _id: false }
);

// No `_id`: the validator keeps each catalogue skill to one row per profile, so
// `skill` already identifies the row.
const profileSkillSchema = new Schema<IProfileSkill>(
  {
    skill: { type: Schema.Types.ObjectId, ref: modelNames.SKILL_CATALOG, required: true },
    level: { type: String, enum: Object.values(JOB_SKILL_LEVEL_ENUMS), required: true },
  },
  { _id: false }
);

const jobProfileSchema = new Schema<IJobProfileDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
    },
    name: {
      type: String,
    },
    jobTitle: [{ type: Schema.Types.ObjectId, ref: modelNames.JOB_TITLE }],
    experienceLevel: { type: Schema.Types.ObjectId, ref: modelNames.EXPERIENCE_LEVEL },
    address: {
      type: String,
    },
    email: {
      type: String,
    },
    contactNumber: {
      type: String,
    },
    summary: {
      type: String,
    },
    portfolioUrl: {
      type: String,
    },
    keywords: [
      {
        type: String,
      },
    ],
    languages: [languageSchema],
    skills: [profileSkillSchema],
    interests: {
      type: String,
    },
    values: [{ type: Schema.Types.ObjectId, ref: modelNames.VALUE }],
    valueScores: { type: [valueScoreSchema], default: [] },
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY),
      default: VISIBILITY.PRIVATE,
    },
    status: {
      type: String,
      enum: Object.values(JOB_PROFILE_STATUS_ENUM),
      default: JOB_PROFILE_STATUS_ENUM.UNVERIFIED,
    },
    industry: [{ type: Schema.Types.ObjectId, ref: modelNames.INDUSTRY }],
    workMode: [{ type: Schema.Types.ObjectId, ref: modelNames.WORK_MODE }],
    profileImageId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.FILE_MEDIA,
    },
    coverPhotoId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.FILE_MEDIA,
    },
    onboardingStep: {
      type: String,
      enum: Object.values(ONBOARDING_STEP_ENUMS),
      default: ONBOARDING_STEP_ENUMS.NOT_STARTED,
    },
    completion: { type: completionMongooseDefinition, default: () => ({}) },
    // Written only by the geocode queue, from `address`.
    geo: { type: geoPointSchema },
    geocodedFrom: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
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

// Backs the keyword `$in` lookup used by the job fan-out (job -> matching profiles).
jobProfileSchema.index({ keywords: 1 });

// Backs "which profiles use this catalogue skill?" — the check before a skill is
// hard-deleted, and skill matching.
jobProfileSchema.index({ "skills.skill": 1 });

// Create and export the model
export const JobProfile = model<IJobProfileDoc, IJobProfileModel>(modelNames.JOB_PROFILE, jobProfileSchema);
