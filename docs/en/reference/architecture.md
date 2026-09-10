---
title: Architecture
description: Nuxt, Nitro, authentication, and persistence boundaries.
---

# Architecture

The application is a Nuxt 4 SPA with Nuxt UI. Pages and components under `app/` communicate through `$fetch` with
Nitro endpoints under `server/api/`. Zod schemas in `shared/schemas/` validate HTTP input, while the side-effect-free
cost engine lives in `shared/domain/print-calculation.ts`.

```text
Browser → global route middleware → Nitro API → service → Prisma → SQLite /data/app.db
                                        ↘ Zod   ↘ Decimal calculation
```

First-run setup creates `User` and `AppSettings` atomically. Passwords use Argon2. Random session tokens exist only
in an `HttpOnly`, `SameSite=Lax` cookie; their SHA-256 hashes are stored. Writes reject foreign origins. Business
routes require a session; setup status, setup, login, and health do not.

Prisma uses the synchronous Better-SQLite3 adapter, so writes and setup target one process and one container
replica. Startup applies migrations and Nitro shutdown disconnects Prisma. See [deployment](/en/operations/deployment).

Explicit first-release exclusions are multi-user roles, cloud synchronization, multiple currencies per instance,
slicer import, quotes/invoices, email password reset, and horizontal scaling. Extensions should add versioned domain
contracts instead of mutating historical snapshots.
