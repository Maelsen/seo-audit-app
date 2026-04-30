# Progress Log

Was gebaut wurde, welche Vertraege/Typen entstanden, welche Gotchas auftraten.

## 2026-04-30: M2 Block-Primitives (arrowBulletList, comparisonTable, pieChart)

### Was

Drei neue Block-Typen ergaenzen das bestehende Block-System fuer das Vasileios-Layout:

- **`arrowBulletList`** fuer "Was dagegen zu tun ist" Sections (Pages 6, 8, 10, 12, 14, 16). Cyan-Pfeil-Glyph (SVG) + bold Title + optional detail darunter. Existing `recommendationList` ist priorisiert+nummeriert, `checkList` ist Status-basiert — passt nicht.
- **`comparisonTable`** fuer Page 4 (Wo du sein koenntest). Drei separate gerundete Header-Pillen (statt single header-row der existing `table`), Hairlines im Body, fixe N-Spalten ueber `columns: ComparisonTableColumn[]`.
- **`pieChart`** fuer Page 13 (Performance — Aufschluesselung Seitengroesse). SVG-Slices via polar-arc, optionaler innerRadius (Pie/Donut), Slice-Prozente, Legend rechts oder unten.

### Vertraege/Typen

```ts
// src/lib/editor/template-types.ts

ArrowBulletListBlock = BlockBase & {
  type: "arrowBulletList";
  binding: Binding;                           // typically audit-bound to ActionItem[]
  staticItems?: StaticArrowItem[];            // {title, detail?} fallback
  itemGap: Mm; arrowColor: HexColor;
  arrowSize: Mm; arrowGap: Mm;
  titleStyle: TextStyle; detailStyle: TextStyle;
  maxItems?: number; overflow: "clip" | "shrink" | "none";
}

ComparisonTableBlock = BlockBase & {
  type: "comparisonTable";
  binding: Binding;                           // typically audit-bound to ComparisonRow[]
  columns: ComparisonTableColumn[];           // { header, fieldPath, width? }[]
  headerPillColor: HexColor; headerPillRadius: Mm;
  headerPillPadding: { top, right, bottom, left };
  headerCellGap: Mm;
  headerStyle: TextStyle; cellStyle: TextStyle;
  rowDividerColor: HexColor; rowVerticalPadding: Mm;
}

PieChartBlock = BlockBase & {
  type: "pieChart";
  binding: Binding;                           // bound to object with named keys
  slices: PieSlice[];                         // { label, fieldPath, color }[]
  pieDiameter: Mm; innerRadius?: Mm;
  showLegend: boolean; legendPosition: "right" | "bottom";
  legendGap, legendItemGap, legendSwatchSize: Mm;
  legendStyle: TextStyle;
  showSliceLabels: boolean; sliceLabelStyle: TextStyle;
  sliceLabelOffset: Mm;
}
```

### Verifikation (lokal + E2E in Chrome)

- `npx tsc --noEmit` clean
- `npm run lint` clean
- `npm run dev` health 200
- Smoke-Template `m2-smoke.json` (gitignored) mit allen drei Blocks auf einer Page erstellt; Smoke-Audit `m2-smoke.json` (Clone von M1-E2E-Audit + 4 mock comparison.rows). PDF rendert in 2.5s, alle drei Blocks visuell korrekt:
  - arrowBulletList: cyan-Pfeile + bold-title + grau-detail, matcht Page 6 von Vasileios
  - comparisonTable: 3 cyan Pillen mit Gap, Hairlines im Body, matcht Page 4
  - pieChart: 5-Slice-Pie mit Prozenten weiss innen + Legend rechts, matcht Page 13 (modulo das stylized 3D-Volumen das wir absichtlich flat machen)
