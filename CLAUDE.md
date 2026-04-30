@AGENTS.md

## Build / Run

- Lokal: `npm run dev` → http://localhost:3000
- Railway-Mode: `npm run start:railway` (seed default template if missing, dann `next dev` + git-cron parallel)
- Lint: `npm run lint`
- Health: `GET /api/health` (200 = ok)

## Deployment

- Production-Host: Railway, App-URL `https://seo-audit-app-production-578b.up.railway.app`
- Volume gemountet auf `/app/data` (persistent: audits, templates, uploads, screenshots, agent-chats, agent-backups)
- Basic Auth via `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` in Railway Variables
- Auto-Deploy bei Push auf `main`. Auto-Sync zurueck via `scripts/git-cron.ts` (6h Intervall)

## Arbeitsweise

- Eine Funktion = ganzer Milestone, nicht Sub-Step. User-Interaktion nur am Milestone-Ende, nicht nach jedem Sub-Schritt.
- Wenn beim Bauen eine manuelle Aktion 3+ Mal wiederholt wird (SQL-Query, Log-Check, Debug-Script, manueller Browser-Klick): am Milestone-Ende beim PROGRESS.md-Update erwaehnen und pruefen, ob ein Subagent / Skill / Hook / offizieller MCP-Server das abnimmt.
- PLAN.md ist der Master-Plan mit Checkboxen. Nach Milestone-Ende abhaken.
- PROGRESS.md ist das Build-Log. Was, welche Typen/Vertraege, welche Gotchas. Append am Milestone-Ende.

## Commit-Style

Format: `<type>: <kurzbeschreibung>`
Types: feat / fix / chore / docs / refactor
Sprache: deutsch oder englisch, aber innerhalb eines Commits konsistent.

## Secrets

Niemals in Git. `.env.example` als Template committen, echte Werte in `.env.local` (gitignored). Production-Secrets ausschliesslich in Railway Variables.

## Code-Conventions

- TypeScript strict, kein `any` ohne Begruendung
- Inline-Styles fuer Audit-Review-Page (so wurde es gestartet, beibehalten)
- Tailwind v4 fuer alle anderen UI-Bereiche
- Agent-Sandbox: Schreib-Operationen ausserhalb des Projekt-Roots oder in `data/agent-backups/` sind blockiert (siehe `src/lib/agent/sandbox.ts`)

## Drei Render-Pfade (kritisch fuer AI-Agent + Code-Aenderungen)

1. **Landing** (`/`) → `src/app/page.tsx`. Upload-Form.
2. **Audit-Review** (`/audit/[id]`) → `src/app/audit/[id]/page.tsx`. Inline-Styles.
3. **PDF-Template** (Editor `/editor/[templateId]` + PDF-Export) → Block-System mit `data/templates/{id}.json`. Decomposed Pages haben Content im JSON, nicht-decomposed rendern die React-Komponente aus `src/components/pdf-template/pages/*.tsx`.
