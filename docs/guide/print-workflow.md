---
title: Print workflow
description: Search and filter prints, create a four-step draft, review costs, edit, complete, and duplicate records.
---

# Print workflow

## Prints page

The `/prints` table shows name, customer, printer, total duration, total cost, and status. Select a print name to
open its details.

![Prints page with a draft and a completed print](/screenshots/prints.jpg)

Use the toolbar to:

- search by print name;
- filter **All statuses**, **Draft**, or **Completed**;
- include archived records through **Table options**;
- choose **New** or press <kbd>Ctrl</kbd>+<kbd>N</kbd> to create a print.

The `/prints/new` route opens the same guided create dialog and normalizes the URL back to `/prints`.

## Create a print

The dialog validates the current section before moving forward:

1. **General:** enter a name, optional customer, printer, and one compatible build plate.
2. **Duration:** select at least one compatible hotend and enter nonnegative hours plus 0–59 minutes. Use
   **Create** to add another hotend; each hotend must be unique and have positive total duration.
3. **Material:** optionally select compatible **Other components**, then select one or more unique filaments and
   enter a positive used weight for each.
4. **Review:** add an optional note and verify the live cost breakdown before selecting **Save draft**.

Changing a printer resets component selections because compatibility may differ. **Back** preserves valid values,
while **Cancel** closes the dialog without creating a print.

![Final create step with live printer, component, filament, electricity, and total costs](/screenshots/new-print-review.jpg)

## Edit a draft

A saved draft remains editable at `/prints/:id`. The detail page exposes all fields in one scrollable form. Changes
automatically refresh the preview after a short delay; **Save draft** persists the recalculated inputs and cost.

![Editable print draft with selected resources and cost breakdown](/screenshots/print-draft.jpg)

The preview contains:

- printer wear for total duration;
- build-plate, hotend, and optional-component wear;
- all filament usage;
- electricity from duration, printer watts, and the current electricity rate;
- the exact unrounded total, formatted for display in the selected currency.

See [Calculation rules](/reference/calculation) for the formula and a reproducible numerical example.

## Complete a print

Select **Complete**, then **Confirm**. The server validates and recalculates the current draft before changing its
status. Completion stores an immutable snapshot of inputs, source prices, rates, electricity price, currency,
formula version, category totals, and final total.

![Completed print with its immutable banner and disabled input fields](/screenshots/completed-print.jpg)

Completed fields are disabled. Later master-data or electricity-price changes do not alter the snapshot.

![Completed cost breakdown and stored calculation sources](/screenshots/completed-print-sources.jpg)

## Duplicate a print

**Duplicate** is available on both drafts and completed prints. It creates a new draft with a `(copy)` suffix,
retains the referenced resources and quantities, and recalculates with the current active master data, formula, and
settings. Review the new total before saving or completing it; duplication is the supported way to reuse a
completed record.
