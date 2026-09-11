---
title: Getting started
description: Understand the application structure and move from first-run setup to a completed print calculation.
---

# Getting started

ezPrint turns printer ownership, component wear, material use, electricity, and print duration into a
single reproducible total. The normal workflow is deliberately ordered: configure the instance, create reusable
inventory, calculate a draft, and complete it only when the inputs are final.

## Recommended first workflow

1. Complete [first-run setup](/guide/setup) to create the local operator account, currency, and electricity rate.
2. Add a [printer](/guide/printers), its compatible [build plate and hotend](/guide/components), and at least one
   [filament](/guide/filaments). A [customer](/guide/customers) is optional.
3. Open **Prints**, choose **New**, and follow the four-step [print workflow](/guide/print-workflow).
4. Review the live cost breakdown, save the record as a draft, and select **Complete** when the inputs are final.
5. Use the [dashboard](/guide/dashboard) to monitor active drafts and completed-print costs.

![Flow from inventory through a draft and completed snapshot to a duplicate](/print-workflow.svg)

## Application map

| Page           | Purpose                          | Main functions                                                                  |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| **Dashboard**  | Current operational summary      | Period filter, KPI links, charts, unfinished prints, new-print shortcut         |
| **Prints**     | All calculation records          | Search, status filter, archived filter, create, open, edit, complete, duplicate |
| **Customers**  | Optional job ownership           | Create, search, edit, archive, restore, delete                                  |
| **Printers**   | Machine cost and power           | Maintain purchase price, lifetime, average power, and notes                     |
| **Components** | Wear parts and compatibility     | Define type, cost, lifetime, and compatible printers                            |
| **Filaments**  | Material cost                    | Maintain spool price, net weight, material, color, and notes                    |
| **Settings**   | Instance and display preferences | Language, appearance, feature modules, currency, and electricity rate           |

The global header, keyboard shortcuts, user menu, version indicator, and search are described under
[Navigation and search](/guide/navigation-search).
