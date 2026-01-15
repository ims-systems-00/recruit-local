import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { ITEM_TYPE_ENUMS } from "@rl/types";

export interface IFavouriteInput {
  userId: Schema.Types.ObjectId;
  itemId: Schema.Types.ObjectId;
  itemType: ITEM_TYPE_ENUMS;
}

export interface IFavouriteDoc extends IFavouriteInput, ISoftDeleteDoc, Document {
  createdAt: Date;
  updatedAt: Date;
}

interface IFavouriteModel
  extends Model<IFavouriteDoc>,
    ISoftDeleteModel<IFavouriteDoc>,
    PaginateModel<IFavouriteDoc>,
    AggregatePaginateModel<IFavouriteDoc> {}

const favouriteSchema = new Schema<IFavouriteDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    itemType: {
      type: String,
      enum: Object.values(ITEM_TYPE_ENUMS),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

favouriteSchema.plugin(softDeletePlugin);
favouriteSchema.plugin(mongoosePaginate);
favouriteSchema.plugin(aggregatePaginate);

export const Favourite = model<IFavouriteDoc, IFavouriteModel>(modelNames.FAVOURITE, favouriteSchema);
