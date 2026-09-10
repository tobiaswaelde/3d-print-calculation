---
title: Master data
description: Manage customers, printers, components, compatibility, filaments, and archiving.
---

# Master data

Every list supports search, pagination, and optionally archived entries. Archiving hides an item from new
calculations but retains it for existing prints. Referenced records cannot be permanently deleted; archive them.

- **Customers:** Name, optional email, and note. A print may have no customer.
- **Printers:** Purchase price, expected lifetime in hours, and average watts. Hourly cost is `price / lifetime`.
- **Components:** Type `HOTEND`, `BUILD_PLATE`, or `OTHER`, price and lifetime. Assign compatible printers. Hotends
  use their own duration; plates and other components use total duration.
- **Filaments:** Manufacturer, name, material, optional color, purchase price, and net grams. Cost per gram is
  `price / net grams`.

Money and quantity fields use a decimal point on the wire. Negative values are invalid; lifetime and filament
weight must exceed zero. Next, create a [print draft](/en/guide/print-workflow).
