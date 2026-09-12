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

node scripts/ensure-database.ts
restore_state="$(node scripts/apply-pending-restore.ts prepare)"
if ! /migration/node_modules/.bin/prisma migrate deploy --config /migration/prisma.config.ts; then
  if [ "$restore_state" != "prepared" ]; then exit 1; fi
  node scripts/apply-pending-restore.ts rollback
  /migration/node_modules/.bin/prisma migrate deploy --config /migration/prisma.config.ts
fi
if [ "$restore_state" = "prepared" ] && ! node scripts/import-backup.ts; then
  node scripts/apply-pending-restore.ts rollback
  /migration/node_modules/.bin/prisma migrate deploy --config /migration/prisma.config.ts
fi
exec node .output/server/index.mjs
