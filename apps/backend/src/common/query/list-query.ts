import { IOptions } from "@rl/types";

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

export type FilterBuilder = (value: unknown) => Record<string, unknown> | undefined;

export interface ListQuerySpec {
  /** The allowlist. A query key absent from this map never reaches the filter. */
  filters: Record<string, FilterBuilder>;
  /** Bare field names, no `-` prefix. */
  sortable: string[];
  defaultSort: string;
  /** Query key carrying the free-text term. Kept as `clientSearch` for the frontend. */
  searchKey?: string;
}

export interface BuiltListQuery {
  filter: Record<string, unknown>;
  options: IOptions;
  search?: string;
}

const DEFAULT_PAGE = 1;
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

  for (const [key, build] of Object.entries(spec.filters)) {
    const condition = build(query[key]);
    if (condition) Object.assign(filter, condition);
  }

  const page = Number(query.page) > 0 ? Number(query.page) : DEFAULT_PAGE;
  const requested = Number(query.limit) > 0 ? Number(query.limit) : DEFAULT_LIMIT;

  const search = spec.searchKey ? String(query[spec.searchKey] ?? "").trim() || undefined : undefined;

  return {
    filter,
    options: { page, limit: Math.min(requested, MAX_LIMIT), sort: normalizeSort(query.sort, spec) },
    search,
  };
};
