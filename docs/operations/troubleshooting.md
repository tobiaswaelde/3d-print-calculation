---
title: Troubleshooting
description: Diagnose storage permissions, migration failures, health, configuration, sign-in, and SQLite corruption.
---

# Troubleshooting

Start with `docker compose ps`, `docker compose logs --tail=200 app`, and `/api/health`. Back up any readable
database before attempting repair.

| Symptom                        | Safe response                                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Data directory is not writable | Grant UID/GID 1001 access to the intended volume; do not bypass the check by running as root.                                     |
| Migration failed               | Check image tag, free capacity, and the full log. Do not start parallel replicas; preserve the backup before retrying.            |
| Health check is red            | Query `/api/health` directly. Database failures return 503; distinguish them from network errors and startup migration time.      |
| Database is missing            | Verify `DATABASE_URL=file:/data/app.db` and the expected persistent volume before continuing, or a blank instance may be created. |
| Database is corrupt            | Stop the app and [restore a verified backup](/operations/backup-restore); do not experiment on the only copy.                     |
| Sign-in fails                  | Verify the email and use the local [password reset](/guide/setup#reset-a-password); it invalidates existing sessions.             |
| Data disappears after restart  | Confirm Compose still uses the same named `app-data` volume.                                                                      |
| A print selection is empty     | Confirm the master-data record is active and the component is compatible with the selected printer.                               |
| Currency cannot be changed     | This is expected after the first cost-bearing record. Restore a clean instance only if changing currency is truly required.       |

Use the explicit values from [Deployment](/operations/deployment) when configuration is missing. Never add a second
replica as a recovery workaround; that violates the SQLite operating boundary.
