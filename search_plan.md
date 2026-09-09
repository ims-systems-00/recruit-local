# Job search: per-module query builder + hybrid Atlas search

Status: **done for every mounted module.** `MongoQuery` is gone from all 35 live list
endpoints; the 6 files still importing it are unmounted dead code. See "Rollout
progress" at the bottom.

## Why

`MongoQuery` turned any leftover query param into a `$match` clause. Nothing validated it:

```
?vacancy[gte]=3          -> { vacancy: { $gte: "3" } }   string vs number, matches nothing
?title[regex]=(a+)+$     -> raw ReDoS pattern reaches Mongo
?nonsense=x              -> { nonsense: "x" }, endpoint quietly returns zero jobs
```

And search was an unindexed regex scan across `["title","description","company","location"]` —
where `company` is not even a field on the Job model, so that clause never matched.

## What changed

**Query building.** Each module now declares the params it accepts. Unknown keys 400 instead of
silently returning nothing.

- `common/middlewares/validation.middleware.ts` — new `validateQuery`. The existing
  `validate("query")` discards Joi's coerced value, so `.default()`s never applied and `page`
  stayed a string. This one writes the parsed value back.
- `common/query/list-query.ts` — `buildListQuery` plus `eq` / `oneOf` / `range` / `bool`.
- `job.validation.ts` — `listQuerySchema`. `job.query.ts` — `jobListQuerySpec`.

Query keys are unchanged, so **no frontend edit was needed**. `clientSearch` is still the search
key. `salaryMode` (which the frontend sends and Job has no field for) is accepted and dropped
rather than 400'ing a page that works today.

**Hybrid search.** `$rankFusion` fuses a Lucene keyword branch with a vector branch, so
"work from home frontend" can surface "Remote React Developer" — no shared words.

- `common/helper/embedding.ts` — `generateEmbedding`, batch variant, and `getQueryEmbedding`
  with a 24h Redis cache under `rl:embedcache:*`.
- `job/embedding.service.ts` — builds the embedded text. Pulls the **tenant name** in, which is
  how company search finally works.
- `queue/embeddingUpdateQueue.ts` — chained off `keywordUpdateQueue`, so every job create/update
  already triggers it.
- `job.query.ts` — `hybridSearchStages`, `jobSearchPreFilter`.
- Job model gains `embedding` (`select: false`) and `embeddingUpdatedAt`.

### Security

The `$match` carrying the CASL query stays the authoritative gate; it just runs *after* the search
stage now instead of first. The `preFilter` pushed inside `$search` / `$vectorSearch` exists only
so the ANN branch does not return 200 global rows that the security filter then reduces to three.
**It is not the boundary.** `matchScore`, `alreadyApplied`, `alreadySaved` are untouched.

## Steps you need to run

Atlas only — `$search` / `$vectorSearch` / `$rankFusion` do not exist on the local `mongo:7`.

```sh
# 1. .env.dev — swap to the Atlas URL (line 3 is already there, commented)
#      MONGO_URL=mongodb+srv://...@cluster0.tr5lx.mongodb.net/

pnpm docker-compose:dev:up            # redis is still needed
pnpm migrate:dev                      # marks existing jobs un-embedded
pnpm --filter @rl/backend search-indexes:dev      # creates + waits for both Atlas indexes
pnpm --filter @rl/backend backfill:embeddings:dev # embeds existing jobs, resumable
pnpm backend:dev
```

`search-indexes:dev` runs `$rankFusion` as a live probe rather than trusting the version string.
Verified working on Atlas **8.0.30**.

## Verify

```sh
curl -s '.../api/v1/jobs?nonsense=x'                    # 400, was an empty list
curl -s '.../api/v1/jobs?yearOfExperience[gte]=3'       # now filters; was comparing "3" to a number
curl -s '.../api/v1/jobs?clientSearch=work%20from%20home%20frontend'   # semantic hit
curl -s '.../api/v1/jobs?clientSearch=work%20from%20home%20frontend&semantic=false'  # keyword only
curl -s '.../api/v1/jobs' | jq '.jobs[0] | has("embedding")'          # false
```

Employer sees only their tenant's jobs; candidate and `/public/jobs` see only open ones.

## Known behaviour changes

