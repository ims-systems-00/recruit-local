import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { AwsStorageTemplate } from "./templates/aws-storage.template";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { TENANT_STATUS_ENUMS, TENANT_TYPE } from "@rl/types";
import { modelNames } from "./constants";

export interface TenantInput {
  name: string;
  description?: string;
  industry?: string;
  type?: TENANT_TYPE;
  size?: number;
  phone?: string;
  email?: string;
  logoSquareSrc?: string;
  logoSquareStorage?: AwsStorageTemplate;
  logoRectangleSrc?: string;
  logoRectangleStorage?: AwsStorageTemplate;
  officeAddress?: string;
  addressInMap?: string;
  status?: TENANT_STATUS_ENUMS;
  website?: string;
  linkedIn?: string;

  missionStatement?: string;
  visionStatement?: string;

  coreProducts?: string;
  coreServices?: string;
}

// Define an interface for Tenant document
export interface ITenantDoc extends TenantInput, ISoftDeleteDoc, Document {
  id: string;
  addressInMapLat?: number;
  addressInMapLng?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define an interface for Tenant model with static methods
export interface ITenantModel
  extends Model<ITenantDoc>,
    ISoftDeleteModel<ITenantDoc>,
    PaginateModel<ITenantDoc>,
    AggregatePaginateModel<ITenantDoc> {}

// Create the Tenant schema
const tenantSchema = new Schema<ITenantDoc>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    industry: {
      type: String,
    },
    size: {
      type: Number,
    },
    type: {
      type: String,
      enum: Object.values(TENANT_TYPE),
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    logoSquareSrc: {
      type: String,
    },
    logoSquareStorage: awsStorageTemplateMongooseDefinition,
    logoRectangleSrc: {
      type: String,
    },
    logoRectangleStorage: awsStorageTemplateMongooseDefinition,

    // Aligned with officeAddress in interface
    officeAddress: {
      type: String,
    },

    addressInMap: {
      type: String,
    },
    addressInMapLat: {
      type: Number,
    },
    addressInMapLng: {
      type: Number,
    },
    status: {
      type: String,
      enum: Object.values(TENANT_STATUS_ENUMS),
      default: TENANT_STATUS_ENUMS.ACTIVE,
    },
    website: {
      type: String,
    },
    linkedIn: {
      type: String,
    },
    missionStatement: {
      type: String,
    },
    visionStatement: {
      type: String,
    },
    coreProducts: {
      type: String,
    },
    coreServices: {
      type: String,
    },
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
tenantSchema.plugin(softDeletePlugin);
tenantSchema.plugin(mongoosePaginate);
tenantSchema.plugin(aggregatePaginate);

// Create and export the model
const Tenant = model<ITenantDoc, ITenantModel>(modelNames.TENANT, tenantSchema);
export { Tenant };
