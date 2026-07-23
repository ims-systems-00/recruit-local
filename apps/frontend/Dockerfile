FROM node:22

# Install pnpm
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Copy app files
COPY apps/frontend ./apps/frontend
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Browser API URL is baked into the client bundle at build time (public origin, through nginx).
ARG NEXT_PUBLIC_BASE_API_URL=http://localhost/api
ARG NEXT_PUBLIC_API_VERSION=v1
ENV NEXT_PUBLIC_BASE_API_URL=$NEXT_PUBLIC_BASE_API_URL
ENV NEXT_PUBLIC_API_VERSION=$NEXT_PUBLIC_API_VERSION

# Build workspace deps then the Next.js app
RUN pnpm run --filter @rl/types build
RUN pnpm run --filter @rl/authz build
RUN pnpm run --filter @rl/frontend build

WORKDIR /usr/src/app/apps/frontend

EXPOSE 3000
CMD ["pnpm", "start"]
