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

# NEXT_PUBLIC_* are inlined at `next build` from apps/frontend/.env (allowed through
# .dockerignore). Strip .env afterward so NEXTAUTH_SECRET is not copied into the
# standalone runtime image — secrets arrive via compose env_file at container start.
RUN pnpm run --filter @rl/types build \
    && pnpm run --filter @rl/authz build \
    && pnpm run --filter @rl/frontend build \
    && rm -f apps/frontend/.env \
    && find apps/frontend/.next/standalone -name '.env*' -delete

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
