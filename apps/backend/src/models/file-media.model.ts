import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { VISIBILITY_ENUM } from "@rl/types";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { modelNames, ModelNames } from "./constants";

export interface IFileMediaInput {
  collectionName: ModelNames;
  collectionDocument: Types.ObjectId;
  storageInformation: AwsStorageTemplate;
  thumbnail?: AwsStorageTemplate;
  visibility: VISIBILITY_ENUM;
}

export interface IFileMediaDoc extends IFileMediaInput, ISoftDeleteDoc, Document {
  createdAt: Date;
  updatedAt: Date;
}

interface IFileMediaModel
  extends Model<IFileMediaDoc>,
    ISoftDeleteModel<IFileMediaDoc>,
    PaginateModel<IFileMediaDoc>,
    AggregatePaginateModel<IFileMediaDoc> {}

const fileMediaSchema = new Schema<IFileMediaDoc>(
  {
    collectionName: {
      type: String,
      required: true,
      index: true,
      enum: Object.values(modelNames),
    },
    collectionDocument: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "collectionName",
    },
    storageInformation: awsStorageTemplateMongooseDefinition,
    thumbnail: {
      ...awsStorageTemplateMongooseDefinition,
    },
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY_ENUM),
      required: true,
      default: VISIBILITY_ENUM.PRIVATE,
    },
  },
  {
    timestamps: true,
  }
);

// --- Plugins ---
fileMediaSchema.plugin(softDeletePlugin);
fileMediaSchema.plugin(mongoosePaginate);
fileMediaSchema.plugin(aggregatePaginate);

fileMediaSchema.index({ collectionDocument: 1, collectionName: 1 });

export const FileMedia = model<IFileMediaDoc, IFileMediaModel>(modelNames.FILE_MEDIA, fileMediaSchema);
