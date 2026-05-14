import mongoose from "mongoose";
import { Keyword } from "../../../models";
import { EmbeddingAdapterFactory } from "../../../common/adapter/embedding/embedding.adapter.factory";
import { MongoVectorSearchAdapter } from "../../../common/adapter/embedding/vector-search/mongo-vector-search.adapter";
import { matchQuery, excludeDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { NotFoundException } from "../../../common/helper";
import { IListKeywordParams, IKeywordCreateParams, IKeywordSearchParams } from "./keyword.interface";
import { keywordProjectionQuery } from "./keyword.query";

export const list = ({ query = {}, options }: IListKeywordParams) => {
  const aggregate = Keyword.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...keywordProjectionQuery(),
  ]);
  return Keyword.aggregatePaginate(aggregate, options);
};

export const create = async ({ payload, session }: IKeywordCreateParams) => {
  const adapter = EmbeddingAdapterFactory.create("openai");
  const embedding = await adapter.generateEmbedding(payload.text);
  const docs = await Keyword.create([{ ...payload, embedding }], { session });
  return docs[0];
};

export const search = async ({ query, limit = 10 }: IKeywordSearchParams) => {
  const adapter = EmbeddingAdapterFactory.create("openai");
  const vectorAdapter = new MongoVectorSearchAdapter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collection = mongoose.connection.db!.collection(Keyword.collection.name) as any;

  return vectorAdapter.search(collection, adapter.getEmbeddings(), query, {
    indexName: process.env.KEYWORD_VECTOR_INDEX_NAME ?? "keyword_vector_index",
    textKey: "text",
    embeddingKey: "embedding",
    limit,
  });
};

export const softDelete = async ({ query }: { query: Record<string, unknown> }) => {
  const keyword = await Keyword.findOne(query);
  if (!keyword) throw new NotFoundException("Keyword not found.");
  await Keyword.softDelete({ _id: keyword._id });
  return keyword;
};
