---
title: Self-hosted deployment
description: Prerequisites, container tags, Compose configuration, migrations, health checks, and operating limits.
---

# Self-hosted deployment

Use a current Docker daemon with the Compose plugin, GHCR access, and writable local storage for the volume. Run
exactly **one replica**: SQLite is single-writer and setup locking is process-local.

The image is `ghcr.io/tobiaswaelde/3d-print-calculation`. Pin `vMAJOR.MINOR.PATCH` in production; `latest` follows
the newest release and `sha-…` identifies a commit build.

Copy [`compose.example.yml`](https://github.com/tobiaswaelde/3d-print-calculation/blob/main/compose.example.yml) to
`compose.yml`, pin the image, and retain `DATABASE_URL=file:/data/app.db`, `DATA_DIR=/data`, port 3000, and the
`app-data:/data` volume. No login secret is supplied through the environment; the first account is browser-created.
Protect port 3000 with a firewall or TLS reverse proxy.

```bash
docker compose pull
docker compose up -d
docker compose ps
curl --fail http://127.0.0.1:3000/api/health
```

The image runs as UID/GID 1001, requires writable `/data`, creates SQLite if needed, and runs
`prisma migrate deploy` before every server start. Health returns 200 only after a real database query. Restarts
reuse the volume and apply only pending migrations. Continue with [first-run setup](/en/guide/setup), and always
follow the [upgrade procedure](/en/operations/upgrades) before changing image versions. Report vulnerabilities
privately under the [security policy](https://github.com/tobiaswaelde/3d-print-calculation/blob/main/SECURITY.md).
