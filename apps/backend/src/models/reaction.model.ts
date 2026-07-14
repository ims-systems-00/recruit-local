import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { ReactionType } from "@rl/types";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";

export interface IReactionInput extends IUserOwnedInput {
  collectionName: typeof modelNames;
  collectionId: Types.ObjectId;
  type: ReactionType;
}

export interface IReactionDoc extends IReactionInput, ISoftDeleteDoc {
  createdAt: Date;
  updatedAt: Date;
}

interface IReactionModel
  extends Model<IReactionDoc>,
    ISoftDeleteModel<IReactionDoc>,
    PaginateModel<IReactionDoc>,
    AggregatePaginateModel<IReactionDoc> {}

const reactionSchema = new Schema<IReactionDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
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

reactionSchema.plugin(softDeletePlugin);
reactionSchema.plugin(mongoosePaginate);
reactionSchema.plugin(aggregatePaginate);
reactionSchema.plugin(userOwnedPlugin);

export const Reaction = model<IReactionDoc, IReactionModel>(modelNames.REACTION, reactionSchema);
