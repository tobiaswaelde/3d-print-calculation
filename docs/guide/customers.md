---
title: Customers
description: Create, search, edit, archive, restore, and safely delete optional customer records.
---

# Customers

Customers at `/customers` are optional references that help identify who a print belongs to. A print can always be
created without a customer.

![Customers page with search, table options, actions, and a sample customer](/screenshots/customers.jpg)

## Fields

| Field     | Requirement                         | Use                                                              |
| --------- | ----------------------------------- | ---------------------------------------------------------------- |
| **Name**  | Required                            | Primary label in tables, selectors, dashboard drafts, and search |
| **Email** | Optional, valid email when provided | Contact context and searchable detail                            |
| **Note**  | Optional                            | Internal context shown when editing the customer                 |

## Page functions

- **Search** filters by customer name and email.
- **New** or <kbd>Ctrl</kbd>+<kbd>N</kbd> opens the create dialog.
- **Edit** opens the same fields with saved values; save to replace the editable data.
- **Archive** removes the customer from new-print selectors but keeps it linked to existing prints.
- **Table options → Show archived** reveals archived customers; **Restore** makes one active again.
- **Delete** permanently removes only an unreferenced customer after confirmation. Archive referenced customers.

The Cost rate column is intentionally empty for customers because they do not contribute to a calculation.
