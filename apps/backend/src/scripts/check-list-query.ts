/**
 * Logic check for the shared list kit — no database, no server.
 *
 * `buildListQuery` and `runCursorList` sit under every migrated module, so a
 * regression here is a regression in all of them at once. Run it after touching
 * anything in `common/query`.
 *
 *   pnpm --filter @rl/backend check:list-query
 */
import { Types } from "mongoose";
import {
  bool,
  buildListQuery,
  dateRange,
  eq,
  gte,
  lt,
  lte,
  objectId,
  objectIdIn,
  oneOf,
  range,
  runCursorList,
  toCursorPage,
  ListQuerySpec,
} from "../common/query";
import { fileMediaListQuerySpec } from "../v1/modules/file-media/file-media.query";
import { formSubmissionListQuerySpec } from "../v1/modules/forms/form-submission/form-submission.query";
import { jobProfileListQuerySpec } from "../v1/modules/job-profile/job-profile.query";

const spec: ListQuerySpec = {
  filters: {
    status: eq("status"),
    type: oneOf("type"),
    salary: range("salary"),
    isActive: bool("isActive"),
    startDate: dateRange("startDate"),
  },
  sortable: ["createdAt", "name", "salary"],
  defaultSort: "-createdAt",
  searchKey: "clientSearch",
  searchFields: ["name", "description"],
};

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) return console.log(`  ok   ${label}`);
  failures++;
  console.log(`  FAIL ${label}\n       expected ${e}\n       actual   ${a}`);
};

console.log("\nbuildListQuery");

check("unknown key is ignored", buildListQuery({ nonsense: "x" }, spec).filter, {});

check("declared filters apply", buildListQuery({ status: "open", type: { in: ["a", "b"] } }, spec).filter, {
  status: "open",
  type: { $in: ["a", "b"] },
});

check("range builds bounds", buildListQuery({ salary: { gte: 50000, lte: 90000 } }, spec).filter, {
  salary: { $gte: 50000, $lte: 90000 },
});

check("regex metacharacters are escaped", buildListQuery({ clientSearch: "(a+)+$" }, spec).filter, {
  $or: [
    { name: { $regex: "\\(a\\+\\)\\+\\$", $options: "i" } },
    { description: { $regex: "\\(a\\+\\)\\+\\$", $options: "i" } },
  ],
});

check("bool only accepts a real boolean", buildListQuery({ isActive: true }, spec).filter, { isActive: true });
check("bool ignores the string 'true'", buildListQuery({ isActive: "true" }, spec).filter, {});

// The reason dateRange exists: Mongo's comparison operators are type-bracketed,
// so a string bound against a Date field matches nothing and raises no error.
const dated = buildListQuery({ startDate: { gte: "2026-01-01", lte: "2026-06-30" } }, spec).filter as {
  startDate: { $gte: unknown; $lte: unknown };
};
check("dateRange coerces to Date, not string", dated.startDate.$gte instanceof Date, true);
check(
  "dateRange keeps both bounds",
  [(dated.startDate.$gte as Date).toISOString(), (dated.startDate.$lte as Date).toISOString()],
  ["2026-01-01T00:00:00.000Z", "2026-06-30T00:00:00.000Z"]
);
check("dateRange drops an unparseable bound", buildListQuery({ startDate: { gte: "not-a-date" } }, spec).filter, {});

console.log("\nobjectId casting");

// The bug this exists for: `sanitizeQueryIds` decides what is an id from the key's
// *name*, so a ref like `jobTitle` never gets cast and the raw string reaches
// `$match`, matching nothing and raising no error.
const ID = "65a0000000000000000000ab";
const castSpec: ListQuerySpec = {
  filters: { jobTitle: objectId("jobTitle"), industry: objectIdIn("industry"), plain: eq("plain") },
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
};

const cast = buildListQuery({ jobTitle: ID, plain: ID }, castSpec).filter as {
  jobTitle: unknown;
  plain: unknown;
};
check("objectId casts to an ObjectId", cast.jobTitle instanceof Types.ObjectId, true);
check("objectId keeps the value", String(cast.jobTitle), ID);
check("eq leaves it a string — the bug, in one line", typeof cast.plain, "string");
check("objectId drops a malformed id", buildListQuery({ jobTitle: "nope" }, castSpec).filter, {});

