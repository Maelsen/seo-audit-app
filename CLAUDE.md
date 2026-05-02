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

Zwoelf Automation-Artefakte unter `.claude/` und `scripts/`. Alle committed, beim naechsten Session-Start automatisch verfuegbar.

- **`/verify-app`** — Smoke-Sequenz `tsc --noEmit` + `npm run lint` + Health-Check + Templates-API. Wann nutzen: VOR jedem Commit, nach groesseren Schema-Aenderungen, als schneller Zwischen-Check. Definiert in `.claude/skills/verify-app/SKILL.md`.

- **`/verify-feature`** — Tiefer als `/verify-app`. Komplette E2E-Verifikation einer gerade gebauten Funktion: Code-Health + Luecken-Scan (TODOs/Platzhalter/console.log) + Backend-APIs + Frontend-UI in Chrome (selber durchklicken!) + Visual + Persistenz + Production. Wann nutzen: VOR jeder "done"-Meldung am Milestone-Ende. Definiert in `.claude/skills/verify-feature/SKILL.md`.

- **`/handoff`** — Lockerer Bericht nach `/verify-feature` was gebaut wurde, was getestet wurde, und ehrlich ob Marlin selber kurz reinschauen sollte (UX/Animationen/Feeling) oder nicht (statisches Layout, API-Persistenz, Compile-Health = Claude reicht). Geschrieben in Marlins Umgangssprache. Wann nutzen: am finalen Milestone-Ende nach gruen-Verify, oder wenn Marlin fragt "wie weit sind wir". Definiert in `.claude/skills/handoff/SKILL.md`.

- **`/render-pdf-preview <auditId> [templateId] [pageRange]`** — Generiert PDF aus laufendem dev-server, rendert Pages als PNGs nach `/tmp/preview-page-NN.png`, gibt Pfade zurueck zum Lesen mit Read-Tool. Wann nutzen: nach Page-Builder-Aenderungen in M3-M13, immer wenn PDF-Output visuell verifiziert werden muss. Defaults: templateId=`default`, pageRange=`1-3`. Definiert in `.claude/skills/render-pdf-preview/SKILL.md`.

- **`/render-edge-cases <blockType>`** — Edge-Case-Verifikation fuer einen Block-Type (`arrowBulletList` | `comparisonTable` | `pieChart` | `all`). Rendert das `m2-edges` Audit + Template (gitignored Re-Smoke-Asset aus M2) und mappt Block-Type → Page in dem Template. Faengt Edge-Inputs ab: empty arrays, total=0, 1=100%, overflow:shrink, maxItems clip, fixed widths, Donut. Wann nutzen: VOR Commit der einen `*BlockView.tsx` aendert, nach Schema-Aenderungen an Block-Types in `template-types.ts`. Definiert in `.claude/skills/render-edge-cases/SKILL.md`.

- **`/visual-diff-against-vasileios <auditId> [templateId] [appPages] [refPages]`** — Wickelt den `pdf-verifier` Subagent in eine deterministische Sequenz. Rendert beide PDFs bei 200 DPI als PNGs in `/tmp/vdiff-{app,ref}-page-*.png`, ruft den Subagent mit klarer Prompt-Vorlage. Wann nutzen: ab M3 nach jedem Page-Builder-Update BEVOR der Builder abgehakt wird, vor erstem Vasileios-Production-Run als finale Visual-Sanity. Definiert in `.claude/skills/visual-diff-against-vasileios/SKILL.md`.

- **`/measure-vasileios-page <pageNum> [element] [yMin] [yMax]`** — Vermisst Layout-Elemente in `docs/measurements/page-NN.png` per Python+PIL und gibt mm-Bbox + Hex-Color aus. Element ist `logo` | `header-text` | `footer-stripe` (Standard-Chrome, default-Range full-page) oder `text-rows` | `pills` | `dividers` | `cyan-region` (Custom-Layout, brauchen yMin/yMax in mm) oder `all` (alle Chrome). Wann nutzen: VOR jedem Page-Builder in M4-M13. Standard-Chrome: `5 logo`. Custom-Layout fuer M5+: `4 pills 155 175` fuer Tabellen-Pills, `4 dividers 165 285` fuer Row-Dividers. Definiert in `.claude/skills/measure-vasileios-page/SKILL.md`.

- **`/seed-edge-case-audit <baseAuditId> [milestone]`** — Erzeugt ein Edge-Case-Audit aus einem Base-Audit mit allen milestone-relevanten Arrays geleert (M5: topRisks, comparison.altSentences, comparison.rows; M6: onpageSeo.findings/actions; **M7 (vollstaendig): uxConversion.findings/actions/heading/text/costText/closingNote** — alle bound Felder; M8-M13 aktuell nur findings/actions, bei Bedarf analog M7 erweitern). Output unter `data/audits/<base>-empty-<milestone>.json`. Wann nutzen: VOR `/verify-feature` am Milestone-Ende fuer Empty-State-Crash-Test. milestone ist `M5|M6|M7|M8|M9|M10|M11|M12|M13|all`. Definiert in `.claude/skills/seed-edge-case-audit/SKILL.md`.

- **`/seed-vasileios-audit <auditId> [milestone]`** — Schreibt ein Audit mit den exakten Vasileios Waschbaer-Service-Texten pro Milestone (aktuell **M5 + M6** vollstaendig erfasst inkl. onpageSeo findings/actions/serpPreview/h2h6Frequency, M7-M13 als Stubs). Output unter `data/audits/<auditId>.json`. Wann nutzen: VOR `/visual-diff-against-vasileios` damit App-PDF die gleichen Texte zeigt wie Referenz, oder als Test-Audit fuer `/verify-feature`. Wenn neue Milestones gebaut werden: DATA-Dict im Skill-Python-Block ergaenzen. Definiert in `.claude/skills/seed-vasileios-audit/SKILL.md`.