- **`totalDocs` in search mode** counts fused search hits (capped ~200/branch), not all matching
  jobs. Normal for search UIs, but pagination totals shift.
- **`matched` + a search term**: search wins. `$rankFusion` already ordered the results and a
  trailing `$sort` would discard that. Feed-id narrowing still applies.
- **Atlas index build lag**: `createSearchIndex` returns before the index is queryable. Searches
  return empty, not an error, until READY. The script polls for it.

## Rollout progress

### Phase 0 — the shared kit (done)

The job controller carried ~50 lines of cursor wiring. Copying that into 30-odd
controllers is how the ordering rules get broken one at a time, so it was extracted
first:

- `common/query/cursor-list.ts` — **new**. `runCursorList` (the whole list half of a
  controller), `cursorPageStages` / `toCursorPage` (the service tail), `nextCursorFrom`.
  A `prepare` hook covers modules whose scope depends on the parsed query — `job`
  needs the search term before it can decide to embed it or narrow to the feed.
- `common/query/list-query.ts` — `regexSearch` (escaped, so the ReDoS hole MongoQuery
  left open is closed for every module that is not on Atlas), `dateRange`, a
  `searchFields` key on the spec, and `page` parsing.
- `common/helper/escape-regex.ts` — **new**. Promoted out of `agent/tools/tool.shared.ts`,
  which now re-exports it so its importers are untouched.
- `scripts/check-list-query.ts` — **new**, `pnpm --filter @rl/backend check:list-query`.
  26 assertions over the kit with no database: filter building, regex escaping, both
  pagination modes, and a full cursor walk that proves no row repeats or is skipped.
- `verify/` — **new**. One `.http` file per migrated group, for the parts that need a
  live server.

### Pagination is dual-mode during the rollout

`?page=` was **not** removed from the other modules, and has been put back on `job`.

The reason: `apps/frontend/services/jobs/jobs.server.ts` sends `page: params?.page || 1`
unconditionally, so `page: Joi.any().forbidden()` made every job list request a 400.
The same line is in ~15 other frontend services; several catalogs drive
`useInfiniteQuery` off `pagination.page + 1`; and `services/shared/schema.ts` marks
`totalDocs`, `totalPages`, `page`, `pagingCounter`, `hasPrevPage`, `prevPage` and
`nextPage` as **required**, so a cursor response fails validation client-side.

So a migrated endpoint serves whichever shape the caller asks for:

```
?page=2  -> { totalDocs, totalPages, page, pagingCounter, hasPrevPage,
              hasNextPage, prevPage, nextPage, nextCursor }   legacy + a way forward
?cursor= -> { limit, hasNextPage, nextCursor }                no $count branch
(neither)-> cursor
```

Every schema declares `page: Joi.number().integer().min(1)`. The last step of the
rollout, once no caller sends it, is one pass flipping them all to
`Joi.any().forbidden()`.

### Migrated

