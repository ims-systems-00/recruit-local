import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { AwsStorageTemplate } from "./templates/aws-storage.template";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import {
  COMPLIANCE_STANDARDS_ENUMS,
  SALES_STAGES_ENUMS,
  YES_NO_ENUM,
  PORTFOLIO_TYPE,
  PRODUCER_TRADER_TYPE,
  TENANT_STATUS_ENUMS,
  COMPLIANCE_STANDARDS_TYPES_ENUMS,
  CDM_CATEGORY_ENUMS,
  IAF_CODE_ENUMS,
  RISK_LEVEL_ENUMS,
  FSC_STANDARD_TYPE,
  PEFC_STANDARD_TYPE,
  ISO_STANDARD_TYPE,
  VRA_STANDARD_TYPE,
} from "@inrm/types";
import { modelNames } from "./constants";

export interface TenantInput {
  name: string;
  industry?: string;
  size?: number;
  phone?: string;
  officeEmail?: string;
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
  salesStage?: SALES_STAGES_ENUMS;
  addressInMap?: string;
  revenueLocalCurrency?: number;
  localCurrency?: string;
  revenueUSD?: number;
  woodBasedTurnoverLocalCurrency?: number;
  woodBasedTurnoverUSD?: number;
  portfolioType?: PORTFOLIO_TYPE;
  producerTraderType?: PRODUCER_TRADER_TYPE;
  useOfOutsourcers?: YES_NO_ENUM;
  potentialDuplicates?: Schema.Types.ObjectId[];
  status?: TENANT_STATUS_ENUMS;
  complianceType?: COMPLIANCE_STANDARDS_TYPES_ENUMS;
  standards?: COMPLIANCE_STANDARDS_ENUMS[];
  cdmCategories?: CDM_CATEGORY_ENUMS[];
  iafCodes?: IAF_CODE_ENUMS[];
  riskLevel?: RISK_LEVEL_ENUMS;
  comment?: string;
  fullTimeEmployees?: number;
  subcontractorsUsed?: number;
  permanentSites?: number;
  temporarySites?: number;
  organisationalChanges?: string;
  hasScopeChanged?: YES_NO_ENUM;
  includedScopes?: string;
  reportingPeriodStartDate?: Date;
  reportingPeriodEndDate?: Date;
  hasCalculatorChanged?: YES_NO_ENUM;
  registeredAddress?: string;
  fscStandards?: FSC_STANDARD_TYPE[];
  pefcStandards?: PEFC_STANDARD_TYPE[];
  isoStandards?: ISO_STANDARD_TYPE[];
  vraStandards?: VRA_STANDARD_TYPE[];
}

// Define an interface for Tenant document
export interface ITenantDoc extends TenantInput, ISoftDeleteDoc, Document {
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
    industry: {
      type: String,
    },
    size: {
      type: Number,
    },
    phone: {
      type: String,
    },
    officeEmail: {
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
    salesStage: {
      type: String,
      enum: Object.values(SALES_STAGES_ENUMS),
    },
    complianceType: {
      type: String,
      enum: Object.values(COMPLIANCE_STANDARDS_TYPES_ENUMS),
    },
    standards: {
      type: [String],
      enum: Object.values(COMPLIANCE_STANDARDS_ENUMS),
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
    portfolioType: {
      type: String,
      enum: Object.values(PORTFOLIO_TYPE),
    },
    producerTraderType: {
      type: String,
      enum: Object.values(PRODUCER_TRADER_TYPE),
    },
    localCurrency: {
      type: String,
    },
    revenueLocalCurrency: {
      type: Number,
    },
    revenueUSD: {
      type: Number,
    },
    woodBasedTurnoverLocalCurrency: {
      type: Number,
    },
    woodBasedTurnoverUSD: {
      type: Number,
    },
    useOfOutsourcers: {
      type: String,
      enum: Object.values(YES_NO_ENUM),
    },
    potentialDuplicates: [
      {
        type: Schema.Types.ObjectId,
        ref: modelNames.TENANT,
        default: null,
      },
    ],
    status: {
      type: String,
      enum: Object.values(TENANT_STATUS_ENUMS),
      default: TENANT_STATUS_ENUMS.ACTIVE,
    },
    cdmCategories: {
      type: [String],
      enum: Object.values(CDM_CATEGORY_ENUMS),
    },
    iafCodes: {
      type: [String],
      enum: Object.values(IAF_CODE_ENUMS),
    },
    riskLevel: {
      type: String,
      enum: Object.values(RISK_LEVEL_ENUMS),
    },
    comment: {
      type: String,
    },
    fullTimeEmployees: {
      type: Number,
    },
    subcontractorsUsed: {
      type: Number,
    },
    permanentSites: {
      type: Number,
    },
    temporarySites: {
      type: Number,
    },
    organisationalChanges: {
      type: String,
    },
    hasScopeChanged: {
      type: String,
      enum: Object.values(YES_NO_ENUM),
    },
    includedScopes: {
      type: String,
    },
    reportingPeriodStartDate: {
      type: Date,
    },
    reportingPeriodEndDate: {
      type: Date,
    },
    hasCalculatorChanged: {
      type: String,
      enum: Object.values(YES_NO_ENUM),
    },
    registeredAddress: {
      type: String,
    },
    fscStandards: {
      type: [String],
      enum: Object.values(FSC_STANDARD_TYPE),
    },
    pefcStandards: {
      type: [String],
      enum: Object.values(PEFC_STANDARD_TYPE),
    },
    isoStandards: {
      type: [String],
      enum: Object.values(ISO_STANDARD_TYPE),
    },
    vraStandards: {
      type: [String],
      enum: Object.values(VRA_STANDARD_TYPE),
    },
  },
  {
    timestamps: true,
  }
);

// Apply plugins
tenantSchema.plugin(softDeletePlugin);
tenantSchema.plugin(mongoosePaginate);
tenantSchema.plugin(aggregatePaginate);

// Create and export the model
const Tenant = model<ITenantDoc, ITenantModel>(modelNames.TENANT, tenantSchema);
export { Tenant };
