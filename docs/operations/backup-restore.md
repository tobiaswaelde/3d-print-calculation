---
title: Backup and restore
description: Create portable logical backups, store them externally, and perform a controlled restore.
---

# Backup and restore

## Create an online backup

The simplest path is **Settings → Backup → Download backup**. Never copy only a live `app.db`; SQLite may use
write-ahead log files. Both the UI and bundled command first take a consistent SQLite snapshot and then export a
portable logical archive:

```bash
docker compose exec app node scripts/backup-database.ts /data/app-backup.ezprint-backup
docker compose cp app:/data/app-backup.ezprint-backup ./app-backup.ezprint-backup
```

Encrypt and store the copied file away from the host. It contains account hashes, integration credentials,
settings, inventory, prints, and snapshots. Sessions are not exported. A second file inside the same volume does
not protect against volume or host loss.

An `.ezprint-backup` is a ZIP archive containing `manifest.json` and one newline-delimited JSON file per application
table under `data/`. The manifest records the format and application versions, creation time, row counts, and a
SHA-256 checksum for every data file. Prisma migrations and SQLite implementation details are not part of the
portable contract.

## Restore in the application

Open **Settings → Backup**, choose an `.ezprint-backup` file, and enter the current account password. ezPrint
validates and stages the archive beside the live database, then exits after acknowledging the request. The
supported Compose deployment restarts it automatically. Other process managers must also restart ezPrint after a
clean exit.

Startup preserves the current database, creates a fresh database using the installed schema, and imports the
logical data in one transaction. Unknown fields from an older schema are ignored and missing fields use current
database defaults where available. A failed migration, import, checksum, or relationship check automatically
restores the previous database. Sign in again and verify settings, inventory, completed-print counts, and a known
immutable snapshot.

The default upload limit is 1 GiB. Set `NUXT_BACKUP_MAX_BYTES` to a positive byte count when a larger archive is
expected. Staging also requires room for the uploaded archive, the current database, and a safety reserve.

Test restore regularly on a disposable instance. Use the authenticated Settings workflow for restores; copying
the archive over `app.db` does not work because the archive is deliberately not a SQLite database. Restoring into
an older app version is supported only when that version understands the archive format and creating app version.

## Compatibility contract

Every v0.x `.ezprint-backup` contains a stable logical-format version, the creating application version, creation
time, checksums, and canonical application records. New importers may ignore retired fields and tables and apply
explicit adapters when a required field changes. Existing IDs, relationships, decimal strings, timestamps,
credentials, and immutable snapshots remain unchanged during an import.

The future v1 baseline must import every backup format emitted by v0 before it replaces the v0 migration history.
It must import users, settings, credentials, master data, inventory, relationships, and immutable print snapshots
into a fresh v1 database while discarding sessions. The v1 baseline must never be applied directly to a legacy
database after deleting its migrations. Synthetic v0 fixtures remain compatibility tests, and a v1 release is
blocked until they restore successfully.
