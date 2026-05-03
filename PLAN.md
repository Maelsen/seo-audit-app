# SEO Audit App - Master Plan

Status-Snapshot der Features. Checkboxen werden beim Milestone-Ende aktualisiert.

## Done (erledigt)

- [x] Audit-Pipeline: Upload (URL + Screaming Frog CSV + SEOptimer PDF + PageSpeed)
- [x] AI-Analyse via Anthropic SDK, generiert vollstaendigen Report (submit_audit Tool)
- [x] Audit-Review-Page (`/audit/[id]`) mit editierbaren Risiken/Empfehlungen
- [x] Template-Editor (`/editor`) mit Block-System (legacy + dekomponierte Pages)
- [x] PDF-Export via Puppeteer + Template-Renderer
- [x] AI-Chat-Agent (Floating-Button) mit File-Tools, kann Code/Templates editieren
- [x] Auto-Backups + Undo fuer Agent-Schreibaktionen
- [x] Live-Reload des Editors wenn Agent Template-JSON aendert
- [x] Railway-Deployment mit `next dev` (HMR aktiv) + Persistent Volume
- [x] Basic-Auth via `proxy.ts`, HMR-Pfade ausgenommen
- [x] Auto-Git-Sync alle 6h via `scripts/git-cron.ts`
- [x] Default-Template Bootstrap-Seed beim Container-Start (idempotent)
- [x] Screenshot-Robustheit: separater Browser pro Viewport, kein Total-Crash mehr

## Offen — 20-Seiten-Migration (Vasileios Waschbaer-Layout)

Detail-Plan: `~/.claude/plans/soft-tickling-iverson.md`

