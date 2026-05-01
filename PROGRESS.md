# Progress Log

Was gebaut wurde, welche Vertraege/Typen entstanden, welche Gotchas auftraten.

## 2026-04-30: M3 Page-Chrome (Header + Footer Helper)

### Was

`pageChrome(): Block[]` Helper in `src/lib/editor/page-builders.ts` produziert die wiederverwendbaren Chrome-Elemente fuer alle Section-Pages: Logo top-left (brandDecoration signet), "SEO-Audit / fuer {domain}" top-right (zwei TextBlocks center-aligned), doppelter Cyan-Footer-Stripe (zwei ShapeBlocks rect). 18 von 20 BUILDERS rufen `CHROME_ONLY_BUILDER` auf — alle ausser `cover` und `inhaber` die in M4/M13 eigene Chrome-Variante bekommen.

### Gebaute Dateien

```
MODIFIZIERT:
  src/lib/editor/page-builders.ts   (pageChrome()-Helper, Konstanten PAGE_WIDTH_MM, PAGE_HEIGHT_MM, BRAND_CYAN, 18 BUILDERS auf CHROME_ONLY_BUILDER)
  src/lib/pdf/build.ts              (.audit-page height 296mm → 297mm)
  scripts/seed-default-template.mjs (page height 296 → 297)
  scripts/gen-m3-template.ts        (NEU, generiert m3-chrome.json via tsx aus pageChrome())
  PLAN.md                           (M3 abgehakt)
  PROGRESS.md                       (dieser Eintrag)

REGENERIERT:
  data/templates/default.json       (height 296 → 297, sonst unveraendert; pages bleiben leere shells)

GITIGNORED ASSETS (Smoke-Render):
  data/templates/m3-chrome.json     (1 page mit pageChrome()-Output, gerendert gegen audit=m2-smoke)
```

### Vertraege/Typen

```ts
// src/lib/editor/page-builders.ts
export const PAGE_WIDTH_MM: Mm = 210;
export const PAGE_HEIGHT_MM: Mm = 297;            // real A4
export const BRAND_CYAN = "#38E1E1";
export function pageChrome(): Block[];            // 5 blocks: signet, title, url, stripe1, stripe2
```

### Vermessung (aus docs/measurements/page-05.png)

```
Logo TL visible bbox:      x[22.59, 35.40] y[11.55, 22.46] mm  (12.82 x 10.91 mm)
"SEO-Audit" cyan bbox:     y[11.67, 16.11] right=186.15 mm     (height 4.44 mm = ~14pt cap-height)
"fuer {domain}" white:     y[~17, 19.9]  right=199.6 mm
Footer stripe 1:           y[291.34, 293.24] (thickness 2.03 mm)
Footer stripe 2:           y[294.25, 296.16] (thickness 2.03 mm)
Stripe gap:                0.89 mm
Stripe bottom margin:      0.63 mm
Brand cyan:                #38E1E1 (existing app brand-cyan, matcht Vasileios visuell)
```

### Verifikation (Pixel-Diff gegen Vasileios Page 5)

| Element | Target (Vasileios) | App-Rendered | Drift |
|---|---|---|---|
| Logo size | 12.82x10.91mm | 12.58x10.67mm | -0.24mm ✓ |
| Logo top-left | x=22.59, y=11.55 | x=22.74, y=11.69 | <0.2mm ✓ |
| Stripe 1 y-top | 291.34mm | 291.43mm | +0.09mm ✓ |
| Stripe 2 y-top | 294.25mm | 294.36mm | +0.09mm ✓ |
| Stripe thickness | 2.03mm | 2.03mm | 0 ✓ |
| Stripe gap | 0.89mm | 0.89mm | 0 ✓ |
| Bottom margin | 0.63mm | 0.76mm | +0.13mm ✓ |
| "SEO-Audit" text-h | 4.44mm | 4.32mm | -0.12mm ✓ |
| "SEO-Audit" right | 186.15mm | 184.59mm | -1.56mm akzeptabel |
| Subline right | 199.6mm | 197.68mm | -1.92mm akzeptabel (URL-Laengen-abhaengig) |

`tsc --noEmit` clean, `npm run lint` clean, `GET /api/health` 200, PDF rendert in ~2s.

### E2E-Verifikation (Chrome-Browser, lokal)

Jeder Block + Workflow wurde manuell durchgeklickt:

