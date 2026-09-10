# AGENTS.md

## Scope

These instructions apply to the entire repository.

## Project overview

- ezPrint is a self-hosted Nuxt 4 single-page application for reproducible 3D-print cost calculation.
- The stack is Vue 3, TypeScript, Nuxt UI, Nitro, Zod, Prisma, Better-SQLite3, Vitest, Playwright, and VitePress.
- Use Node.js 24 and the Corepack-provided pnpm version declared in `package.json`.
- Keep changes narrow. Preserve unrelated work in the working tree and never discard or rewrite it.

## Architecture

- Put browser pages, layouts, components, composables, middleware, and client plugins in `app/`.
- Put HTTP handlers in `server/api/`, business and persistence logic in `server/services/`, and server-only helpers in `server/utils/`.
- Put contracts shared by browser and server in `shared/`. Shared and client code must not import from `server/` or `prisma/`.
- Validate external input with Zod schemas from `shared/schemas/`; do not duplicate validation in API handlers.
- Keep monetary and quantity calculations decimal-safe. Use `decimal.js` and canonical decimal strings rather than JavaScript floating-point arithmetic.
- Treat completed print snapshots as immutable and versioned. Do not silently reinterpret historical calculations.
- The supported deployment model is one application replica backed by SQLite. Do not introduce assumptions about horizontal scaling without explicit scope.

## Implementation conventions

- Follow strict TypeScript and the existing Nuxt auto-import and path-alias conventions.
- Vue single-file components must use the order `<template>`, `<script>`, `<style>`.
- Prefer focused reusable components and composables over growing large mixed-responsibility pages.
- Use Nuxt UI components and the existing visual patterns. Preserve responsive behavior and keyboard/accessibility labels.
- All user-facing application text must use i18n keys. Keep `app/i18n/locales/de-DE.json` and `app/i18n/locales/en-US.json` in sync.
- Keep API error codes and translation keys stable unless the change intentionally updates the public contract.
- Never edit generated Prisma client files under `prisma/generated/`.
- Do not add secrets, real customer data, production databases, session cookies, or personally identifiable information to the repository, tests, fixtures, logs, or screenshots.

## Database changes

- Every Prisma schema change must include a checked-in migration under `prisma/migrations/`.
- Generate development migrations with `pnpm db:migrate`; production and automated tests use `pnpm db:deploy`.
- Preserve existing data and historical snapshot semantics. Do not rewrite an existing migration after it may have been applied.
- Update schemas, services, API behavior, tests, and documentation together when a data contract changes.

## Tests and verification

- Add or update the smallest relevant test for every behavior change.
- Use Vitest unit tests for shared domain logic and schemas, component tests for Vue interactions, integration tests for API/database flows, and Playwright for end-to-end user behavior.
- E2E tests must use the isolated temporary SQLite setup provided by the Playwright configuration. Never point tests at a development or production database.
- Run focused checks while developing. Before handing off a substantive change, run the relevant subset of:

```bash
pnpm format:check
pnpm lint
pnpm i18n:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:integration
pnpm test:e2e
pnpm docs:check
pnpm docs:build
pnpm test:docs:e2e
```

- Use `pnpm test:component` for component-only work. Run `sh tests/container-smoke.sh` for Docker, startup, migration, health-check, or packaging changes.
- Report exactly which checks were run and distinguish failures caused by the change from pre-existing failures.

## Documentation

- Product, API, data-model, setup, deployment, or workflow changes must update the corresponding documentation in the same change.
- Documentation is US English only. Every Markdown page under `docs/` needs `title` and `description` frontmatter.
- Use extensionless internal documentation links, meaningful image alt text, and add new pages to the VitePress sidebar.
- Run `pnpm docs:screenshots` when documented UI changes affect screenshots. Generated screenshots must contain only deterministic synthetic data and the US English interface.

## Changesets and Git

- Every user-visible product change requires a focused file under `.changeset/`. Documentation-only, test-only, and internal maintenance changes do not need one unless they affect the published product.
- Use patch releases for compatible fixes and small improvements; use minor releases for backward-compatible feature additions. Ask before introducing a breaking change.
- Do not run `pnpm version` or `pnpm release` unless explicitly requested.
- Do not commit, push, create tags, publish images, or create releases unless explicitly requested.
- When a commit is requested, stage only files belonging to the requested change and use a concise imperative commit message.

## Agent handoff

- Summarize only the material changes, tests run, and any remaining risks or follow-up work.
- Use clickable repository file paths when referring to changed files.
