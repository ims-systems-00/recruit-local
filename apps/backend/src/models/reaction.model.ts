import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { ReactionType } from "@rl/types";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

export interface IReactionInput {
  tenantId?: Types.ObjectId;
  jobProfileId?: Types.ObjectId;
  collectionName: typeof modelNames;
  collectionId: Types.ObjectId;
  type: ReactionType;
}

export interface IReactionDoc extends IReactionInput, ISoftDeleteDoc {
  createdAt: Date;
  updatedAt: Date;
}

interface IReactionModel
  extends
    Model<IReactionDoc>,
    ISoftDeleteModel<IReactionDoc>,
    PaginateModel<IReactionDoc>,
    AggregatePaginateModel<IReactionDoc> {}

const reactionSchema = new Schema<IReactionDoc>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.TENANT,
    },
    jobProfileId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.JOB_PROFILE,
    },
    collectionName: {
      type: String,
      enum: Object.values(modelNames),
      required: true,
    },
    collectionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ReactionType),
      required: true,
    },
  },
  { timestamps: true }
);

// Either a tenant or a job profile must own the reaction — not neither.
reactionSchema.pre("validate", function (next) {
  if (!this.tenantId && !this.jobProfileId) {
    this.invalidate("tenantId", "A reaction requires either a tenantId or a jobProfileId.");
  }
  next();
});

reactionSchema.plugin(softDeletePlugin);
reactionSchema.plugin(mongoosePaginate);
reactionSchema.plugin(aggregatePaginate);

export const Reaction = model<IReactionDoc, IReactionModel>(modelNames.REACTION, reactionSchema);
