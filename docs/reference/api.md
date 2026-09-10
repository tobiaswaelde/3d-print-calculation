---
title: HTTP API
description: Endpoints, authentication, request models, pagination, validation, and stable error envelopes.
---

# HTTP API

All routes share the web interface origin. Authentication uses the `print-cost-session` cookie, and write requests
require a matching `Origin`. Decimal values are JSON strings, timestamps are ISO 8601 strings, and durations are
whole seconds.

## Endpoints

| Method and path                           | Auth     | Contract                                                              |
| ----------------------------------------- | -------- | --------------------------------------------------------------------- |
| `GET /api/health`                         | No       | `{ status, database, version }`; 503 if the database is unreadable    |
| `GET /api/auth/setup-status`              | No       | `{ initialized }`                                                     |
| `POST /api/auth/setup`                    | No       | Create the first account and settings once; later calls return 409    |
| `POST /api/auth/login`                    | No       | Validate email/password and set the session cookie                    |
| `GET /api/auth/session`                   | Optional | `{ user }` or `null`                                                  |
| `POST /api/auth/logout`                   | Yes      | Delete the current session                                            |
| `PATCH /api/auth/preferences`             | Yes      | Update `{ locale }` for the account                                   |
| `GET/PATCH /api/settings`                 | Yes      | Read or update currency, default language, and electricity price      |
| `GET/POST /api/customers`                 | Yes      | Paginated list or create                                              |
| `GET/PATCH/DELETE /api/customers/:id`     | Yes      | Read, replace/archive, or safely delete                               |
| `GET/POST /api/printers`                  | Yes      | Paginated list or create                                              |
| `GET/PATCH/DELETE /api/printers/:id`      | Yes      | Read, replace/archive, or safely delete                               |
| `GET/POST /api/manufacturers`             | Yes      | Paginated list or create                                              |
| `GET/PATCH/DELETE /api/manufacturers/:id` | Yes      | Read, replace/archive, or safely delete                               |
| `GET/POST /api/components`                | Yes      | Paginated list or create with `printerIds`                            |
| `GET/PATCH/DELETE /api/components/:id`    | Yes      | Read, replace/archive, or safely delete                               |
| `GET/POST /api/filaments`                 | Yes      | Paginated list or create                                              |
| `GET/PATCH/DELETE /api/filaments/:id`     | Yes      | Read, replace/archive, or safely delete                               |
| `POST /api/prints/calculate`              | Yes      | Preview a print-draft DTO without persistence                         |
| `GET/POST /api/prints`                    | Yes      | Filtered list or create a draft                                       |
| `GET/PATCH /api/prints/:id`               | Yes      | Read, update a draft, or set `{ archived }`                           |
| `POST /api/prints/:id/complete`           | Yes      | Recalculate and complete immutably                                    |
| `POST /api/prints/:id/duplicate`          | Yes      | Create a current-price draft copy                                     |
| `GET /api/dashboard?period=30d`           | Yes      | KPIs, cost series, categories, and drafts for `30d`, `90d`, or `all`  |
| `GET /api/search?q=…`                     | Yes      | Grouped print and inventory results for a two-or-more-character query |
| `GET /api/version-latest`                 | Yes      | Latest GitHub Release version or `null`, cached for five minutes      |

## Lists and input models

Inventory lists accept `search`, one-based `page`, `pageSize` from 1–100, and `includeArchived=true|false`. Print
lists also accept `status=DRAFT|COMPLETED` and `customerId`. Responses contain `items`, `total`, `page`, and
`pageSize`.

Setup requires `displayName`, `email`, a password of at least 12 characters, supported `locale`, `currency`, and
`electricityPrice`. A print draft requires `name`, optional `customerId`, `printerId`, `buildPlateId`, one or more
`{ componentId, durationSeconds }` hotends, optional `otherComponentIds`, one or more
`{ filamentId, usedGrams }`, and optional `notes`.

Inventory PATCH replaces its editable DTO; `{ archived: boolean }` only changes archive state. Authoritative
schemas are in [`shared/schemas`](https://github.com/tobiaswaelde/ezprint/tree/main/shared/schemas).

Component and filament inputs reference shared manufacturers with `manufacturerId`. Component references are
optional; filament references are required. Component inputs also accept `alwaysUsed`, which defaults to `false`.
Responses expose both this flag and the resolved manufacturer name.

## Errors

Errors include an HTTP status and stable `data` with `code`, `messageKey`, optional `fieldErrors`, and `requestId`.
Expect 401 without a session, 403 for a foreign origin, 409 for immutability, references, currency, or setup
conflicts, and 422 for invalid or incompatible input. API clients should branch on `code`, not parse messages.
