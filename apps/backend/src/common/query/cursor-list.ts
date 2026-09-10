import { PipelineStage } from "mongoose";
import { IOptions } from "@rl/types";
import { buildListQuery, ListQuerySpec } from "./list-query";
import {
  cursorGuard,
  cursorSortStage,
  decodeCursor,
  encodeKeysetCursor,
  encodeOffsetCursor,
  keysetCondition,
  parseSortToken,
} from "./cursor";

/**
 * The list half of every migrated module.
 *
 * `job` proved the pattern but carries ~50 lines of it inline. Repeating that in
 * 30-odd controllers is how the ordering rules get broken one at a time — the
 * cursor must be built from raw documents, the keyset condition must join the
 * same `$and` as the security query, the guard must cover every input that
 * changes the ordering. All of that lives here once.
 *
 * A controller is left with: build the ability, call this, sanitize the docs.
 */

export interface CursorPageResult<T> {
  docs: T[];
  hasNextPage: boolean;
  limit: number;
}

/** Legacy offset block, plus `nextCursor` so a caller can switch over mid-list. */
export interface OffsetPaginationBlock {
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
  nextCursor: string | null;
}

export interface CursorPaginationBlock {
  limit: number;
  hasNextPage: boolean;
  nextCursor: string | null;
}

export interface PrepareResult {
  extraConditions?: Record<string, unknown>[];
  guardExtras?: Record<string, unknown>;
  useKeyset?: boolean;
}

export interface CursorListInput<T> {
  /** `req.query`, already through `validateQuery` so values are coerced. */
  query: Record<string, unknown>;
  spec: ListQuerySpec;
  /** The module's CASL query. The authoritative gate — pass it unless the list is public. */
  securityQuery?: Record<string, unknown>;
  /** Extra `$and` terms: a forced owner pin, a feed-id narrowing, `isActive: true`. */
  extraConditions?: Record<string, unknown>[];
  /** Anything else that changes the ordering and so must invalidate a stale cursor. */
  guardExtras?: Record<string, unknown>;
  /**
   * False when the order is computed rather than stored — a relevance score, an
   * `$addFields` rank — because there is no field to key on. Those page by offset.
   */
  useKeyset?: boolean;
  /**
   * Runs after the query is parsed and before the cursor guard is taken, for a
   * module whose scope depends on the parsed input: `job` needs the search term
   * to decide whether to embed it and whether to narrow to the matched feed.
   *
   * It may mutate `options` — that is how search mode drops the `$sort` — and
   * whatever it returns is merged into the conditions and the guard.
   */
  prepare?: (ctx: {
    filter: Record<string, unknown>;
    options: IOptions;
    search?: string;
  }) => Promise<PrepareResult> | PrepareResult;
  fetch: (args: { query: Record<string, unknown>; options: IOptions; offset: number }) => Promise<CursorPageResult<T>>;
  /**
   * Total matching documents, for legacy `?page=` requests only. Required because
   * the frontend's shared `paginationSchema` marks `totalDocs` as mandatory — a
   * block without it fails validation on the client.
   */
  count: (args: { query: Record<string, unknown> }) => Promise<number>;
}

export interface CursorListOutput<T> {
  /** Raw, unsanitized. The caller applies CASL field stripping to these. */
  docs: T[];
  pagination: OffsetPaginationBlock | CursorPaginationBlock;
  /** The free-text term, for a module that handles search itself. */
  search?: string;
  /** The composed `$and`, for a caller that needs a second query against the same scope. */
  finalQuery: Record<string, unknown>;
}

/**
 * Token for the next page, or null when there isn't one.
 *
 * Must be called on the *raw* service documents. `sanitizeDocuments` and a
 * public list's `pick` can both drop the field the keyset keys on, and a cursor
 * built from a stripped document silently restarts the list from the top.
 */
