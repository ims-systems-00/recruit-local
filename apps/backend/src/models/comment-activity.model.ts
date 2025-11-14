import { Schema, model, Document, Model } from "mongoose";
import { User } from "./user.model";
import { tenantDataPlugin, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { COMMENT_ACTIVITY_TYPE_ENUMS, COMMENT_ACTIVITY_COLLECTION_ENUMS, modelNames } from "./constants";

// Define an interface for Comment Activity input
export interface CommentActivityInput {
  collectionName: COMMENT_ACTIVITY_COLLECTION_ENUMS;
  collectionDocument: Schema.Types.ObjectId;
  value: string;
}

// Define an interface for Comment Activity document
export interface ICommentActivityDoc extends CommentActivityInput, ITenantDoc, ISoftDeleteDoc, Document {
  title?: string;
  createdBy?: Schema.Types.ObjectId;
  extraLogs?: { title: string; value: string }[];
  type: COMMENT_ACTIVITY_TYPE_ENUMS;
  iconSrc?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define an interface for Comment Activity model
interface ICommentActivityModel
  extends Model<ICommentActivityDoc>,
    ITenantModel<ICommentActivityDoc>,
    ISoftDeleteModel<ICommentActivityDoc> {}

// Create the comment activity schema
const commentActivitySchema = new Schema<ICommentActivityDoc>(
  {
    collectionName: {
      type: String,
      required: true,
      enum: Object.values(COMMENT_ACTIVITY_COLLECTION_ENUMS),
    },
    collectionDocument: {
      type: Schema.Types.ObjectId,
      refPath: "collectionName",
      required: true,
    },
    title: {
      type: String,
    },
    value: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      default: null,
    },
    extraLogs: [
      {
        title: String,
        value: String,
      },
    ],
    type: {
      type: String,
      enum: Object.values(COMMENT_ACTIVITY_TYPE_ENUMS),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply plugins
commentActivitySchema.plugin(tenantDataPlugin);
commentActivitySchema.plugin(softDeletePlugin);

// Create and export the model
const CommentActivity = model<ICommentActivityDoc, ICommentActivityModel>(
  modelNames.COMMENT_ACTIVITY,
  commentActivitySchema
);
export { CommentActivity };