const castIn = buildListQuery({ industry: { in: [ID, "nope"] } }, castSpec).filter as {
  industry: { $in: unknown[] };
};
check("objectIdIn casts each member", castIn.industry.$in[0] instanceof Types.ObjectId, true);
check("objectIdIn drops unparseable members", castIn.industry.$in.length, 1);

console.log("\nreal specs: every ObjectId ref actually casts");

// Imported from the modules themselves rather than rebuilt here, so these track the
// shipped specs. All six targeted ObjectId fields whose keys do not end in `Id`, so
// `sanitizeQueryIds` left them as strings and the filters matched nothing — and an
// empty collection makes that invisible over HTTP, which is how it shipped.
const castsTo = (build: (v: unknown, q: Record<string, unknown>) => unknown, field: string) => {
  const built = build(ID, {}) as Record<string, unknown> | undefined;
  return built?.[field] instanceof Types.ObjectId;
};

for (const [label, spec, field] of [
  ["job-profile.jobTitle", jobProfileListQuerySpec, "jobTitle"],
  ["job-profile.industry", jobProfileListQuerySpec, "industry"],
  ["job-profile.workMode", jobProfileListQuerySpec, "workMode"],
  ["job-profile.experienceLevel", jobProfileListQuerySpec, "experienceLevel"],
  ["file-media.collectionDocument", fileMediaListQuerySpec, "collectionDocument"],
  ["form-submission.collectionDocument", formSubmissionListQuerySpec, "collectionDocument"],
] as [string, ListQuerySpec, string][]) {
  check(`${label} casts to ObjectId`, castsTo(spec.filters[field], field), true);
}

console.log("\nmerging several keys onto one field");

const mergeSpec: ListQuerySpec = {
  filters: {
    endDateFrom: gte("endDate"),
    endDateTo: lte("endDate"),
    endDateBefore: lt("endDate"),
    status: eq("status"),
    // Sibling-aware: only applies when the caller did not choose a status.
    excludeClosed: (value, query) =>
      value === true && !query.status ? { status: { $nin: ["closed", "archived"] } } : undefined,
  },
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
};

check("one bound alone", buildListQuery({ endDateFrom: 1 }, mergeSpec).filter, { endDate: { $gte: 1 } });
check("two bounds merge rather than clobber", buildListQuery({ endDateFrom: 1, endDateTo: 9 }, mergeSpec).filter, {
  endDate: { $gte: 1, $lte: 9 },
});
check("three bounds merge", buildListQuery({ endDateFrom: 1, endDateTo: 9, endDateBefore: 5 }, mergeSpec).filter, {
  endDate: { $gte: 1, $lte: 9, $lt: 5 },
});

// A scalar equality and an operator object cannot share one key — `{ f: "x", f: {$gte} }`
// is not writable — so the second goes to `$and` rather than being dropped.
const collideSpec: ListQuerySpec = {
  filters: { exact: eq("f"), atLeast: gte("f") },
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
};
check("a scalar plus an operator object goes to $and", buildListQuery({ exact: "x", atLeast: 5 }, collideSpec).filter, {
  f: "x",
  $and: [{ f: { $gte: 5 } }],
});

// The search clause is an `$or` array, so it can never merge into a field — this is
// the case the old hand-written special-case covered, now handled by the same path.
const searchCollide = buildListQuery({ clientSearch: "a", status: "open" }, spec).filter as Record<string, unknown>;
check("search $or coexists with a field filter", Object.keys(searchCollide).sort(), ["$or", "status"]);

console.log("\nbuilders that read a sibling key");

check(
  "sibling-aware builder applies when the sibling is absent",
  buildListQuery({ excludeClosed: true }, mergeSpec).filter,
  {
    status: { $nin: ["closed", "archived"] },
  }
);
check("an explicit status wins", buildListQuery({ excludeClosed: true, status: "closed" }, mergeSpec).filter, {
  status: "closed",
});
check("neither sent", buildListQuery({}, mergeSpec).filter, {});

console.log("\nbuildListQuery, continued");

check("undeclared sort falls back", buildListQuery({ sort: "-secret" }, spec).options.sort, "-createdAt");
check("declared sort is kept", buildListQuery({ sort: "name" }, spec).options.sort, "name");
check("limit is capped at 100", buildListQuery({ limit: 5000 }, spec).options.limit, 100);
check("page is read when sent", buildListQuery({ page: 3 }, spec).page, 3);
check("page is undefined when absent", buildListQuery({}, spec).page, undefined);

