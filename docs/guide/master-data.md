---
title: Stammdaten
description: Kunden, Drucker, Komponenten, Kompatibilitäten, Filamente und Archivierung verwalten.
---

# Stammdaten

Alle Listen unterstützen Suche, Seitennavigation und optional archivierte Einträge. Archivieren blendet einen
Eintrag in neuen Kalkulationen aus, erhält ihn aber für bestehende Drucke. Ein referenzierter Eintrag kann nicht
endgültig gelöscht werden; archiviere ihn stattdessen.

## Ressourcen

- **Kunden:** Name, optionale E-Mail und Notiz. Ein Druck darf auch ohne Kunden angelegt werden.
- **Drucker:** Kaufpreis, erwartete Lebensdauer in Stunden und mittlere Leistung in Watt. Kosten pro Stunde sind
  `Kaufpreis / Lebensdauerstunden`.
- **Komponenten:** Typ `HOTEND`, `BUILD_PLATE` oder `OTHER`, Kaufpreis und Lebensdauer. Weise jeden Eintrag den
  kompatiblen Druckern zu. Hotends verwenden ihre eigene Einsatzdauer; Bauplatte und zusätzliche Komponenten die
  gesamte Druckdauer.
- **Filamente:** Hersteller, Bezeichnung, Material, optionale Farbe, Kaufpreis und Nettogewicht in Gramm. Kosten pro
  Gramm sind `Kaufpreis / Nettogewicht`.

Geld- und Mengenfelder verwenden einen Punkt als Dezimaltrenner im Datenvertrag. Angezeigte Werte folgen der
gewählten Sprache und Währung. Negative Werte sind unzulässig; Lebensdauer und Filamentgewicht müssen größer als
null sein.

Danach kann der erste [Druckentwurf](/guide/print-workflow) erstellt werden.
