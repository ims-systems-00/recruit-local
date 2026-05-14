import { Schema, model, Model, AggregatePaginateModel } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";

export interface KeywordInput {
  text: string;
  embedding: number[];
}

export interface IKeywordDoc extends KeywordInput, ISoftDeleteDoc, IBaseDoc {}

interface IKeywordModel
  extends Model<IKeywordDoc>,
    ISoftDeleteModel<IKeywordDoc>,
    AggregatePaginateModel<IKeywordDoc> {}

const keywordSchema = new Schema<IKeywordDoc>(
  {
    text: { type: String, required: true, unique: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

keywordSchema.plugin(softDeletePlugin);
keywordSchema.plugin(aggregatePaginate);

export const Keyword = model<IKeywordDoc, IKeywordModel>(modelNames.KEYWORD, keywordSchema);