// A page of fake documents, newest first, so keyset cursors have a real field.
//
// A third of them have a null `salary`. That is deliberate and it is the case
// most likely to break: BSON orders null below every number, so a descending
// sort puts the nulls in a block at the end, and a condition of
// `{ salary: { $lt: 50000 } }` alone would drop every one of them from the
// second page onwards. `keysetCondition` carries explicit null terms for that,
// and this is what exercises them.
const rows = Array.from({ length: 25 }, (_, i) => ({
  _id: `65a000000000000000000${String(i).padStart(3, "0")}`,
  name: `row-${i}`,
  createdAt: new Date(Date.UTC(2026, 0, 25 - i)),
  salary: i % 3 === 0 ? null : (25 - i) * 1000,
}));

/**
 * Minimal Mongo matcher — enough for the shapes `keysetCondition` emits. Without
 * this the fake fetch ignores the cursor entirely and the walk test proves nothing.
 */
type Row = (typeof rows)[number];
const cmp = (value: unknown, operand: unknown) => {
  const l = value instanceof Date ? value.getTime() : value;
  const r = operand instanceof Date ? operand.getTime() : String(operand).length === 24 ? String(operand) : operand;
  return { l: l as never, r: r as never };
};
const matches = (row: Row, cond: Record<string, unknown>): boolean => {
  if (Array.isArray(cond.$or)) return (cond.$or as Record<string, unknown>[]).some((c) => matches(row, c));
  if (Array.isArray(cond.$and)) return (cond.$and as Record<string, unknown>[]).every((c) => matches(row, c));

  return Object.entries(cond).every(([field, test]) => {
    const value = field === "_id" ? String(row._id) : (row as Record<string, unknown>)[field];
    if (test === null) return value === null || value === undefined;

    // Before the operator branch: a Date is an `object`, and Object.entries on one
    // is empty, so `.every()` would vacuously match every row.
    if (test instanceof Date) return value instanceof Date && value.getTime() === test.getTime();

    if (typeof test === "object" && test !== null) {
      return Object.entries(test as Record<string, unknown>).every(([op, operand]) => {
        const { l, r } = cmp(value, operand);
        if (op === "$lt") return l < r;
        if (op === "$gt") return l > r;
        if (op === "$ne") return l !== r;
        return false;
      });
    }
    return value === test;
  });
};

/** BSON collation for the fields here: null sorts below every number and date. */
const bsonCompare = (a: unknown, b: unknown): number => {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1;
  if (b === null || b === undefined) return 1;
  const l = a instanceof Date ? a.getTime() : (a as number);
  const r = b instanceof Date ? b.getTime() : (b as number);
  return l < r ? -1 : l > r ? 1 : 0;
};

const fakeFetch = async ({
  query,
  options,
  offset,
}: {
  query: Record<string, unknown>;
  options: { limit?: number; sort?: unknown };
  offset: number;
}) => {
  const limit = options.limit ?? 10;
  const token = String(options.sort ?? "-createdAt")
    .trim()
    .split(/\s+/)[0];
  const field = token.replace(/^-/, "") as "createdAt" | "salary" | "name";
  const dir = token.startsWith("-") ? -1 : 1;

  // The same total order the real `$sort` produces: (field, _id), both in the
  // sort's direction, with `_id` breaking ties.
  const matched = rows
    .filter((row) => matches(row, query))
    .sort((a, b) => bsonCompare(a[field], b[field]) * dir || (a._id < b._id ? -dir : dir));

  return toCursorPage(matched.slice(offset, offset + limit + 1), limit);
};
const fakeCount = async ({ query }: { query: Record<string, unknown> }) =>
  rows.filter((row) => matches(row, query)).length;

const run = (query: Record<string, unknown>) => runCursorList({ query, spec, fetch: fakeFetch, count: fakeCount });

