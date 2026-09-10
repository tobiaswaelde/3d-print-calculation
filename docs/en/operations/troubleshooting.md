---
title: Troubleshooting
description: Diagnose storage permissions, migration failures, health, configuration, and SQLite corruption.
---

# Troubleshooting

Start with `docker compose ps`, `docker compose logs --tail=200 app`, and `/api/health`. Back up any readable
database before attempting repair.

| Symptom                        | Safe response                                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Data directory is not writable | Grant UID/GID 1001 access to the intended volume; do not bypass this by running as root.                                          |
| Migration failed               | Check image tag, capacity, and full log. Do not start parallel replicas; preserve the backup before retrying.                     |
| Health is red                  | Query the endpoint directly. Database failures return 503; distinguish them from network errors or startup migration time.        |
| Database is missing            | Verify `DATABASE_URL=file:/data/app.db` and the expected persistent volume before continuing, or a blank instance may be created. |
| Database is corrupt            | Stop the app and [restore a verified backup](/en/operations/backup-restore); do not experiment on the only copy.                  |
| Sign-in fails                  | Verify email and use the local [password reset](/en/guide/setup); it invalidates existing sessions.                               |
| Data vanishes after restart    | Confirm Compose still uses the same named `app-data` volume.                                                                      |

Use the explicit values from [deployment](/en/operations/deployment) when configuration is missing. Never add a
second replica as a recovery workaround; that violates the SQLite operating boundary.
