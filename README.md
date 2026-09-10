# 3D Print Cost Calculation

Self-hosted Nuxt application for deterministic filament-print cost calculation.

User, operator, API, and contributor documentation is available in [German](./docs/index.md) and
[English](./docs/en/index.md).

Security vulnerabilities should be reported privately as described in [SECURITY.md](./SECURITY.md).

## Development

```bash
corepack enable
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

The SQLite database is single-writer only. Production stores it at `/data/app.db`; do not run multiple replicas.

## Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm docs:check
pnpm docs:build
```
