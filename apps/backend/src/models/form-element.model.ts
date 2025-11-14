import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { Form } from "./form.model";
import { modelNames } from "./constants";

// Main FormElementInput interface
export interface FormElementInput extends TenantInput {
  formId: Schema.Types.ObjectId;
  type: string;
  headElement?: boolean;
  attributes?: Record<string, unknown>;
  nextElementId?: Schema.Types.ObjectId;
  previousElementId?: Schema.Types.ObjectId;
  parentElementId?: Schema.Types.ObjectId;
}

// FormElement document interface
export interface IFormElementDoc extends FormElementInput, ITenantDoc, Document {
  createdAt?: Date;
  updatedAt?: Date;
}

// FormElement model interface
interface IFormElementModel
  extends Model<IFormElementDoc>,
    ITenantModel<IFormElementDoc>,
    PaginateModel<IFormElementDoc>,
    AggregatePaginateModel<IFormElementDoc> {}

// Define the FormElement schema
const schema = new Schema<IFormElementDoc>(
  {
    formId: { type: Schema.Types.ObjectId, ref: Form.modelName, required: true },
    type: { type: String, required: true },
    headElement: { type: Boolean, default: false },
    attributes: { type: Schema.Types.Mixed },
    nextElementId: { type: Schema.Types.ObjectId, ref: modelNames.FORM_ELEMENT, default: null },
    previousElementId: { type: Schema.Types.ObjectId, ref: modelNames.FORM_ELEMENT, default: null },
    parentElementId: { type: Schema.Types.ObjectId, ref: modelNames.FORM_ELEMENT, default: null },
  },
  { timestamps: true }
);

// Apply plugins
schema.plugin(tenantDataPlugin);
schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

// Create and export the model
const FormElement = model<IFormElementDoc, IFormElementModel>(modelNames.FORM_ELEMENT, schema);
export { FormElement };