- **Chrome E2E** auf `/editor/m2-smoke?auditId=m2-smoke`: alle drei Bloecke rendern im Editor-Canvas mit echten Daten. Click auf pieChart-Block oeffnet Inspector ("pieChart · pie-1" + Frame + Layer + Duplizieren/Loeschen) ohne Crash. Console clean (keine errors/warnings). Editor-Inspector hat fuer die neuen Block-Types kein Custom-Properties-Panel — landet im default-Fall, was ok ist (gleich wie barChart/gauge/starRating heute auch).

### Gotchas

- **SVG `<text>` ignoriert CSS `color`** — braucht `fill`. Erste Pie-Render-Iteration zeigte schwarze Prozent-Labels statt der konfigurierten `#ffffff`. Fix in `PieChartBlockView.tsx` setzt `fill={fillColor}` zusaetzlich zum style.
- **SVG-viewBox-Clipping bei Slice-Labels** — Erste Iteration setzte `svgSizeMm = diameter + offset*2`, da Labels mit textAnchor=middle aber bis ~5mm halbe Breite ueber den Rand ragen wurden sie geclippt. Fix: `labelMargin = offset + 8mm` Reserve, `labelRadius = outerR + offset` (statt 0.6 * offset).
- **Editor-Inspector hat keine UI-Add-Buttons fuer die neuen Blocks** — bewusst nicht hinzugefuegt. Die existing barChart/gauge/starRating/resourceTile/serpPreview haben das auch nicht; sie kommen aus Page-Buildern in M3-M13. Konsistente Linie.

### Public Interfaces (Quick-Reference)

```ts
// Block-Union erweitert
Block = ... | ArrowBulletListBlock | ComparisonTableBlock | PieChartBlock

// binding-catalog.ts neu hinzugefuegt
{ path: "sections.leistung.pageSizeBreakdown", label: "Performance - Page Size Breakdown (Pie)", type: "object" }
{ path: "sections.leistung.resourceCounts", label: "Performance - Resource Counts (Object)", type: "object" }
```

### Smoke-Test reproduzieren

```bash
# m2-smoke audit + template liegen in data/ (gitignored)
curl -s -o /tmp/preview.pdf "http://localhost:3000/api/generate-pdf?auditId=m2-smoke&templateId=m2-smoke"
pdftoppm -r 100 -f 1 -l 1 /tmp/preview.pdf /tmp/preview-page -png
# /tmp/preview-page-1.png anschauen
```

### Wiederholte manuelle Aktionen / Friction-Points

- 2x manuell PDF generiert + pdftoppm + Read um pieChart-Bugs zu finden (beide Iterations: SVG-clipping, dann fill-vs-color). Akzeptabel — `/render-pdf-preview` Skill macht das schon trivial.

## 2026-04-17: M1 Schema-Migration + Legacy-Cleanup

### Was

- `src/lib/types.ts`: Komplett neu strukturiert. `usability` und `social` Sections entfernt. Drei neue Top-Level-Strukturen:
  - `sections.seitenstrukturContent: SeitenstrukturContentSection` (NEU, 6. Sub-Score)
  - `comparison: ComparisonSection` (Heute/In-3-Monaten Vergleich, Page 4)
  - `phasenplan: PhasenplanSection` (3 Phasen mit Massnahme/Impact-Tabellen, Pages 17-18)
  - `diagnosisText: string` (Page 2 Hauptbeschreibung)
- Alle Section-Typen erben jetzt von `SectionBase` (`score, heading, text, findings: SectionFinding[], costText, actions: ActionItem[]`). Findings sind `{problem, befund, status}` Tupel fuer die Vasileios-Tabellen.
- `src/lib/agent/schema.ts`: Zod-Schema 1:1 auf neue Types abgestimmt
- `src/lib/agent/prompts.ts`: System-Prompt um neue Section-Anleitungen erweitert
- `src/lib/editor/binding-catalog.ts`: alle Bindings auf neue Pfade umgestellt (`actions`, `costText`, `comparison.rows`, `phasenplan.phase1.entries` usw)
- `src/app/audit/[id]/page.tsx`: sectionLabels-Map auf 6 Sections (Display-Naming "Performance & Technisches" / "Links & Autoritaet"; intern bleibt `leistung`/`links`)
- `src/app/api/upload/route.ts`: Stub-Defaults fuer alle neuen Sections + comparison + phasenplan, keine Initialisierung mehr fuer `usability`/`social`

