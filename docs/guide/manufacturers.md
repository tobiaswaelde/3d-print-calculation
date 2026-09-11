---
title: Manufacturers
description: Maintain reusable manufacturer records for printers, components, and filaments.
---

# Manufacturers

Manufacturers at `/manufacturers` provide the shared manufacturer list used by printer, component, and filament
forms. Create a manufacturer once, then select it from the **Manufacturer** dropdown on an inventory form.

Existing printer, component, and filament manufacturer text is converted to shared manufacturer records during
database migrations. Identical names are reused across resource types. Printers without a previous manufacturer
are assigned to the generated `Unknown` record.

Manufacturers can be searched, edited, archived, restored, and safely deleted. Archived manufacturers are hidden
from new selections. A manufacturer referenced by a printer, component, or filament cannot be permanently deleted.
