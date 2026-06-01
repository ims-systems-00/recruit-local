import { Schema, model, Document, Model } from "mongoose";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { automaticReferencePlugin } from "./plugins/automatic-reference.plugin";
import { modelNames } from "./constants";

export interface ResponseTemplateInput {
  keyword: string;
  fullText: string;
}

export interface IResponseTemplateDoc extends ResponseTemplateInput, ISoftDeleteDoc, Document {
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IResponseTemplateModel extends Model<IResponseTemplateDoc>, ISoftDeleteModel<IResponseTemplateDoc> {}

const schema = new Schema<IResponseTemplateDoc>(
  {
    keyword: {
      type: String,
      required: true,
    },
    fullText: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(softDeletePlugin);
schema.plugin(automaticReferencePlugin({ model: modelNames.RESPONSE_TEMPLATE, referencePrefix: "RT" }));

export const ResponseTemplate = model<IResponseTemplateDoc, IResponseTemplateModel>(
  modelNames.RESPONSE_TEMPLATE,
  schema
);
