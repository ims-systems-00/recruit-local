import { Schema, model, Document, Model, Types } from "mongoose";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

export interface FormInput extends TenantInput {
  collectionName: (typeof modelNames)[keyof typeof modelNames];
  collectionId: Types.ObjectId;
  title: string;
  description?: string;
  theme?: string;
}

export interface IFormDoc extends FormInput, ITenantDoc, ISoftDeleteDoc, Document {
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: Types.ObjectId;
  submissionCount?: number;
  collaboration?: Types.ObjectId[];
}

interface IFormModel extends Model<IFormDoc>, ITenantModel<IFormDoc>, ISoftDeleteModel<IFormDoc> {}

// Create the Form schema
const schema = new Schema<IFormDoc>(
  {
    collectionName: {
      type: String,
      required: true,
      enum: Object.values(modelNames),
    },
    collectionId: { type: Schema.Types.ObjectId, required: true, refPath: "collectionName" },
    title: { type: String, required: true },
    description: { type: String },
    theme: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: modelNames.USER },
    submissionCount: { type: Number, default: 0 },
    collaboration: [{ type: Schema.Types.ObjectId, ref: modelNames.USER }],
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