### Legacy-Cleanup (M14 vorgezogen, weil sonst kompiliert nichts)

- Geloescht: alle 12 Dateien in `src/components/pdf-template/pages/*.tsx` (Cover, Overview, TopRisks, Recommendations, OnPageSeo, UxConversion, Usability, Leistung, Social, LokalesSeo, Links, ThankYou)
- Geloescht: `src/components/pdf-template/AuditDocument.tsx`
- Geloescht: `src/lib/editor/blocks/LegacyPageBlockView.tsx`
- Geloescht: 6 obsolete Scripts (dump-measurements, visual-compare-all, visual-compare-cover, seed-decomposed-template, measure-legacy, capture-preview-pages)
- `src/lib/pdf/build.ts`: `buildAuditHtml()` entfernt; nur noch `buildTemplateHtml()`
- `src/app/api/generate-pdf/route.ts`: `engine=legacy` Fallback weg
- `src/lib/editor/template-types.ts`: `LegacyPageBlock` und `LegacyPageKey` aus dem Block-Union entfernt
- `src/lib/editor/render-template.tsx`: `legacyPage` Case im Dispatcher weg, kein Sonderfall mehr in PageView
- `src/app/editor/[templateId]/EditorClient.tsx`: "Seite in Elemente aufteilen" UI weg, `decomposePage` callback geloescht, `onDecomposePage` prop weg, `decomposePageBlocks` import weg
- `src/lib/editor/page-builders.ts`: komplett auf Stub reduziert. Neuer `PageKey` Enum mit 20 Schluesseln (cover, gesamtsituation, topRisiken, woDuSeinKoenntest, onPageSeo1/2, uxConversion1/2, seitenstrukturContent1/2, lokalesSeo1/2, performance1/2, links1/2, phasenplan1/2, zusammenfassung, inhaber). Alle Builder geben aktuell leeres Array zurueck — wird in M3-M13 befuellt
- `scripts/seed-default-template.mjs`: Seed produziert jetzt 20 leere Page-Shells (kein `legacyPage` Block mehr)
- `src/app/api/templates/decompose/route.ts`: nutzt jetzt `string` statt `LegacyPageKey`
- `src/lib/agent/chat-orchestrator.ts`: System-Prompt-Block entfernt der noch zwei Zustaende (legacy/aufgeteilt) erklaerte
- Pre-existing Lint-Fehler in `src/app/page.tsx` mitgefixt (a → Link)

### Vertraege/Typen

- `SectionBase` ist die Basis-Form fuer alle 6 Sub-Score-Sections
- `SectionFinding = {problem, befund, status}` ist die Tabellen-Zeile
- `ActionItem = {title, detail?}` ist der Pfeil-Bullet (Was-dagegen-zu-tun-ist)
- `PhaseEntry = {measure, impact}` ist die Phasenplan-Zeile
- `ComparisonRow = {problem, today, future}` ist die Vergleichstabellen-Zeile
- Editor-Page-Block-System ist jetzt Single-Source-of-Truth — keine duale React-Komponenten-Welt mehr

### Verifikation (lokal)

- `npx tsc --noEmit` clean
- `npm run lint` clean
- `npm run dev` startet, `GET /api/health` 200, `GET /api/templates` liefert 20 Page-Shells, `GET /editor` und `GET /editor/default` 200

### Gotchas

