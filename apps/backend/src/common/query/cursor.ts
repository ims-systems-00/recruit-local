import { createHash } from "crypto";
import { Types } from "mongoose";
import { BadRequestException } from "../helper/errors/api-error";

/**
 * Cursor pagination, generic over any module.
 *
 * Two strategies behind one opaque token:
 *   - keyset ("k") — the list is ordered by a stored field, so the next page is
 *     "everything after (fieldValue, _id)". Cost is flat no matter how deep.
 *   - offset ("o") — the order is computed ($rankFusion relevance, an $addFields
 *     score) and has no stored field to key on, so the token carries a $skip.
 *
 * The client never learns which one it holds; it just echoes `nextCursor` back.
 */

const CURSOR_VERSION = 1;

/** Value types that survive a JSON round-trip only if we tag them. */
type CursorValue = { t: "date"; v: string } | { t: "num"; v: number } | { t: "str"; v: string } | { t: "null" };

interface KeysetCursor {
  v: typeof CURSOR_VERSION;
  t: "k";
  g: string;
  /** The sort this cursor was issued for, e.g. "-createdAt". */
  s: string;
  k: CursorValue;
  /** Tiebreaker _id, hex. */
  i: string;
}

interface OffsetCursor {
  v: typeof CURSOR_VERSION;
  t: "o";
  g: string;
  o: number;
}

export type Cursor = KeysetCursor | OffsetCursor;

const badCursor = () =>
  new BadRequestException("This cursor does not match the current filters. Start again from the first page.");

/**
 * Fingerprint of the request shape a cursor belongs to.
 *
 * Replaying a `?sort=-createdAt` cursor against `?sort=-salary` would compare a
 * date against a number and quietly return garbage, so the token carries this and
 * `decodeCursor` rejects a mismatch. `limit` is deliberately not part of it —
 * changing page size mid-scroll is legitimate.
 */
export const cursorGuard = (parts: unknown): string =>
  createHash("sha256").update(stableStringify(parts)).digest("hex").slice(0, 12);

/** JSON.stringify with sorted keys, so `{a,b}` and `{b,a}` fingerprint the same. */
const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (value instanceof Types.ObjectId) return JSON.stringify(value.toHexString());

  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`);

  return `{${entries.join(",")}}`;
};

const tagValue = (value: unknown): CursorValue => {
  if (value === null || value === undefined) return { t: "null" };
  if (value instanceof Date) return { t: "date", v: value.toISOString() };
  if (typeof value === "number") return { t: "num", v: value };
  return { t: "str", v: String(value) };
};

/**
 * Rehydrate the tagged value. This is the reason the tag exists: Mongo's
 * comparison operators are type-bracketed, so `{ createdAt: { $lt: "2026-09-01T…" } }`
 * — a string against a Date — matches zero documents without erroring.
 */
const untagValue = (value: CursorValue): Date | number | string | null => {
  switch (value?.t) {
    case "date": {
      const date = new Date(value.v);
      if (Number.isNaN(date.getTime())) throw badCursor();
      return date;
    }
    case "num":
      return value.v;
    case "str":
      return value.v;
    case "null":
      return null;
    default:
      throw badCursor();
  }
};

export const encodeKeysetCursor = (guard: string, sort: string, value: unknown, id: unknown): string =>
  encode({ v: CURSOR_VERSION, t: "k", g: guard, s: sort, k: tagValue(value), i: String(id) });

export const encodeOffsetCursor = (guard: string, offset: number): string =>
  encode({ v: CURSOR_VERSION, t: "o", g: guard, o: offset });

const encode = (cursor: Cursor): string => Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");

export const decodeCursor = (raw: string, guard: string): Cursor => {
  let parsed: Cursor;

  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    throw badCursor();
  }

  if (!parsed || parsed.v !== CURSOR_VERSION || parsed.g !== guard) throw badCursor();

  if (parsed.t === "o") {
    if (!Number.isInteger(parsed.o) || parsed.o < 0) throw badCursor();
    return parsed;
  }

  if (parsed.t === "k") {
    if (typeof parsed.s !== "string" || !Types.ObjectId.isValid(parsed.i)) throw badCursor();
    return parsed;
  }

  throw badCursor();
};

/** `"-createdAt"` -> `{ field: "createdAt", direction: -1 }`. Only the first token is used. */
export const parseSortToken = (sort: string): { field: string; direction: 1 | -1 } => {
  const token = sort.trim().split(/\s+/)[0] ?? "";
  return token.startsWith("-") ? { field: token.slice(1), direction: -1 } : { field: token, direction: 1 };
};

/**
 * `$sort` for a cursor-paged list. Every declared token is kept, then `_id` is
 * appended with the last token's direction — without that tiebreaker two jobs
 * created in the same millisecond can swap places between requests, so one shows
 * up twice and the other never does.
 *
 * `"-matchScore -createdAt"` -> `{ matchScore: -1, createdAt: -1, _id: -1 }`
 */
export const cursorSortStage = (sort: string): Record<string, 1 | -1> => {
  const tokens = sort.trim().split(/\s+/).filter(Boolean);
  const stage: Record<string, 1 | -1> = {};

  let direction: 1 | -1 = 1;
  for (const token of tokens) {
    direction = token.startsWith("-") ? -1 : 1;
    stage[token.replace(/^-/, "")] = direction;
  }

  stage._id = direction;
  return stage;
};

/**
 * `$match` condition for "everything strictly after (value, id)" in the given sort.
 *
 * The null terms are not optional. `salary` and `endDate` are optional fields, and
 * BSON orders `null` below every number — so descending puts the nulls last, and
 * `{ salary: { $lt: 50000 } }` alone would drop every job without a salary off the
 * second page onwards.
 */
export const keysetCondition = (cursor: KeysetCursor): Record<string, unknown> => {
  const { field, direction } = parseSortToken(cursor.s);
  const value = untagValue(cursor.k);
  const id = new Types.ObjectId(cursor.i);

  if (direction === -1) {
    // Already inside the trailing null block: only smaller _ids are left.
    if (value === null) return { $and: [{ [field]: null }, { _id: { $lt: id } }] };

    return {
      $or: [{ [field]: { $lt: value } }, { [field]: null }, { $and: [{ [field]: value }, { _id: { $lt: id } }] }],
    };
  }

  // Ascending: nulls lead, so from a null cursor everything non-null still follows.
  if (value === null) return { $or: [{ [field]: { $ne: null } }, { $and: [{ [field]: null }, { _id: { $gt: id } }] }] };

  return { $or: [{ [field]: { $gt: value } }, { $and: [{ [field]: value }, { _id: { $gt: id } }] }] };
};
