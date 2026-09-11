---
title: Settings
description: Configure display, calculation, and integration settings in dedicated tabs.
---

# Settings

The Settings page uses linked **General**, **Calculation**, and **Integrations** tabs. Each tab has its own URL, so browser navigation and direct links preserve the selected settings area.

![Settings page with linked General, Calculation, and Integrations tabs](/screenshots/settings.jpg)

## General

- **Language:** German or US English. Saving updates the instance default and the signed-in account's preference.
  The user menu provides the same account-level shortcut.
- **Appearance:** Light, Dark, or System. This browser-local preference changes immediately after saving.
- **Date format:** choose `DD.MM.YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`, or a localized abbreviated month.
- **Time format:** choose 24-hour time, 12-hour time with AM/PM, or 24-hour time including seconds.
- **Duration format:** choose human-readable words, compact units, a digital clock, or decimal hours.
- **Spool management:** controls physical spool selection and stock tracking for the whole instance. When disabled,
  new calculations use the filament catalog price and net weight directly. Existing spool records and historical
  snapshots are retained. Enabling it again creates an opening spool for each active filament that has no active
  spool.

These browser-local preferences are applied centrally with Day.js to timestamps and print durations throughout
the application.

## Calculation

- **Currency:** `EUR`, `USD`, `CHF`, or `GBP`. It applies to the whole instance and becomes locked after the first
  cost-bearing record exists.
- **Electricity price per kWh:** a nonnegative decimal used for new previews, saved drafts, duplicates, and
  completion recalculation. Existing completed snapshots keep their original electricity rate.

## Integrations

Use the **Integrations** tab to enable and configure Spoolman and BambuBuddy. Disabling spool management also
disables Spoolman while retaining its URL and credential; re-enable Spoolman explicitly after restoring spool
management. BambuBuddy printer and result workflows remain available, while tray-to-spool mapping is hidden.
Connection tools stay within that tab; they do not add separate pages or sidebar entries. See
[Spoolman and BambuBuddy](./integrations) for setup, ownership, and reconciliation details.

Select **Save** in General or Calculation to validate and persist that tab's settings. A success message confirms the update; validation or currency-lock errors are shown without discarding the entered values.