- Schema-Bruch hat den ganzen `pdf-template/pages/*.tsx` Komplex und damit verbundene Komponenten unkompilierbar gemacht. M14 (Cleanup) musste in M1 gezogen werden — es gab keinen Halbzustand bei dem die Legacy-Pages ohne `usability`/`social`/`technicalChecks` haetten kompilieren koennen.
- Wenn `next dev` waehrend grosser Type-Aenderungen laeuft, kann es in einen broken Zustand kommen (500-er) — Restart noetig.
- E2E-Verifikation in Chrome enthuellte: PDF-Render hatte `waitUntil: "networkidle0"` was 30s timeout warf weil Google Fonts CDN + `--disable-background-networking` schlecht zusammenspielen. Gefixt zu `waitUntil: "load"` + `document.fonts.ready` evaluation. PDF rendert jetzt in 2.5s.
- E2E-Verifikation in Chrome enthuellte: Anthropic Agent generiert validen Output gegen neues Zod-Schema (175s, 8.6k in / 9.6k out tokens) inkl. korrekter findings+actions pro Section. ABER `comparison.rows` und `phasenplan.phase{1,2,3}.entries` bleiben leer obwohl der System-Prompt sie verlangt. Zod akzeptiert leere Arrays. Fuer M9 (Prompt-Engineering) — entweder `.min(3)` Constraint oder Prompt strenger formulieren.

### M1 E2E-Verifikation (vollstaendig durchgezogen)

1. POST `/api/upload` ohne CSV → 200, Audit erstellt, Screenshots+PageSpeed
2. POST `/api/upload` MIT CSV-Blob → 200, "Screaming Frog fertig" geloggt, Audit erstellt
3. GET `/api/audit/{id}` → JSON enthaelt alle 6 neuen Sections, comparison{}, phasenplan{}, diagnosisText, KEIN usability/social
4. GET `/audit/{id}` (UI) → Audit-Review-Page rendert exakt 6 Section-Cards
5. POST `/api/analyze` → Anthropic-Agent laeuft 175s durch, Output-Validation gegen Zod gruen, 18 Empfehlungen, 3 Top-Risiken, alle 6 Sub-Scores gesetzt. ABER `comparison.rows[]` und `phasenplan.phase{1,2,3}.entries[]` bleiben leer (M9 Prompt-Engineering).
6. PATCH `/api/audit/{id}` (Save-Button) → 200, overallHeading persistiert verifiziert
7. POST `/api/style-profile` action=addTip → 200, Tipp im profile.explicitTips
8. PATCH `/api/templates/default` (Editor-Save) → 200, Block-Persistenz verifiziert
9. GET `/api/generate-pdf?auditId=...` → 200, **20 Pages** (initial 8 wegen Empty-Page-Collapsing-Bug, gefixt mit Anchor-Div in render-template.tsx)
10. PDF visuell ueber `pdftoppm`: schwarze A4 Pages mit `#1a1a1a` Background korrekt
11. Editor + Block hinzufuegen via PATCH + PDF rendert "E2E TEST OK" sichtbar in PNG
12. POST `/api/agent/chat` lesender Pfad → Agent liest Template via `read_file`, 5s, 2 Iterationen
13. POST `/api/agent/chat` schreibender Pfad → Agent ruft `edit_file` Tool, 8s, Template-JSON tatsaechlich modifiziert ("AGENT EDITED" persistiert + im PDF sichtbar)
14. POST `/api/agent/undo/{sessionId}` → Block-staticText auf vorherigen Wert zurueckgesetzt verifiziert
15. GET `/editor/default` UI → 20 Page-Shells in Sidebar
16. Railway-Production health 200, 401 auf protected paths (proxy.ts geladen). Auto-Deploy konfiguriert; deep-Verifikation hinter Basic-Auth erfordert User-Passwort, das ich nicht hab — gilt als deployed, nicht behind-auth verifiziert.

### Bug-Fixes waehrend E2E (M1.1)

