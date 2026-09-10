---
title: Data model
description: Prisma models, relationships, archiving, decimal serialization, and immutable print snapshots.
---

# Data model

`User` owns `Session` records; `AppSettings` is the singleton with ID `1`. `Customer`, `Printer`, `Manufacturer`,
`Component`, and `Filament` are inventory records. Components optionally and filaments obligatorily reference a
shared `Manufacturer`; `PrinterComponent` represents printer/component compatibility.
Filaments store a required descriptive color name and `#RRGGBB` value; their display name is derived from the
manufacturer, material, and color name.
The `Component.alwaysUsed` flag controls compatible defaults in new print forms without making those selections
mandatory.

A `PrintJob` references one printer, an optional customer, and component and filament usage rows. Its workflow
status is one of `DRAFT`, `PRINTING`, `PRINTED`, `SHIPPED`, or `DONE`; payment is tracked independently with the
nullable `paidAt` timestamp. Usage rows copy
names, prices, lifetimes, quantities, and line costs at calculation time. `PrintCostSnapshot` also retains totals,
electricity price, printer inputs, currency, and formula version. A `DRAFT` may be recalculated; leaving Draft
finalizes the snapshot and makes print inputs immutable through the service contract.

Archiving sets `archivedAt`, hiding records from new selections while preserving historical prints. Restrictive
relations and service checks prevent deletion of referenced data, including manufacturers used by components or
filaments; join rows and sessions may cascade with owners.

Money and quantities use Prisma `Decimal` and canonical JSON strings such as `"1.782175"`. Duration and power are
integer seconds and watts. The authoritative model is
[`prisma/schema.prisma`](https://github.com/tobiaswaelde/ezprint/blob/main/prisma/schema.prisma).
