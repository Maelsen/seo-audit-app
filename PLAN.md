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

## Offen (geplante Anpassungen)

- [ ] (kommt — User listet als naechstes auf)

## Backlog / Ideen

- [ ] Style-Profile lernt aus Vasileios' Edits, fliesst in System-Prompt zurueck
- [ ] Multi-Template-Support im PDF-Export (Dropdown, nicht nur "default")
- [ ] Audit-Liste/Dashboard zum Wiederfinden alter Audits