- **PDF-Render `networkidle0` Timeout** → render.ts: `waitUntil: "load"` + `document.fonts.ready`. PDF rendert in 2.5s.
- **Empty-Page-Collapsing in PDF** → render-template.tsx: Anchor-Div mit 1px transparentem `&nbsp;` pro Page. 20 Pages aus 20 Sections garantiert.

### Public Interfaces (Quick-Reference)

```ts
// src/lib/types.ts
SectionBase = { score, heading, text, findings: SectionFinding[], costText, actions: ActionItem[], closingNote? }
SectionFinding = { problem: string; befund: string; status: "ok"|"warning"|"fail"|"info" }
ActionItem = { title: string; detail?: string }

AuditData.sections = {
  onpageSeo: SectionBase & { serpPreview, h2h6Frequency }
  uxConversion: SectionBase
  seitenstrukturContent: SectionBase & { comparisonImages? }    // NEU
  lokalesSeo: SectionBase & { schemaMarkupImage?, schemaMarkupCaption? }
  leistung: SectionBase & { serverResponseTime, contentLoadTime, scriptLoadTime, resourceCounts, pageSizeMb, pageSizeBreakdown }
  links: SectionBase & { domainStrength, pageStrength, totalBacklinks, ... }
}

AuditData.comparison = { heading, altSentences[], rows[] }   // NEU, Page 4
AuditData.phasenplan = { intro, phase1{title, entries[]}, phase2, phase3, afterPhase1, afterPhase2, afterPhase3 }   // NEU, Pages 17-18
AuditData.diagnosisText: string   // NEU, Page 2

// src/lib/editor/page-builders.ts
PageKey = "cover" | "gesamtsituation" | "topRisiken" | "woDuSeinKoenntest"
       | "onPageSeo1" | "onPageSeo2" | "uxConversion1" | "uxConversion2"
       | "seitenstrukturContent1" | "seitenstrukturContent2"
       | "lokalesSeo1" | "lokalesSeo2"
       | "performance1" | "performance2" | "links1" | "links2"
       | "phasenplan1" | "phasenplan2" | "zusammenfassung" | "inhaber"
BUILDERS: Record<PageKey, () => Block[]>   // alle aktuell EMPTY_BUILDER, gefuellt in M3-M13
decomposePageBlocks(pageKey: string): Block[]
```

### Design-Entscheidungen

- **Block-System ist Source-of-Truth** statt React-Pages. Editor + Agent + PDF lesen alle aus `data/templates/{id}.json`. Kein dual-render-path mehr.
- **Internal Naming bleibt `leistung`/`links`**, Display-Labels werden lokal in der UI/PDF auf "Performance & Technisches" / "Links & Autoritaet" gemapped — spart 30+ Datei-Touches.
- **20-Seiten-Schale ohne Inhalt im M1**, jeder Builder ist `EMPTY_BUILDER`. Pages erscheinen leer im PDF (1px-Anchor erzwingt Page-Break). Inkrementell befuellt M3-M13.
- **Schema akzeptiert leere Arrays** fuer `comparison.rows`, `phasenplan.phase{1,2,3}.entries[]`. Agent generiert gegen das Schema, Zod-Validation passiert. Aber Agent fuellt diese Arrays aktuell leer. Constraint absichtlich nicht eng (`min(N)`) gesetzt — sonst crasht `/api/analyze` ohne dass M9 fertig ist.
- **Old test audits werden NICHT migriert** — wipen war effizienter. M0 hat data/audits/ etc geleert.
- **Volume-Mount auf Railway ueberschreibt git-tracked /data**. Templates-Seed laeuft on-boot via `start:railway` Hook (`--if-missing`).

### Offene Tests / Bekannte Gaps fuer naechste Milestones

