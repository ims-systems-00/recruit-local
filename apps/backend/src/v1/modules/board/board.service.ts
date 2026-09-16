import { NotFoundException } from "../../../common/helper";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { IListParams } from "@rl/types";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { boardProjectQuery } from "./board.query";
import { IBoardInput, Board, IBoardDoc } from "../../../models";

type IBoardListParams = IListParams<IBoardInput> & { offset?: number };
type IBoardQueryParams = Partial<IBoardInput & { _id: string }>;

export const list = async ({ query = {}, options, offset = 0 }: IBoardListParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Board.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...boardProjectQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};
export const getOne = async (query = {}): Promise<IBoardDoc> => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const board = await Board.aggregate([
    ...matchQuery(sanitizedQuery),
    ...excludeDeletedQuery(),
    ...boardProjectQuery(),
  ]);
  if (board.length === 0) throw new NotFoundException("Board not found.");
  return board[0];
};

export const listSoftDeleted = async (query = {}) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const board = await Board.aggregate([...matchQuery(sanitizedQuery), ...onlyDeletedQuery(), ...boardProjectQuery()]);
  if (board.length === 0) throw new NotFoundException("Board not found in trash.");
  return board[0];
};

export const getOneSoftDeleted = async (query = {}) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const board = await Board.aggregate([...matchQuery(sanitizedQuery), ...onlyDeletedQuery(), ...boardProjectQuery()]);
  if (board.length === 0) throw new NotFoundException("Board not found in trash.");
  return board[0];
};

export const create = async (data: IBoardInput) => {
  const board = new Board(data);
  await board.save();
  return board;
};

export const update = async (query: IBoardQueryParams, data: Partial<IBoardInput>) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const board = await Board.findOneAndUpdate(sanitizedQuery, data, { new: true });
  if (!board) throw new NotFoundException("Board not found for update.");
  return board;
};

export const softRemove = async (query: IBoardQueryParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const board = await Board.softDelete(sanitizedQuery);
  if (!board) throw new NotFoundException("Board not found for delete.");
  return board;
};

export const restore = async (query: IBoardQueryParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const board = await Board.restore(sanitizedQuery);
  if (!board) throw new NotFoundException("Board not found for restore.");
  return board;
};

export const hardRemove = async (query: IBoardQueryParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const board = await Board.deleteOne(sanitizedQuery);
  if (!board) throw new NotFoundException("Board not found for hard delete.");
  return board;
};
