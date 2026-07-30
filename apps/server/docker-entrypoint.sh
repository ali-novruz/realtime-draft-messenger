#!/bin/sh
set -e
echo "Syncing database schema (prisma db push)..."
packages/database/node_modules/.bin/prisma db push --schema=packages/database/prisma/schema.prisma --skip-generate
echo "Starting server..."
exec node apps/server/dist/index.js
