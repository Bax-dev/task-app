#!/bin/bash
set -e

APP_DIR="/home/taskflow/app"

cd "$APP_DIR"

echo "==> Pulling latest code..."
git pull origin main

echo "==> Installing dependencies..."
npm ci

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Building application..."
npm run build

echo "==> Reloading with zero downtime..."
pm2 reload ecosystem.config.js --update-env

echo "==> Saving PM2 process list..."
pm2 save

echo "==> Deploy complete!"
