---
title: Settings
description: Configure language, appearance, date, time, duration formatting, currency, and electricity price.
---

# Settings

The Settings page at `/settings` combines display preferences with instance-wide calculation inputs.

![Settings page with General and Calculation sections](/screenshots/settings.jpg)

## General

- **Language:** German or US English. Saving updates the instance default and the signed-in account's preference.
  The user menu provides the same account-level shortcut.
- **Appearance:** Light, Dark, or System. This browser-local preference changes immediately after saving.
- **Date format:** choose `DD.MM.YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`, or a localized abbreviated month.
- **Time format:** choose 24-hour time, 12-hour time with AM/PM, or 24-hour time including seconds.
- **Duration format:** choose human-readable words, compact units, a digital clock, or decimal hours.

These browser-local preferences are applied centrally with Day.js to timestamps and print durations throughout
the application.

## Calculation

- **Currency:** `EUR`, `USD`, `CHF`, or `GBP`. It applies to the whole instance and becomes locked after the first
  cost-bearing record exists.
- **Electricity price per kWh:** a nonnegative decimal used for new previews, saved drafts, duplicates, and
  completion recalculation. Existing completed snapshots keep their original electricity rate.

Select **Save** to validate and persist all settings. A success message confirms the update; validation or
currency-lock errors are shown on the page without discarding the entered values.
