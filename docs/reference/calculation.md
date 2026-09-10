---
title: Berechnungsregeln
description: Formelversion 1, Einheiten, Eingabegrenzen, Dezimalpräzision und reproduzierbares Rechenbeispiel.
---

# Berechnungsregeln

Formelversion `1` verwendet `decimal.js` ohne Zwischenrundung. API-Ergebnisse sind kanonische Dezimalstrings; erst
die Oberfläche formatiert Geld für die Anzeige. `t = Sekunden / 3600`, Leistung wird mit `/ 1000` von Watt in kW
umgerechnet.

```text
Drucker       = t_gesamt × (Kaufpreis_Drucker / Lebensdauer_Drucker_h)
Hotend        = t_Hotend × (Kaufpreis_Hotend / Lebensdauer_Hotend_h)
Bauplatte     = t_gesamt × (Kaufpreis_Bauplatte / Lebensdauer_Bauplatte_h)
Weitere Teile = t_gesamt × Σ(Kaufpreis_Teil / Lebensdauer_Teil_h)
Filament      = Σ(Gramm_verbraucht × Kaufpreis_Rolle / Nettogramm_Rolle)
Strom         = t_gesamt × (Watt_Drucker / 1000) × Preis_kWh
Gesamt        = Drucker + alle Komponenten + Filament + Strom
```

Mindestens ein Hotend und ein Filament sowie genau ein Drucker und eine Bauplatte sind erforderlich. Die
Gesamtdauer ist die Summe positiver ganzzahliger Hotend-Sekunden. Verbrauchsgewichte und Lebensdauern müssen positiv
sein; Preise und Watt dürfen null, aber nicht negativ sein. Ressourcen müssen aktiv, eindeutig und mit dem Drucker
kompatibel sein.

## Unabhängig reproduzierbares Beispiel

Für 5400 s = 1,5 h, Drucker 1200/6000 h und 120 W, Hotend 100/2000 h, Bauplatte 60/1200 h,
42,5 g einer 29,99/1000-g-Rolle und Strompreis 0,32/kWh:

```text
Drucker    1.5 × 0.2       = 0.3
Hotend     1.5 × 0.05      = 0.075
Bauplatte  1.5 × 0.05      = 0.075
Filament   42.5 × 0.02999  = 1.274575
Strom      1.5 × 0.12 × .32= 0.0576
Gesamt                      = 1.782175
```

Eine neue Formel erhält eine neue `calculationVersion`. Alte Abschluss-Snapshots behalten ihre Version und Werte;
Duplikate werden mit der aktuellen Version und aktuellen Preisen berechnet.
