import { Schema, model, Document, Model } from "mongoose";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { Form } from "./form.model";
import { FormElement } from "./form-element.model";
import { FormSubmission } from "./form-submission.model";
import { modelNames } from "./constants";

export interface FormResponseInput extends TenantInput {
  formId: Schema.Types.ObjectId;
  formElementId: Schema.Types.ObjectId;
  responseValue: Record<string, unknown>;
  formSubmissionId: Schema.Types.ObjectId;
}

interface IFormResponseDoc extends FormResponseInput, ITenantDoc, ISoftDeleteDoc, Document {
  createdAt?: Date;
  updatedAt?: Date;
}

interface IFormResponseModel
  extends Model<IFormResponseDoc>,
    ITenantModel<IFormResponseDoc>,
    ISoftDeleteModel<IFormResponseDoc> {}

// Create the FormResponse schema
const schema = new Schema<IFormResponseDoc>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: Form.modelName,
      required: true,
    },
    formElementId: {
      type: Schema.Types.ObjectId,
      ref: FormElement.modelName,
      required: true,
    },
    responseValue: {
      type: Schema.Types.Mixed,
      required: false,
    },
    formSubmissionId: {
      type: Schema.Types.ObjectId,
      ref: FormSubmission.modelName,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply plugins
schema.plugin(tenantDataPlugin);
schema.plugin(softDeletePlugin);

// Create and export the model
const FormResponse = model<IFormResponseDoc, IFormResponseModel>(modelNames.FORM_RESPONSE, schema);
export { FormResponse };
