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
3. **PDF-Template** (Editor `/editor/[templateId]` + PDF-Export) → Block-System mit `data/templates/{id}.json`. Pages bestehen ausschliesslich aus dekomponierten Bloecken (text, image, scoreCircle, gauge, checkList, table, ...). Kein legacy React-Page-Rendering mehr (in M1 retired). Block-Layouts werden in `src/lib/editor/page-builders.ts` definiert (PageKey-Enum + BUILDERS-Map). Block-Views (rendert JSX zu PDF) in `src/lib/editor/blocks/*BlockView.tsx`.

## Projekt-Tools

Sechs Automation-Artefakte unter `.claude/`. Alle committed, beim naechsten Session-Start automatisch verfuegbar.

- **`/verify-app`** — Smoke-Sequenz `tsc --noEmit` + `npm run lint` + Health-Check + Templates-API. Wann nutzen: VOR jedem Commit, VOR jeder "done"-Meldung, nach groesseren Schema-Aenderungen. Definiert in `.claude/skills/verify-app/SKILL.md`.

- **`/render-pdf-preview <auditId> [templateId] [pageRange]`** — Generiert PDF aus laufendem dev-server, rendert Pages als PNGs nach `/tmp/preview-page-NN.png`, gibt Pfade zurueck zum Lesen mit Read-Tool. Wann nutzen: nach Page-Builder-Aenderungen in M3-M13, immer wenn PDF-Output visuell verifiziert werden muss. Defaults: templateId=`default`, pageRange=`1-3`. Definiert in `.claude/skills/render-pdf-preview/SKILL.md`.

- **`/render-edge-cases <blockType>`** — Edge-Case-Verifikation fuer einen Block-Type (`arrowBulletList` | `comparisonTable` | `pieChart` | `all`). Rendert das `m2-edges` Audit + Template (gitignored Re-Smoke-Asset aus M2) und mappt Block-Type → Page in dem Template. Faengt Edge-Inputs ab: empty arrays, total=0, 1=100%, overflow:shrink, maxItems clip, fixed widths, Donut. Wann nutzen: VOR Commit der einen `*BlockView.tsx` aendert, nach Schema-Aenderungen an Block-Types in `template-types.ts`. Definiert in `.claude/skills/render-edge-cases/SKILL.md`.

- **`/visual-diff-against-vasileios <auditId> [templateId] [appPages] [refPages]`** — Wickelt den `pdf-verifier` Subagent in eine deterministische Sequenz. Rendert beide PDFs bei 200 DPI als PNGs in `/tmp/vdiff-{app,ref}-page-*.png`, ruft den Subagent mit klarer Prompt-Vorlage. Wann nutzen: ab M3 nach jedem Page-Builder-Update BEVOR der Builder abgehakt wird, vor erstem Vasileios-Production-Run als finale Visual-Sanity. Definiert in `.claude/skills/visual-diff-against-vasileios/SKILL.md`.

- **`tsc-on-schema-edit` Hook** (auto-aktiv, kein Aufruf) — PostToolUse-Hook der nach Edit/Write auf `src/lib/types.ts`, `src/lib/agent/schema.ts`, `src/lib/agent/prompts.ts`, `src/lib/editor/template-types.ts`, `src/lib/editor/binding-catalog.ts` automatisch `npx tsc --noEmit` ausfuehrt und das Ergebnis als Context zurueckgibt. Wann triggert: automatisch bei jedem Edit auf diese 5 Dateien. Faengt Schema-Bruch sofort. Skript: `.claude/hooks/tsc-on-schema-edit.sh`.

- **`pdf-verifier` Subagent** (`subagent_type: "pdf-verifier"`) — Visueller Diff zwischen App-PDF und Vasileios' Referenz-PDF (`SEO AUDIT WASCHBÄR SERVICE.pdf` in `~/Downloads/`). Rendert beide bei 200 DPI, vergleicht Header/Footer/Score-Donuts/Tabellen Position+Style, gibt Drift-Report zurueck. Tools: nur Bash + Read (read-only, modifiziert keinen Code). Wann nutzen: meist via `/visual-diff-against-vasileios` Skill, nicht direkt. Definiert in `.claude/agents/pdf-verifier.md`.
