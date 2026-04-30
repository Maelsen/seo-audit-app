# Progress Log

Was gebaut wurde, welche Vertraege/Typen entstanden, welche Gotchas auftraten.

## 2026-04-30: M2 Block-Primitives (arrowBulletList, comparisonTable, pieChart)

Commits: `c73b223` (initial M2) + `1664f69` (Edge-Bug-Fixes nach Verify-Pass).

### Was

Drei neue Block-Typen ergaenzen das bestehende Block-System fuer das Vasileios-Layout:

- **`arrowBulletList`** fuer "Was dagegen zu tun ist" Sections (Pages 6, 8, 10, 12, 14, 16). Cyan-Pfeil-Glyph (SVG) + bold Title + optional detail darunter. Existing `recommendationList` ist priorisiert+nummeriert, `checkList` ist Status-basiert — passt nicht.
- **`comparisonTable`** fuer Page 4 (Wo du sein koenntest). Drei separate gerundete Header-Pillen (statt single header-row der existing `table`), Hairlines im Body, fixe N-Spalten ueber `columns: ComparisonTableColumn[]`.
- **`pieChart`** fuer Page 13 (Performance — Aufschluesselung Seitengroesse). SVG-Slices via polar-arc, optionaler innerRadius (Pie/Donut), Slice-Prozente, Legend rechts oder unten.

### Gebaute Dateien

```
NEU:
  src/lib/editor/blocks/ArrowBulletListBlockView.tsx
  src/lib/editor/blocks/ComparisonTableBlockView.tsx
  src/lib/editor/blocks/PieChartBlockView.tsx

MODIFIZIERT:
  src/lib/editor/template-types.ts           (Block-Union + 3 neue Types + StaticArrowItem, ComparisonTableColumn, PieSlice)
  src/lib/editor/render-template.tsx         (Dispatcher-Cases: arrowBulletList, comparisonTable, pieChart)
  src/lib/editor/binding-catalog.ts          (+pageSizeBreakdown + resourceCounts als type:"object")
  src/lib/agent/chat-orchestrator.ts         (System-Prompt: vollstaendige Block-Type-Liste fuer AI-Agent)
  PLAN.md                                    (M2 abgehakt)
  PROGRESS.md                                (dieser Eintrag)

GITIGNORED ASSETS (Re-Smoke-Test):
  data/audits/m2-smoke.json                  (Clone von M1-E2E + 4 mock comparison.rows)
  data/templates/m2-smoke.json               (1 Page mit allen 3 Bloecken kombiniert)
  data/audits/m2-edges.json                  (20 actions, leere Arrays, all-zero + single-100% breakdowns)
  data/templates/m2-edges.json               (3 Pages, jede Page testet eine Block-Type-Edge-Variation)
```

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

### Verifikation (Smoke + Edge-Cases + Chrome E2E + Subagent-Diff)

**Smoke (`m2-smoke` audit + template, gitignored):**
- `npx tsc --noEmit` clean, `npm run lint` clean, health 200
- PDF rendert in 2.5s, alle drei Blocks visuell korrekt
- arrowBulletList matcht Vasileios Page 6, comparisonTable Page 4, pieChart Page 13

**Edge-Cases (`m2-edges` audit + template, gitignored, 3 Pages):**
- arrowBulletList: empty array → leerer Frame; 20 items mit overflow=shrink → 11 items skaliert auf scale=0.55, kein cutoff; maxItems=2 clip von 20 → exakt 2; static binding ohne staticItems → leerer Frame, kein Crash
- comparisonTable: 0 rows → nur Header-Pillen ohne Body; column.width gesetzt + fehlender fieldPath in einer Spalte → fixe widths, leere Zellen ohne Crash
- pieChart: total=0 → graue Dummy-Circle + Legend ohne Werte; 1 slice = 100% → voller einfarbiger Kreis (war Bug: arc start==end → null path, gefixt mit full-circle/annulus fallback); innerRadius>0 + legendPosition=bottom → Donut mit Loch + Legend unten