| Module | Notes |
| --- | --- |
| `job` | Retrofitted onto `runCursorList`; `list` and `publicList` now share one path. `?page=` un-forbidden — this is the fix for the 400. |
| `job-title`, `industry`, `work-mode`, `experience-level` | Identical flat catalogs. |
| `value` | Adds a `type` enum filter. `topThree` moved off MongoQuery too. |
| `skill` | First with CASL scoping + field sanitizing. `jobProfileId` is a filter; `assertProfileScopedListAccess` still gates whose profile may be asked for. |
| `status`, `action` | Search was **unreachable** on both: their schemas declared `sortBy`/`sortOrder` (ignored by MongoQuery) and rejected `clientSearch` (read by it). Both also searched non-existent paths — `value` on Status, `label` on Action. Now searching `label` / `actionType`; the legacy sort keys are accepted and dropped. `status`' trash list moved off MongoQuery as well. |
| `education`, `experience`, `certification`, `interest` | Batch 2. Same shape as `skill`: ability check, `assertProfileScopedListAccess`, then the CASL query. `jobProfileId` is a declared filter; the security query is still the boundary. `experience` gains enum filters (`workplace`, `employmentType`) and `isActive`. |
| `user-interest-survey` | Scoped by `userId` rather than a job profile. |
| `kyc`, `reaction`, `prompt` | Batch 3, `skill` shape: ability check, CASL query, field sanitizing. |
| `file-media`, `salary` | No CASL scoping (unchanged). `salary` is the public, unauthenticated list, so its allowlist is the only guard on the query string. |
| `event`, `event-registration`, `skill-assessment` | Search was **unreachable**: each declared `search` while MongoQuery read `clientSearch`, which the schema then rejected. The schema now `.rename()`s `search` → `clientSearch`, so both keys work. |
| `skill-assessment-result` | `minScore`/`maxScore` and `sortBy` were declared but ignored — they work now. `score` was also in `searchFields`; it is a Number, so that half never matched and is gone. |
| `favourite` | Polymorphic fan-out preserved. No `searchFields` — a Favourite carries no text of its own, only a pointer. |
| `agent` (conversations) | Moved off `paginateAndExcludeDeleted` to a `find` + cursor. |
| `notification` | Migrated, but see the security note below — still unscoped. |
| `forms/form`, `forms/form-submission` | Cursor-paged via `find`. Submissions stay scoped by the `:formId` route param, not a query filter. |
| `forms/form-element` | **Hardened only, still offset-paged.** It walks the element chain with `$graphLookup` and returns a form's structure in sequence order; a keyset cursor would key on a field that traversal does not order by. Params are validated, pagination is unchanged. |
| `application`, `user`, `tenant` | Batch 4. `user` searched `fullName` — a **virtual**, not a stored path — so its search matched nothing; it now searches `firstName`/`lastName`/`email`. `application`'s `tenantId` filter narrows *within* an employer's `{ tenantId }` CASL grant; it cannot widen past it. |
| `job-profile` | Two lists. `list` searched `headline`, which is **not a path** on JobProfile — now `name`/`summary`. `getAppliedJobs` pages over *applications* and returns jobs, so the cursor is the applications cursor; the jobs query is a lookup of that page's ids, not a page of its own. |
| `post` | Batch 5. Feed/matched machinery preserved via the `prepare` hook, same as `job`. Per-viewer flags (`alreadyReacted`, `alreadySaved`, reaction counts) moved past the `$limit` so they join the page instead of every matching post. |
| `cv` | Keeps its extra pin: a candidate's CASL rules also match any *published* CV, so the security query alone does not hold the list to one person. `jobProfileId` is accepted by the schema but deliberately **not** a spec filter — the pin does the scoping, and duplicating it as a filter would obscure that. |

Catalogs had **no sort at all** before (MongoQuery passes `sort: undefined`), which
cursor paging cannot walk safely. They now default to ascending `createdAt` — the
seeded order, so nothing visibly reorders.

The profile-owned lists needed a default sort for the same reason, and there the
natural choice does reorder them: `education` and `experience` default to
`-startDate`, `certification` to `-issueDate`. That is newest-first, which is how a
CV section reads, but it is a visible change from insertion order — worth a look on
the profile pages.

`dateRange` was added to the kit for these three. It exists because Mongo's
comparison operators are type-bracketed: `{ startDate: { $gte: "2026-01-01" } }` —
a string against a Date — matches zero documents and raises no error.

Batch 3 added one more guard to the kit. `prompt` defaults to a **two-token** sort
(`name -version`), and a keyset cursor keys on the first token only — so it would
have walked (name, _id) while the list was ordered (name, version, _id),
duplicating some rows and skipping others. `runCursorList` now detects a
multi-token sort and issues an offset cursor instead. It is not opt-in.

Two routes (`prompt`, `agent`) also defined their own
`const validateQuery = validate("query")`, the variant that reports errors but
throws Joi's coerced value away, so defaults never applied. Both now use the
shared middleware, which fixes `/prompts/resolve` and `/agent/traces/stats` as
a side effect.

### Downstream fallout of the `application` migration

`applicationService.list` stopped returning `totalDocs`, which three callers used:

- `agent/tools/list-applications.tool.ts` — hoists the composed query into a
  variable and asks `applicationService.count({ query })` for the total, so the
  number matches exactly what the page was drawn from.
- `job.controller.ts` `allApplicationsForJob` — switched to `formatCursorListResponse`.
- `job-profile.controller.ts` `getAppliedJobs` — see above.

### Remaining — nothing mounted

