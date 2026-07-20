FROM node:22

# Install Redis (server + CLI) and LibreOffice for DOC/DOCX -> PDF conversion
RUN apt-get update && \
        apt-get install -y --no-install-recommends \
            redis-server \
            redis-tools \
            libreoffice \
            libreoffice-writer \
            libreoffice-calc \
            libreoffice-impress \
            fonts-dejavu-core \
            fonts-liberation && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Copy app files
COPY apps/backend ./apps/backend
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build app
RUN pnpm run --filter @rl/types build
RUN pnpm run --filter @rl/authz build
RUN pnpm run --filter @rl/utils build
RUN pnpm run --filter @rl/backend build

WORKDIR /usr/src/app/apps/backend

EXPOSE 9027
CMD ["sh", "-c", "redis-server --daemonize yes && node dist/src/server.js"]
 