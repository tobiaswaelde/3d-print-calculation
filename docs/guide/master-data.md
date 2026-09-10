---
title: Inventory overview
description: Understand shared list behavior, validation, calculated rates, archiving, and safe deletion.
---

# Inventory overview

Inventory provides the reusable inputs for every print calculation:

- [Customers](/guide/customers) provide optional ownership and contact context.
- [Printers](/guide/printers) provide purchase price, expected lifetime, and average power.
- [Components](/guide/components) provide wear cost, type, and printer compatibility.
- [Filaments](/guide/filaments) provide spool cost and usable net weight.

## Shared list functions

Each page supports local search, **New**, **Edit**, **Archive**, **Restore**, and **Delete**. Search is debounced as
you type. Select **Table options → Show archived** to include archived rows; those rows appear dimmed.

Archiving is reversible and hides a record from new print selections while preserving old calculations. Permanent
deletion succeeds only when the record is not referenced. If it is referenced, keep it archived instead. Delete
always opens a confirmation before the request is sent.

## Form behavior

Create and edit forms open in a dialog. Required fields are marked with an asterisk, invalid fields show inline
messages, and **Cancel**, <kbd>Escape</kbd>, or the close button discards unsaved changes. Monetary and quantity
fields accept decimal values; negative values are rejected, and lifetimes and net weights must be greater than zero.

Printer/component cost per hour and filament cost per gram update in the form before saving. Display formatting
uses the selected application language and currency; the HTTP API serializes decimal values as strings.
