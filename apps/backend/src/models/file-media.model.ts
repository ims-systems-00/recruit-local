import { Schema, model, Document, Model } from "mongoose";
import { DocumentFolder } from "./document-folder.model";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { AwsStorageTemplate } from "./templates/aws-storage.template";
import { modelNames } from "./constants";

export interface FileMediaInput extends TenantInput {
  collectionName: string;
  collectionDocument: Schema.Types.ObjectId;
  storageInformation: AwsStorageTemplate;
}

export interface IFileMediaDoc extends FileMediaInput, ITenantDoc, ISoftDeleteDoc, Document {
  createdAt: Date;
  updatedAt: Date;
}

interface IFileMediaModel extends Model<IFileMediaDoc>, ITenantModel<IFileMediaDoc>, ISoftDeleteModel<IFileMediaDoc> {}

// Create the file media schema
const fileMediaSchema = new Schema<IFileMediaDoc>(
  {
    collectionName: {
      type: String,
      required: true,
    },
    collectionDocument: {
      type: Schema.Types.ObjectId,
      ref: DocumentFolder.modelName,
      required: true,
    },
    storageInformation: awsStorageTemplateMongooseDefinition,
  },
  {
    timestamps: true,
  }
);

// Apply plugins
fileMediaSchema.plugin(tenantDataPlugin);
fileMediaSchema.plugin(softDeletePlugin);

// Create and export the model
const FileMedia = model<IFileMediaDoc, IFileMediaModel>(modelNames.FILE_MEDIA, fileMediaSchema);
export { FileMedia };