**Chrome E2E auf `/editor/m2-edges?auditId=m2-edges`:**
- arrowBulletList Block selektieren → Inspector zeigt "arrowBulletList · arrow-clip" + Frame + Layer + Duplizieren/Loeschen, X 15→25 ueber Inspector-Edit funktioniert
- comparisonTable Block selektieren → Inspector clean, Mouse-Drag Y 77→97.64 funktioniert
- pieChart Block selektieren → Inspector clean, Mouse-Drag X 15→50.72 funktioniert
- Console clean ueber alle drei Block-Type-Interaktionen

**Subagent-Verifikation (`pdf-verifier` Aequivalent ueber general-purpose Subagent gegen Vasileios-Referenz-Pages 4/6/13):**
- arrowBulletList: ✓ Pfeil-Form, ✓ cyan-Farbe, ✓ Title-Bold, ⚠ minimal engeres Item-Spacing (smoke-Page-Density, kein Block-Bug)
- comparisonTable: ✓ Header-Pillen Form+Farbe, ✓ Spalten-Spacing, ✓ Hairlines, ✓ Cell-Alignment, ⚠ kompakteres vertical Padding (smoke-Density)
- pieChart: ✓ Pie-Form, ✓ Slice-Farben, ✓ Legend-Style; ✗ **Bug entdeckt**: HTML 3% + Andere 2% Inline-Labels ueberlappen oben am Pie-Rand. Fix: Slices unter 5% bekommen kein Inline-Label (Wert steht weiter in der Legend), `MIN_INLINE_LABEL_PCT = 5` als Konstante. Re-Render bestaetigt clean — beide Smoke- und Edge-Pies haben keine Label-Kollisionen mehr.

**Agent-Tool-Pfad:** Templates haben keine Runtime-Schema-Validation, neue Block-Types werden vom JSON.parse → Renderer-Dispatch automatisch akzeptiert. System-Prompt in `chat-orchestrator.ts` um die drei neuen Types erweitert, sodass der AI-Chat-Agent sie aktiv referenzieren kann.

**Inspector-Caveat:** Die drei neuen Blocks haben kein Custom-Properties-Panel (kein UI-Editing fuer arrowColor/sliceColor/headerPillColor etc). Fallen in den default-Inspector-Pfad — gleich wie barChart/gauge/starRating heute auch. Property-Aenderungen via JSON-Edit oder AI-Agent.

### Design-Entscheidungen

- **Drei separate Block-Types statt eine generische "list"** — arrowBulletList ist semantisch verschieden von recommendationList (priorisiert) und checkList (status-basiert). comparisonTable ist verschieden von table (single-header-row). Statt existing-Bloecke ueberladen ist es sauberer separate Block-Types zu fuehren — pro Vasileios-Layout-Konstrukt einer.
- **Inspector ohne Custom-Properties-Panel** — bewusst weggelassen. Konsistent mit existing barChart/gauge/starRating/resourceTile/serpPreview die das auch nicht haben. Property-Aenderungen via JSON-Edit oder AI-Chat-Agent. Custom-Inspector-UIs sind ein eigener spaeterer Milestone wenn der User sie wirklich braucht.
- **shrink-Algo mit `MIN_SCALE = 0.55` Clamp + fitCount-Reduktion** — wenn Items selbst bei 0.55 Skalierung nicht passen, wird die sichtbare Anzahl reduziert statt overflow:hidden Cutoff. Akzeptabel weil oberes Items immer noch lesbar bleiben.
- **`MIN_INLINE_LABEL_PCT = 5` als Konstante (nicht Block-Property)** — Default ist gut genug, Konfigurierbarkeit waere Overkill. Bei < 5% Slices steht der Wert eh in der Legend.
- **PieChart `pageSizeBreakdown` als generic object-binding** — der Block bindet auf ein Object, die slices benennen die Keys via fieldPath. Damit kann derselbe pieChart-Block-Typ fuer beliebige named-keys-Objekte genutzt werden, nicht nur pageSizeBreakdown.

