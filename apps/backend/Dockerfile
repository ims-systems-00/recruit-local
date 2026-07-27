FROM node:22

# LibreOffice for DOC/DOCX -> PDF conversion, plus a bundled Redis used when no
# external one is configured (see docker-entrypoint.sh).
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

# Wire up the bundled Redis config and the entrypoint
RUN mkdir -p /etc/redis /data && \
    cp /usr/src/app/apps/backend/redis/internal.conf /etc/redis/internal.conf && \
    install -m 0755 /usr/src/app/apps/backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

WORKDIR /usr/src/app/apps/backend

EXPOSE 9027
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/src/server.js"]
 