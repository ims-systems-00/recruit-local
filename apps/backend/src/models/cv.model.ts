import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";
import { baseSchemaOptions } from "./options/schema.options";
import { IBaseDoc } from "./interfaces/base.interface";
import { IExperience, IEducation, ISkill, IInterest, CV_STATUS_ENUM } from "@inrm/types";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";

// todo - reuse interface
export interface CVInput extends IUserOwnedInput, JobProfileInput {
  title: string;
  summary?: string;
  experience?: IExperience[];
  education?: IEducation[];
  skills?: ISkill[];
  interests?: IInterest[];
  name?: string;
  imageSrc?: string;
  imageStorage?: AwsStorageTemplate;
  email?: string;
  phone?: string;
  address?: string;
  templateId?: string;
  colorProfile?: string;
  status: CV_STATUS_ENUM;
}

export interface ICVDoc extends CVInput, ISoftDeleteDoc, IBaseDoc {}

interface ICVModel
  extends Model<ICVDoc>,
    ISoftDeleteModel<ICVDoc>,
    PaginateModel<ICVDoc>,
    AggregatePaginateModel<ICVDoc> {}

const skillSchema = new Schema<ISkill>({
  name: { type: String, required: true },
  proficiencyLevel: { type: String },
  description: { type: String },
  // endorsements: { type: Number, default: 0 },
  // yearsOfExperience: { type: Number },
});

const educationSchema = new Schema<IEducation>({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String },
  grade: { type: String },
});

const experienceSchema = new Schema<IExperience>({
  company: { type: String, required: true },
  location: { type: String },
  workMode: { type: String },
  employmentType: { type: String },
  position: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String },
});

const interestSchema = new Schema<IInterest>({
  name: { type: String, required: true },
  description: { type: String },
});

// --- Main Schema ---

const cvSchema = new Schema<ICVDoc>(
  {
    title: { type: String, required: true },
    summary: { type: String },

    // Using Sub-Schemas instead of generic Array
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    skills: { type: [skillSchema], default: [] },
    interests: { type: [interestSchema], default: [] },

    name: { type: String },
    imageSrc: { type: String },
    imageStorage: { type: awsStorageTemplateMongooseDefinition },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    templateId: { type: String },
    colorProfile: { type: String },
    status: {
      type: String,
      enum: Object.values(CV_STATUS_ENUM),
      default: CV_STATUS_ENUM.DRAFT,
    },
  },
  {
    ...baseSchemaOptions,
  }
);

// --- Plugins ---

cvSchema.plugin(softDeletePlugin);
cvSchema.plugin(mongoosePaginate);
cvSchema.plugin(aggregatePaginate);
cvSchema.plugin(userOwnedPlugin);
cvSchema.plugin(jobProfilePlugin);

export const CV = model<ICVDoc, ICVModel>(modelNames.CV, cvSchema);
