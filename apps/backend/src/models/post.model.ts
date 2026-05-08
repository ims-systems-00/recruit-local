import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";

export interface IPostInput extends IUserOwnedInput {
  title: string;
  content: string;
  imageIds?: Types.ObjectId[];
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
    imageIds: [
      {
        type: Schema.Types.ObjectId,
        ref: modelNames.FILE_MEDIA,
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
