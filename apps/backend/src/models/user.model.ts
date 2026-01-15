import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { passwordHashPlugin, PasswordHashInput, IPasswordHashDoc } from "./plugins/password-hash.plugin";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { EMAIL_VERIFICATION_STATUS_ENUMS, modelNames } from "./constants";
import { USER_ROLE_ENUMS, ACCOUNT_TYPE_ENUMS } from "@rl/types";

// Define an interface for User input
/*
@description UserInput interface
@fields
- role: system role of the user
- type: tenant role of the user
*/
export interface UserInput extends PasswordHashInput, TenantInput {
  firstName: string;
  lastName: string;
  email: string;
  profileImageSrc?: string;
  profileImageStorage?: AwsStorageTemplate;
  role?: USER_ROLE_ENUMS;
  type?: ACCOUNT_TYPE_ENUMS;
}

// Define an interface for User document
export interface IUserDoc extends UserInput, IPasswordHashDoc, ITenantDoc, ISoftDeleteDoc, Document {
  fullName: string;
  emailVerificationStatus: EMAIL_VERIFICATION_STATUS_ENUMS;
  createdAt: Date;
  updatedAt: Date;
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

// Define the User model
const User = model<IUserDoc, IUserModel>(modelNames.USER, userSchema);

export { User };
