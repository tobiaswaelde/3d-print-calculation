---
title: Contributing
description: Local development, migrations, verification, Changesets, and US English documentation rules.
---

# Contributing

Use Node.js 24, Corepack/pnpm from `packageManager`, Git, and Chromium plus Docker for the complete verification
suite:

```bash
corepack enable
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

To create a local operator account and a complete synthetic demonstration dataset, run this after the migration:

```bash
pnpm db:seed -- --email demo@example.test --password 'local-demo-password-123'
```

The seed covers master data, spool inventory, a series, every print workflow status, payment states, and successful,
failed, and pending outcomes. It only accepts an empty, migrated database and refuses to run when
`NODE_ENV=production`; it never deletes or replaces existing data. The email and password are supplied at runtime,
and the password is stored only as an Argon2id hash. Use synthetic local credentials only and avoid placing real
passwords in shell history.

Prisma changes require a migration from `pnpm db:migrate`; production startup only runs `pnpm db:deploy`.

## Verification

Run the checks relevant to a narrow change, and use the full sequence before release:

```bash
pnpm format:check
pnpm lint
pnpm i18n:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:integration
pnpm test:e2e
pnpm docs:screenshots
pnpm docs:check
pnpm docs:build
pnpm test:docs:e2e
sh tests/container-smoke.sh
```

Every product change includes a file under `.changeset/`. API, formula, and snapshot changes require tests and
must respect the [architecture boundaries](/reference/architecture).

## Documentation rules

Documentation is written in US English only. Every Markdown page needs `title` and `description` frontmatter,
extensionless internal links, useful image alternative text, and a sidebar entry. Keep labels, units, and examples
aligned with the current application. Screenshots must use synthetic data, show the US English interface, and
contain no secrets or personal information.

`pnpm docs:screenshots` starts the application against a temporary SQLite database, creates deterministic sample
data, and replaces every image in `docs/public/screenshots/`. Run it whenever the documented UI changes, review
the result, and commit the updated images. GitHub runs the generator in a separate non-blocking workflow and
retains Playwright artifacts for failed captures; documentation builds use the checked-in screenshots.

`pnpm docs:check` validates frontmatter, navigation, alt text, unresolved placeholders, and the absence of legacy
localized Markdown. `pnpm docs:build` validates page rendering, links, and anchors.

To keep the live development server on port 3000 while running browser checks, use `PRINT_COST_E2E_PORT=3002 pnpm test:e2e`. Browser suites isolate SQLite databases and Nuxt build directories under temporary roots. Playwright artifacts are separated into `test-results/e2e`, `test-results/screenshots`, and `test-results/docs`. `PRINT_COST_BUILD_DIR` selects a separate Nuxt build directory when needed.
