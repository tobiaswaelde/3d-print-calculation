---
title: Settings
description: Configure language, appearance, date formatting, currency, and electricity price.
---

# Settings

The Settings page at `/settings` combines display preferences with instance-wide calculation inputs.

![Settings page with General and Calculation sections](/screenshots/settings.jpg)

## General

- **Language:** German or US English. Saving updates the instance default and the signed-in account's preference.
  The user menu provides the same account-level shortcut.
- **Appearance:** Light, Dark, or System. This browser-local preference changes immediately after saving.
- **Date format:** Regional uses the active language's convention; ISO uses `YYYY-MM-DD`. This preference is stored
  in the browser and affects application timestamps.

## Calculation

- **Currency:** `EUR`, `USD`, `CHF`, or `GBP`. It applies to the whole instance and becomes locked after the first
  cost-bearing record exists.
- **Electricity price per kWh:** a nonnegative decimal used for new previews, saved drafts, duplicates, and
  completion recalculation. Existing completed snapshots keep their original electricity rate.

Select **Save** to validate and persist all settings. A success message confirms the update; validation or
currency-lock errors are shown on the page without discarding the entered values.
