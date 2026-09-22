# Recruit Local (`recruit-local`)

A recruitment platform: a TypeScript pnpm-workspace monorepo with an Express API, a Next.js
app, and an AI assistant ("Alice") built on the same authorization rules as the rest of the
product.

| Workspace        | Package        | What it is                                   |
| ---------------- | -------------- | -------------------------------------------- |
| `apps/backend`   | `@rl/backend`  | Express 4 + Mongoose 8 REST API (CommonJS)   |
| `apps/frontend`  | `@rl/frontend` | Next.js 16 App Router + React 19             |
| `packages/types` | `@rl/types`    | Shared enums, interfaces, CASL action types  |
| `packages/authz` | `@rl/authz`    | CASL ability builders, one per domain entity |
| `packages/utils` | `@rl/utils`    | Shared pure helpers                          |

Both apps consume `@rl/types` and `@rl/authz`, so permissions are defined once and enforced
on both sides.

---

## 1. Prerequisites

- **Node >= 20.14** and **pnpm 10.10** — `corepack enable` is enough; `pnpm` only, never
  `npm` or `yarn`.
- **Docker** with Compose v2 (`docker compose`, not `docker-compose`).
- An **OpenAI API key** with access to `gpt-4o`, `text-embedding-3-small` and
  `gpt-4o-mini-tts`. CV extraction, the assistant and its speech replies all need it.

MongoDB must run as a **replica set** — the backend uses transactions (`withTransaction`),
and a plain `mongod` will fail. The dev Compose file handles this for you.

---

## 2. Run it locally

```sh
git clone <repo> && cd recruit-local
pnpm install

# 1. Environment files (see §3 for what goes in them)
cp apps/backend/.env.dev.example apps/backend/.env.dev
#    Create apps/frontend/.env.local — there is no example file; see §3.

# 2. Dependencies: Mongo (single-node replica set rs0) + Redis
pnpm docker-compose:dev:up

# 3. Shared packages — the backend compiles against their dist/, not their src/
pnpm build:packages

# 4. Schema and data
pnpm migrate:dev
pnpm seed:dev

# 5. Backend + frontend together
pnpm start:dev
```

| URL                                  | What                                                        |
| ------------------------------------ | ----------------------------------------------------------- |
| `http://localhost:3000`              | Frontend                                                    |
| `http://localhost:9027/api/v1`       | API                                                         |
| `http://localhost:9027/`             | Health check — returns `{"message":"Active"}`               |
| `http://localhost:9027/admin/queues` | Bull Board. **Unauthenticated — never expose it publicly.** |
| `http://localhost:3000/studio`       | Sanity Studio                                               |

Mongo listens on `127.0.0.1:27017` and Redis on `127.0.0.1:6379`; both are bound to
localhost only. Stop them with `pnpm docker-compose:dev:down`.

`pnpm seed:dev` creates the platform admin from `ADMIN_USER_EMAIL` / `ADMIN_USER_PASSWORD`,
so set those before seeding or you get no way in.

---

## 3. Environment files

Never commit any of these. Each app holds its own; there is no root `.env`.

| File                       | Used by                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `apps/backend/.env.dev`    | `pnpm backend:dev` (loaded by `env-cmd`) and the dev scripts   |
| `apps/backend/.env`        | Backend container at runtime (Compose `env_file`)              |
| `apps/frontend/.env.local` | `pnpm frontend:dev`                                            |
| `apps/frontend/.env`       | Frontend image **build** (`NEXT_PUBLIC_*` inlined) and runtime |

`apps/backend/.env.dev.example` and `.env.prod.example` document the backend shape. The
keys that most often go wrong:

| Key                                | Notes                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `MONGO_URL`, `DATABASE_NAME`       | The URL carries host and options; the database name is appended by the app.                      |
| `OPENAI_API_KEY`                   | **Required.** CV extraction, the agent, embeddings and text-to-speech.                           |
| `REDIS_URL` or `REDIS_HOST`/`PORT` | **Required in production** — see §6. Leave unset locally to use `127.0.0.1:6379`.                |
| `ADMIN_USER_EMAIL` / `_PASSWORD`   | The seeded platform admin.                                                                       |
| `AGENT_*`                          | All optional; every one has a code default (`AGENT_MODEL` → `gpt-4o`, `AGENT_MAX_STEPS` → 6, …). |
| `AGENT_CONFIRMATION_SECRET`        | Optional; falls back to `ACCESS_TOKEN_SECRET`.                                                   |

The frontend has no example file. For local development:

```sh
# apps/frontend/.env.local
NEXT_PUBLIC_BASE_API_URL=http://localhost:9027/api
NEXT_PUBLIC_API_VERSION=v1
NEXTAUTH_SECRET=<any long random string>
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

For Docker and production, use `apps/frontend/.env` with the **public** hostnames, plus
`INTERNAL_API_URL=http://rl_backend:9027/api` (server-side calls take the in-network
route) and `NEXTAUTH_URL=<your public origin>`.

