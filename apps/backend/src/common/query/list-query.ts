import { Types } from "mongoose";
import { IOptions } from "@rl/types";
import { escapeRegex } from "../helper/escape-regex";

/**
 * Per-module list query building.
 *
 * Replaces `MongoQuery` from @ims-systems-00/ims-query-builder, which turned any
 * leftover query param into a `$match` clause — so `?nonsense=x` silently returned
 * nothing and `?title[regex]=(a+)+$` handed Mongo a raw pattern. Here a module
 * declares the keys it accepts and what each one means; anything else is ignored
 * (the route's Joi schema is what rejects it with a 400).
 *
 * Input must already be validated, so values arrive coerced: `?salary[gte]=50000`
 * is the number 50000, not the string.
 */

/**
 * `value` is this key's own value. `query` is the whole validated query, for the
 * rare filter whose meaning depends on another key — a default view baseline that
 * an explicit choice overrides, say. Read `query` rather than the filter being
 * accumulated, so builders stay order-independent.
 */
export type FilterBuilder = (value: unknown, query: Record<string, unknown>) => Record<string, unknown> | undefined;

export interface ListQuerySpec {
  /** The allowlist. A query key absent from this map never reaches the filter. */
  filters: Record<string, FilterBuilder>;
  /** Bare field names, no `-` prefix. */
  sortable: string[];
  defaultSort: string;
  /** Query key carrying the free-text term. Kept as `clientSearch` for the frontend. */
  searchKey?: string;
  /**
   * Fields the free-text term matches, as an escaped case-insensitive regex.
   *
   * Leave unset when the module handles the term itself: `job` passes it to Atlas
   * `$search` instead, and adding a regex `$or` on top would filter the fused
   * results down to only those containing the literal string.
   */
  searchFields?: string[];
}

export interface BuiltListQuery {
  filter: Record<string, unknown>;
  options: IOptions;
  search?: string;
  /** Opaque forward cursor, decoded by the controller against its own guard. */
  cursor?: string;
  /**
   * Legacy offset paging, set only when the caller sent `?page=`. Present so the
   * frontend can migrate to cursors module by module instead of all at once —
   * see `runCursorList`. Remove once no caller sends it.
   */
  page?: number;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/** Exact match: `?status=open` -> `{ status: "open" }`. */
export const eq =
  (field: string): FilterBuilder =>
  (value) =>
    value === undefined || value === null || value === "" ? undefined : { [field]: value };

/**
 * Membership. Accepts a bare value, an array, or the `{ in: [...] }` shape the
 * frontend sends via qs brackets (`?employmentType[in][]=full-time`).
 */
export const oneOf =
  (field: string): FilterBuilder =>
  (value) => {
    const raw = value as { in?: unknown[] } | unknown[] | unknown;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { in?: unknown[] })?.in)
        ? (raw as { in: unknown[] }).in
        : raw === undefined || raw === null || raw === ""
          ? []
          : [raw];

    return list.length ? { [field]: { $in: list } } : undefined;
  };

/** `?salary[gte]=50000&salary[lte]=90000` -> `{ salary: { $gte: 50000, $lte: 90000 } }`. */
export const range =
  (field: string): FilterBuilder =>
  (value) => {
    const bounds = value as { gte?: number; lte?: number } | undefined;
    const condition: Record<string, number> = {};

    if (bounds?.gte !== undefined) condition.$gte = bounds.gte;
    if (bounds?.lte !== undefined) condition.$lte = bounds.lte;

    return Object.keys(condition).length ? { [field]: condition } : undefined;
  };

/** Boolean flag on the document, e.g. `?isActive=true`. */
export const bool =
  (field: string): FilterBuilder =>
  (value) =>
    typeof value === "boolean" ? { [field]: value } : undefined;

/**
 * `?createdAt[gte]=2026-01-01` -> `{ createdAt: { $gte: Date(2026-01-01) } }`.
 *
 * Separate from `range` because Mongo's comparison operators are type-bracketed:
 * a string bound against a Date field matches nothing and raises no error.
 */
export const dateRange =
  (field: string): FilterBuilder =>
  (value) => {
    const bounds = value as { gte?: unknown; lte?: unknown } | undefined;
    const condition: Record<string, Date> = {};

    for (const [key, op] of [
      ["gte", "$gte"],
      ["lte", "$lte"],
    ] as const) {
      if (bounds?.[key] === undefined) continue;
      const date = new Date(bounds[key] as string);
      if (!Number.isNaN(date.getTime())) condition[op] = date;
    }

    return Object.keys(condition).length ? { [field]: condition } : undefined;
  };

/**
 * Reference match, casting to an ObjectId here rather than downstream.
 *
 * `sanitizeQueryIds` decides what is an id from the key's *name* (`endsWith("Id")`),
 * so a ref like `jobTitle` or `collectionDocument` fails that test and the raw
 * string reaches `$match`, where it matches nothing and raises no error. Declaring
 * the cast removes the dependence on how the field happens to be spelled.
 *
 * Equality against an array field is Mongo's "array contains", which is what a
 * filter on `jobTitle: [ObjectId]` should mean — so this covers a scalar ref and an
 * array of them alike.
 */
export const objectId =
  (field: string): FilterBuilder =>
  (value) =>
    typeof value === "string" && Types.ObjectId.isValid(value) ? { [field]: new Types.ObjectId(value) } : undefined;