### Gotchas

- **SVG `<text>` ignoriert CSS `color`** — braucht `fill`. Erste Pie-Render-Iteration zeigte schwarze Prozent-Labels statt der konfigurierten `#ffffff`. Fix in `PieChartBlockView.tsx` setzt `fill={fillColor}` zusaetzlich zum style.
- **SVG-viewBox-Clipping bei Slice-Labels** — Erste Iteration setzte `svgSizeMm = diameter + offset*2`, da Labels mit textAnchor=middle aber bis ~5mm halbe Breite ueber den Rand ragen wurden sie geclippt. Fix: `labelMargin = offset + 8mm` Reserve, `labelRadius = outerR + offset` (statt 0.6 * offset).
- **PieChart 100%-Slice = null-area path** — wenn nur ein Slice die volle Summe traegt, wird startRad == endRad und der arc-path hat 0 area. Fallback: full circle (oder annulus bei innerRadius>0) mit fill-rule="evenodd".
- **Editor-Inspector hat keine UI-Add-Buttons fuer die neuen Blocks** — bewusst nicht hinzugefuegt. Die existing barChart/gauge/starRating/resourceTile/serpPreview haben das auch nicht; sie kommen aus Page-Buildern in M3-M13. Konsistente Linie.
- **Templates haben keine Runtime-Schema-Validation** — `/api/templates/[id]` PATCH akzeptiert beliebiges Partial<Template> ohne Zod-Validation. Vorteil: neue Block-Types funktionieren automatisch ohne Schema-Update. Nachteil: kein Schutz vor mal-formed JSON. Akzeptabel weil Single-Tenant.

### Offene Tests / Bekannte Gaps fuer naechste Milestones

- **Production-hinter-Auth nicht getestet** — lokal alle Pfade gruen (smoke + edges + Chrome E2E + save-persist + reload). Production-Deep blockiert auf BASIC_AUTH_PASS, mache ich erst beim ersten echten Vasileios-Run mit Marlin zusammen (gleiche Linie wie M1).
- **Page-Builder fuer die 20 Pages sind weiterhin EMPTY_BUILDER** — die Bloecke sind verfuegbar, werden aber erst in M3-M13 ueber `BUILDERS` map in den 20 Page-Shells genutzt.
- **Resize-Handles im Editor nicht explizit getestet** — selber BlockOverlay-Code wie Drag, das fuer alle 3 Bloecke geht; Resize sollte aequivalent funktionieren. Nicht hand-getestet.
- **Concurrent-Save mit gleichzeitigem Agent-Edit** — nicht getestet. Single-Tenant, niedrige Wahrscheinlichkeit.
- **Vasileios-Page-Layout-Density** — Subagent-Verify hat ⚠ "kompakteres Spacing" gemeldet fuer arrowBulletList und comparisonTable in der M2-Smoke. Das ist Smoke-Page-Density, nicht Block-Bug — beim echten M3-M13 Page-Layout mit ordentlichem Padding wird es passen.

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

In M2 mehrfach von Hand gemacht:

| Aktion | Wie oft | Pain |
|---|---|---|
| Mock-Audit-JSON via `python3 -c "..."` patchen (m2-smoke creation, m2-edges creation, altSentences-Daten nachpflegen) | 3x | mittel |
| Edge-Case-Template-JSON mit Wiederholungs-Boilerplate fuer 8 Bloecke schreiben (jedes Block hat dieselbe Stilstruktur, nur frame+binding+Type unterscheiden sich) | 1x (gross, ~280 Zeilen JSON) | hoch |
| `curl PDF + pdftoppm + Read PNG` Loop fuer Bug-Iteration (SVG-clipping → fill-vs-color → shrink-overflow → 100%-slice → label-collision) | 5x | mittel |
| Subagent fuer Vasileios-Diff manuell starten mit ~600-Worte-Prompt | 1x | mittel |
| Chrome-Browser-Klicks fuer Inspector + Drag pro Block-Type (Auswahl + Inspector-Check + Drag + Console + Screenshot) | 6x | mittel |
| Save-Persistenz-Test (Save → reload → JSON-Diff pruefen) | 1x | niedrig |

