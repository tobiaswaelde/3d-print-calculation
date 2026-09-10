---
title: Data model
description: Prisma models, relationships, archiving, decimal serialization, and immutable print snapshots.
---

# Data model

`User` owns `Session` records; `AppSettings` is the singleton with ID `1`. `Customer`, `Printer`, `Component`, and
`Filament` are inventory records. `PrinterComponent` represents printer/component compatibility.

A `PrintJob` references one printer, an optional customer, and component and filament usage rows. Usage rows copy
names, prices, lifetimes, quantities, and line costs at calculation time. `PrintCostSnapshot` also retains totals,
electricity price, printer inputs, currency, and formula version. A `DRAFT` may be recalculated; a `COMPLETED` print
is immutable through the service contract.

Archiving sets `archivedAt`, hiding records from new selections while preserving historical prints. Restrictive
relations and service checks prevent deletion of referenced data; join rows and sessions may cascade with owners.

Money and quantities use Prisma `Decimal` and canonical JSON strings such as `"1.782175"`. Duration and power are
integer seconds and watts. The authoritative model is
[`prisma/schema.prisma`](https://github.com/tobiaswaelde/ezprint/blob/main/prisma/schema.prisma).