export const nextCursorFrom = <T extends Record<string, unknown>>(
  results: CursorPageResult<T>,
  guard: string,
  useKeyset: boolean,
  sort: string | undefined,
  offset: number
): string | null => {
  if (!results.hasNextPage || !results.docs.length) return null;

  if (!useKeyset || !sort) return encodeOffsetCursor(guard, offset + results.limit);

  const last = results.docs[results.docs.length - 1];
  const { field } = parseSortToken(sort);

  return encodeKeysetCursor(guard, sort, last[field], last._id);
};

/**
 * The paging tail of a list aggregation: sort on a total order, skip, then take
 * one more document than asked for.
 *
 * That extra document is the whole `hasNextPage` answer — there is no `$count`
 * branch, which is the point of paging this way.
 */
export const cursorPageStages = (sort: string | undefined, offset: number, limit: number): PipelineStage[] => [
  ...(sort ? [{ $sort: cursorSortStage(sort) } as PipelineStage] : []),
  ...(offset ? [{ $skip: offset } as PipelineStage] : []),
  { $limit: limit + 1 },
];

/** Trims the probe document back off and reports whether it was there. */
export const toCursorPage = <T>(docs: T[], limit: number): CursorPageResult<T> => ({
  docs: docs.length > limit ? docs.slice(0, limit) : docs,
  hasNextPage: docs.length > limit,
  limit,
});

export const runCursorList = async <T extends Record<string, unknown>>({
  query,
  spec,
  securityQuery,
  extraConditions = [],
  guardExtras,
  useKeyset = true,
  prepare,
  fetch,
  count,
}: CursorListInput<T>): Promise<CursorListOutput<T>> => {
  const { filter, options, search, cursor: rawCursor, page } = buildListQuery(query, spec);

  // May rewrite `options.sort`, so it has to run before the guard is taken.
  const prepared = prepare ? await prepare({ filter, options, search }) : undefined;

  // `?page=` is the deprecated path, kept so the frontend can move module by
  // module. It always skips — a page number has no keyset to walk.
  const legacy = page !== undefined;
  const sort = options.sort as string | undefined;

  // A keyset cursor keys on the *first* sort token only, so a multi-token sort
  // would walk a different order than it pages by — `"name -version"` sorts
  // (name asc, version desc, _id desc) but the cursor would step (name, _id asc),
  // duplicating some rows and skipping others. Those page by offset instead.
  const singleToken = !sort || sort.trim().split(/\s+/).filter(Boolean).length <= 1;
  const keyset = (prepared?.useKeyset ?? useKeyset) && singleToken;

  const guard = cursorGuard({
    filter,
    sort: sort ?? null,
    search: search ?? null,
    ...guardExtras,
    ...prepared?.guardExtras,
  });

  const cursor = !legacy && rawCursor ? decodeCursor(rawCursor, guard) : undefined;
  const limit = options.limit ?? 10;
  const offset = legacy ? (page - 1) * limit : cursor?.t === "o" ? cursor.o : 0;

  const finalQuery = {
    $and: [
      filter,
      ...(securityQuery ? [securityQuery] : []),
      ...extraConditions,
      ...(prepared?.extraConditions ?? []),
      ...(cursor?.t === "k" ? [keysetCondition(cursor)] : []),
    ],
  };

  const results = await fetch({ query: finalQuery, options, offset });
  const nextCursor = nextCursorFrom(results, guard, keyset && !legacy, sort, offset);

  if (!legacy) {
    return {
      docs: results.docs,
      pagination: { limit: results.limit, hasNextPage: results.hasNextPage, nextCursor },
      search,
      finalQuery,
    };
  }

  const totalDocs = await count({ query: finalQuery });

  return {
    docs: results.docs,
    pagination: {
      totalDocs,
      limit: results.limit,
      totalPages: Math.ceil(totalDocs / results.limit),
      page,
      pagingCounter: offset + 1,
      hasPrevPage: page > 1,
      hasNextPage: results.hasNextPage,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: results.hasNextPage ? page + 1 : null,
      nextCursor,
    },
    search,
    finalQuery,
  };
};
