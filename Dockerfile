FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma
RUN npm install --no-package-lock --include=optional

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
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

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
CMD ["node", "server.js"]