- **Agent fuellt comparison.rows + phasenplan.entries leer**. Behebt sich in M9 (Prompt-Engineering oder Schema-Constraints).
- **Production-hinter-Auth**: lokal alle 16 Pfade verifiziert. Production-Deep blockiert auf BASIC_AUTH_PASS, mache ich erst beim ersten echten Vasileios-Run mit Marlin zusammen.
- **PDF-Inhalt der 20 Pages ist leer** bis M3-M13. Nicht "broken" — designed gap. Erst M3 (Page-Chrome) bringt erste sichtbare Inhalte.
- **Editor-Drag-and-Drop in der Canvas** habe ich nicht getestet. Bekommt Coverage in M3 wenn ich erste Bloecke verschiebe.
- **Mehrere Audits parallel** (Concurrency) — nicht getestet, aber Vasileios laeuft eh single-tenant.

### Wiederholte manuelle Aktionen / Friction-Points

In M0+M1 mehrfach von Hand gemacht:

| Aktion | Wie oft | Pain |
|---|---|---|
| `tsc --noEmit && npm run lint && curl health && curl /api/templates` als Smoke-Sequenz | 4x | mittel |
| PDF generieren → `pdftoppm -r 80 -f N -l N` → Read PNG fuer visuelle Pruefung | 3x | hoch |
| `tail /tmp/seo-dev.log | grep -E "...zod|Error|...auditId..."` waehrend Anthropic-Agent laeuft | 5x | mittel |
| `git pull --rebase && git push` weil git-cron auto-syncs (~6h) — race condition zwischen lokalem Push und Container-Cron | 4x | niedrig |
| `pgrep next dev && pkill && nohup npm run dev` nach Schema-Bruch der dev-server in 500-state bringt | 2x | mittel |
| Browser-Tab management (created/closed/recreate/find by URL) nachdem User Tabs schliesst | 6x | niedrig |
| Agent-Generation triggern → 60-180s warten → status-poll → tail des response | 3x | mittel |

### Vorschlaege fuer Automatisierung (Quellen, nichts installiert)

**1. Custom Skill `/verify-app` (lokal)** — Ersetzt die Smoke-Sequenz.
- Skill-Definition: `~/.claude/skills/verify-app/SKILL.md` mit Bash-Steps (`tsc`, `lint`, `curl health`, `curl templates`, `pdf-gen + page-count check`).
- Quelle: [Claude Code Skills Doc](https://docs.claude.com/en/docs/claude-code/skills) — built-in Mechanismus.

**2. Custom Skill `/render-pdf-preview {auditId}`** — Ersetzt curl→pdftoppm→Read.
- Bash unterm: `curl -s -o /tmp/x.pdf ... && pdftoppm -r 80 -f 1 -l 3 ... && ls /tmp/x-page-*.png` und meldet Pfade die ich mit Read-Tool oeffnen kann.
- Quelle: gleiche Skills-Doc.

**3. PostToolUse-Hook auf Edit/Write** — laeuft `npx tsc --noEmit` nach jedem `src/lib/types.ts`/`schema.ts` Edit.
- Konfiguration in `.claude/settings.json` mit `hooks.PostToolUse[].matcher = "Edit|Write"`.
- Quelle: [Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks).

**4. Subagent `pdf-verifier`** — bekommt `auditId+templateId`, gibt PNG-Paths + Page-Count + Pixel-Diff vs. Vasileios-Referenz-PDF zurueck.
- Definition: `~/.claude/agents/pdf-verifier.md`.
- Quelle: [Claude Code Subagents Doc](https://docs.claude.com/en/docs/claude-code/sub-agents).

**5. Filesystem MCP Server (offiziell, Anthropic)** — bringt nichts fuer uns, weil Read/Write/Edit das schon abdecken. Skip.
- Quelle: [modelcontextprotocol/servers — filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem).

**6. GitHub MCP Server (offiziell)** — falls wir mehr `gh` Workflows kriegen (PRs, Issues). Aktuell nicht noetig, Bash + `gh` reicht.
- Quelle: [github/github-mcp-server](https://github.com/github/github-mcp-server).

**7. Puppeteer MCP (Reference Server)** — wuerde meine Chrome-Manuell-Klicks ersetzen koennen. Aber `claude-in-chrome` MCP haben wir schon.
- Quelle: [modelcontextprotocol/servers — puppeteer](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer) (community/reference).

**Empfehlung priorisiert:**

a) Skill `/verify-app` + Skill `/render-pdf-preview` → **maximaler Nutzen, geringer Aufwand**. Spart pro Milestone 5-10min Smoke-Pruefen + visuelles PDF-Verifizieren.
b) PostToolUse-Hook fuer `tsc` Auto-Run → faengt Schema-Bruch sofort, statt nach 30 Edits.
c) `pdf-verifier` Subagent → erst sinnvoll ab M3 wenn Pixel-Vergleich gegen Vasileios-PDF wirklich noetig wird.

