import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { POST_TYPE_ENUMS, POST_STATUS_ENUMS } from "@rl/types";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

export interface IPostInput {
  tenantId?: Types.ObjectId; // at least one of tenantId / jobProfileId is required (enforced in pre-validate)
  jobProfileId?: Types.ObjectId;
  title: string;
  text: string;
  banner?: Types.ObjectId;
  images?: Types.ObjectId[];
  keywords: string[];
  type: POST_TYPE_ENUMS;
  status: POST_STATUS_ENUMS;
  schedule?: Date; // only articles are scheduled; enforced in service, not schema
}

export interface IPostDoc extends IPostInput, ISoftDeleteDoc {
  createdAt: Date;
  updatedAt: Date;
}

interface IPostModel
  extends Model<IPostDoc>, ISoftDeleteModel<IPostDoc>, PaginateModel<IPostDoc>, AggregatePaginateModel<IPostDoc> {}

const postSchema = new Schema<IPostDoc>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.TENANT,
    },
    jobProfileId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.JOB_PROFILE,
    },
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    banner: {
      type: Schema.Types.ObjectId,
      ref: modelNames.FILE_MEDIA,
    },
    images: [
      {
        type: Schema.Types.ObjectId,
        ref: modelNames.FILE_MEDIA,
      },
    ],
    keywords: [{ type: String }],
    type: {
      type: String,
      enum: Object.values(POST_TYPE_ENUMS),
      default: POST_TYPE_ENUMS.POST,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(POST_STATUS_ENUMS),
      default: POST_STATUS_ENUMS.DRAFT,
      required: true,
    },
    schedule: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Either a tenant or a job profile must own the post — not neither.
postSchema.pre("validate", function (next) {
  if (!this.tenantId && !this.jobProfileId) {
    this.invalidate("tenantId", "A post requires either a tenantId or a jobProfileId.");
  }
  next();
});

postSchema.plugin(softDeletePlugin);
postSchema.plugin(mongoosePaginate);
postSchema.plugin(aggregatePaginate);

// Backs the keyword `$in` lookup used by the post fan-out (post -> matching
// profiles/tenants) and the reverse feed rebuild (recipient -> matching posts).
postSchema.index({ keywords: 1 });

export const Post = model<IPostDoc, IPostModel>(modelNames.POST, postSchema);
