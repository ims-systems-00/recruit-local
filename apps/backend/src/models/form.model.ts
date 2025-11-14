import { Schema, model, Document, Model } from "mongoose";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { FORM_STATUS_ENUMS, FORM_USAGES_TYPE_ENUMS, TENANT_WITH_STANDARD_ENUMS, modelNames } from "./constants";
import { User } from "./user.model";

export interface FormInput extends TenantInput {
  title: string;
  description?: string;
  status?: FORM_STATUS_ENUMS;
  theme?: string;
  usagesType?: FORM_USAGES_TYPE_ENUMS;
  availableForTenantWithStandards?: TENANT_WITH_STANDARD_ENUMS[];
}

export interface IFormDoc extends FormInput, ITenantDoc, ISoftDeleteDoc, Document {
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  submissionCount?: number;
  collaboration?: Schema.Types.ObjectId[];
}

interface IFormModel extends Model<IFormDoc>, ITenantModel<IFormDoc>, ISoftDeleteModel<IFormDoc> {}

// Create the Form schema
const schema = new Schema<IFormDoc>(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: Object.values(FORM_STATUS_ENUMS), default: FORM_STATUS_ENUMS.DRAFT },
    theme: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: User.modelName },
    submissionCount: { type: Number, default: 0 },
    collaboration: [{ type: Schema.Types.ObjectId, ref: User.modelName }],
    usagesType: { type: String, enum: Object.values(FORM_USAGES_TYPE_ENUMS) },
    availableForTenantWithStandards: [{ type: String, enum: Object.values(TENANT_WITH_STANDARD_ENUMS) }],
  },
  {
    timestamps: true,
  }
);

// Apply plugins
schema.plugin(tenantDataPlugin);
schema.plugin(softDeletePlugin);

// Create and export the model
const Form = model<IFormDoc, IFormModel>(modelNames.FORM, schema);
export { Form };
