# 3D Print Cost Calculation Application Plan

## 1. Product Summary

Build a self-hosted, full-stack application for calculating and preserving the actual cost of filament-based 3D prints. The application is intended for one local operator and provides customer, printer, component, filament, electricity-price, and print-job management.

The application must calculate printer, hotend, and build-plate costs from the purchase price and a separately configured expected lifetime in hours. These values are calculation inputs only: the application will not track consumed or remaining lifetime.

The first release does not include quotes, sales prices, margins, tax, invoices, exchange rates, spool inventory, slicer/G-code imports, roles, or multi-user access.

## 2. Technical Architecture

### Application stack

- Nuxt 4 with TypeScript and Nuxt UI.
- Apache ECharts, integrated through a Vue wrapper and client-only chart components, for responsive dashboard statistics.
- Nuxt Nitro server routes provide the application API; there is no separate backend service.
- Prisma ORM 7 with the SQLite connector and driver adapter. Prisma 7 remains pinned while the selected SQLite integration is implemented and tested.
- pnpm with pinned Node.js and pnpm versions for reproducible local and CI builds.
- Zod schemas shared between client forms and server endpoints.
- Decimal-based money and quantity calculations; native JavaScript floating-point arithmetic must not be used for monetary results.

### Source layout

- `app/components/layout`: dashboard, sidebar, authentication, and page-shell components.
- `app/components/common`: reusable controls and presentation components.
- `app/components/modules`: feature components grouped by customer, printer, component, filament, settings, and print job.
- `app/pages`: thin route-level orchestration only.
- `app/composables`: typed API, localization, theme, and form helpers.
- `server/api`: authenticated Nitro REST endpoints.
- `server/services`: business rules, transactions, and calculation orchestration.
- `server/repositories`: Prisma persistence adapters.
- `server/utils`: authentication, database, validation, and HTTP utilities.
- `shared/domain`, `shared/schemas`, and `shared/types`: framework-independent calculations, Zod contracts, and serialized DTOs.
- `prisma`: schema, migrations, and development seed support.

Vue single-file components follow `<template>`, typed `<script setup lang="ts">`, and optional `<style>` ordering. Large pages are split into responsibility-based module components.

### Runtime model

- Nuxt uses client-side dashboard rendering while Nitro runs as a Node server.
- Production starts through `.output/server/index.mjs` after `prisma migrate deploy` succeeds.
- SQLite is stored at `file:/data/app.db` in a persistent container volume.
- Only one application replica may write to the SQLite database.
- `/api/health` reports process readiness and verifies a database query.

## 3. User Experience

### Authentication and setup

- An empty installation exposes only a first-run setup page.
- Setup creates the single local user and selects the instance currency, default language, and initial electricity price.
- Passwords are hashed with Argon2id.
- Authentication uses opaque server-side sessions in `HttpOnly`, `Secure`, and `SameSite=Lax` cookies.
- State-changing requests enforce same-origin validation.
- A local CLI command resets the password and invalidates all active sessions.
- There is no registration, password-reset email, role system, or additional-user management.

### Dashboard shell

- Use Nuxt UI's `UDashboardGroup`, collapsible/resizable `UDashboardSidebar`, and dashboard panels.
- Keep navigation and panel toolbars fixed while only panel content scrolls.
- Sidebar links: Dashboard, Prints, Customers, Printers, Components, Filaments, and Settings.
- Sidebar footer: language switcher, light/dark/system theme control, and account/logout menu.
- Support `de-DE` and `en-US`; default to `de-DE`.
- Persist the selected language for the user and color mode in the browser.
- Follow the visual composition and component organization of `/mnt/projects/tt-webdev/crm/apps/tenant-web/` without copying CRM-specific behavior.

### Dashboard overview

- Use the dashboard landing page as an operational overview instead of an empty welcome screen.
- Show KPI cards for active drafts, completed prints, total print duration, and total calculated cost. Completed-print KPIs use completed, non-archived jobs and clearly display the selected reporting period.
- Render statistics with Apache ECharts: a time series for completed-print cost over time and a cost-category breakdown for printer, components, filament, and electricity.
- Provide reporting-period controls for the last 30 days, last 90 days, and all time. The same period applies to completed-print KPIs and charts; the active-draft count and draft list remain unfiltered.
- Show all non-archived `DRAFT` print jobs in a dedicated "unfinished prints" section, ordered by most recently updated first.
- Each unfinished-print row shows its name, optional customer, printer, last update, total duration, and latest calculated total cost, and links directly to the print editor.
- Include a clear empty state when no unfinished prints exist and a primary action for creating a print.
- Charts must resize with their dashboard panel, support light and dark themes, use localized labels and tooltips, and expose the underlying values in an accessible text summary.