(7) und MCP-Server kann man spaeter ergaenzen — nicht produktiv jetzt.

### Implementierte Automation (Commit `a933a12`)

- `.claude/skills/verify-app/SKILL.md` — Smoke-Sequenz (tsc, lint, health, templates, optional PDF)
- `.claude/skills/render-pdf-preview/SKILL.md` — `<auditId> [templateId] [pageRange]` → PDF + PNGs in `/tmp`
- `.claude/hooks/tsc-on-schema-edit.sh` + `.claude/settings.json` — PostToolUse-Hook der `tsc --noEmit` ausfuehrt nach Edit auf `types.ts`/`schema.ts`/`prompts.ts`/`template-types.ts`/`binding-catalog.ts`. Hook-Test grun (clean nach types.ts edit, silent skip bei nicht-relevanten Files).
- `.claude/agents/pdf-verifier.md` — Subagent fuer App-PDF-vs-Vasileios-Referenz Visual-Diff. Tools: Bash + Read (read-only). Fuer M3+ wenn echte Page-Builder gegen Referenz verglichen werden muessen.

Nach `/clear` sind die Skills + Subagent + Hook aktiv. Aufrufen via `/verify-app`, `/render-pdf-preview <auditId>`, oder Agent-Tool mit `subagent_type: "pdf-verifier"`. Hook feuert automatisch.




## 2026-04-17: 20-Seiten-Migration M0 (Vorbereitung)

### Was

- Local Data-Wipe: `data/audits/`, `data/uploads/`, `data/screenshots/`, `data/agent-chats/`, `data/agent-backups/` geleert; `data/templates/default.json` geloescht (Bootstrap-Seed laeuft beim naechsten dev-Start)
- Vasileios' Referenz-PDF (`SEO AUDIT WASCHBÄR SERVICE.pdf`, 20 pages) via `pdftoppm -r 200` zu PNGs gerendert in `docs/measurements/page-NN.png` (1655x2340 px = 200 DPI = pixelgenaues A4)
- `docs/measurements/README.md` mit px-zu-mm-Konversion (1mm = 7.874px) und Page-zu-Milestone-Map angelegt
- `.gitignore` ergaenzt: PNGs in `docs/measurements/` + Vasileios' Quell-PDF + Sprachmemo bleiben out of git
- Railway-Volume-Wipe nach M1-Deploy verschoben (Schema wird sich aendern, ohnehin neuer Stand noetig — spart eine Aktion)

### Vertraege/Typen

- Mess-Pipeline: PNGs liegen in `docs/measurements/page-NN.png`, Konversion in README. Kein automatisches Mess-Tool; Koordinaten werden je Milestone visuell aus dem PNG abgelesen (Read-tool zeigt Bild) und als mm in `page-builders.ts` Builder-Funktionen eingekippt.

### Gotchas

- Vasileios hat das Quell-PDF + Sprachmemo via Drag&Drop in den Repo-Root gelegt (nicht ins Filesystem ausserhalb). Manuell geignored, sonst waere die 15MB-PDF in den naechsten Auto-Sync-Commit gerutscht.
- `mutool` und `magick`/`convert` nicht installiert — `pdftoppm` (poppler-utils) reicht aber.


