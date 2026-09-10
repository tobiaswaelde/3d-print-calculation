---
title: Upgrade and rollback
description: Upgrade pinned versions safely and roll back within explicit data-safety boundaries.
---

# Upgrade and rollback

Before upgrading, read all relevant [GitHub Releases](https://github.com/tobiaswaelde/3d-print-calculation/releases),
create an [external verified backup](/en/operations/backup-restore), change only the pinned image tag, and start the
service. Then inspect health, logs, sign-in, dashboard, master data, and a completed snapshot.

```bash
docker compose pull app
docker compose up -d app
docker compose ps
docker compose logs --tail=100 app
```

The `main` documentation describes the latest state. The Changesets release aligns app version, Git tag, GitHub
release, and image tag. Older immutable docs remain under `docs/` at the corresponding Git tag.

An image-only rollback is allowed only when release notes declare database compatibility. Otherwise stop the app,
pin the previous image, restore the backup taken immediately before upgrade, and start one replica. This loses all
data written after the upgrade. Without a matching backup, a downgrade is unsafe; keep the new version, preserve
the database, and investigate through [troubleshooting](/en/operations/troubleshooting).