(async () => {
  console.log("\nrunCursorList — cursor mode");

  const first = await run({ limit: 10 });
  check("returns a full page", first.docs.length, 10);
  check("cursor block has no totals", Object.keys(first.pagination).sort(), ["hasNextPage", "limit", "nextCursor"]);
  check("hasNextPage is true", (first.pagination as { hasNextPage: boolean }).hasNextPage, true);

  const nextCursor = (first.pagination as { nextCursor: string }).nextCursor;
  check("nextCursor is issued", typeof nextCursor, "string");

  // Walk the whole list two rows at a time and confirm no duplicates or gaps.
  const seen: string[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 40; i++) {
    const page: Awaited<ReturnType<typeof run>> = await run({ limit: 2, ...(cursor ? { cursor } : {}) });
    seen.push(...page.docs.map((d) => d._id as string));
    cursor = (page.pagination as { nextCursor: string | null }).nextCursor;
    if (!cursor) break;
  }
  check("walk visits every row once", seen.length, rows.length);
  check("walk has no duplicates", new Set(seen).size, rows.length);
  check("walk is in order", seen[0] === rows[0]._id && seen[seen.length - 1] === rows[rows.length - 1]._id, true);

  // The same walk over a NULLABLE field, in both directions. This is the case
  // real data has not covered — every job in the dev database has a salary — and
  // the one `keysetCondition`'s null terms exist for.
  for (const sort of ["-salary", "salary"]) {
    const walked: string[] = [];
    let c: string | null = null;
    for (let i = 0; i < 40; i++) {
      const page: Awaited<ReturnType<typeof run>> = await run({ limit: 2, sort, ...(c ? { cursor: c } : {}) });
      walked.push(...page.docs.map((d) => d._id as string));
      c = (page.pagination as { nextCursor: string | null }).nextCursor;
      if (!c) break;
    }
    check(`walk over nullable field (sort=${sort}) visits every row`, walked.length, rows.length);
    check(`walk over nullable field (sort=${sort}) has no duplicates`, new Set(walked).size, rows.length);
  }

  // A multi-token sort has no single field to key on, so it must fall back to an
  // offset cursor. Keyset-walking it would duplicate and skip rows.
  const multiSpec: ListQuerySpec = { ...spec, sortable: ["name"], defaultSort: "name -createdAt" };
  const multi = await runCursorList({ query: { limit: 10 }, spec: multiSpec, fetch: fakeFetch, count: fakeCount });
  const multiCursor = (multi.pagination as { nextCursor: string }).nextCursor;
  check(
    "multi-token sort issues an offset cursor, not a keyset one",
    JSON.parse(Buffer.from(multiCursor, "base64url").toString("utf8")).t,
    "o"
  );

  console.log("\nrunCursorList — legacy ?page= mode");

  const legacy = await run({ page: 2, limit: 10 });
  const block = legacy.pagination as unknown as Record<string, unknown>;
  check("second page skips the first", legacy.docs[0]._id, rows[10]._id);
  check("totalDocs is reported", block.totalDocs, 25);
  check("totalPages is reported", block.totalPages, 3);
  check("page echoes back", block.page, 2);
  check("pagingCounter is 1-based", block.pagingCounter, 11);
  check("hasPrevPage on page 2", block.hasPrevPage, true);
  check("prevPage/nextPage", [block.prevPage, block.nextPage], [1, 3]);
  check("legacy block still carries nextCursor", typeof block.nextCursor, "string");

  const lastPage = await run({ page: 3, limit: 10 });
  check("last page has no next", (lastPage.pagination as { hasNextPage: boolean }).hasNextPage, false);
  check("last page nextCursor is null", (lastPage.pagination as { nextCursor: unknown }).nextCursor, null);

  console.log("\ncursor guard");

  try {
    await run({ limit: 10, cursor: nextCursor, sort: "name" });
    failures++;
    console.log("  FAIL replaying a cursor under a different sort should throw");
  } catch (error) {
    check("rejects a cursor from a different sort", (error as Error).message.includes("cursor"), true);
  }

  try {
    await run({ limit: 10, cursor: nextCursor, status: "open" });
    failures++;
    console.log("  FAIL replaying a cursor under a different filter should throw");
  } catch (error) {
    check("rejects a cursor from a different filter", (error as Error).message.includes("cursor"), true);
  }

  try {
    await run({ limit: 10, cursor: "not-a-cursor" });
    failures++;
    console.log("  FAIL a malformed cursor should throw");
  } catch (error) {
    check("rejects a malformed cursor", (error as Error).message.includes("cursor"), true);
  }

  console.log("\nsecurity query composition");
  const composed = await runCursorList({
    query: { status: "open", limit: 5 },
    spec,
    securityQuery: { tenantId: "t1" },
    extraConditions: [{ isActive: true }],
    fetch: fakeFetch,
    count: fakeCount,
  });
  check("security query and extras join the $and", composed.finalQuery, {
    $and: [{ status: "open" }, { tenantId: "t1" }, { isActive: true }],
  });

  console.log(failures ? `\n${failures} FAILED\n` : "\nall passed\n");
  process.exit(failures ? 1 : 0);
})();
