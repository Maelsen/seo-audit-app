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
- [ ] M2 Block-Primitives: pieChart, arrowBulletList, comparisonTable falls noetig
- [ ] M3 Page-Chrome (Header + Footer Helper)
- [ ] M4 Cover + Gesamtsituation
- [ ] M5 Top 3 Risiken + Wo du sein koenntest
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

- [ ] Style-Profile lernt aus Vasileios' Edits, fliesst in System-Prompt zurueck
- [ ] Multi-Template-Support im PDF-Export (Dropdown, nicht nur "default")
- [ ] Audit-Liste/Dashboard zum Wiederfinden alter Audits
