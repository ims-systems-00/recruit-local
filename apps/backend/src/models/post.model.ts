import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";

export interface IPostImage {
  src: string;
  storage: AwsStorageTemplate;
}

export interface IPostInput extends IUserOwnedInput {
  title: string;
  content: string;
  images?: IPostImage[];
  tags: string[];
  statusId: Types.ObjectId;
}

export interface IPostDoc extends IPostInput, ISoftDeleteDoc {
  createdAt: Date;
  updatedAt: Date;
}

interface IPostModel
  extends Model<IPostDoc>,
    ISoftDeleteModel<IPostDoc>,
    PaginateModel<IPostDoc>,
    AggregatePaginateModel<IPostDoc> {}

const postSchema = new Schema<IPostDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    images: [
      {
        src: { type: String, required: true },
        storage: { type: awsStorageTemplateMongooseDefinition, required: true },
      },
    ],
    tags: [{ type: String }],
    statusId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.STATUS,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.plugin(softDeletePlugin);
postSchema.plugin(userOwnedPlugin);
postSchema.plugin(mongoosePaginate);
postSchema.plugin(aggregatePaginate);

export const Post = model<IPostDoc, IPostModel>(modelNames.POST, postSchema);