Per module: `listQuerySchema` in `*.validation.ts`, `<module>ListQuerySpec` in
`*.query.ts`, `validateQuery` on the route, `runCursorList` in the controller,
`cursorPageStages`/`toCursorPage` + a `count` export in the service, and a compound
index `{ <scope>: 1, <sortField>: -1, _id: -1 }` with a migration.

Every router mounted in `v1/routes/api-routes.ts` is migrated. Six controllers still
import `MongoQuery`, all **unmounted dead code**: `board`, `comment-activity`,
`document-folder`, `invitation`, `response-template`, `task`. Migrating them would
cost time and prove nothing; deleting them is a separate call.

### What is left to do

1. **Frontend.** Every service still sends `page: … || 1`, so every list is on the
   legacy branch and nothing has changed for the app. Moving a module to cursors
   means: stop sending `page`, read `pagination.nextCursor`, and relax
   `services/shared/schema.ts` — its `paginationSchema` marks `totalDocs`,
   `totalPages`, `page`, `pagingCounter`, `hasPrevPage`, `prevPage` and `nextPage`
   as required, so a cursor response fails validation today.
2. **Then drop the legacy branch.** One pass flipping every `page:
   Joi.number().integer().min(1)` to `Joi.any().forbidden()`, and deleting the
   offset half of `runCursorList`.
3. **Compound indexes.** Each cursor-paged list wants
   `{ <scope>: 1, <sortField>: -1, _id: -1 }` plus a migration, mirroring
   `20260907120000-job-cursor-indexes.js`. Only `job` has them so far; the rest
   are correct without them, just slower on deep pages.
4. **Close the `notification` hole** (below).
5. **Semantic search** for `post`, `job-profile`, `tenant` — Phase 6, unstarted.

Skip: `board`, `comment-activity`, `document-folder`, `invitation`, `task`,
`response-template`, `url-metadata-parser`, `location` — routers not mounted.

### Broken search fields — all now fixed

Every one of these matched nothing before, so search on those endpoints returns
rows where it previously returned none:

| Module | Old `searchField` | Why it never matched | Now searches |
| --- | --- | --- | --- |
| `user` | `fullName` | a virtual, not a stored path | `firstName`, `lastName`, `email` |
| `job-profile` | `headline` | not a path on the model | `name`, `summary` |
| `skill-assessment-result` | `score` | a Number — regex cannot match it | `recommendations` |
| `status` | `value` | not a path on the model | `label` |
| `action` | `label` | not a path on the model | `actionType` |
| `form-submission` | `name` | not a path on the model | — (no text to search) |
| `favourite` | *(none)* | nothing to search: it is a pointer | — (unchanged, deliberately) |
| `event-registration` | `status` | an enum — only whole values matched | `status` (kept) |

Separately, `event`, `event-registration`, `skill-assessment`, `status` and
`action` had search **unreachable** regardless of field, because their schemas
declared `search`/`sortBy` while MongoQuery read `clientSearch`.

### Two security gaps found next door

- **`notification` lists every user's notifications.** The controller passes no
  security query, so any authenticated user can read everyone's. Migrated in batch 3
  with the params validated and the hole documented in `notification.validation.ts`
  and `notification.query.ts`, but **not closed** — closing it changes what users
  see, which is a product call. The fix is to scope the list to
  `req.session.user._id` (or a CASL query) and stop treating the `userId` query key
  as caller-supplied.
- **`event` defines `roleScopedSecurityQuery` and never calls it.** Also migrated
  without changing that, and noted in `event.query.ts`.

Neither was tightened silently: both reduce what some users currently see.

### Semantic search — only `post`, `job-profile`, `tenant`

Everything else gets `regexSearch`. Those three repeat what `job` did: `embedding`
(`select: false`) + `embeddingUpdatedAt` on the model, an `embedding.service.ts`, an
enqueue chained off `keywordUpdateQueue`, index definitions in
`scripts/ensure-search-indexes.ts`, a backfill script, and `hybridSearchStages` as
pipeline stage 0.

## Note

`cv-extract.service.ts` constructs its OpenAI client at module scope, so the backend will not boot
without `OPENAI_API_KEY`. That predates this work and was left alone. The new embedding client is
lazy, so a missing key degrades search to keyword-only instead of killing the process.
