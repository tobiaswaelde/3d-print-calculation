---
title: Print workflow
description: Create print drafts, move them through production and delivery, track payment, and duplicate records.
---

# Print workflow

## Prints page

The `/prints` table shows name, customer, printer, total duration, total cost, workflow status, and payment status.
Select a print name to open its details.

![Prints page showing paid and unpaid examples for every workflow status](/screenshots/prints.jpg)

Use the toolbar to:

- search by print name;
- filter **All statuses**, **Draft**, **Printing**, **Printed**, **Shipped**, or **Done**;
- include archived records through **Table options**;
- choose **New** or press <kbd>Shift</kbd>+<kbd>N</kbd> to create a print.

The `/prints/new` route opens the same guided create dialog and normalizes the URL back to `/prints`.

## Create a print

The dialog validates the current section before moving forward:

1. **General:** enter a name, optional customer, printer, and one compatible build plate.
2. **Duration:** select at least one compatible hotend and enter nonnegative hours plus 0–59 minutes. Use
   **Add** to add another hotend; each hotend must be unique and have positive total duration.
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

## Update workflow and payment

Every print moves through `DRAFT`, `PRINTING`, `PRINTED`, `SHIPPED`, and `DONE`. Choose the next value in the
**Workflow** card and select **Update status**. The first transition out of Draft requires confirmation. The server
validates and recalculates the draft, then finalizes its immutable snapshot of inputs, source prices, rates,
electricity price, currency, formula version, category totals, and final total.

Use **Mark as paid** independently of the workflow status. ezPrint stores the server timestamp in `paidAt`; marking
the print as unpaid clears it. This preserves both the yes/no state and the time payment was recorded.

![Done and paid print with its immutable banner and disabled input fields](/screenshots/completed-print.jpg)

Print fields are disabled after leaving Draft. Later inventory or electricity-price changes do not alter the
snapshot. A finalized print cannot return to Draft, but it can move between the other workflow statuses.

![Done print cost breakdown and stored calculation sources](/screenshots/completed-print-sources.jpg)

## Duplicate a print

**Duplicate** is available in every workflow status. It creates a new draft with a `(copy)` suffix,
retains the referenced resources and quantities, and recalculates with the current active inventory, formula, and
settings. Review the new total before advancing it; duplication is the supported way to reuse a finalized record.