### Resource screens

- Every resource has a searchable list, empty state, create/edit form, validation feedback, and archive handling.
- Referenced master data is archived instead of deleted. Hard deletion is permitted only for unreferenced records.
- Forms display derived hourly or per-gram rates immediately but the server remains authoritative.
- Monetary values are formatted in the instance currency; duration is entered as hours/minutes, stored as seconds, and weight is entered in grams.

### Print workflow

- A print job can be saved as a draft, completed, archived, or duplicated.
- Completed jobs and their cost snapshots are immutable and cannot be reopened.
- Duplicating any job creates a new draft and recalculates it from current master data.
- The editor selects one printer, exactly one compatible build plate, one or more compatible hotends with a duration for each, one or more filaments with a weight for each, optional additional compatible components, and an optional customer.
- A live cost summary shows duration, printer, component, filament, electricity, and total cost before saving.

## 4. Data Model

### Core models

- `User`: email, display name, Argon2id password hash, preferred locale, timestamps.
- `Session`: hashed token, user relation, expiration, timestamps.
- `AppSettings`: singleton row containing ISO 4217 currency, default locale, electricity price per kWh, and cost-calculation version.
- `Customer`: name, optional email, optional note, archive timestamp, timestamps.
- `Printer`: name, optional manufacturer/model, purchase price, expected lifetime hours, average power in watts, optional note, archive timestamp, timestamps.
- `Component`: type (`HOTEND`, `BUILD_PLATE`, or `OTHER`), name, optional manufacturer/model, purchase price, expected lifetime hours, optional note, archive timestamp, timestamps.
- `PrinterComponent`: many-to-many compatibility relation between printers and components.
- `Filament`: name, manufacturer, material, optional color/note, purchase price, net weight in grams, archive timestamp, timestamps.
- `PrintJob`: name, optional customer, printer, status (`DRAFT` or `COMPLETED`), notes, derived total duration, formula version, currency, total cost, completion/archive timestamps, timestamps.
- `PrintComponentUsage`: referenced component, snapshotted type/name/purchase price/lifetime/hourly rate, applied duration, and line cost.
- `PrintFilamentUsage`: referenced filament, snapshotted display fields/purchase price/net weight/per-gram rate, used weight, and line cost.
- `PrintCostSnapshot`: electricity tariff, printer purchase price/lifetime/hourly rate/power, printer cost, component cost, filament cost, electricity cost, total cost, currency, formula version, and calculation timestamp.

### Numeric representation

- Prices, rates, weights, hours, and calculated costs use Prisma `Decimal` values.
- API DTOs serialize decimals as canonical decimal strings.
- The UI parses localized input into canonical decimal strings before submission and formats returned values only for display.
- Store duration as whole seconds and power as whole watts.
- Keep full precision in snapshots and round only formatted currency output according to the selected ISO currency.

### Integrity rules

- Purchase prices and electricity prices may be zero but not negative.
- Expected lifetime, net filament weight, used filament weight, and hotend duration must be greater than zero.
- Every print has exactly one printer and build plate and at least one hotend and filament usage.
- Selected components must be active and compatible with the selected printer when a draft is calculated or saved.
- Total print duration is the sum of hotend durations.
- A selected build plate and each selected `OTHER` component use total print duration for their line cost.
- Each selected hotend uses its own entered duration.
- Master-data changes never rewrite an existing print snapshot.
- The instance currency cannot change after any cost-bearing master record or print job exists.

## 5. Cost Calculation Contract

For a printer purchase price `Pp`, expected printer lifetime `Lp`, printer power `W`, electricity price `E`, hotend entries `Hi`, build plate `B`, additional components `Ci`, filament entries `Fi`, and total duration `T`:

```text
T = sum(Hi.durationHours)

printerHourlyRate = Pp / Lp
printerCost = T * printerHourlyRate

hotendCost = sum(Hi.durationHours * (Hi.purchasePrice / Hi.expectedLifetimeHours))
buildPlateCost = T * (B.purchasePrice / B.expectedLifetimeHours)
otherComponentCost = sum(T * (Ci.purchasePrice / Ci.expectedLifetimeHours))

electricityCost = T * (W / 1000) * E

filamentCost = sum(Fi.usedGrams * (Fi.purchasePrice / Fi.netWeightGrams))

componentCost = hotendCost + buildPlateCost + otherComponentCost
totalCost = printerCost + componentCost + electricityCost + filamentCost
```

The purchase price and expected lifetime of the printer, each hotend, and each build plate are configured independently. No cost is based on tracked remaining lifetime, previous print history, utilization, residual value, maintenance, or replacement events.

The framework-independent calculation module exposes:

- `PrintCalculationInput`
- `PrintCalculationResult`
- `CostBreakdownLine`
- `calculatePrintCost(input)`
- A calculation-version constant stored with every snapshot

The API provides `POST /api/prints/calculate` for previews. Print create/update/complete operations invoke the same function again inside the server-side transaction and never trust client-calculated totals.

## 6. API Surface

- `/api/auth/setup-status`, `/api/auth/setup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`.
- `/api/settings` for reading and updating instance settings subject to currency-lock rules.
- `/api/customers`, `/api/printers`, `/api/components`, and `/api/filaments` for list/create and `/:id` read/update/archive/delete behavior.
- `/api/prints` for list/create and `/:id` read/update/archive behavior.
- `/api/prints/calculate` for validated, non-persisting previews.
- `/api/prints/:id/complete` to atomically recalculate, snapshot, and lock a draft.
- `/api/prints/:id/duplicate` to create a new draft using current master-data prices.
- `/api/dashboard` for the reporting-period KPI summary, completed-print chart series, cost-category totals, and the unfiltered list of non-archived draft prints.
- `/api/health` for unauthenticated container health checks without exposing business data.

List endpoints support bounded pagination and text search. Responses use typed success DTOs and a consistent error payload containing a machine-readable code, localized-message key, optional field errors, and request ID.

## 7. Delivery and Release Automation

### Continuous integration

Run on pull requests and pushes to `main`:

1. Install with a frozen lockfile.
2. Generate the Prisma client.
3. Run lint and formatting checks.
4. Run Nuxt type checking.
5. Run unit, service, API integration, and component tests.
6. Build the Nuxt application.
7. Build the Docker image without pushing it.

### Changesets and releases

- Every user-facing or operational change includes a Changeset.
- Changesets maintains the application version and `CHANGELOG.md`.
- `changesets/action@v2` creates or updates the version pull request using `version-script`.
- Merging the Changesets release pull request triggers the Docker release workflow.
- The image is published to `ghcr.io/tobiaswaelde/3d-print-calculation` with `vX.Y.Z`, `latest`, and commit-SHA tags.
- Create the matching Git tag and GitHub release only after the versioned image push succeeds.
- The workflow publishes an image only; it does not deploy to a host.

### Container artifacts

- Multi-stage Dockerfile with a non-root runtime user.
- Prisma client, schema, migrations, migration CLI, Nuxt server output, and required native SQLite dependencies are present in the runtime image.
- Provide `compose.example.yml` with the persistent `/data` volume, application port, health check, and required secrets/configuration.
- Document database-file backup and restore procedures. Do not copy or back up a live database without using a SQLite-safe method.

## 8. Verification and Acceptance Criteria

### Calculation tests

- Single and multiple hotend durations produce the correct total duration.
- Printer, hotend, build plate, other-component, electricity, and filament costs match independent expected values.
- Every printer, hotend, and build plate uses its own purchase price and expected lifetime.
- Decimal weights and repeating division results remain deterministic and do not acquire binary floating-point errors.
- Zero-cost inputs work; zero or negative denominators and quantities fail validation.
- Currency-specific display rounding does not alter stored values or totals.

### Persistence and API tests

- Each suite uses a temporary migrated SQLite database.
- First-run setup is single-use and safe against concurrent requests.
- Login, logout, expiration, invalid credentials, and CLI reset/session invalidation work.
- Compatibility, archive/delete, currency-lock, and referential-integrity rules are enforced server-side.
- Draft saves recalculate snapshots; completion locks a final snapshot; master-data edits do not change historical results.
- Duplicate creates an editable draft using current master values.

