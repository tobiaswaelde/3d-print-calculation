---
title: Calculation rules
description: Formula version 3, units, input boundaries, decimal precision, and a reproducible example.
---

# Calculation rules

Formula version `3` uses `decimal.js` without intermediate rounding. API results are canonical decimal strings;
only the UI formats currency for display. Let `t = seconds / 3600`, and convert watts to kilowatts by dividing by
1,000.

```text
Printer       = total_h × (printer_price / printer_lifetime_h)
Hotend        = hotend_h × (hotend_price / hotend_lifetime_h)
Build plate   = total_h × (plate_price / plate_lifetime_h)
Other parts   = total_h × Σ(part_price / part_lifetime_h)
Filament      = Σ(used_g × spool_price / spool_net_g)
Electricity   = total_h × (printer_watts / 1000) × price_per_kWh
Total         = printer + components + filament + electricity
```

When spool management is disabled, `spool_price` and `spool_net_g` are taken from the selected filament's catalog
price and net weight. The resulting usage has no spool identity and produces no stock movement.

One printer and build plate, at least one hotend, and at least one filament are required. Total duration sums
positive whole hotend seconds. Used weight and lifetimes are positive; prices and watts may be zero but not
negative. Resources must be active, unique, and compatible.

For 5,400 seconds (1.5 hours), a printer at 1,200/6,000 hours and 120 W, a hotend at 100/2,000 hours, a build plate
at 60/1,200 hours, 42.5 g from a 29.99/1,000-g spool, and electricity at 0.32/kWh:

```text
Printer     1.5 × 0.2        = 0.3
Hotend      1.5 × 0.05       = 0.075
Build plate 1.5 × 0.05       = 0.075
Filament    42.5 × 0.02999   = 1.274575
Electricity 1.5 × 0.12 × .32 = 0.0576
Total                         = 1.782175
```

A changed formula receives a new `calculationVersion`. Existing completed snapshots retain their version and
values; duplicates use the current formula and current prices.

## Quantity and unit costs

Quantity is a whole number from 1 to 1,000,000 (default 1). Duration, material, categories, and total cost describe the entire run. `costPerUnit = totalCost / quantity` uses the same decimal precision (20 significant digits for repeating division), with currency rounding only for display. Version 2 snapshots freeze quantity and unit cost. Version 1 snapshots retain their original totals and use quantity 1 with unit cost equal to their stored total. Duplication preserves quantity and recalculates at current prices.

## Actual costs

An outcome uses `actual-1` and only the rates stored when the print left Draft. Actual duration drives printer, build-plate, other-component, and electricity costs. Multiple hotends share actual duration in proportion to their planned durations. Each planned filament usage requires an actual weight, including zero. Zero-duration failures are allowed. Actual totals and unit costs are stored as canonical decimal strings in a separate immutable snapshot. Planned costs never change.

Version 3 uses selected physical spool prices and preserves the complete calculation as decimal strings in JSON, avoiding SQLite numeric-affinity rounding of repeating rates. Earlier snapshots retain their original stored values. Actual-cost snapshots use the frozen rates of their source version.
