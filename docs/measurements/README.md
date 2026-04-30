# Vasileios PDF Measurement Reference

PDF-Quelle: `~/Downloads/SEO AUDIT WASCHBÄR SERVICE.pdf` (20 pages, A4 Hochformat)

## Pixel ↔ mm Konvertierung

PDF gerendert mit `pdftoppm -r 200` → 1655 × 2340 px = A4 (210 × 297 mm) bei 200 DPI.

```
1 mm ≈ 7.874 px
mm = px / 7.874
px = mm * 7.874
```

Quick-Reference:
| px | mm |
|---|---|
| 79 | 10 |
| 157 | 20 |
| 394 | 50 |
| 787 | 100 |
| 1181 | 150 |
| 1576 | 200 |

## Page Index (zu Milestone)

| Page | Inhalt | Milestone |
|---|---|---|
| 01 | Cover (Logo, URL, Monitor-Mockup) | M4 |
| 02 | Gesamtsituation & Diagnose (6 Sub-Scores) | M4 |
| 03 | Top 3 Risiken (flach) | M5 |
| 04 | Wo du sein könntest (Vergleichstabelle) | M5 |
| 05 | On-Page SEO Ergebnisse (Tabelle + Status-Icons) | M6 |
| 06 | On-Page SEO Was kostet (SERP + H-Bars + Pfeil-Bullets) | M6 |
| 07 | UX & Conversion Ergebnisse (12-row Tabelle) | M7 |
| 08 | UX & Conversion Was kostet | M7 |
| 09 | Seitenstruktur & Content Ergebnisse (NEU, 8-row Tabelle) | M8 |
| 10 | Seitenstruktur & Content Was kostet (+ 2 Screenshots) | M8 |
| 11 | Lokales SEO Ergebnisse (8-row Tabelle) | M9 |
| 12 | Lokales SEO Was kostet (+ Schema-Markup-Code) | M9 |
| 13 | Performance Ergebnisse (3 Halbkreis-Gauges + 6 Icons + Pie-Chart) | M10 |
| 14 | Performance Was kostet | M10 |
| 15 | Links & Autorität (2 Donuts + 7 Stat-Cards) | M11 |
| 16 | Links & Autorität Was kostet | M11 |
| 17 | Phasenplan Phase 1+2 | M12 |
| 18 | Phasenplan Phase 3 + Resümee | M12 |
| 19 | Zusammenfassung & nächster Schritt | M13 |
| 20 | Inhaber (Vasileios Foto + Kontakt + Icons) | M13 |

## Header / Footer Chrome (alle Pages außer Cover)

Logo top-left + "SEO-Audit / für www.url" turkis top-right + Cyan-Footer-Stripe unten.
Detailmaße werden in M3 gemessen.

## Workflow je Milestone

1. PNG der Page in Read tool öffnen
2. Block-Boxes visuell identifizieren, Koordinaten in px notieren
3. Per Conversion in mm rechnen, in `pages/page-NN.md` ablegen
4. In `page-builders.ts` einbauen
