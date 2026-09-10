---
title: Backup and restore
description: Create consistent SQLite backups, store them externally, and perform a controlled restore.
---

# Backup and restore

## Create an online backup

Never copy only a live `app.db`; SQLite may use write-ahead log files. The bundled command uses SQLite's backup API
and validates the result with `integrity_check`:

```bash
docker compose exec app pnpm db:backup /data/app-backup.db
docker compose cp app:/data/app-backup.db ./app-backup.db
```

Encrypt and store the copied file away from the host. It contains account hashes, sessions, settings, inventory,
prints, and snapshots. A second file inside the same volume does not protect against volume or host loss.

## Restore a backup

A restore replaces the current database. Stop writes and preserve the current state first:

```bash
docker compose exec app pnpm db:backup /data/before-restore.db
docker compose cp app:/data/before-restore.db ./before-restore.db
docker compose down
docker compose run --rm --no-deps \
  -v "$PWD/app-backup.db:/restore/app.db:ro" \
  --entrypoint sh app -c 'cp /restore/app.db /data/app.db'
docker compose up -d
curl --fail http://127.0.0.1:3000/api/health
```

Startup migrates an older backup forward when required. Verify sign-in, inventory, completed-print counts, and a
known snapshot. On failure, restore `before-restore.db` with the same process.

Test restore regularly on a disposable instance. Restoring into an older app version is safe only with a backup
created by that version; migrations are not automatically reversed.
