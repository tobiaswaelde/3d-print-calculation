# 3D Print Cost Calculation

Self-hosted Nuxt application for deterministic filament-print cost calculation.

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
```
