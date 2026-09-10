---
title: Backup and restore
description: Create consistent SQLite backups, store them externally, and perform a controlled restore.
---

# Backup and restore

Never copy only a live `app.db`; SQLite may use WAL files. The bundled command uses SQLite's backup API and validates
the result with `integrity_check`.

```bash
docker compose exec app pnpm db:backup /data/app-backup.db
docker compose cp app:/data/app-backup.db ./app-backup.db
```

Encrypt and store the copied file away from the host. It contains account hashes, sessions, and business data; a
file in the same volume is not protection against volume loss.

For restore, stop writes and first preserve the current state:

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

Startup migrates older backups forward. Verify login, master data, completed-print counts, and a known snapshot. On
failure, restore `before-restore.db`. Regularly test this on a disposable instance. Restoring into an older app is
safe only with a backup from that version; migrations are not automatically reversed.
