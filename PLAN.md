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
- [ ] M6 On-Page SEO (2 pages)
- [ ] M7 UX & Conversion (2 pages)
- [ ] M8 Seitenstruktur & Content (2 pages)
- [ ] M9 Lokales SEO (2 pages)
- [ ] M10 Performance & Technisches (2 pages)
- [ ] M11 Links & Autoritaet (2 pages)
- [ ] M12 Phasenplan (2 pages)
- [ ] M13 Zusammenfassung + Inhaber
- [x] M14 Cleanup: Legacy React-Pages loeschen (in M1 mitgenommen)

## Backlog / Ideen

- [ ] M4.1 Refinement: Cover-Screenshot in Monitor-Mockup-Frame (Bezel + Stand) — derzeit nur borderRadius:4. Asset-PNG oder SVG-Block noetig
- [ ] Style-Profile lernt aus Vasileios' Edits, fliesst in System-Prompt zurueck
- [ ] Multi-Template-Support im PDF-Export (Dropdown, nicht nur "default")
- [ ] Audit-Liste/Dashboard zum Wiederfinden alter Audits
