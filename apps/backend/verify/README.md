# Verification requests

One `.http` file per migrated module. Run them with the **REST Client** extension
(`humao.rest-client`) in VS Code — click "Send Request" above any block.

There is no test suite in this repo, so these are the record of what each migrated
list endpoint is supposed to do. Run a module's file after migrating it, and again
if you touch `common/query`.

## Order

1. Start the API: `pnpm backend:dev` (needs Redis: `pnpm docker-compose:dev:up`).
2. Open the module's file and send its requests top to bottom. The first one is a
   login that stores `token` for the rest of that file — REST Client variables do
   not cross files, so every file logs in for itself. Credentials come from
   `.env.dev` (`ADMIN_USER_EMAIL` / `ADMIN_USER_PASSWORD`), which is also the user
   `pnpm seed:dev` creates.

Auth is the `x-auth-access-token` header, not `Authorization: Bearer`.

## What every module file checks

The five that apply everywhere, because they are what the migration changed:

| Check | Expected |
| --- | --- |
| unknown query param | `400` — it used to return an empty list |
| undeclared sort field | `400` — it used to reach `$sort` raw |
| regex metacharacters in the search term | `200`, no crash — it used to reach Mongo unescaped |
| `?page=1&limit=5` | `200` with `totalDocs` / `totalPages` (legacy shape still works) |
| `?limit=5` with no page | `200` with `pagination.nextCursor` and no `totalDocs` |

Plus that module's own filters.

## The two that catch real pagination bugs

- **Walk the cursor to the end with `limit=2`** and confirm no row appears twice and
  none is skipped. This is what the `_id` tiebreaker in `cursorSortStage` is for:
  without it, two documents sharing a sort value can swap places between requests,
  so one is returned twice and the other never.
- **Replay a cursor under a different sort** and confirm `400`. A cursor issued for
  `-createdAt` carries a date; used under `?sort=name` it would compare a date to a
  string and quietly return garbage. `cursorGuard` rejects it.

The pure-logic half of both is covered without a server by
`pnpm --filter @rl/backend check:list-query`.

## Data

`pnpm seed:dev` seeds the admin user and the reference catalogs only — no jobs,
tenants or profiles. So the catalog files work against a fresh local database, but
the owner-scoped modules need real rows. `.env.dev` currently points at a shared
Atlas cluster that has them; note that these requests read and write a database
other people may be using.
