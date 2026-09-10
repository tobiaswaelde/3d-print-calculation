---
title: Druckkosten berechnen
description: Entwürfe erstellen, kompatible Ressourcen wählen, Kosten verstehen, abschließen und duplizieren.
---

# Druckkosten berechnen

## Entwurf und Vorschau

Öffne **Drucke → Neuer Druck**. Vergib einen Namen, wähle optional einen Kunden und anschließend einen aktiven
Drucker. Danach stehen nur kompatible Bauplatten, Hotends und weitere Komponenten zur Auswahl.

Wähle genau eine Bauplatte, mindestens ein Hotend mit Einsatzdauer in Sekunden sowie mindestens ein Filament mit
verbrauchtem Gewicht in Gramm. Zusätzliche Komponenten sind optional. Die Gesamtdauer ist die Summe der
Hotend-Dauern. Die Vorschau zeigt Drucker-, Komponenten-, Filament- und Stromkosten sowie die Gesamtsumme. Die
vollständige Formel steht in der [Berechnungsreferenz](/reference/calculation).

**Speichern** erzeugt oder aktualisiert einen `DRAFT`. Entwürfe bleiben bearbeitbar und erscheinen als offene
Arbeit im Dashboard. Fehlende oder archivierte Ressourcen, unzulässige Mengen und inkompatible Komponenten werden
mit Validierungsfehlern abgewiesen.

## Abschluss und Verlauf

**Abschließen** setzt den Status auf `COMPLETED` und fixiert Eingaben, verwendete Stammdatenpreise, Formelversion,
Währung und Ergebnis in einem unveränderlichen Snapshot. Ein abgeschlossener Druck lässt sich nicht mehr ändern.
Archivieren entfernt ihn aus Standardlisten, löscht jedoch weder Verlauf noch Snapshot.

**Duplizieren** erzeugt einen neuen bearbeitbaren Entwurf. Dabei werden die Referenzen übernommen, aber die Kosten
mit den aktuell aktiven Stammdaten und Einstellungen neu berechnet. Vergleiche daher das neue Ergebnis bewusst mit
dem alten Snapshot.

## Typische Wiederherstellung

- Ist eine Auswahlliste leer, prüfe aktive Einträge und Drucker-Kompatibilitäten unter **Komponenten**.
- Korrigiere markierte Felder und speichere den Entwurf erneut; ein fehlgeschlagener Request schließt ihn nicht ab.
- Bei falschen Preisen ändere zuerst die Stammdaten und dupliziere anschließend den Druck.
- Bei Server- oder Datenbankfehlern nutze die [Fehlerbehebung](/operations/troubleshooting), statt Requests blind zu
  wiederholen.
