# syntax=docker/dockerfile:1

# Multi-stage: the toolchain, devDependencies and TypeScript sources stay in the
# builder. Only compiled output plus production dependencies reach the runtime.

########################  base  ########################
FROM node:22-slim AS base

# corepack ships with node; `npm install -g pnpm` cost ~57MB for the same thing.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /usr/src/app

########################  builder  ########################
FROM base AS builder

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/backend ./apps/backend
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# Workspace packages first — @rl/backend compiles against their emitted dist/.
RUN pnpm run --filter @rl/types build \
    && pnpm run --filter @rl/authz build \
    && pnpm run --filter @rl/utils build \
    && pnpm run --filter @rl/backend build

########################  runner  ########################
FROM base AS runner

# The placeholder thumbnail SVG asks for "Arial, Helvetica, sans-serif"; Liberation
# Sans is the metric-compatible substitute sharp resolves. Without these the label
# renders blank instead of failing loudly.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        fonts-dejavu-core \
        fonts-liberation && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Manifests only, so the production install caches independently of build output.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/authz/package.json ./packages/authz/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile --prod

# Compiled output only. No src/, no typescript, no ts-node, no nodemon.
# `pnpm run build` runs postEsBuild, which copies email templates and src/assets
# into dist/ — so runtime assets come along with these.
COPY --from=builder /usr/src/app/packages/types/dist ./packages/types/dist
COPY --from=builder /usr/src/app/packages/authz/dist ./packages/authz/dist
COPY --from=builder /usr/src/app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /usr/src/app/apps/backend/dist ./apps/backend/dist

# migrate-mongo reads plain .js migrations from src/migrations, which tsc does not
# emit into dist/. A few KB, and it keeps `pnpm migrate` usable inside the image.
COPY apps/backend/migrate-mongo-config.js ./apps/backend/
COPY apps/backend/src/migrations ./apps/backend/src/migrations

WORKDIR /usr/src/app/apps/backend

EXPOSE 9027

CMD ["node", "dist/src/server.js"]
