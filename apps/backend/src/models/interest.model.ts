import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwned } from "./plugins/userOwned.plugin";

export interface InterestInput extends IUserOwned {
  name: string;
  description?: string;
}

export interface IInterestDoc extends InterestInput, ISoftDeleteDoc, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IInterestModel
  extends Model<IInterestDoc>,
    ISoftDeleteModel<IInterestDoc>,
    PaginateModel<IInterestDoc>,
    AggregatePaginateModel<IInterestDoc> {}

const interestSchema = new Schema<IInterestDoc>(
  {
    name: { type: String, required: true },
    description: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

interestSchema.plugin(softDeletePlugin);
interestSchema.plugin(mongoosePaginate);
interestSchema.plugin(aggregatePaginate);
interestSchema.plugin(userOwnedPlugin);

export const Interest = model<IInterestDoc, IInterestModel>(modelNames.INTEREST, interestSchema);