- **`/verify-chrome-editor-e2e <templateId> [auditId]`** — Klickt im Chrome-Browser jeden Block eines Templates an, liest dessen Inspector-Werte und vergleicht sie mit der Backend-JSON. Pruefe automatisch: pro Block ✓/✗, Drag-Sanity, Save+Reload-Persistenz, Console-Errors. Wraps die `claude-in-chrome` MCP-Sequenz. Wann nutzen: nach jedem Page-Builder-Update in M4-M13 BEVOR der Builder als "fertig" abgehakt wird. Definiert in `.claude/skills/verify-chrome-editor-e2e/SKILL.md`.

- **`/setup-domain-edge-test <baseAuditId> [templateId]`** — Generiert 3 Test-Audits (kurze/mittel/lange Domain-URLs), rendert pro Variante PDF + Header-Crop, dokumentiert Wrap-Verhalten. Wann nutzen: nach jedem neuen TextBlock der `{domain}` aufloest, oder bei Vermutung dass Domain-Laenge das Layout bricht. Definiert in `.claude/skills/setup-domain-edge-test/SKILL.md`.

- **`scripts/diff-pdf-against-vasileios.ts <auditId> <templateId> <appPage> <refPage>`** — TS-Skript (kein Skill): rendert App-PDF, vergleicht gegen Vasileios-Referenz, gibt mm-Drift-Tabelle aus mit ✓/⚠/✗ Flags. Aufruf via `npx tsx scripts/diff-pdf-against-vasileios.ts m2-smoke m3-chrome 1 5`. Wann nutzen: nach jeder Helper-Anpassung im Page-Builder fuer schnelle Drift-Quantifizierung (5s Output statt Subagent-Prompt schreiben).

- **`tsc-on-schema-edit` Hook** (auto-aktiv, kein Aufruf) — PostToolUse-Hook der nach Edit/Write auf `src/lib/types.ts`, `src/lib/agent/schema.ts`, `src/lib/agent/prompts.ts`, `src/lib/editor/template-types.ts`, `src/lib/editor/binding-catalog.ts`, `src/lib/editor/page-builders.ts` automatisch `npx tsc --noEmit` ausfuehrt und das Ergebnis als Context zurueckgibt. Wann triggert: automatisch bei jedem Edit auf diese 6 Dateien. Faengt Schema-Bruch sofort. Skript: `.claude/hooks/tsc-on-schema-edit.sh`.

- **`binding-catalog-consistency` Hook** (auto-aktiv, kein Aufruf) — PostToolUse-Hook der nach Edit/Write auf `src/lib/editor/page-builders.ts` alle `binding: { kind: "audit", path: "sections.X.Y" }` extrahiert und prueft dass jeder Path im `BINDING_CATALOG` (`src/lib/editor/binding-catalog.ts`) steht. Faengt den **silent persistence-killer**: wenn ein Page-Builder einen audit-Pfad referenziert der nicht im Catalog ist, rendert das PDF korrekt (Backend liest direkt), aber Editor zeigt "(statisch)" — und User-Save zerstoert das Audit-Binding. Wann triggert: automatisch bei jedem Edit auf `page-builders.ts`. Output: Liste fehlender Paths oder ✓-Counter. In M7-E2E-Test entdeckt (closingNote-Bug + 4 weitere Luecken aus M6: SerpPreview-url/title/description + h2h6Frequency). Skript: `.claude/hooks/binding-catalog-consistency.sh`.

- **`pdf-verifier` Subagent** (`subagent_type: "pdf-verifier"`) — Visueller Diff zwischen App-PDF und Vasileios' Referenz-PDF (`SEO AUDIT WASCHBÄR SERVICE.pdf` in `~/Downloads/`). Rendert beide bei 200 DPI, vergleicht Header/Footer/Score-Donuts/Tabellen Position+Style, gibt Drift-Report zurueck. Tools: nur Bash + Read (read-only, modifiziert keinen Code). Wann nutzen: meist via `/visual-diff-against-vasileios` Skill, nicht direkt. Definiert in `.claude/agents/pdf-verifier.md`.

## API- & Schema-Conventions (M6+)

Diese Conventions sind in den Routen / Block-Schemas eingebaut und auto-aktiv. Beim Bauen unbedingt beachten — Verstösse fallen sofort auf (PATCH 400, BarChart shrinkt).

- **PATCH `/api/templates/[id]` ist strikt typed.** Body MUSS `Partial<Template>` direkt sein (Top-Level-Keys: `id` / `name` / `version` / `createdAt` / `updatedAt` / `pages` / `assets`). Wrapper-Form `{template: ...}` führt zu **HTTP 400** mit klarer Error-Message. Editor + EditorIndex-Caller schicken bereits korrekt. Wenn du die API per `curl` testen willst: nicht den GET-Response wrappen, nur die Felder die du aendern willst direkt im Body. Definiert in `src/app/api/templates/[id]/route.ts`.

- **`BarChartBlock.overflow: "clip" | "shrink"`** — analog `ArrowBulletListBlock`. Default `clip` = backwards-compat. `shrink` skaliert Bars + Labels (min 0.55) wenn Total-Höhe Frame übersteigt. Wann nutzen: bei dynamischen Bar-Listen wo die Anzahl variieren kann (z.B. M10 Performance-Charts) oder wenn der Frame eng kalkuliert ist. M6 Page 6 nutzt es als Safety-Net. Schema in `src/lib/editor/template-types.ts`, View in `src/lib/editor/blocks/BarChartBlockView.tsx`.
