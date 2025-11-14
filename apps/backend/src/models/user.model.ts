import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { passwordHashPlugin, PasswordHashInput, IPasswordHashDoc } from "./plugins/password-hash.plugin";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { USER_TYPE_ENUMS, EMAIL_VERIFICATION_STATUS_ENUMS, modelNames } from "./constants";
import { YES_NO_ENUM, USER_ROLE_ENUMS } from "@inrm/types";

// Define an interface for User input
export interface UserInput extends PasswordHashInput, TenantInput {
  firstName: string;
  lastName: string;
  email: string;
  profileImageSrc?: string;
  profileImageStorage?: AwsStorageTemplate;
  type?: USER_TYPE_ENUMS;
  voIPNumber?: string;
  role?: USER_ROLE_ENUMS;
  isConsultant?: YES_NO_ENUM;
  isPrimaryUser?: YES_NO_ENUM;
}

// Define an interface for User document
export interface IUserDoc extends UserInput, IPasswordHashDoc, ITenantDoc, ISoftDeleteDoc, Document {
  fullName: string;
  emailVerificationStatus: EMAIL_VERIFICATION_STATUS_ENUMS;
}

// Define an interface for User model with static methods
interface IUserModel
  extends Model<IUserDoc>,
    ISoftDeleteModel<IUserDoc>,
    PaginateModel<IUserDoc>,
    AggregatePaginateModel<IUserDoc>,
    ITenantModel<IUserDoc> {}

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
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    profileImageSrc: {
      type: String,
    },
    profileImageStorage: {
      type: Schema.Types.Mixed,
      default: awsStorageTemplateMongooseDefinition,
    },
    type: {
      type: String,
      enum: Object.values(USER_TYPE_ENUMS),
      default: USER_TYPE_ENUMS.CUSTOMER,
    },
    emailVerificationStatus: {
      type: String,
      enum: Object.values(EMAIL_VERIFICATION_STATUS_ENUMS),
      default: EMAIL_VERIFICATION_STATUS_ENUMS.UNVERIFIED,
    },
    voIPNumber: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLE_ENUMS),
      default: null,
    },
    isConsultant: {
      type: String,
      enum: Object.values(YES_NO_ENUM),
      default: YES_NO_ENUM.NO,
    },
    isPrimaryUser: {
      type: String,
      enum: Object.values(YES_NO_ENUM),
      default: YES_NO_ENUM.NO,
    },
  },
  {
    timestamps: true,
  }
);

// Apply the password hash plugin
userSchema.plugin(tenantDataPlugin);
userSchema.plugin(passwordHashPlugin);
userSchema.plugin(softDeletePlugin);
userSchema.plugin(mongoosePaginate);
userSchema.plugin(aggregatePaginate);

// Define the User model
const User = model<IUserDoc, IUserModel>(modelNames.USER, userSchema);

export { User };
