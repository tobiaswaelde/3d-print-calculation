#!/bin/sh
set -eu

data_dir="${DATA_DIR:-/data}"
if [ ! -d "$data_dir" ]; then
  echo "Data directory does not exist: $data_dir" >&2
  exit 1
fi
if [ ! -w "$data_dir" ]; then
  echo "Data directory is not writable by uid $(id -u): $data_dir" >&2
  exit 1
fi

./node_modules/.bin/tsx scripts/ensure-database.ts
./node_modules/.bin/prisma migrate deploy
exec node .output/server/index.mjs