| Test | Resultat |
|---|---|
| `/editor/m3-chrome` lädt, Sidebar zeigt 1 Page | ✓ |
| Logo-Block selektierbar, Inspector: brandDecoration · chrome-logo, X=20.6 Y=10.2 W=16.7 H=13.7 z-Index=100 | ✓ |
| SEO-Audit Text-Block: Inspector zeigt fontSize 16, weight 700, color #38E1E1, align center, lineHeight 1.05, Poppins, binding statisch | ✓ |
| Footer-Stripe: Inspector zeigt shape=Rechteck, X=0 Y=291.42 W=210 H=2.03, fill #38E1E1 | ✓ |
| Drag eines Blocks via Mouse | ✓ Logo X 20.6→48.12, Y 10.2→37.72 |
| Resize via Corner-Handle | ✓ W 16.7→41.31, H 13.7→38.31 |
| Inspector-Edit numerischer X-Wert (Tab-bestätigt) | ✓ |
| Save-Button ("Speichern" → "Gespeichert") | ✓ |
| Reload `/editor/m3-chrome` persistiert nur Saved-State | ✓ |
| AI-Agent Floating-Button öffnet Chat-Panel | ✓ |
| AI-Agent versteht Prompt, ruft `read_file` + `edit_file` auf | ✓ |
| Editor reloadet bei Agent-Edit live ("M3-VERIFY-OK" sofort sichtbar) | ✓ |
| Agent "Letzte Änderung rückgängig" Button | ✓ |
| Backend `data/templates/m3-chrome.json` enthält 5 Blocks mit korrekten Frames, Page 210x297mm | ✓ |
| `/editor/default` lädt 20 Page-Shells, kein 500er | ✓ |
| Echter PDF-Endpoint (HTTP 200, application/pdf, 269KB, 1 Page, gültiges PDF v1.4) | ✓ |
| Edge-Case kurze Domain `x.de` → 1-Line center-aligned | ✓ |
| Edge-Case lange Domain (49 chars) → 2-Line Wrap, kein Crash, sauber | ✓ |
| Console während aller Interaktionen | ✓ clean (nur React-DevTools-Info + HMR-Connect) |

### Design-Entscheidungen

- **Helper statt Block-Type** — `pageChrome()` produziert standard `Block[]` (brandDecoration + text + shape). Kein eigener `pageChrome` Block-Type, keine Renderer-Aenderung. Maximum Wiederverwendung der existing Block-Views.
- **Logo via `brandDecoration kind:"signet"`** statt `image`-Block — der existing BlockView hat schon Asset-Resolution-Fallback (`templateAssets.signet → moduleSrc → /assets/ArtisticAvenue-Signet.png`). Robust gegen leeren Volume-Mount auf Railway.
- **Frame des Logos kompensiert PNG-Whitespace** — Asset hat 23% transparent border. Bei `objectFit: contain` schrumpft das visible Logo auf 77% der Frame-Groesse. Frame 16.7x13.7mm laesst das Logo bei 12.85x10.85mm rendern (matcht Vasileios). Alternative waere PNG zuschneiden, aber das Asset ist auch in anderen Pages gebraucht.
- **TR-Text center-aligned, nicht right-aligned** — Vasileios' Vorlage zeigt "SEO-Audit" horizontal mittig ueber dem laengeren Subline. Beide Lines sind `textAlign: "center"` in einem 60mm-Frame; bei verschieden langen Domains variiert das Subline-Right-Edge entsprechend.
- **PAGE_HEIGHT_MM = 297mm** (real A4) — Vasileios' PDF ist exakt 297mm. Die alte App-Konfiguration nutzte 296mm in CSS aber `@page { size: A4 }` rendert in 297mm-Container. Ergebnis war 1mm Whitespace am Bottom + Stripe-Drift. Fix gilt fuer alle Pages, nicht nur Chrome.
- **Stripe-Bottom-Margin als Konstante (0.63mm)** + relative Positionierung — Stripes werden vom PAGE_HEIGHT_MM rückwaerts berechnet, nicht absolut bei y=291. Damit wird das Layout robust gegen weitere Page-Height-Anpassungen.

### Gotchas

- **Page-Height 296 vs 297** — Erstes Render hatte Stripes 1.78mm vor Page-Bottom statt 0.63mm. Ursache: `.audit-page` CSS-height war 296mm, `@page` size A4 (297mm) rendert in 297mm-Container, also 1mm whitespace. Fix in 3 Stellen: `pdf/build.ts` CSS, `seed-default-template.mjs` page-Shell, `page-builders.ts` Konstante.
- **Logo-Asset Whitespace** — `ArtisticAvenue-Signet.png` ist 2061x1687px Canvas mit 23% transparent border (visible Logo bei 1578x1341px, aspect 1.177). Frame muss 1.31x groesser sein als die gewuenschte rendered Logo-Groesse, sonst sieht das Logo geschrumpft aus.
- **Subline wraps bei langen Domains** — Bei fontSize 10pt und 60mm-Frame wraps "fuer www.homeraum-immobilien.de" (30 chars) auf 2 Lines. Loesung: fontSize 9pt + Frame-Width 64mm. Bei noch laengeren Domains (>32 chars) braucht es entweder kleinere fontSize oder breiteres Frame.
- **Existing-Render-Drift** — Chromium rendered Specified-mm minimal kleiner (0.05-0.1mm pro 2mm Element). Nicht systemisch, akzeptabel im Subpixel-Bereich.
- **Default-Template re-seed im Volume** — Nach Production-Deploy bleibt `default.json` mit alter Page-Height 296, weil `seed --if-missing` skipt. Ops-Action: Volume-File loeschen + Restart, oder gezielt `node scripts/seed-default-template.mjs` ohne `--if-missing` einmalig laufen lassen.

