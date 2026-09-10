---
title: Datenmodell
description: Prisma-Modelle, Beziehungen, Archivierung, Dezimalwerte und unveränderliche Druck-Snapshots.
---

# Datenmodell

`User` besitzt `Session`-Datensätze; `AppSettings` ist der Singleton mit ID `1`. `Customer`, `Printer`, `Component`
und `Filament` bilden Stammdaten. `PrinterComponent` ist die n:m-Kompatibilität zwischen Druckern und Komponenten.

Ein `PrintJob` referenziert genau einen Drucker, optional einen Kunden und besitzt Komponenten- sowie
Filament-Verbrauchszeilen. Diese Zeilen kopieren Namen, Preise, Lebensdauern, Einheiten und Zeilenkosten zum
Berechnungszeitpunkt. `PrintCostSnapshot` speichert zusätzlich Summen, Strompreis, Druckerdaten, Währung und
Formelversion. `DRAFT` darf neu berechnet werden; `COMPLETED` ist über den Servicevertrag unveränderlich.

Archivierung setzt `archivedAt`, statt Beziehungen zu zerstören. Archivierte Stammdaten fehlen in neuen Auswahlen,
bleiben aber für bestehende Drucke lesbar. Restriktive Relationen und der Service verhindern das Löschen
referenzierter Daten; Join-Daten und Sessions dürfen mit ihrem Besitzer kaskadieren.

Geld und Mengen werden in SQLite über Prisma `Decimal` persistiert und in JSON als kanonische Dezimalstrings wie
`"1.782175"` übertragen. Dauer und Leistung sind ganzzahlige Sekunden beziehungsweise Watt. Dadurch gelangt kein
binäres Floating-Point-Runden in Kostenverträge. Das vollständige Schema liegt in
[`prisma/schema.prisma`](https://github.com/tobiaswaelde/3d-print-calculation/blob/main/prisma/schema.prisma).
