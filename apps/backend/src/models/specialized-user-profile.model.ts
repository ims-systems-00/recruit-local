import { Schema, model, Document, Model } from "mongoose";
import { User } from "./user.model";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { tenantDataPlugin, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { AUDITOR_AVAILABILITY_ENUMS, modelNames } from "./constants";

// Type Definitions
interface IQualification {
  name: string;
  institution?: string;
  dateObtained?: Date;
  validUntil?: Date;
}

interface IIAFCode {
  code: string;
  description?: string;
}

interface IAreaOfExpertise {
  field: string;
  experienceYears?: number;
}

interface ICertification {
  name: string;
  institution?: string;
  dateObtained?: Date;
}

// Auditor Qualifications Schema
const AuditorQualificationsSchema = new Schema({
  qualifications: [
    {
      name: {
        type: String,
        required: true,
      },
      institution: String,
      dateObtained: Date,
      validUntil: Date,
    },
  ],
  availability: {
    type: [String],
    enum: Object.values(AUDITOR_AVAILABILITY_ENUMS),
    required: true,
  },
  iafCodes: [
    {
      code: {
        type: String,
        required: true,
      },
      description: String,
    },
  ],
});

// Consultant Details Schema
const ConsultantDetailsSchema = new Schema({
  areasOfExpertise: [
    {
      field: {
        type: String,
        required: true,
      },
      experienceYears: {
        type: Number,
        default: 0,
      },
    },
  ],
  certifications: [
    {
      name: String,
      institution: String,
      dateObtained: Date,
    },
  ],
  clientsServed: { type: Number, default: 0 },
});

// User-Specific Details Schema
const UserSpecificDetailsSchema = new Schema({
  languagesSpoken: [String],
  professionalTitle: String,
  yearsInIndustry: {
    type: Number,
    default: 0,
  },
});

// Interface for the input data
export interface SpecializedUserProfileInput {
  userId: Schema.Types.ObjectId;
  auditorQualifications?: {
    qualifications: IQualification[];
    availability: AUDITOR_AVAILABILITY_ENUMS[];
    iafCodes: IIAFCode[];
  };
  consultantDetails?: {
    areasOfExpertise: IAreaOfExpertise[];
    certifications?: ICertification[];
    clientsServed?: number;
  };
  userSpecificDetails?: {
    languagesSpoken?: string[];
    professionalTitle?: string;
    yearsInIndustry?: number;
  };
}

// Document Interface extending all necessary properties
export interface ISpecializedUserProfileDoc extends SpecializedUserProfileInput, ISoftDeleteDoc, ITenantDoc, Document {
  createdAt?: Date;
  updatedAt?: Date;
}

// Model Interface extending custom Mongoose model interfaces
export interface ISpecializedUserProfileModel
  extends Model<ISpecializedUserProfileDoc>,
    ISoftDeleteModel<ISpecializedUserProfileDoc>,
    ITenantModel<ISpecializedUserProfileDoc> {}

// Specialized User Profile Schema
const specializedUserProfileSchema = new Schema<ISpecializedUserProfileDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
    },
    auditorQualifications: AuditorQualificationsSchema,
    consultantDetails: ConsultantDetailsSchema,
    userSpecificDetails: UserSpecificDetailsSchema,
  },
  {
    timestamps: true,
  }
);

// Apply plugins
specializedUserProfileSchema.plugin(softDeletePlugin);
specializedUserProfileSchema.plugin(tenantDataPlugin);

// Model creation
const SpecializedUserProfile = model<ISpecializedUserProfileDoc, ISpecializedUserProfileModel>(
  modelNames.SPECIALIZED_USER_PROFILE,
  specializedUserProfileSchema
);

export { SpecializedUserProfile };
