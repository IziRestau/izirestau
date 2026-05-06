# Dockerfile for @iziresto/api on Railway
# Build context: repo root
FROM node:20-bookworm-slim AS base

ENV PNPM_HOME=/usr/local/share/pnpm \
    PATH=/usr/local/share/pnpm:$PATH \
    NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      openssl \
      tini \
      chromium \
      fonts-liberation \
      fonts-noto-color-emoji \
      libnss3 \
      libatk-bridge2.0-0 \
      libdrm2 \
      libxkbcommon0 \
      libgbm1 \
      libasound2 \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@8.15.0

ENV CHROME_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# 1. Manifests + lockfile (better Docker layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
# apps/web manifest is needed because pnpm-workspace includes it (lockfile resolves all)
COPY apps/web/package.json apps/web/

# 2. Install all workspace deps (including dev — tsx/prisma needed at runtime + build)
RUN pnpm install --frozen-lockfile --ignore-scripts

# 3. Copy source for the workspaces required by the API
COPY packages/database packages/database
COPY packages/shared packages/shared
COPY apps/api apps/api

# 4. Generate Prisma client
RUN pnpm --filter @iziresto/database exec prisma generate

EXPOSE 4000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "pnpm --filter @iziresto/database exec prisma migrate deploy && pnpm --filter @iziresto/api start"]
