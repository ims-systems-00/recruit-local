import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

export interface IFavouriteInput {
  tenantId?: Schema.Types.ObjectId;
  jobProfileId?: Schema.Types.ObjectId;
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
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.TENANT,
      required: false,
      index: true,
    },
    jobProfileId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.JOB_PROFILE,
      required: false,
      index: true,
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

// A favourite is owned by exactly one context: a tenant (employer) OR a job profile (candidate).
favouriteSchema.pre("validate", function (next) {
  if (!this.tenantId === !this.jobProfileId) {
    return next(new Error("A favourite must have exactly one of tenantId or jobProfileId."));
  }
  next();
});

// Enforce uniqueness ONLY when the document is NOT deleted
// Use sparse index to handle the null owner field (tenantId for candidates, jobProfileId for employers)
favouriteSchema.index(
  { tenantId: 1, jobProfileId: 1, itemId: 1, itemType: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { "deleteMarker.status": false },
  }
);

favouriteSchema.plugin(softDeletePlugin);
favouriteSchema.plugin(mongoosePaginate);
favouriteSchema.plugin(aggregatePaginate);

export const Favourite = model<IFavouriteDoc, IFavouriteModel>(modelNames.FAVOURITE, favouriteSchema);
