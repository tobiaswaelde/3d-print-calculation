---
title: Contributing
description: Local development, migrations, tests, Changesets, and bilingual documentation rules.
---

# Contributing

Use Node.js 24, Corepack/pnpm from `packageManager`, Git, and Chromium/Docker for full verification:

```bash
corepack enable
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

There is intentionally no seed script; setup and master data are created through UI or API. Prisma changes require
a migration from `pnpm db:migrate`; production startup only runs `pnpm db:deploy`.

Run `pnpm format:check`, `pnpm lint`, `pnpm i18n:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
`pnpm test:integration`, `pnpm test:e2e`, `pnpm docs:check`, `pnpm docs:build`, `pnpm test:docs:e2e`, and
`sh tests/container-smoke.sh` as appropriate. Every product commit includes `.changeset/*.md`. API, formula, and
snapshot changes require tests and must respect the [architecture boundaries](/en/reference/architecture).

Every Markdown page needs `title`, `description`, a same-path German counterpart, extensionless internal links, and
useful image alt text. Add pages to navigation/sidebars and keep terminology and units aligned with the app. Never
include secrets or personal data. `docs:check` enforces parity, frontmatter, orphans, and alt text; `docs:build`
validates links and anchors.