### Vorschlaege fuer Automatisierung (Quellen, nichts installiert)

**1. Skill `/render-edge-cases <blockType>`** — generiert Mock-Audit + Mini-Template mit allen Edge-Cases fuer einen Block-Typ und rendert Pages 1-N als PNGs. Spart das Python-Patchen + 280-Zeilen-JSON-Schreiben pro Block. Wuerde in M3-M13 jedes Mal nuetzen wenn neue Block-Combos getestet werden. Definition: `.claude/skills/render-edge-cases/SKILL.md` mit Bash-Steps.
- Quelle: [Claude Code Skills Doc](https://docs.claude.com/en/docs/claude-code/skills)

**2. Skill `/visual-diff-against-vasileios <appPages> <refPages>`** — automatisiert die "render beide PDFs als PNG bei 200 DPI + Subagent-Diff" Sequenz die ich heute mit ~600 Worten Prompt manuell zusammengeschrieben habe. Existing pdf-verifier Subagent ist da, aber Aufrufen kostet je 30s Prompt-Engineering.
- Quelle: [Claude Code Skills Doc](https://docs.claude.com/en/docs/claude-code/skills) + bestehender Subagent unter `.claude/agents/pdf-verifier.md`

**3. Helper-Skript `scripts/build-mock-audit.mjs <baseAuditId> <newId> <patch.json>`** — kein Subagent/Skill/Hook, einfach ein Node-Skript. Liest existing audit, applyt JSON-Patch (z.B. `{"sections.uxConversion.actions": [...]}`), schreibt neuen audit. War in M2 3x der Pain-Point. Aber: nicht klar dass es in M3+ wieder gebraucht wird, weil Page-Builder gegen echte Audits laufen. Niedrige Prioritaet.
- Kein offizielles Tool, einfach ein internes scripts/-Skript.

**4. Hook `format-on-save` mit Prettier auf data/templates/*.json** — ist niedrige Prioritaet, aber: das m2-edges-Template wurde nach Editor-Save in formatiertem JSON gespeichert (vom JSON.stringify mit `null, 2` ueber storage layer), aber `m2-smoke.json` und `m2-edges.json` waren urspruenglich kompakter geschrieben. Konsistenz waere nett. Skip wenn nicht weiter relevant.
- Quelle: [Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)

**5. Playwright MCP (offiziell, Microsoft)** — koennte die Chrome-Klicks (Block-Click + Inspector-Check + Drag + Console-Pruefung) automatisieren als deklarative Test-Suite statt 6x manuell durch claude-in-chrome. Aber: die existing claude-in-chrome MCP macht das schon, und der echte UX-Hand-Test soll an Marlin uebergeben werden ab jetzt (siehe Memory-Update). Skip — nicht produktiv.
- Quelle: [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) (community/official Microsoft)

**Empfehlung priorisiert:**

a) **Skill `/render-edge-cases`** und **Skill `/visual-diff-against-vasileios`** wuerden M3-M13 erheblich beschleunigen weil dort jeder Page-Builder gegen echte Vasileios-Pages verglichen werden muss. Hoher Nutzen, geringer Aufwand. Wenn ich am Anfang von M3 0.5h investiere, spare ich pro Builder 5-10min.

b) Helper-Skript fuer Mock-Audit-Builder ist optional — nur einbauen wenn M3+ wieder Mock-Audits braucht.

(4) Hook und (5) Playwright sind nicht produktiv jetzt.

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
