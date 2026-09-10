---
title: Calculate print costs
description: Create drafts, choose compatible resources, read costs, complete, archive, and duplicate.
---

# Calculate print costs

## Draft and preview

Open **Prints → New print**. Enter a name, optional customer, and active printer. Only compatible plates, hotends,
and other components are then available. Choose one plate, at least one hotend with seconds, and at least one
filament with used grams. Other components are optional. Total duration is the sum of hotend durations.

The live preview separates printer, component, filament, and electricity costs; see the
[calculation reference](/en/reference/calculation). **Save** creates or updates a `DRAFT`. Drafts remain editable and
appear as active work on the dashboard. Archived or incompatible resources, invalid quantities, and duplicates
produce validation errors.

## Completion and history

**Complete** changes status to `COMPLETED` and freezes inputs, source prices, formula version, currency, and totals in
an immutable snapshot. A completed print cannot be edited. Archiving removes it from default lists without deleting
history.

**Duplicate** creates a new editable draft. References are copied but cost is recalculated from current active
master data and settings. Compare the new result with the old snapshot.

If selection lists are empty, inspect active items and printer compatibility. Correct invalid fields and save
again; a failed request does not complete the draft. For storage failures, follow
[troubleshooting](/en/operations/troubleshooting).
