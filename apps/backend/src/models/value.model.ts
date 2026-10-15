import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { IValue, VALUE_TYPE_ENUM } from "@rl/types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ValueInput extends IValue {}

export interface IValueDoc extends ValueInput, ISoftDeleteDoc, IBaseDoc {
  weight?: number;
}

interface IValueModel
  extends Model<IValueDoc>, ISoftDeleteModel<IValueDoc>, PaginateModel<IValueDoc>, AggregatePaginateModel<IValueDoc> {}

const valueSchema = new Schema<IValueDoc>(
  {
    type: { type: String, enum: Object.values(VALUE_TYPE_ENUM), required: true, trim: true },
    label: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    weight: { type: Number, default: 0 },
    // The self-evaluation a candidate answers for this value. Optional: a value
    // with none simply cannot be evaluated yet. Seeded from
    // seeders/value-assessments.content.ts.
    assessment: {
      type: new Schema(
        {
          heading: { type: String, required: true, trim: true },
          questions: [
            {
              _id: false,
              key: { type: String, required: true, trim: true },
              text: { type: String, required: true, trim: true },
              placeholder: { type: String, trim: true },
            },
          ],
        },
        { _id: false }
      ),
      required: false,
    },
  },
  { timestamps: true }
);

valueSchema.plugin(softDeletePlugin);
valueSchema.plugin(mongoosePaginate);
valueSchema.plugin(aggregatePaginate);

export const Value = model<IValueDoc, IValueModel>(modelNames.VALUE, valueSchema);