## 2026-04-14: Railway-Deploy + Stabilitaets-Pass

### Was

- App nach Railway deployed mit `next dev` (HMR), nicht prod build → Agent-Edits sind in 1-2s live
- Persistent Volume `/app/data` fuer Audits, Templates, Uploads, Screenshots
- Basic Auth in `proxy.ts` (Next.js Middleware), Bypass fuer `/_next/*`, `/api/health`, `/__nextjs_original-stack-frames`
- Auto-Sync-Cron in `scripts/git-cron.ts`, alle 6h `git add -A && commit && push` falls Aenderungen
- Bootstrap-Seed in `start:railway`: `node scripts/seed-default-template.mjs --if-missing` damit leeres Volume immer mit Default-Template startet
- Screenshot-Capture umgebaut: jeder Viewport (cover/mobile/tablet) bekommt eigenen Browser. Vorher war ein Browser mit 3 Pages, "Target closed"-Crash auf einer Page killte alle drei
- Editor reagiert auf `agent-applied-changes` CustomEvent → `fetch /api/templates/{id}` → `setTemplate(...)`. Vorher hielt Editor stale React-State, Agent-Edits waren auf Disk aber nicht im UI sichtbar

### Vertraege/Typen

- `AppliedChange` aus `src/lib/agent/chat-types.ts` enthaelt `path` und `kind` (write/edit/delete) — wird bei `result`-Event mitgegeben
- `agent-applied-changes` (CustomEvent, Browser): wird in `ChatPanel.tsx` dispatched nach Tool-Run und nach Undo. Editor lauscht in `EditorClient.tsx`
- Template-JSON-Schema: `data/templates/{id}.json` → `{id, name, version, pages: [{id, blocks: [{id, type, frame, ...}]}]}`. Decomposed Page hat n Bloecke, nicht-decomposed hat einen einzigen `legacyPage`-Block

### Gotchas

- Railway Volume-Mount UEBERSCHREIBT alles was ueber Git in `/app/data/` reinkam. Templates muessen via Bootstrap-Script ins Volume geschrieben werden, nicht ueber Git committed werden (war urspruenglich der Plan, ging nicht).
- `--single-process` im Puppeteer-Args macht "Target closed"-Crashes WAHRSCHEINLICHER, nicht seltener. Nicht setzen.
- Trial-Plan auf Railway hat ~512MB-1GB RAM — Turbopack + Puppeteer brauchen ~900MB Peak. Hobby-Plan (8GB) noetig fuer stabilen Betrieb. (Sehr lehrreicher Punkt: eher zahlen als Workarounds bauen.)
- Snap-Stub auf Ubuntu (`/usr/bin/chromium-browser` als Snap-Redirector) crashte Puppeteer. Resolver in `src/lib/chromium-path.ts` skippt jetzt `/usr/bin/chromium*` und nimmt `command -v` Output ausserhalb von `/usr/bin`.
- `next dev` exited bei OOM mit Code 0 (graceful). `concurrently --restart-tries=-1 --restart-after=2000` startet automatisch neu.
- Hard-Reload des Browser-Tabs noetig nach Container-Restart — alte Tabs hingen mit stale 502 obwohl Server schon wieder 200 lieferte.

### Wiederholte manuelle Aktionen (Kandidaten fuer Automatisierung)

- Railway-Logs durchsuchen nach Crashes wurde 3x manuell via Browser gemacht. Kandidat: Subagent oder Skill der Railway-Log-API anzapft.
- Health-Check-Polling nach Deploy. Aktuell via Monitor + curl. Akzeptabel wie es ist.
- Test-Audit hochladen via Chrome um E2E zu verifizieren. Kandidat: Smoke-Test-Script das `POST /api/upload` automatisiert ausfuehrt und Screenshots/PDF prueft.
