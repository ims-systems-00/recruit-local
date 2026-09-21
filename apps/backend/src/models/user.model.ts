import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { passwordHashPlugin, PasswordHashInput, IPasswordHashDoc } from "./plugins/password-hash.plugin";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { EMAIL_VERIFICATION_STATUS_ENUMS, modelNames } from "./constants";
import {
  USER_ROLE_ENUMS,
  ACCOUNT_TYPE_ENUMS,
  KYC_STATUS,
  ANSWER_LENGTH,
  AccessibilityPreferences,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  SPEECH_RATE_MIN,
  SPEECH_RATE_MAX,
} from "@rl/types";
import { IJobProfileModel, JobProfileInput, IJobProfileDoc, jobProfilePlugin } from "./plugins/jobProfile.plugin";

/*
  @description UserInput interface
  @fields
  - role: system role of the user
  - type: tenant role of the user
*/
export interface UserInput extends PasswordHashInput, TenantInput, JobProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  role?: USER_ROLE_ENUMS;
  type?: ACCOUNT_TYPE_ENUMS;
}

// Define an interface for User document
export interface IUserDoc extends UserInput, IPasswordHashDoc, ITenantDoc, IJobProfileDoc, ISoftDeleteDoc, Document {
  fullName: string;
  emailVerificationStatus: EMAIL_VERIFICATION_STATUS_ENUMS;
  kycStatus?: KYC_STATUS;
  accessibility?: AccessibilityPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Define an interface for User model with static methods
interface IUserModel
  extends
    Model<IUserDoc>,
    ISoftDeleteModel<IUserDoc>,
    PaginateModel<IUserDoc>,
    AggregatePaginateModel<IUserDoc>,
    ITenantModel<IUserDoc>,
    IJobProfileModel<IUserDoc> {}

// Define the schema for User
const userSchema = new Schema<IUserDoc>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ACCOUNT_TYPE_ENUMS),
      default: null,
    },
    emailVerificationStatus: {
      type: String,
      enum: Object.values(EMAIL_VERIFICATION_STATUS_ENUMS),
      default: EMAIL_VERIFICATION_STATUS_ENUMS.UNVERIFIED,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLE_ENUMS),
      default: null,
    },
    kycStatus: {
      type: String,
      enum: Object.values(KYC_STATUS),
      default: KYC_STATUS.UNVERIFIED,
    },
    /**
     * How this person wants to be communicated with. See
     * `packages/types/src/accessibility.ts` for what each field means.
     *
     * Defaults are declared per field rather than on the subdocument, so a user
     * who has set one preference still gets the documented default for the
     * others — Mongoose applies a subdocument default only when the whole object
     * is absent, and a `$set` of one key would otherwise leave the rest undefined.
     */
    accessibility: {
      plainLanguage: { type: Boolean, default: DEFAULT_ACCESSIBILITY_PREFERENCES.plainLanguage },
      answerLength: {
        type: String,
        enum: Object.values(ANSWER_LENGTH),
        default: DEFAULT_ACCESSIBILITY_PREFERENCES.answerLength,
      },
      oneQuestionAtATime: { type: Boolean, default: DEFAULT_ACCESSIBILITY_PREFERENCES.oneQuestionAtATime },
      autoReadAloud: { type: Boolean, default: DEFAULT_ACCESSIBILITY_PREFERENCES.autoReadAloud },
      voice: { type: String, default: DEFAULT_ACCESSIBILITY_PREFERENCES.voice },
      speechRate: {
        type: Number,
        min: SPEECH_RATE_MIN,
        max: SPEECH_RATE_MAX,
        default: DEFAULT_ACCESSIBILITY_PREFERENCES.speechRate,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Define a virtual property for full name
userSchema.virtual("fullName").get(function (this: IUserDoc) {
  return `${this.firstName} ${this.lastName}`;
});

// Apply plugins
userSchema.plugin(tenantDataPlugin);
userSchema.plugin(passwordHashPlugin);
userSchema.plugin(softDeletePlugin);
userSchema.plugin(mongoosePaginate);
userSchema.plugin(aggregatePaginate);
userSchema.plugin(jobProfilePlugin);

// Define the User model
const User = model<IUserDoc, IUserModel>(modelNames.USER, userSchema);

export { User };
