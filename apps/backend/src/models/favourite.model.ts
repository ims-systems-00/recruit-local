import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

export interface IFavouriteInput {
  userId: Schema.Types.ObjectId;
  itemId: Schema.Types.ObjectId;
  itemType: typeof modelNames;
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
      refPath: "itemType",
    },
    itemType: {
      type: String,
      enum: Object.values(modelNames),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce uniqueness ONLY when the document is NOT deleted
favouriteSchema.index(
  { userId: 1, itemId: 1, itemType: 1 },
  {
    unique: true,
    partialFilterExpression: { "deleteMarker.status": false },
  }
);

favouriteSchema.plugin(softDeletePlugin);
favouriteSchema.plugin(mongoosePaginate);
favouriteSchema.plugin(aggregatePaginate);

export const Favourite = model<IFavouriteDoc, IFavouriteModel>(modelNames.FAVOURITE, favouriteSchema);
