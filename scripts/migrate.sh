#!/bin/bash
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Migrations completed successfully!"
