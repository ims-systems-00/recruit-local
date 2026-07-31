# syntax=docker/dockerfile:1

# Multi-stage: the full workspace install (~1.6GB) stays in the builder. The runtime
# ships Next.js standalone output, which is the traced server plus only the modules
# it actually imports.

########################  base  ########################
FROM node:22-slim AS base

# corepack ships with node; `npm install -g pnpm` cost ~57MB for the same thing.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /usr/src/app

########################  builder  ########################
FROM base AS builder

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/frontend ./apps/frontend
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# Every NEXT_PUBLIC_* value is inlined into the client bundle at build time, so it has
# to be present here rather than at runtime. They arrive as build args instead of via
# apps/frontend/.env: that file also holds NEXTAUTH_SECRET, and Next's standalone output
# copies .env verbatim into the bundle, which would bake the secret into the image.
ARG NEXT_PUBLIC_BASE_API_URL=http://localhost/api
ARG NEXT_PUBLIC_API_VERSION=v1
ARG NEXT_PUBLIC_SANITY_PROJECT_ID
ARG NEXT_PUBLIC_SANITY_DATASET
ARG NEXT_PUBLIC_APP_BRAND
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_BASE_API_URL=$NEXT_PUBLIC_BASE_API_URL
ENV NEXT_PUBLIC_API_VERSION=$NEXT_PUBLIC_API_VERSION
ENV NEXT_PUBLIC_SANITY_PROJECT_ID=$NEXT_PUBLIC_SANITY_PROJECT_ID
ENV NEXT_PUBLIC_SANITY_DATASET=$NEXT_PUBLIC_SANITY_DATASET
ENV NEXT_PUBLIC_APP_BRAND=$NEXT_PUBLIC_APP_BRAND
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Build workspace deps then the Next.js app
RUN pnpm run --filter @rl/types build \
    && pnpm run --filter @rl/authz build \
    && pnpm run --filter @rl/frontend build

########################  runner  ########################
FROM base AS runner

ENV NODE_ENV=production

# standalone/ already contains a minimal node_modules and the workspace packages it
# traced, so no install runs here.
COPY --from=builder /usr/src/app/apps/frontend/.next/standalone ./

# Next deliberately leaves these two out of standalone; they must land beside the
# generated server or the app serves with no CSS and no images.
COPY --from=builder /usr/src/app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /usr/src/app/apps/frontend/public ./apps/frontend/public

# The standalone server binds localhost by default; nginx reaches it as frontend:3000
# across the compose network, so it has to listen on all interfaces.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
