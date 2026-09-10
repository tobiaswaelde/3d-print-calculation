---
title: Architecture
description: Nuxt, Nitro, authentication, domain calculation, and SQLite persistence boundaries.
---

# Architecture

The application is a Nuxt 4 single-page app with Nuxt UI. Pages and components under `app/` call Nitro endpoints
under `server/api/` through `$fetch`. Zod schemas in `shared/schemas/` validate input, while the side-effect-free
cost engine lives in `shared/domain/print-calculation.ts`.

```text
Browser → route middleware → Nitro API → service → Prisma → SQLite /data/app.db
                                  ↘ Zod   ↘ Decimal calculation
```

First-run setup creates `User` and `AppSettings` atomically. Passwords use Argon2. Random session tokens exist only
in an HTTP-only, SameSite=Lax cookie; the database stores SHA-256 hashes. Writes reject foreign origins. Business
routes require a session; setup status, setup, sign-in, and health do not.

Prisma uses the synchronous Better-SQLite3 adapter, so writes and setup target one process and one container
replica. Startup applies migrations and Nitro shutdown disconnects Prisma. See [Deployment](/operations/deployment).

The current scope excludes multi-user roles, cloud synchronization, multiple currencies per instance, slicer
imports, quotes and invoices, email password reset, and horizontal scaling. Extensions should add versioned domain
contracts instead of mutating historical snapshots.
