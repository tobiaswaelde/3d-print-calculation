---
title: Upgrade and rollback
description: Upgrade pinned versions safely and roll back within explicit data-safety boundaries.
---

# Upgrade and rollback

## Upgrade

1. Read all relevant [GitHub Releases](https://github.com/tobiaswaelde/ezprint/releases) between the
   installed version and target version.
2. Create an [external, verified backup](/operations/backup-restore).
3. Change only the pinned image tag, pull the image, and restart the service.
4. Verify health, logs, sign-in, dashboard, master data, and a known completed snapshot.

```bash
docker compose pull app
docker compose up -d app
docker compose ps
docker compose logs --tail=100 app
```

The documentation on `main` describes the latest application state. Changesets align the application version,
Git tag, GitHub release, and image tag. Historical source documentation remains available in `docs/` at each tag.

## Roll back

An image-only rollback is allowed only when the release notes declare database compatibility. Otherwise:

1. Stop the application.
2. Pin the previous image tag.
3. Restore the database backup created immediately before the upgrade.
4. Start exactly one replica and verify health plus known data.

This full rollback loses data written after the upgrade. Without a matching backup, a downgrade is unsafe; keep
the new version running, preserve the database, and investigate through [Troubleshooting](/operations/troubleshooting).
