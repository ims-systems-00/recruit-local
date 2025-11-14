FROM node:22

# Install dependencies and LibreOffice
RUN apt-get update && \
    apt-get install -y libreoffice libreoffice-writer libreoffice-calc libreoffice-impress \
    fonts-dejavu-core fonts-dejavu-extra \
    default-jre xvfb && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    wget https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip && \
    unzip Inter-4.0.zip -d inter-fonts && \
    mkdir -p /usr/share/fonts/inter && \
    cp inter-fonts/*.ttf inter-fonts/extras/ttf/*.ttf /usr/share/fonts/inter/ && \
    fc-cache -f -v && \
    rm -rf Inter-4.0.zip inter-fonts

# Install Redis (server + CLI)
RUN apt-get update && \
    apt-get install -y redis-server redis-tools && \
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
RUN pnpm run --filter @inrm/types build
RUN pnpm run --filter @inrm/authz build
RUN pnpm run --filter @inrm/utils build
RUN pnpm run --filter @inrm/backend build

WORKDIR /usr/src/app/apps/backend

EXPOSE 9027
CMD ["sh", "-c", "redis-server --daemonize yes && node dist/src/server.js"]
 