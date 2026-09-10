---
title: Calculation rules
description: Formula version 1, units, input boundaries, decimal precision, and a reproducible example.
---

# Calculation rules

Formula version `1` uses `decimal.js` without intermediate rounding. API results are canonical decimal strings; only
the UI formats money. `t = seconds / 3600`, and watts become kW by dividing by 1000.

```text
Printer       = total_h × (printer_price / printer_lifetime_h)
Hotend        = hotend_h × (hotend_price / hotend_lifetime_h)
Build plate   = total_h × (plate_price / plate_lifetime_h)
Other parts   = total_h × Σ(part_price / part_lifetime_h)
Filament      = Σ(used_g × spool_price / spool_net_g)
Electricity   = total_h × (printer_watts / 1000) × price_per_kWh
Total         = printer + components + filament + electricity
```

One printer and plate, at least one hotend, and at least one filament are required. Total duration sums positive
whole hotend seconds. Used weight and lifetimes are positive; prices and watts may be zero but not negative.
Resources must be active, unique, and compatible.

For 5400 s = 1.5 h, printer 1200/6000 h and 120 W, hotend 100/2000 h, plate 60/1200 h, 42.5 g from a
29.99/1000-g spool, and electricity at 0.32/kWh:

```text
Printer     1.5 × 0.2        = 0.3
Hotend      1.5 × 0.05       = 0.075
Build plate 1.5 × 0.05       = 0.075
Filament    42.5 × 0.02999   = 1.274575
Electricity 1.5 × 0.12 × .32 = 0.0576
Total                         = 1.782175
```

A changed formula receives a new `calculationVersion`. Existing completed snapshots retain old versions and values;
duplicates use the current formula and current prices.
