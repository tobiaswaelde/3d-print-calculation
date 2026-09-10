---
title: HTTP API
description: First-release endpoints, authentication, DTOs, pagination, validation, and error envelopes.
---

# HTTP API

All paths share the UI origin. Authentication uses the `print-cost-session` cookie and writes require a matching
`Origin`. Decimal values are JSON strings, timestamps are ISO 8601, and durations are seconds.

| Method and path                        | Auth     | Contract                                           |
| -------------------------------------- | -------- | -------------------------------------------------- |
| `GET /api/health`                      | no       | `{ status, database }`; 503 if DB is unreadable    |
| `GET /api/auth/setup-status`           | no       | `{ initialized }`                                  |
| `POST /api/auth/setup`                 | no       | First account/settings, once only; then 409        |
| `POST /api/auth/login`                 | no       | Email/password; sets cookie                        |
| `GET /api/auth/session`                | optional | `{ user }` or `null`                               |
| `POST /api/auth/logout`                | yes      | Deletes current session                            |
| `PATCH /api/auth/preferences`          | yes      | `{ locale }`                                       |
| `GET/PATCH /api/settings`              | yes      | Currency, language, electricity price              |
| `GET/POST /api/customers`              | yes      | Paginated list or create                           |
| `GET/PATCH/DELETE /api/customers/:id`  | yes      | Read, replace/archive, or safe delete              |
| `GET/POST /api/printers`               | yes      | Paginated list or create                           |
| `GET/PATCH/DELETE /api/printers/:id`   | yes      | Read, replace/archive, or safe delete              |
| `GET/POST /api/components`             | yes      | Paginated list or create with `printerIds`         |
| `GET/PATCH/DELETE /api/components/:id` | yes      | Read, replace/archive, or safe delete              |
| `GET/POST /api/filaments`              | yes      | Paginated list or create                           |
| `GET/PATCH/DELETE /api/filaments/:id`  | yes      | Read, replace/archive, or safe delete              |
| `POST /api/prints/calculate`           | yes      | Preview a print-draft DTO                          |
| `GET/POST /api/prints`                 | yes      | Filtered list or create draft                      |
| `GET/PATCH /api/prints/:id`            | yes      | Detail or update a `DRAFT`                         |
| `POST /api/prints/:id/complete`        | yes      | Complete immutably                                 |
| `POST /api/prints/:id/duplicate`       | yes      | Create a current-price `DRAFT`                     |
| `GET /api/dashboard?period=30d`        | yes      | KPIs, cost series, and drafts; `30d`, `90d`, `all` |

Lists accept `search`, one-based `page`, `pageSize` 1–100, and `includeArchived=true|false`. Print lists also accept
`status=DRAFT|COMPLETED` and `customerId`. Responses contain `items`, `total`, `page`, and `pageSize`.

Setup requires `displayName`, `email`, 12+ character `password`, supported `locale`, `currency`, and
`electricityPrice`. A print draft requires `name`, optional `customerId`, `printerId`, `buildPlateId`, one or more
`{ componentId, durationSeconds }` hotends, optional `otherComponentIds`, one or more
`{ filamentId, usedGrams }`, and optional `notes`. Master-data PATCH replaces its editable DTO; `{ archived }`
switches archive state. Authoritative schemas are in
[`shared/schemas`](https://github.com/tobiaswaelde/3d-print-calculation/tree/main/shared/schemas).

Errors carry an HTTP status and stable `data` with `code`, `messageKey`, optional `fieldErrors`, and `requestId`.
Expect 401 without session, 403 for foreign origins, 409 for immutability/references/currency/setup conflicts, and
422 for invalid or incompatible inputs. Clients should branch on `code`, not parse messages.
