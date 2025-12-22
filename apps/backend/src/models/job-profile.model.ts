import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { VISIBILITY, Experience, Education, Certification, Skill, language } from "@inrm/types";

export interface JobProfileInput {
  userId: Schema.Types.ObjectId;
  headline?: string;
  summary?: string;
  experiences?: Experience[];
  educations?: Education[];
  skills?: Skill[];
  certifications?: Certification[];
  languages?: language[];
  interests?: string[];
  keywords?: string[];
}

export interface IJobProfileDoc extends JobProfileInput, ISoftDeleteDoc, Document {
  id: string;
  visibility: VISIBILITY;
  createdAt: Date;
  updatedAt: Date;
}

interface IJobProfileModel
  extends Model<IJobProfileDoc>,
    ISoftDeleteModel<IJobProfileDoc>,
    PaginateModel<IJobProfileDoc>,
    AggregatePaginateModel<IJobProfileDoc> {}

const jobProfileSchema = new Schema<IJobProfileDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
    },
    headline: {
      type: String,
    },
    summary: {
      type: String,
    },
    experiences: [
      {
        company: String,
        position: String,
        location: String,
        workMode: String,
        employmentType: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],
    educations: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startDate: Date,
        endDate: Date,
        description: String,
        gpa: String,
      },
    ],
    skills: [
      {
        name: String,
        proficiencyLevel: String,
        description: String,
      },
    ],
    certifications: [
      {
        name: String,
        issuingOrganization: String,
        issueDate: Date,
      },
    ],
    languages: [
      {
        name: String,
        proficiencyLevel: String,
      },
    ],
    interests: [
      {
        type: String,
      },
    ],
    keywords: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Apply plugins
jobProfileSchema.plugin(softDeletePlugin);
jobProfileSchema.plugin(mongoosePaginate);
jobProfileSchema.plugin(aggregatePaginate);

// Create and export the model
export const JobProfileModel = model<IJobProfileDoc, IJobProfileModel>(modelNames.JOB_PROFILE, jobProfileSchema);
