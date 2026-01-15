import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { AwsStorageTemplate } from "./templates/aws-storage.template";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { TENANT_STATUS_ENUMS } from "@rl/types";
import { modelNames } from "./constants";

export interface TenantInput {
  name: string;
  description?: string;
  industry?: string;
  size?: number;
  phone?: string;
  email?: string;
  logoSquareSrc?: string;
  logoSquareStorage?: AwsStorageTemplate;
  logoRectangleSrc?: string;
  logoRectangleStorage?: AwsStorageTemplate;
  addressBuilding?: string;
  addressStreet?: string;
  addressStreet2?: string;
  addressCity?: string;
  addressPostCode?: string;
  addressStateProvince?: string;
  addressCountry?: string;
  addressInMap?: string;
  status?: TENANT_STATUS_ENUMS;
  registeredAddress?: string;
  website?: string;
  linkedIn?: string;
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
    addressBuilding: {
      type: String,
    },
    addressStreet: {
      type: String,
    },
    addressStreet2: {
      type: String,
    },
    addressCity: {
      type: String,
    },
    addressPostCode: {
      type: String,
    },
    addressStateProvince: {
      type: String,
    },
    addressCountry: {
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
    registeredAddress: {
      type: String,
    },
    website: {
      type: String,
    },
    linkedIn: {
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
