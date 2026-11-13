FROM node:20-alpine AS builder
WORKDIR /app

# openssl + libc6-compat are required for Prisma's schema/query engine
# (linux-musl-openssl-3.0.x binary) to load libssl3 at runtime.
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json ./
COPY prisma ./prisma
# The lockfile lists native binaries for every platform (incl. linux-musl), so ci installs the right ones.
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
# Runtime secrets need non-empty values at build time so module-level
# initializations (Prisma, auth libs) don't crash during static page collection.
# These are never copied into the production stage.
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    JWT_SECRET="build-placeholder" \
    REDIS_URL="redis://localhost:6379" \
    RESEND_API_KEY="build-placeholder" \
    EMAIL_FROM="build@example.com" \
    GOOGLE_CLIENT_ID="build-placeholder" \
    GOOGLE_CLIENT_SECRET="build-placeholder" \
    TASKFLOW_CRON_SECRET="build-placeholder"

RUN npm run build

FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production \
    PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Prisma client (runtime) + CLI (migrations)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -q -T 5 -O /dev/null http://127.0.0.1:3000/api/health || exit 1

# Fargate auto-injects HOSTNAME=<eni-hostname>, overriding any Dockerfile ENV.
# Next.js standalone reads process.env.HOSTNAME and binds to it, so the server
# ends up listening on the ENI IP instead of 0.0.0.0 — making the localhost
# healthcheck above unreachable. Strip HOSTNAME here so the server falls back
# to 0.0.0.0.
CMD ["sh", "-c", "exec env -u HOSTNAME node server.js"]
