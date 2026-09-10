# ezPrint

## 0.3.2

### Patch Changes

- 551baba: Reduce the container image size by using Alpine and shipping only the Prisma migration runtime instead of all build dependencies.

## 0.3.1

### Patch Changes

- e37417a: Rename the application to ezPrint, adopt the ezSWM-inspired sidebar wordmark, and align project links with the renamed repository.

## 0.3.0

### Minor Changes

- 5d7974f: Adopt full-height Tenant Web list pages with fixed breadcrumb toolbars and independently scrollable compact tables.
- 137a9eb: Open validated master-data create and edit forms in accessible responsive dialogs while keeping tables visible.
- 661ffc1: Validate settings, master-data, and print-job forms with shared Zod schemas before submitting data.
- d799402: Adopt a consistent Tabler-first icon language across navigation, search, dashboard, forms, and actions.
- 6600a0c: Publish a complete US English user guide with Playwright-generated application screenshots and refreshed application branding.
- cf1399d: Standardize form controls with numeric amount inputs, in-field units, and leading Tabler icons.

### Patch Changes

- fb8a0be: Stabilize generated release lockfiles and documentation screenshots in CI.

## 0.2.0

### Minor Changes

- c7922cd: Add the Nuxt application foundation, SQLite persistence, local authentication, dashboard shell, CI, and container release scaffolding.
- bae63f4: Refresh the application shell with Zinc and Blue styling, IBM Plex Sans and JetBrains Mono, grouped navigation, a Tenant Web-inspired user menu, and a versioned sidebar footer.
- 0963cba: Refresh the dashboard with colorful KPI accents, clearer iconography, and more distinctive chart and draft sections.
- 6ea6937: Launch the public VitePress documentation with the product typography, blue theme, richer landing page, and repository navigation.
- 1fe1db4: Add instance settings and searchable customer, printer, compatible component, and filament management with deterministic derived cost rates.
- 28b873f: Add deterministic print cost calculation, immutable snapshots, draft completion and duplication, the print editor, and period-aware dashboard analytics.
- 96b753f: Harden migrations, health checks, non-root container startup, SQLite backups, accessibility, and isolated integration, component, browser, and container verification.
- c2d7f99: Add a responsive global app-bar search for print jobs and all master-data records, including grouped results and a keyboard shortcut.
- 625d2fc: Add a bilingual, searchable VitePress site with user, operator, architecture, calculation, API, contribution, and publication guides plus documentation quality and Pages workflows.

### Patch Changes

- 1db4c94: Keep scheduled Dependabot updates focused on GitHub Actions and container images while GitHub security updates continue to cover vulnerable application dependencies.
- 12aef65: Expand the project README with features, deployment and development guidance, live documentation links, workflow badges, and project support information.
- aec75d3: Add repository funding metadata for supporting the project through Buy Me a Coffee.
- 039a48e: Add automated CodeQL quality and security analysis, dependency review, Dependabot updates, clearer vulnerability reporting, and current workflow runtimes.
- 2c1254d: Keep production container restart checks on the dynamically reassigned host port in CI.
- d632992: Repair the remote release workflow for Changesets v3 and make the cold-start browser acceptance test resilient to CI compilation time.

## 0.1.0

Initial planning release.
