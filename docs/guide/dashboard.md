---
title: Dashboard
description: Read the period filter, KPI cards, completed-cost charts, and unfinished-print table.
---

# Dashboard

The Dashboard at `/` is the default page after sign-in. It combines completed-print reporting with a working list
of active drafts.

![Populated dashboard with KPI cards and completed-print charts](/screenshots/dashboard.jpg)

## Reporting period

Choose **Last 30 days**, **Last 90 days**, or **All time**. The selected period affects completed-print count,
duration, total cost, the cost-over-time chart, and the category chart. **Active drafts** and the unfinished-print
table remain current operational data rather than historical reporting.

## KPI cards

- **Active drafts** opens the Prints page filtered to Draft.
- **Completed prints** opens the Prints page filtered to Completed.
- **Total duration** sums completed-print duration in the selected period.
- **Total calculated cost** sums immutable completed-print totals in the selected period.

## Charts

**Print cost over time** plots completed totals by date. **Cost by category** divides completed costs into printer,
components, filament, and electricity. Hover a chart segment or point for the formatted value. Equivalent text is
provided for assistive technology.

## Unfinished prints

The table lists each draft's name, optional customer, printer, last update, duration, and current total. Select a
name to continue editing. **New print** opens the same guided dialog available on the Prints page.

![Unfinished-print table with a current draft and the New print action](/screenshots/dashboard-unfinished.jpg)
