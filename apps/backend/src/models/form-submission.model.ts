import { Document, model, Model, Schema } from "mongoose";
import { Form } from "./form.model";
import { User } from "./user.model";
import { ISoftDeleteDoc, ISoftDeleteModel, softDeletePlugin } from "./plugins/soft-delete.plugin";
import { ITenantDoc, ITenantModel, tenantDataPlugin, TenantInput } from "./plugins/tenant-data.plugin";
import { automaticReferencePlugin } from "./plugins/automatic-reference.plugin";
import { modelNames } from "./constants";

export interface FormSubmissionInput extends TenantInput {
  formId: Schema.Types.ObjectId;
  submittedBy?: Schema.Types.ObjectId;
  collectionName: string; // will have to decide the enum values. maybe audits tenants and users
  collectionDocument: Schema.Types.ObjectId;
}

export interface IFormSubmissionDoc extends FormSubmissionInput, ITenantDoc, ISoftDeleteDoc, Document {
  createdAt?: Date;
  updatedAt?: Date;
}

interface IFormSubmissionModel
  extends Model<IFormSubmissionDoc>,
    ITenantModel<IFormSubmissionDoc>,
    ISoftDeleteModel<IFormSubmissionDoc> {}

// Create the FormSubmission schema
const schema = new Schema<IFormSubmissionDoc>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: Form.modelName,
      required: true,
    },
    collectionName: {
      type: String,
    },
    collectionDocument: {
      type: Schema.Types.ObjectId,
      refPath: "collectionName",
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
// Deine indexes
schema.index({ formId: 1, collectionName: 1, collectionDocument: 1, submittedBy: 1 }, { unique: true, sparse: true });
// Apply plugins
schema.plugin(tenantDataPlugin);
schema.plugin(softDeletePlugin);
schema.plugin(automaticReferencePlugin({ model: modelNames.FORM_SUBMISSION, referencePrefix: "SUB" }));

// Create and export the model
const FormSubmission = model<IFormSubmissionDoc, IFormSubmissionModel>(modelNames.FORM_SUBMISSION, schema);
export { FormSubmission };