---

## 4. Everyday commands

Run from the repo root.

```sh
pnpm build                 # every workspace
pnpm build:packages        # types, authz, utils — run after editing any packages/*
pnpm build:backend
pnpm backend:dev           # nodemon + ts-node
pnpm frontend:dev          # next dev --turbopack
pnpm lint                  # eslint, flat config
pnpm format                # prettier --write .
```

There is no test suite. Verify changes by building and by exercising the API.

Prettier configs differ per workspace on purpose — the backend uses double quotes at
`printWidth: 120`, everything else single quotes. Don't normalize across that boundary.

---

## 5. Database tasks

Each task has a dev flavour (ts-node, reads `.env.dev`) and a prod flavour (compiled `dist/`,
reads the process environment).

| Task               | Local                                           | In the container           |
| ------------------ | ----------------------------------------------- | -------------------------- |
| Migrations         | `pnpm migrate:dev`                              | `pnpm migrate:prod`        |
| Roll one back      | `pnpm migrate-down:dev`                         | `pnpm migrate-down:prod`   |
| All seeders        | `pnpm seed:dev`                                 | `pnpm seed`                |
| Help articles only | `pnpm --filter @rl/backend seed:help:dev`       | `pnpm seed:help`           |
| Publish prompts    | `pnpm --filter @rl/backend prompts:publish:dev` | `pnpm prompts:publish`     |
| Atlas search idx   | `pnpm search-indexes:dev`                       | `pnpm search-indexes:prod` |

**Migrations.** `migrate-mongo`, plain `.js` files in `apps/backend/src/migrations/`, named
`<timestamp>-<description>.js`. Any change to an existing document shape needs one — the
seeder is not a substitute. The backend image ships the migrations directory and
`migrate-mongo`, so `pnpm migrate:prod` works inside the running container.

**Seeders** (`apps/backend/src/seeders/`) are all create-if-missing, so `pnpm seed` is safe
to re-run against a populated database. Two things to know:

- The prompt seeder writes **v1 only** and never touches an existing prompt, so editing a
  `DEFAULT_*_PROMPT` constant and re-seeding changes nothing. That is what
  `prompts:publish` is for.
- The value seeder deletes values whose `type` is no longer in `VALUE_TYPE_ENUM`, i.e.
  deprecated types only.

**Prompts.** The agent resolves its system prompts from the `prompts` collection and falls
back to the in-code defaults when a prompt is missing — logging a warning and re-querying
on every turn, because fallbacks are deliberately not cached. To move a database onto newer
in-code prompt text:

```sh
pnpm prompts:publish -- --dry-run                        # show what would change
pnpm prompts:publish                                     # append a version, move `production`
pnpm prompts:publish -- --only agent.system.candidate    # one prompt
pnpm prompts:publish -- --rollback agent.system.base=1   # undo, printed by the publish run
```

Running servers keep the resolved prompt cached for `PROMPT_CACHE_TTL_MS` (60s default), so
a publish takes effect within a minute — no restart.

**Atlas search indexes** are Atlas-only (`$rankFusion`, Mongo 8.0+). The script fails by
design against a self-hosted `mongod`, so skip it locally.

---

## 6. Deploy to production

Production runs the whole stack with `docker-compose.yml`: `rl_backend`, `rl_frontend` and
`rl_nginx`, on an **external** Docker network named `ims-dev-infra`. Only nginx is
published, on host port **8247**, proxying `/api/v1/` to the backend and everything else to
Next.js (`/api/auth/*` stays on the frontend for NextAuth).

**The prod Compose file runs neither MongoDB nor Redis.** Both must already exist and be
reachable from that network.

> **Redis is no longer bundled in the backend image.** It was removed when the Dockerfiles
> moved to multi-stage builds. Some comments in `docker-compose.yml`, the `.env` examples
> and `src/.config/ioredis.ts` still claim otherwise. If you leave every `REDIS_*` unset in
> production, the backend connects to `127.0.0.1:6379` _inside its own container_, finds
> nothing, and every queue — feed rebuilds, fanout, thumbnails, keyword and salary updates —
> silently stops working. Set `REDIS_URL` (use `rediss://` for TLS) or the discrete
> `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` vars.

### First deploy

```sh
# On the host, once:
docker network create ims-dev-infra          # if it does not already exist

git clone <repo> && cd recruit-local
# Create apps/backend/.env and apps/frontend/.env with production values (§3).

docker compose build
docker compose run --rm rl_backend pnpm migrate:prod
docker compose up -d
docker compose exec rl_backend pnpm seed            # admin, catalogs, prompts, help articles
docker compose exec rl_backend pnpm prompts:publish -- --dry-run
```