### Public Interfaces (Quick-Reference)

```ts
import { pageChrome, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, BRAND_CYAN } from "@/lib/editor/page-builders";

// Use in M4-M13 page builders:
function buildOnPageSeo1(): Block[] {
  return [
    ...pageChrome(),
    // ... section-specific blocks
  ];
}
```

### Editor-UX-Limitations (kein M3-Bug, dokumentiert)

- **"Preview PDF" Button öffnet HTML-Mode**, nicht echten PDF-Download. `EditorClient.tsx:310` nutzt absichtlich `&format=html` für Inline-Preview im Browser-Tab. Echter PDF-Download nur via direkter API-URL ohne `format=html`. Falls UI-Download gewünscht, eigener Button noetig (separate UX-Aufgabe, nicht M3-Scope).
- **Lange Domains wrappen Subline auf 2 Lines** — bei 9pt fontSize und 64mm-Frame wraps Subline-Text bei >32 chars. Kein Crash, sauberes center-aligned Wrap, aber Vasileios-Style verlangt 1 Line. Bei realen Audit-Domains (typisch 15-30 chars) tritt das nicht auf.

### Offene Tests / Bekannte Gaps

- **Builder-Output landet noch nicht in default.json** — `pageChrome()` ist in `BUILDERS` map referenziert, aber `seed-default-template.mjs` ruft `BUILDERS` nicht auf. Decompose-API (`POST /api/templates/decompose`) liefert Builder-Output aber wird vom Editor-Frontend aktuell nicht genutzt. Fix kommt in M4 (Cover + Gesamtsituation): Seed wird so umgebaut dass er per `tsx` die Builder ausfuehrt und Output in default.json schreibt.
- **Vasileios-Vergleich nur gegen Page 5** — andere Pages koennten subtle Chrome-Variationen haben (z.B. anderer Stripe-Margin auf Phasenplan-Pages). M3-Helper deckt den Standard-Fall ab; falls Vasileios auf irgendeiner Page abweicht wird das im jeweiligen Milestone gefixed.
- **Production-hinter-Auth nicht getestet** — lokal alles gruen (inkl. echtes PDF, AI-Agent, Drag, Resize, Save+Reload, Domain-Edge-Cases). Production-Deep blockiert auf BASIC_AUTH_PASS (gleiche Linie wie M1+M2). Nach naechstem Push wird Production-Smoke beim ersten echten Vasileios-Run zusammen mit Marlin durchgezogen.
- **Cross-Browser nicht getestet** — Chrome verifiziert. Safari/Firefox koennten andere Font-Rendering-Drifts oder Drag-Behavior haben. Niedrige Prio, weil Vasileios den Editor selbst kaum nutzen wird; wir generieren PDFs serverseitig mit headless Chromium.

### Wiederholte manuelle Aktionen / Friction-Points

In M3 mehrfach gemacht:

| Aktion | Wie oft | Pain |
|---|---|---|
| Python-Pixel-Vermessung von Vasileios PNG (Logo-Bbox, Text-Bbox, Stripe-Y, Color-Sample) mit verschiedenen Heuristiken (relaxed/strict cyan, non-bg) | 5x iterativ bis Werte stimmten | hoch |
| `npx tsx scripts/gen-m3-template.ts` + `curl PDF + pdftoppm + Read PNG` Iteration nach jeder Helper-Anpassung | 5x | mittel |
| App-PDF strikt nachvermessen (gleiche Python-Logik aber gegen App-Output) um Drift zu quantifizieren | 3x | mittel |
| Subagent-Diff zwischen App und Vasileios mit ~600-Worte-Prompt | 1x | mittel |
| Chrome-Editor E2E: Block selektieren → Inspector pruefen → Drag → Resize → Save → Reload (pro Block einmal) | 5 Blocks × ~7 Klick-Sequenzen | hoch |
| AI-Agent Test (oeffnen → Prompt schreiben → Tool-Trace verfolgen → Undo) | 1x | mittel |
| Domain-Edge-Case Audits manuell mit Python patchen + 2x Re-render + 2x PNG-Read | 1x | mittel |
| `cp /tmp/m3-chrome.pdf /tmp/vdiff-app.pdf` und `pdftoppm`-Calls fuer Visual-Diff-Skill | 4x weil Skill-Wrapper voraussetzte das vdiff-app.pdf existiert | niedrig-mittel |

