---
title: Filaments
description: Maintain filament identity, spool pricing, usable weight, derived cost per gram, and availability.
---

# Filaments

Filaments at `/filaments` provide material identity and cost per usable gram.

![Filaments page with material metadata and cost per gram](/screenshots/filaments.jpg)

## Fields and derived rate

| Field              | Requirement                 | Use                                       |
| ------------------ | --------------------------- | ----------------------------------------- |
| **Name**           | Derived                     | Manufacturer, material, and color name    |
| **Manufacturer**   | Required                    | Shared manufacturer selected from a list  |
| **Material**       | Required                    | Material family such as PLA, PETG, or ABS |
| **Color name**     | Required                    | Searchable descriptive value              |
| **Color hex code** | Required, `#RRGGBB`         | Color avatar in filament selectors        |
| **Purchase price** | Required, zero or greater   | Full spool cost                           |
| **Net weight (g)** | Required, greater than zero | Usable material in the spool              |
| **Note**           | Optional                    | Batch, storage, or purchasing context     |

The form and table calculate **Cost per gram** as `purchase price / net weight`. Print cost multiplies this value by
the **Used weight (g)** entered for each selected filament. A draft may use multiple unique filaments.

Manage available choices in the shared [manufacturer inventory](/guide/manufacturers). The filament name is
derived from the selected manufacturer, material, and color name. It cannot be edited independently.

Use the standard search, create, edit, archive, restore, and safe-delete actions. Archived filament remains visible
in historical usages but is not available for a new calculation.