On a freshly seeded database that dry run reports _"up to date (production v1)"_ for every
prompt — v1 was just seeded from the same constants the publisher compares against, so
there is nothing to publish. That is the expected result, not a failure.

### Updating an existing deployment

```sh
git pull origin main
docker compose build                                 # NEXT_PUBLIC_* are compiled in — always rebuild
docker compose run --rm rl_backend pnpm migrate:prod # migrate before the new code serves traffic
docker compose up -d
docker compose exec rl_backend pnpm seed:help        # if the help corpus changed
docker compose exec rl_backend pnpm prompts:publish -- --dry-run
docker compose exec rl_backend pnpm prompts:publish  # if the dry run shows changes
```

Order matters: a migration that backfills a field the new code reads should land before that
code takes traffic, which is why the migration runs in a throwaway container while the old
one is still up.

### Verify

```sh
docker compose ps
docker compose logs -f rl_backend
docker compose exec rl_backend pnpm migrate status          # applied vs pending
curl -s -o /dev/null -w '%{http_code}\n' localhost:8247/    # frontend through nginx
docker compose exec rl_backend node -e "fetch('http://127.0.0.1:9027/').then(r=>r.text()).then(console.log)"
```

The backend logs its Redis target on boot (`Redis target [host:port] db=… tls=…`) — check
that line says what you expect before assuming the queues are healthy.

---

## 7. Troubleshooting

**`<prompt>: not in the registry — run the prompt seeder first. Skipped.`**
The `prompts` collection is empty on that database — the migration builds the collection and
its indexes but never writes rows. Run `pnpm seed` (or just the prompt seeder), then publish.

**A frontend change didn't appear after `docker compose up -d`.**
`NEXT_PUBLIC_*` values and the whole bundle are baked into the image at build time. Re-run
`docker compose build` (or `up -d --build`).

**The API returns nothing for a field you just added.**
`sanitizeDocument` strips anything not in the CASL allowlist. Add the field to
`ALL_<ENTITY>_FIELDS` and to the relevant per-role field lists in
`packages/authz/src/<entity>.authz.ts`, then `pnpm build:packages`.

**Backend won't start: transaction errors.**
Mongo is not running as a replica set. Use `pnpm docker-compose:dev:up` rather than a local
`mongod`.

**Edited a shared package and nothing changed.**
Consumers resolve the built `dist/`. Run `pnpm build:packages`.

**Queues idle in production.** See the Redis note in §6.

**DOC/DOCX thumbnails are placeholder cards.**
Expected in Docker. The image does not bundle LibreOffice (it added ~467MB), so
`renderOfficeThumbnail` falls back to a generated card; PDF and image thumbnails are
unaffected. To render real ones locally on macOS:

```sh
brew install --cask libreoffice
export LIBREOFFICE_BIN="/Applications/LibreOffice.app/Contents/MacOS/soffice"
"$LIBREOFFICE_BIN" --headless --version
```

---

## 8. Conventions

- **Commits**: Conventional Commits — `feat(kyc): …`, `fix(dockerization): …`. commitlint and
  lint-staged are installed but no git hooks are wired up, so match the convention by hand.
- **Branches**: `feat/<topic>`, `fix/<topic>`; `main` is the default branch.
- **Imports**: relative inside the backend, `@rl/*` for shared packages, `@/` in the frontend.
- **Redis keys**: everything this app writes is namespaced under `rl:` — the server is shared
  with other projects. Pass `prefix: REDIS_KEY_PREFIX` to every BullMQ `Queue`, `Worker` and
  `QueueEvents`, and build direct ioredis keys from the same constant.

See [CLAUDE.md](CLAUDE.md) for the architecture tour: module layout, the request pipeline,
the CASL field-level authorization model, and how background work is split between BullMQ
and Agenda.

---

## Appendix: building single images for a registry

Used by the ECR / Elastic Beanstalk path rather than Compose.

```sh
# arm64 host
docker build --build-arg NODE_ENV=production -t inrm-backend:latest -f apps/backend/Dockerfile .

# x86 target from an arm64 host
docker build --platform=linux/amd64 --build-arg NODE_ENV=production -t inrm-backend:latest -f apps/backend/Dockerfile .
```

```sh
aws ecr get-login-password --region eu-west-2 \
  | docker login --username AWS --password-stdin 774305577345.dkr.ecr.eu-west-2.amazonaws.com
docker tag inrm-backend:latest 774305577345.dkr.ecr.eu-west-2.amazonaws.com/interface-nrm:latest
docker push 774305577345.dkr.ecr.eu-west-2.amazonaws.com/interface-nrm:latest
```

`Dockerrun.aws.json`:

```json
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "774305577345.dkr.ecr.eu-west-2.amazonaws.com/interface-nrm",
    "Update": "true"
  },
  "Ports": [{ "ContainerPort": 9027 }]
}
```

```sh
aws cloudfront create-invalidation --distribution-id E16D43XS2EULWY --paths "/*"
```