/**
 * `$in` over references. Accepts a bare value, an array, or the `{ in: [...] }`
 * shape the frontend sends via qs brackets. Ids that do not parse are dropped —
 * the route's Joi schema is what rejects them with a 400.
 */
export const objectIdIn =
  (field: string): FilterBuilder =>
  (value) => {
    const raw = value as { in?: unknown[] } | unknown[] | unknown;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { in?: unknown[] })?.in)
        ? (raw as { in: unknown[] }).in
        : raw === undefined || raw === null || raw === ""
          ? []
          : [raw];

    const ids = list
      .filter((id): id is string => typeof id === "string" && Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    return ids.length ? { [field]: { $in: ids } } : undefined;
  };

/**
 * Single-sided bounds, so several query keys can narrow one field:
 * `endDateFrom` -> `$gte`, `endDateTo` -> `$lte`, `endDateBefore` -> `$lt`.
 * `buildListQuery` merges them back into one condition.
 *
 * The value is passed through as-is because the Joi schema has already coerced it:
 * `Joi.date()` yields a Date, `Joi.number()` a number. That matters — Mongo's
 * comparison operators are type-bracketed, so a string bound against a Date field
 * matches zero documents and raises no error.
 */
const bound =
  (operator: "$gte" | "$lte" | "$gt" | "$lt") =>
  (field: string): FilterBuilder =>
  (value) =>
    value === undefined || value === null || value === "" ? undefined : { [field]: { [operator]: value } };

export const gte = bound("$gte");
export const lte = bound("$lte");
export const gt = bound("$gt");
export const lt = bound("$lt");

/**
 * Free-text match across several fields, as one escaped case-insensitive regex.
 *
 * `buildListQuery` applies this automatically when a spec declares `searchFields`.
 * Use it directly only for a second search param under its own key.
 */
export const regexSearch =
  (fields: string[]): FilterBuilder =>
  (value) => {
    const term = String(value ?? "").trim();
    if (!term || !fields.length) return undefined;

    const pattern = { $regex: escapeRegex(term), $options: "i" };
    return { $or: fields.map((field) => ({ [field]: pattern })) };
  };

/** An object whose every key is a Mongo operator, e.g. `{ $gte: 1, $lte: 9 }`. */
const isOperatorObject = (value: unknown): value is Record<string, unknown> =>
  !!value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !(value instanceof Date) &&
  !(value instanceof Types.ObjectId) &&
  Object.keys(value).length > 0 &&
  Object.keys(value).every((key) => key.startsWith("$"));

/**
 * Folds one builder's output into the filter.
 *
 * Several keys may target one field — `endDateFrom` and `endDateTo` both narrow
 * `endDate` — so a plain assign would let the last one silently win. Two operator
 * objects merge into one condition; anything else goes to `$and`, because
 * `{ a: 1, a: { $gt: 2 } }` cannot be written as a single object.
 */
const mergeCondition = (filter: Record<string, unknown>, condition: Record<string, unknown>): void => {
  for (const [field, value] of Object.entries(condition)) {
    const existing = filter[field];

    if (existing === undefined) {
      filter[field] = value;
      continue;
    }

    if (isOperatorObject(existing) && isOperatorObject(value)) {
      filter[field] = { ...existing, ...value };
      continue;
    }

    filter.$and = [...((filter.$and as unknown[]) ?? []), { [field]: value }];
  }
};

const normalizeSort = (value: unknown, spec: ListQuerySpec): string => {
  if (typeof value !== "string" || !value.trim()) return spec.defaultSort;

  // A sort the module did not declare falls back rather than reaching $sort — Joi
  // already rejects those, this is the belt to that braces.
  const allowed = value
    .trim()
    .split(/\s+/)
    .filter((token) => spec.sortable.includes(token.replace(/^-/, "")));

  return allowed.length ? allowed.join(" ") : spec.defaultSort;
};

export const buildListQuery = (query: Record<string, unknown>, spec: ListQuerySpec): BuiltListQuery => {
  const filter: Record<string, unknown> = {};

  // Every declared builder runs, whether or not its own key was sent — a builder
  // may key off a sibling instead (see `FilterBuilder`).
  for (const [key, build] of Object.entries(spec.filters)) {
    const condition = build(query[key], query);
    if (condition) mergeCondition(filter, condition);
  }

  const requested = Number(query.limit) > 0 ? Number(query.limit) : DEFAULT_LIMIT;

  const search = spec.searchKey ? String(query[spec.searchKey] ?? "").trim() || undefined : undefined;
  const cursor = typeof query.cursor === "string" && query.cursor ? query.cursor : undefined;
  const page = Number(query.page) > 0 ? Number(query.page) : undefined;

  // Only when the module asked for regex search. A spec that leaves `searchFields`
  // unset still gets `search` back and decides for itself (job -> Atlas).
  const searchClause = spec.searchFields?.length ? regexSearch(spec.searchFields)(search, query) : undefined;

  // `mergeCondition` handles the collision: a second `$or` is an array, not an
  // operator object, so it lands in `$and` rather than overwriting the first.
  if (searchClause) mergeCondition(filter, searchClause);

  return {
    filter,
    options: { limit: Math.min(requested, MAX_LIMIT), sort: normalizeSort(query.sort, spec) },
    search,
    cursor,
    page,
  };
};
