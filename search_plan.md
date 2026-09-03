# Job search: per-module query builder + hybrid Atlas search

Status: **implemented for the `job` module.** Every other module still uses `MongoQuery`.

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

## Remaining modules

Same two-file pattern — `listQuerySchema` in `*.validation.ts`, `*ListQuerySpec` in `*.query.ts`,
swap `MongoQuery` for `buildListQuery`. ~36 controllers left. Suggested order:

1. Flat catalogs (`job-title`, `industry`, `experience-level`, `work-mode`, `value`) — near
   identical, no security query.
2. The 8 with an existing (broken) `validate("query")` schema — `board`, `status`, `action`,
   `favourite`, `event`, `event-registration`, `skill-assessment`, `sar`. Their schemas declare
   `search`/`sortBy`/`sortOrder`, which `MongoQuery` ignores, while rejecting `clientSearch`,
   which it reads — so search is currently unreachable on all eight.
3. The rest. `post` last: it shares job's feed/matched machinery and is the natural second
   candidate for hybrid search.

## Note

`cv-extract.service.ts` constructs its OpenAI client at module scope, so the backend will not boot
without `OPENAI_API_KEY`. That predates this work and was left alone. The new embedding client is
lazy, so a missing key degrades search to keyword-only instead of killing the process.