- [x] M0 Vorbereitung: Local-Wipe + PDF-Vermessungs-PNGs (Railway-Volume-Wipe deferred auf M1-Deploy)
- [x] M1 Schema-Migration + Legacy-Cleanup + M14-Cleanup vorgezogen: usability+social raus; seitenstrukturContent + comparison + phasenplan rein; legacy pdf-template/pages/* + AuditDocument + buildAuditHtml + LegacyPageBlockView geloescht; default.json seedet jetzt 20 leere Page-Shells; PDF-Render-Fixes (networkidle0 → load+fonts.ready, Empty-Page-Anchor)
- [x] M2 Block-Primitives: arrowBulletList + comparisonTable + pieChart implementiert; Smoke-Template `m2-smoke` rendert alle drei korrekt
- [x] M3 Page-Chrome (Header + Footer Helper) — `pageChrome()` Helper exportiert, in 18 BUILDERS referenziert (alle ausser cover + inhaber), pixel-vermessen gegen Vasileios Page 5; PAGE_HEIGHT 296→297 (real A4) korrigiert
- [x] M4 Cover + Gesamtsituation — `buildCover()` (Mega-Title mit Cyan-Glow + Wortmarke + Domain + Cover-Screenshot + 3-Spalten-Footer) und `buildGesamtsituation()` (Headline + Diagnose-Text + Sub-Headline + 52mm-Big-Donut + Right-Side-Heading/Paragraph/Empfehlungs-Button + 6 Sub-Donuts 19mm im 4+2 Grid) implementiert. Seed-Skript (.mjs→.ts) ruft jetzt BUILDERS via tsx auf — default.json hat 120 echte Blocks statt leerer Shells. TextBlockView bekam overflow:hidden gegen Frame-Überlauf
- [x] M5 Top 3 Risiken + Wo du sein koenntest — `buildTopRisks()` (Headline + Subline + topRiskList Block bound to `topRisks`) und `buildWoDuSeinKoenntest()` (centered Headline + Subline + 3× alt-sentence-Pair (rechts-bündige bold aspect / centered vision multi-line) + Tabellen-Heading + 3-Spalten Vergleichstabelle mit cyan Pill-Header) gegen Vasileios Page 3+4 vermessen + chrome-diff <1.5mm
- [x] M6 On-Page SEO (2 pages) — `buildOnPageSeo1()` (Score-Donut + bound-Sub-Headline/Text + findingsTable Block neu mit cyan-underlined Header + 3 Spalten Problem/Befund/Status + Status-Icons aus assets) und `buildOnPageSeo2()` (Cost-Heading + Body + SerpPreview + cyan H2-H6 Sub-Headings + BarChart 5 rows + arrowBulletList + 2 Footer-Notes) gegen Vasileios Page 5+6 vermessen + ⚠ warning-Glyph in DEFAULT_STATUS_ASSETS auf yellow gefixt. Default-Template hat 150 Blocks (+17 vs M5).
- [x] M7 UX & Conversion (2 pages) — `buildUxConversion1()` (Score-Donut + bound-Sub-Headline/Text + findingsTable mit 12 Rows) und `buildUxConversion2()` (Cost-Heading + Body + Action-Heading + arrowBulletList 6 Pfeil-Items + closingNote) als Subset von M6's Pattern (kein SerpPreview, kein BarChart, nur 1 Footer-Note). Default-Template hat 162 Blocks (+12 vs M6). seed-vasileios-audit M7-Daten ergaenzt. Editor-E2E in Chrome verifiziert (alle Bloecke anklickbar, Inspector matcht JSON, Save+Reload-Persistenz). Bug gefixt: `closingNote` fehlte im binding-catalog fuer alle 7 Sections (silent persistence-killer wenn User im Editor speichert).
- [x] M8 Seitenstruktur & Content (2 pages) — `buildSeitenstrukturContent1()` (Page 9: Score-Donut + bound Sub-Headline/Text + findingsTable mit 8 Rows, h=130 statt 175 weil unteres Page-Drittel leer bleibt) und `buildSeitenstrukturContent2()` (Page 10: Cost-Heading + costText (5 Zeilen) + 3 Image-Stub-Slots als dashed-cyan-Placeholders (2 oben side-by-side + 1 cyan-Banner unten) + arrowBulletList 4 Items + centered closingNote). Default-Template hat 177 Blocks (+15 vs M7). seed-vasileios-audit + seed-edge-case-audit M8-Daten ergaenzt. PDF-Diff vs Vasileios Page 9 Chrome ✓ unter 1.6mm Drift.
- [x] M9 Lokales SEO (2 pages) — `buildLokalesSeo1()` (Page 11: exakter Spiegel von M8 Page 9 mit anderen Bindings, 8 Findings-Rows GBP/NAP/HWK/Schema-Markup) und `buildLokalesSeo2()` (Page 12: Cost-Heading + costText 6 Zeilen + Action-Heading + arrowBulletList 5 Items + centered closingNote 2 Zeilen + Schema-Markup-Image links unten 90×60mm bound to `sections.lokalesSeo.schemaMarkupImage` + italic Caption rechts daneben bound to `.schemaMarkupCaption`). 2 neue Bindings im Catalog: schemaMarkupImage (image) + schemaMarkupCaption (string). Default-Template hat 191 Blocks (+14 vs M8). seed-vasileios-audit M9 + seed-edge-case-audit M9-Op (vollstaendig: heading/text/costText/closingNote + schemaMarkupImage/Caption) ergaenzt. PDF-Diff vs Vasileios Page 11+12 Chrome ✓ unter 1.6mm Drift, Empty-State kein Crash.
- [x] M10 Performance & Technisches (2 pages) — `buildPerformance1()` (Page 13: Score-Donut + bound Sub-Headline/Text + 3 Speed-Gauges semi für serverResponseTime/contentLoadTime/scriptLoadTime mit threshold-basierter Farbe + 6 ResourceTiles für resourceCounts.{html,js,css,img,other,total} mit Datei-Type-Approximations-Icons in Brand-Farben + Page-Size-Gauge bound to pageSizeMb + Pie-Chart 5 Slices bound to pageSizeBreakdown mit Legende rechts) und `buildPerformance2()` (Page 14: Cost-Heading + costText + Action-Heading + arrowBulletList 3 Items + centered closingNote — exaktes Spiegel-Pattern von M7 Page 8). Default-Template hat 218 Blocks (+27 vs M9). 6 neue Sub-Pfad-Bindings im Catalog (resourceCounts.{html,js,css,img,other,total}) + findings-Pfad nachgepflegt. seed-vasileios-audit M10 + seed-edge-case-audit M10-Op (vollstaendig: heading/text/costText/closingNote + numerische Felder + 2 Object-Felder) ergaenzt. PDF-Diff vs Vasileios Page 13+14 Chrome ✓ unter 1.6mm Drift, Empty-State kein Crash (Pie-Fallback grauer Kreis bei total=0).
- [ ] M11 Links & Autoritaet (2 pages)
- [ ] M12 Phasenplan (2 pages)
- [ ] M13 Zusammenfassung + Inhaber
- [x] M14 Cleanup: Legacy React-Pages loeschen (in M1 mitgenommen)

## Backlog / Ideen

- [ ] M4.1 Refinement: Cover-Screenshot in Monitor-Mockup-Frame (Bezel + Stand) — derzeit nur borderRadius:4. Asset-PNG oder SVG-Block noetig
- [ ] Style-Profile lernt aus Vasileios' Edits, fliesst in System-Prompt zurueck
- [ ] Multi-Template-Support im PDF-Export (Dropdown, nicht nur "default")
- [ ] Audit-Liste/Dashboard zum Wiederfinden alter Audits
