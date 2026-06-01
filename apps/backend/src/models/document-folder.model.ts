import { Schema, model, Document, Model } from "mongoose";
import { awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { User } from "./user.model";
import { automaticReferencePlugin } from "./plugins/automatic-reference.plugin";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { DOCUMENT_FOLDER_TYPE_ENUMS, modelNames } from "./constants";
import { AwsStorageTemplate } from "./templates/aws-storage.template";

export interface DocumentFolderInput extends TenantInput {
  name: string;
  description?: string;
  type: DOCUMENT_FOLDER_TYPE_ENUMS;
  parentId?: Schema.Types.ObjectId;
  storageInformation?: AwsStorageTemplate;
  ownedBy: Schema.Types.ObjectId[];
}

export interface IDocumentFolderDoc extends DocumentFolderInput, ITenantDoc, ISoftDeleteDoc, Document {
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IDocumentFolderModel
  extends Model<IDocumentFolderDoc>,
    ITenantModel<IDocumentFolderDoc>,
    ISoftDeleteModel<IDocumentFolderDoc> {}

// Create the document folder schema
const documentFolderSchema = new Schema<IDocumentFolderDoc>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: Object.values(DOCUMENT_FOLDER_TYPE_ENUMS),
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.DOCUMENT_FOLDER,
    },
    storageInformation: awsStorageTemplateMongooseDefinition,
    ownedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: User.modelName,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Apply plugins
documentFolderSchema.plugin(tenantDataPlugin);
documentFolderSchema.plugin(softDeletePlugin);
// documentFolderSchema.plugin(automaticReferencePlugin({ model: "DocumentFolder", referencePrefix: "DM" }));

// Create and export the model
const DocumentFolder = model<IDocumentFolderDoc, IDocumentFolderModel>(
  modelNames.DOCUMENT_FOLDER,
  documentFolderSchema
);
export { DocumentFolder };