### Vorschlaege fuer Automatisierung (Quellen, nichts installiert)

**1. Skill `/measure-vasileios-page <pageNum> [element]`** — wraps die wiederholte Python-PIL-Mess-Sequenz fuer Vasileios-PNGs. Args: page-Nummer (1-20), optional element-name (z.B. "logo", "header-text", "footer-stripe", "all"). Spuckt mm-Bbox + Color-Hex aus mit verschiedenen Detection-Heuristiken (strict/relaxed). Wuerde in M4-M13 jedes Mal nuetzen wenn neue Page vermessen wird. Spart pro Page 5-10min Python-Boilerplate.
- Quelle: [Claude Code Skills Doc](https://docs.claude.com/en/docs/claude-code/skills) + bestehender `python3 + PIL` Workflow

**2. Skill `/verify-chrome-editor-e2e <templateId> [auditId]`** — wraps die `claude-in-chrome` MCP-Sequenz die ich heute manuell durchgeklickt habe. Schritte: Editor-URL navigieren → fuer jeden Block (auto-detected via `data/templates/{id}.json`) Block selektieren → Inspector lesen → Inspector-Werte gegen JSON-Werte vergleichen → Save → Reload → Persistenz-Check → Console-Errors. Output: pro Block ✓/✗ Tabelle. Wuerde in M4-M13 nach jedem Builder-Update den E2E-Test in <30s durchziehen statt 5-10min manuell.
- Quelle: [Claude Code Skills Doc](https://docs.claude.com/en/docs/claude-code/skills) + existing claude-in-chrome MCP

**3. Hook `format-on-page-builders-edit`** — analog zum existing `tsc-on-schema-edit.sh`: PostToolUse-Hook der bei Edit auf `src/lib/editor/page-builders.ts` automatisch `npx tsc --noEmit` + `npm run lint` ausfuehrt. Erweiterung des existing Hook-Skripts auf 6. Datei.
- Quelle: [Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)

**4. Helper-Skript `scripts/diff-pdf-against-vasileios.ts <templateId> <auditId> <vasileiosPage>`** — kombiniert PDF-gen + pdftoppm + Python-Pixel-Diff in einem Aufruf, gibt mm-Drift-Tabelle aus (so wie ich heute manuell zusammengeschraubt habe). Output-Format identisch zur Verifikations-Tabelle in PROGRESS.md. Wuerde in M4-M13 die Drift-Quantifizierung nach jedem Helper-Update in 5s liefern.
- Kein Tool, nur ein internes scripts/-Skript.

**5. Skill `/setup-domain-edge-test`** — generiert 3 Test-Audits mit kurzen/mittel/langen Domain-URLs (basierend auf existing `m2-smoke` als Source) und rendert pro Audit ein PDF + extrahiert die Header-Region als Cropped PNG. Damit wird in M4+ jeder neue Builder mit text-bound Subline einmal gegen Edge-Cases getestet. Niedrig prioritized weil M3 das einmalig durchgezogen hat und der Pattern jetzt im Code festgeklopft ist.
- Quelle: [Claude Code Skills Doc](https://docs.claude.com/en/docs/claude-code/skills)

**6. Playwright MCP (offiziell, Microsoft)** — wuerde meine Chrome-Klick-Sequenzen als deklarative Test-Suite ersetzen. Aber: existing `claude-in-chrome` MCP macht das bereits, und (2) Skill wuerde den Skript-Anteil abdecken. Skip — redundant.
- Quelle: [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)

**7. GitHub Actions / CI** — beim Push auf main automatisch `tsc + lint + dev-server-startup + smoke-render` laufen lassen, Subagent-Diff vs Vasileios als Artifact. Aber: Setup ist schwer, Single-Tenant, niedrige Push-Frequenz. Manuelle `/verify-app` Skill reicht.
- Skip.

**Empfehlung priorisiert:**

a) **Skill `/verify-chrome-editor-e2e`** — heute der mit Abstand groesste Friction-Point. Manuelles Durchklicken jeder Block-Inspector-Verifikation hat ~30min gedauert. Ein Skill der das gegen `data/templates/{id}.json` automatisch macht spart in M4-M13 bei jedem Milestone 20-30min E2E-Verifikation.

b) **Skill `/measure-vasileios-page`** — hoher Nutzen ab M4, jede neue Page braucht Vermessung. 0.5h Setup spart 5-10min pro Milestone.

c) **Hook auf `page-builders.ts` Edit** — billig, faengt Bugs sofort. Existing Hook-Mechanismus erweitern auf 6. Datei (one-line edit in `.claude/hooks/tsc-on-schema-edit.sh`).

d) (4) Pixel-Diff-Skript — optional. (5) Domain-Edge-Skill — niedrig prio. (6) und (7) skip.

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