### Browser acceptance tests

- Complete the first-run setup and authentication flow.
- Create settings, customer, printer, compatible hotend/build plate, and filament.
- Create a draft, verify the visible line-item breakdown, complete it, and confirm it is immutable.
- Duplicate the completed job and verify that current costs are used.
- Verify German/English switching, theme persistence, sidebar links, keyboard operation, and narrow/mobile dashboard geometry.
- Confirm fixed navigation/toolbars and content-only scrolling.
- Verify that dashboard KPIs and ECharts series match completed, non-archived print snapshots for each reporting period.
- Verify that every non-archived draft appears in the unfinished-prints section, archived or completed jobs do not appear there, and selecting a row opens its editor.
- Verify responsive chart resizing, localized tooltips, light/dark chart colors, accessible chart summaries, and the unfinished-prints empty state.

### Container acceptance tests

- Start from an empty volume, run migrations, complete setup, and pass the health check.
- Restart with the same volume and confirm retained data and idempotent migrations.
- Verify runtime operation as the non-root user and graceful failure when `/data` is not writable.

## 9. Milestone Roadmap

### [M1 — Application Foundation](https://github.com/tobiaswaelde/3d-print-calculation/milestone/1)

- [#1 Scaffold the Nuxt 4 full-stack application](https://github.com/tobiaswaelde/3d-print-calculation/issues/1)
- [#2 Establish Prisma 7 and SQLite persistence](https://github.com/tobiaswaelde/3d-print-calculation/issues/2)
- [#3 Implement first-run setup and single-user authentication](https://github.com/tobiaswaelde/3d-print-calculation/issues/3)
- [#4 Build the Nuxt UI dashboard shell, localization, and theming](https://github.com/tobiaswaelde/3d-print-calculation/issues/4)
- [#5 Add CI, Changesets, and container release foundations](https://github.com/tobiaswaelde/3d-print-calculation/issues/5)

### [M2 — Cost Master Data](https://github.com/tobiaswaelde/3d-print-calculation/milestone/2)

- [#6 Implement instance settings and electricity pricing](https://github.com/tobiaswaelde/3d-print-calculation/issues/6)
- [#7 Implement customer management](https://github.com/tobiaswaelde/3d-print-calculation/issues/7)
- [#8 Implement printer management with lifetime-based hourly cost](https://github.com/tobiaswaelde/3d-print-calculation/issues/8)
- [#9 Implement component management and printer compatibility](https://github.com/tobiaswaelde/3d-print-calculation/issues/9)
- [#10 Implement the filament catalog and per-gram cost](https://github.com/tobiaswaelde/3d-print-calculation/issues/10)

### [M3 — Print Costing Workflow](https://github.com/tobiaswaelde/3d-print-calculation/milestone/3)

- [#11 Implement the deterministic print cost calculation engine](https://github.com/tobiaswaelde/3d-print-calculation/issues/11)
- [#12 Implement print job persistence, snapshots, and lifecycle](https://github.com/tobiaswaelde/3d-print-calculation/issues/12)
- [#13 Build the print management and calculator UI](https://github.com/tobiaswaelde/3d-print-calculation/issues/13)
- [#14 Build the dashboard overview and cost breakdown views](https://github.com/tobiaswaelde/3d-print-calculation/issues/14)

### [M4 — Production Readiness](https://github.com/tobiaswaelde/3d-print-calculation/milestone/4)

- [#15 Complete integration, component, and browser test coverage](https://github.com/tobiaswaelde/3d-print-calculation/issues/15)
- [#16 Harden container startup, migrations, health checks, and SQLite operations](https://github.com/tobiaswaelde/3d-print-calculation/issues/16)
- [#17 Complete accessibility, responsive UX, documentation, and release verification](https://github.com/tobiaswaelde/3d-print-calculation/issues/17)

## 10. Explicit Non-Goals for V1

- Tracking remaining printer, hotend, or build-plate lifetime.
- Tracking filament spool stock or automatically subtracting used filament.
- Sales prices, margin, quotes, invoices, VAT, or accounting exports.
- Currency conversion or mixed-currency records.
- User registration, multiple users, roles, teams, or tenant isolation.
- Printer control, job dispatch, telemetry, OctoPrint/Moonraker integration, or slicer imports.
- Multiple application replicas or high-availability SQLite operation.
