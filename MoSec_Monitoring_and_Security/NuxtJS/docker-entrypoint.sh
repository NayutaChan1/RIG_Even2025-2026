#!/bin/sh
set -e

SEED_FLAG="/app/.seed-done"

if [ "$1" = "dev" ]; then
  npx drizzle-kit push
  if [ ! -f "$SEED_FLAG" ]; then
    echo "Running seed..."
    npx tsx drizzle/seed.ts
    npx tsx drizzle/seed-history.ts
    touch "$SEED_FLAG"
    echo "Seed complete"
  fi
  exec npm run dev

elif [ "$1" = "prod" ]; then
  npx drizzle-kit migrate
  if [ ! -f "$SEED_FLAG" ]; then
    echo "Running seed..."
    npx tsx drizzle/seed.ts
    npx tsx drizzle/seed-history.ts
    touch "$SEED_FLAG"
    echo "Seed complete"
  fi
  exec node ./server/index.mjs

else
  echo "Usage: $0 {dev|prod}"
  exit 1
fi
