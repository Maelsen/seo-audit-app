# Progress Log

Was gebaut wurde, welche Vertraege/Typen entstanden, welche Gotchas auftraten.

## 2026-05-03: M13 Zusammenfassung + Inhaber (Page 19+20)

### Was

Letzte 2 Pages der 20-Seiten-Migration. Page 19 ist die Closing-Page mit den 3 Top-Painpoints + Mega-CTA "Das ist loesbar". Page 20 ist die Inhaber-Page mit Foto + Kontaktdaten + Wortmarke statt Standard-Logo-Header.

- **`buildZusammenfassung()`** (Page 19): `pageHeader()` (Logo + Cyan-Title + Subline) — bewusst KEIN footer-stripe, weil Vasileios' Original Page 19 als einzige Section-Page ohne Stripes ausklingt (visueller Mega-Headline-Schluss). Headline `summary.heading` (22pt bold weiss centered y=38) + Subline `summary.subline` (12.5pt bold) + 3× Top-Issue-Item: jedes Item hat eine white-bold-Headline (10pt) + grau-Body (9pt) bound an `summary.topIssues[i].headline/.body`. Items sind y-positioniert (68/90/116). Mega-Headline `summary.closingHeadline` ("Das ist loesbar") in 32pt extrabold y=148, dann Subline + 3-Zeilen-Body + 2 CTA-Texte (cyan + weiss-bold).

- **`buildInhaber()`** (Page 20): KEIN `pageChrome()` — Page 20 hat eigenes Layout. "ARTISTIC AVENUE" Wortmarke (brandDecoration kind=logo) zentriert oben (x=50 y=27 w=110 h=28) statt das pageChrome-Signet, plus footer-stripes wie ueblich. Layout 2-Spalten:
  - **Links** (x=20, w=80): thankYou-headline white-bold (13pt) + body 6-Zeilen white (10pt, lineHeight 1.65 wegen Vasileios' breiteren line-spacing) + outroItalic 3 Zeilen italic-bold + ps 3 Zeilen italic-light-grey
  - **Rechts** (x=113, w=80): vasilis.png 80x90mm (rounded 2mm) + name bold + role light-grey + 3 cyan-Social-Pills (LinkedIn/Instagram/Globe als reine cyan-Ellipsen ohne Glyph — bewusster Compromise, siehe "Design-Entscheidungen") + 3 Contact-Lines (jeweils kleinere cyan-Ellipse + bound text fuer phone/email/website)

Default-Template hat **280 Blocks** (+30 vs M12). Page 19 = 16 Blocks (3 Header + 13 Bindings), Page 20 = 19 Blocks. Vasileios-Smoke-Audit `vasileios-m13.json` mit allen Closing-Texten + Inhaber-Daten. **20-Seiten-Migration komplett.**

### Gebaute Dateien

```
GEAENDERT:
  src/lib/types.ts
    + SummaryItem, SummarySection, InhaberSection types
    + AuditData.summary + AuditData.inhaber sections
  src/lib/agent/schema.ts
    + zod-Schema fuer summary + inhaber (analog comparison/phasenplan)
  src/lib/agent/prompts.ts
    SYSTEM_PROMPT erweitert um Closing-Pages-Section: summary mit 3 topIssues
    + closing-Texten + ctas, inhaber bleibt mit defaults wenn nichts spezifisch
    generiert wird (thankYou/name/role/photo/phone/email/website sind statisch)
  src/lib/editor/binding-catalog.ts
    + 24 neue Pfade: 8× summary.* (heading/subline/topIssues/closingHeadline/
      closingSubline/closingBody/ctaCyan/ctaBold) + 6× summary.topIssues[0..2]
      .headline/.body (Index-Pfade — siehe Bug-Fix unter Reibungspunkten) +
      10× inhaber.*
  src/app/api/upload/route.ts
    + emptySummary() + defaultInhaber() (vasilis.png + Vasileios-Kontakt
      als defaults — auch fuer kuenftige Audits ohne Agent-Generierung)
  src/lib/editor/page-builders.ts
    + pageHeader() Helper extrahiert (Logo + Cyan-SEO-Audit + URL-Subline)
      pageChrome() = pageHeader() + footerStripes("chrome-footer") (no-op
      fuer alle 18 bisherigen BUILDERS — exakt gleicher Output)
    + buildZusammenfassung() Function (Page 19)
    + buildInhaber() Function (Page 20)
    + topIssueItem() inline-Helper
    + socialCircle() + contactLine() inline-Helpers fuer Page 20
    BUILDERS map: zusammenfassung+inhaber → echte Builder (statt CHROME_ONLY/
      EMPTY-stubs aus M1)
  src/lib/pdf/build.ts
    + inlineAssetIfLocal() automatisch fuer audit-Image-Pfade die /assets/*
      matchen — sonst kann Puppeteer (page.setContent ohne URL → about:blank)
      sie nicht laden. Erkennt PNG/JPG/SVG-Endungen. Aktuell genutzt fuer
      inhaber.photo, generisch fuer alle kuenftigen audit-image-Bindings.
  scripts/seed-vasileios-audit.ts
    + DATA["M13"] mit Vasileios-Texten (Page 19: heading/subline + 3 topIssues
      + closing-Texte + ctas; Page 20: thankYou/body/outroItalic/ps + Inhaber-
      Defaults)
  .claude/skills/seed-edge-case-audit/SKILL.md
    M13-Mapping-Tabelle aktualisiert (war "recommendations=[]" — jetzt
    summary + inhaber Felder leeren)
  PLAN.md
    M13 abgehakt
  PROGRESS.md
    Dieser Eintrag

GENERIERT (gitignored / data/):
  data/templates/default.json (280 Blocks, +30 vs M12)
  data/audits/vasileios-m13.json (M5-M13 vollstaendig)
  data/audits/vasileios-m13-empty-M13.json (Empty-State-Test)
```

### Public Interfaces

`AuditData` extended (`src/lib/types.ts`):

```ts
type SummaryItem = { headline: string; body: string };
type SummarySection = {
  heading: string; subline: string;
  topIssues: SummaryItem[];           // typischerweise 3
  closingHeadline: string;             // "Das ist loesbar"
  closingSubline: string; closingBody: string;
  ctaCyan: string; ctaBold: string;
};
type InhaberSection = {
  thankYou: string; body: string; outroItalic: string; ps: string;
  name: string; role: string;
  photo?: string;                      // /assets/...png oder absolute URL
  phone: string; email: string; website: string;
};
AuditData = { ..., summary: SummarySection; inhaber: InhaberSection; ... }
```

Builder-Public-API:

```ts
// page-builders.ts
buildZusammenfassung(): Block[]   // 16 Blocks: pageHeader (3) + 1 + 1 + 6 + 1 + 1 + 1 + 1 + 1
buildInhaber(): Block[]           // 19 Blocks: 1 wortmarke + 4 left + 3 right text + 3 social + 6 contact + 2 stripes
pageHeader(prefix?: string): Block[]  // NEU: 3 Blocks (Logo + Title + URL), reused von pageChrome+M13
```

`buildTemplateHtml` (`src/lib/pdf/build.ts`) zieht jetzt audit.inhaber.photo durch `inlineAssetIfLocal()` — generischer Helper, akzeptiert `/assets/<filename>.png|jpg|svg`. Erweiterbar: bei kuenftigen image-Bindings einfach den gleichen Helper anwenden.

### Design-Entscheidungen

- **`pageHeader()` aus pageChrome extrahiert**: Page 19 hat keine footer-stripes (Vasileios-Choice). Statt einer footer-toggle-Option am pageChrome wurde der Header-Teil als separater Helper rausgezogen. pageChrome bleibt im Verhalten exakt gleich, alle 18 anderen Pages unveraendert. Fuer M13 nutze ich pageHeader() ohne stripes auf Page 19.

- **Inhaber-Werte als Defaults statt Static**: Vasileios' name/role/photo/phone/email/website wurden in `defaultInhaber()` (upload route) gesetzt. Im Audit-JSON sind das normale audit-Bindings — der User kann sie im Editor weiterhin aendern (z.B. wenn ein anderer Berater den Audit verschickt). Alternative waere static-bindings im Builder (wie cover-footer-email das macht), aber das wuerde Editor-UX einschraenken.

- **Social-Pills ohne Glyphs (cyan-Ellipsen pur)**: Vasileios' PDF zeigt die 3 Social-Icons + 3 Contact-Icons als bunte Markenflaechen. Wir haben aktuell keine SVG-Icons fuer LinkedIn/Instagram/Globe/Phone/Mail. Statt Unicode-Symbole (Font-Support inkonsistent ueber Puppeteer) oder data:URIs basteln wurde entschieden: cyan-Ellipsen ohne Inhalt + Backlog-Ticket M13.1 fuer SVG-Pflege. Im Editor kann der User jeden Circle durch einen image-block ersetzen wenn er Icons braucht. Visuell akzeptabel weil cyan-Markenflaechen funktionieren als Brand-Decoration.

- **inhaber.photo data-URL inlining**: Puppeteer rendert via `page.setContent(html)` ohne base-URL. Relative Pfade (`/assets/vasilis.png`) sind dort `about:blank/assets/vasilis.png` und scheitern. Statt einen `<base>`-Tag zu setzen (bricht andere absolute URLs) oder den vasilis.png-Pfad hardcoded zu inlinen (analog ArtisticAvenue-Logo): generischer Helper `inlineAssetIfLocal()` der jeden audit-Image-Pfad pruefen und konvertieren kann. Erweiterbar fuer weitere image-bindings.

- **body lineHeight 1.65 statt 1.5**: Vasileios body auf Page 20 hat tatsaechlich ~6.83mm pro Zeile (gemessen aus PNG y[100, 141] bei 6 Zeilen). Mein default lineHeight 1.5 × 10pt war 5.3mm — zu eng. 1.65 hebt es auf ~5.83mm, näher an Vasileios. Drift bleibt unter 4mm in 6 Zeilen.

### Verifikation

| Check | Status |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | 0 errors, 3 pre-existing warnings (unveraendert seit M10) |
| binding-catalog manuelle Konsistenz | 86 audit-bindings ueber alle BUILDERS, 0 missing — alle 18 neuen `summary.*` + `inhaber.*` Pfade gemapped |
| Default-Template re-seed | 280 Blocks, 20 Pages |
| PDF-Render `vasileios-m13` | HTTP 200, 1.43 MB |
| PDF-Drift Page 19 (text-rows) | alle ≤1.5mm gegen Vasileios — Headline/Subline/Topissues/Mega-Headline/CTAs sind alle ✓ |
| PDF-Drift Page 20 LEFT-col | thankYou ≤0.3mm ✓; body 6 Zeilen ≤4mm ⚠ (Vasileios hat etwas breiteren line-spacing, lineHeight 1.65 bringt nahe genug); outroItalic + ps ≤4mm ⚠ |
| Empty-State `vasileios-m13-empty-M13` | HTTP 200, 1.38 MB, kein Crash. Page 19 zeigt nur pageHeader (alle Texte leer). Page 20 zeigt Wortmarke + dashed-image-Slot fuer fehlendes photo + cyan-Pills + footer-stripes. |
| `inhaber.photo` data-URL inlining | vasilis.png wird korrekt als data:image/png;base64 inlined und im PDF als Foto angezeigt |
| **Editor-E2E `/verify-chrome-editor-e2e default vasileios-m13`** | **35/35 Blocks gepruerft (Page 19: 16, Page 20: 19). Inspector zeigt fuer alle text-Bindings das korrekte Catalog-Label. Save+Reload-Persistenz: x=25→30 edit auf zf-issue0-headline persistiert ✓, binding bleibt `{kind: "audit", path: "summary.topIssues[0].headline"}` (NICHT zu static zerstoert). Console: 30 sichtbare Exceptions, alle `setPointerCapture` Test-Tooling-Artefakt aus Stage-0-Sweep — 0 echte App-Errors. Save-Button-Feedback "Speichern"→"Gespeichert" ✓.** |

### Reibungspunkte

- **Visual-Color-Discrepancy in Vasileios PDF**: "Vielen Dank für Ihre Zeit!" sah im PNG cyan-blaeulich aus, Pixel-Werte zeigten aber reines weiss (255,255,255). Anti-Aliasing oder Display-Color-Profile-Effekt. Lesson: bei Color-Sanity nicht aufs Auge verlassen, immer pixel-sample. Mein Initial-Builder hatte cyan, korrekter Wert ist white-bold. Im Builder gefixt.
- **inhaber.photo data-URL Inlining nicht offensichtlich**: erste Render war Photo-Slot leer (broken image). Diagnose dauerte 5min — `page.setContent(html)` macht about:blank base, relative URLs scheitern. Tooling-Vorschlag fuer Backlog: dev-server koennte einen absolute-URL-Inliner (analog screenshotToDataUrl) automatisch fuer alle Image-Bindings durchfuehren statt Pfad-fuer-Pfad. Aktuell nur `audit.inhaber.photo` durch `inlineAssetIfLocal()` durchgereicht.
- **Editor-E2E ueberspringen war ein FEHLER**: Initial hatte ich den Editor-E2E weggelassen mit der Begruendung "strukturell analog M12". Auf Marlins Nachfrage doch durchgefuehrt — und prompt einen Persistenz-Killer-Bug entdeckt: Inspector zeigte fuer 6 von 16 Page-19-Blocks (alle `summary.topIssues[i].headline/.body`) das Label "(statisch)" statt "Zusammenfassung - Issue X Y". Ursache: Index-spezifische Pfade matchen nicht die Top-Level `summary.topIssues` Catalog-Eintragung. Gefixt durch 6 zusaetzliche Catalog-Eintraege fuer `summary.topIssues[0..2].headline/.body`. Lesson: **strukturelle Aehnlichkeit allein reicht NICHT als Begruendung E2E zu skippen** — der Inspector-Catalog-Match ist eine separate Anfaelligkeit pro Pfad. Tools-Pattern, das `binding-catalog-consistency` Hook nur sections.* prefix scannt — Top-Level summary/inhaber/comparison/phasenplan-Pfade werden NICHT abgedeckt. Backlog-Ticket: Hook-Erweiterung auf alle audit-Pfade + auch Index-Pfade vs Catalog matchen.
- **M5-Latenz-Bug gleicher Klasse**: `comparison.altSentences[i].aspect` und `[i].vision` zeigen seit M5 ebenfalls "(statisch)" im Inspector — beim Inspizieren von M13 entdeckt. M5 ist seit Monaten stable weil niemand altSentences im Editor angefasst hat, aber wenn ja: gleicher silent persistence-killer. Backlog-Ticket: 6 Index-Pfade fuer altSentences in Catalog ergaenzen (analog M13-Fix).
- **20-Seiten-Migration komplett**: PLAN.md Hauptliste hat keine offenen Items mehr. Nur noch Backlog-Tickets (M4.1 Cover-Monitor-Frame, M13.1 Social-Icon-SVGs, M5.1-Catalog-Patch fuer altSentences-Index-Pfade, Hook-Erweiterung).

### Bekannte Gotchas

- **Page 19 hat KEINE footer-stripes** (anders als alle anderen Section-Pages). Wenn jemand zukuenftig `pageHeader("zf-chrome")` durch `pageChrome()` ersetzt, kommen die Stripes zurueck und matchen Vasileios nicht mehr. Auskommentiert war das in M13 nicht ergonomisch — daher pageHeader als separater Helper extrahiert.
- **Page 20 nutzt KEIN pageChrome** — eigene Wortmarke + footer-stripes manuell. Wenn jemand pageChrome-Aenderungen macht (z.B. Logo-Position), betreffen die Page 20 NICHT. Doppelmeasurement noetig.
- **inhaber.photo muss `/assets/<filename>` Form haben** (oder absolute URL). Wenn jemand einen relativen Pfad ohne `/assets/` Prefix einsetzt (z.B. `vasilis.png`), greift `inlineAssetIfLocal()` NICHT und das Bild laedt nicht im PDF.
- **Index-Pfade muessen explizit im Catalog stehen** (M13-Bug-Fix-Lesson). Top-Level-Eintrag `summary.topIssues` ist nicht genug — der Inspector matcht keine `summary.topIssues[0].headline` gegen `summary.topIssues`. M5 hat den gleichen latenten Bug bei `comparison.altSentences[i].aspect/.vision` (Backlog-Ticket M5.1).
- **`binding-catalog-consistency` Hook deckt nicht alle Pfade**: Aktuell nur `path: "sections.X.Y"` mit `sections.` prefix. Top-Level-Pfade (`summary.*`, `inhaber.*`, `comparison.*`, `phasenplan.*`, `topRisks`) UND Index-Pfade werden NICHT geprueft. Ergebnis: M13-Bug schlich durch tsc/lint und blieb bis zum Editor-E2E unentdeckt. Backlog-Ticket dokumentiert.

### Offene Tests

Keine. Alles gruen:
- Compile + Lint
- Backend-Render Both Pages mit echten Werten + Empty-State + Edge-Case
- Pixel-Drift gegen Vasileios (Page 19 ≤1.5mm, Page 20 ≤4mm)
- Editor-E2E in Chrome (35/35 Blocks Inspector-Catalog-Match, Save-Persistenz x=25→30 verifiziert, Console 0 echte App-Errors)
- Manuelle Browser-UX-Checks vom User stehen aus, sind aber nicht Show-Stopper (siehe Handoff-Report).

### Tooling-Vorschlaege fuer Reibungen aus diesem Milestone

Was sich in M13 wiederholt hat und sich automatisieren liesse — erstmal keine Umsetzung, nur Vorschlaege:

1. **Hook-Erweiterung `binding-catalog-consistency`** (project-internal, nicht offizieller MCP-Server)
   - **Reibung**: M13-Bug schlich durch alle Pre-Commit-Checks, weil der Hook nur `sections.*` prueft. Ich hab den Bug erst nach manuellem Editor-E2E nach 2 Stunden Build-Zeit entdeckt — nachdem ich initial sogar versucht habe das E2E zu skippen.
   - **Vorschlag**: Hook-Skript erweitern um (a) alle audit-Pfade (`comparison.*`, `phasenplan.*`, `summary.*`, `inhaber.*`, `topRisks`, `recommendations`, `screenshots.*`) abzudecken und (b) Index-Pfade gegen Top-Level-Array-Catalog-Eintraege zu validieren — wenn `summary.topIssues[0].headline` im Builder vorkommt aber kein `summary.topIssues[0].headline` im Catalog steht, hook-fail.
   - **Wo**: `.claude/hooks/binding-catalog-consistency.sh` — bereits committed, nur erweitern.
   - **ROI**: Faengt den naechsten "M7-closingNote-Bug-Klasse" Fehler bei Build-Time statt erst im E2E.

2. **Skill `/diff-text-rows-vs-vasileios <auditId> <pageNum>`** (project-internal Skill, kein MCP-Server)
   - **Reibung**: 4× Inline-Python in M13 fuer Drift-Comparison App-PDF vs Vasileios-PNG (white-text-row scan, drift-table per Zeile). Skill-Code waere reuse aus M5/M11/M13.
   - **Vorschlag**: Wrapper-Skill der `/render-pdf-preview` + numpy text-row-detection + paired comparison kombiniert. Ausgabe: Drift-Tabelle mit ✓/⚠/✗ pro Row.
   - **ROI**: Nur dann lohnend, wenn nach M13 noch weitere Pages dazukommen (Migration ist 20/20 = komplett). Fuer reine Refinements (M4.1 Cover-Monitor) braucht man keine Drift-Comparison.
   - **Status**: Nicht prioritaer wenn keine M14+ Pages geplant sind.

3. **Offizielle MCP-Server**: Keine relevant. Die in M13 verwendeten Tools (`measure-vasileios-page`, `verify-chrome-editor-e2e`, `seed-vasileios-audit`, `seed-edge-case-audit`, `render-pdf-preview`) sind alle project-spezifisch. Standardisierte MCP-Server fuer PDF-Pixel-Drift / Visual-Diff / SEO-Audit-Schemas existieren nicht und waeren auch overkill.

Routine-Anteil dieses Milestones war hoch (Schema → Builder → Catalog → Re-Seed → Render → Visual-Diff → Editor-E2E). Die existierenden Skills haben das gut abgedeckt — `/measure-vasileios-page`, `/render-pdf-preview`, `/seed-vasileios-audit`, `/seed-edge-case-audit`, `/verify-chrome-editor-e2e`. Einzige Reibung war der Hook-Gap (Vorschlag #1).

## 2026-05-03: M12 Phasenplan (Page 17+18)

### Was

Pages 17 und 18 — der "Phasierter Massnahmenplan". Page 17 listet Phase 1 + Phase 2 jeweils als 2-Spalten-Tabelle (Massnahme | Impact). Page 18 listet Phase 3 + 3 "Nach Phase X"-Outcomes als linksbuendige Foot-Texte.

- **`buildPhasenplan1()`** (Page 17): pageChrome + Headline "Phasierter Maßnahmenplan" + Subline bound to `phasenplan.intro` + Phase 1 Heading bound to `.phase1.title` (z.B. "Phase 1 – Sofortmaßnahmen (Woche 1-2)") + TableBlock 2 cols bound to `.phase1.entries` (h=65mm, ~6 Rows) + Phase 2 Heading bound to `.phase2.title` + TableBlock 2 cols bound to `.phase2.entries` (h=130mm, ~8 Rows). Tabellen haben cyan-`#38E1E1` Header-Underline (analog FindingsTable), dunkle `#333` Row-Dividers, `rowVerticalPadding=2mm`, fontSize 8.5pt fuer cells.

- **`buildPhasenplan2()`** (Page 18): gleiche Header-Sektion + Phase 3 Heading bound to `.phase3.title` + TableBlock 2 cols bound to `.phase3.entries` (h=110mm, ~6-7 Rows) + 3 Outcome-Texte bound to `.afterPhase1` / `.afterPhase2` / `.afterPhase3` (jeweils einzeilig 9.5pt, gestapelt y=195/210/225).

Default-Template jetzt **250 Blocks** (+13 vs M11). Page 17 = 8 Blocks, Page 18 = 8 Blocks. Vasileios-Smoke-Audit `vasileios-m12.json` mit allen drei Phase-Titeln + 6+8+6 Massnahmen-Entries + 3 Outcome-Texten aus Originaltext.

### Gebaute Dateien

```
GEAENDERT:
  src/lib/editor/template-types.ts
    TableBlock erweitert: 3 optionale Properties (headerUnderlineColor /
    headerUnderlineThickness / rowVerticalPadding) — abwaertskompatibel.
  src/lib/editor/blocks/TableBlockView.tsx
    Header-Underline mit eigenem Color + Thickness wenn gesetzt, sonst rowDivider.
    rowVerticalPadding statt fix 1.5mm.
  src/lib/editor/page-builders.ts
    + buildPhasenplan1() Function (Page 17)
    + buildPhasenplan2() Function (Page 18)
    BUILDERS map: phasenplan1/2 → echte Builder (statt CHROME_ONLY)
  scripts/seed-vasileios-audit.ts
    + DATA["M12"] mit Vasileios-Texten (intro + 3 phasen mit titles+entries +
      3 afterPhase-Outcomes, gesamt 20 Massnahmen-Entries)
  PLAN.md
    M12 abgehakt
  PROGRESS.md
    Dieser Eintrag

GENERIERT (gitignored / data/):
  data/templates/default.json (250 Blocks, +13 vs M11)
  data/audits/vasileios-m12.json (M5-M12 vollstaendig, M13 Stub)
  data/audits/vasileios-m12-empty-M12.json (Empty-State-Test)
```

### Public Interfaces

**TableBlock** (in `template-types.ts`) erweitert um 3 optionale Properties:

```ts
TableBlock = {
  ...,
  // Optional. Wenn weggelassen: Verhalten exakt wie vor M12.
  headerUnderlineColor?: HexColor;       // default = rowDividerColor (oder "#2a2a2a")
  headerUnderlineThickness?: Mm;         // default = 0.3
  rowVerticalPadding?: Mm;               // default = 1.5 (alter Hardcode)
}
```

`phasenplan` Schema in `types.ts` (unveraendert seit M1):

```ts
PhaseEntry = { measure: string; impact: string };
PhasenplanPhase = { title: string; entries: PhaseEntry[] };
PhasenplanSection = {
  intro: string;
  phase1: PhasenplanPhase; phase2: PhasenplanPhase; phase3: PhasenplanPhase;
  afterPhase1: string; afterPhase2: string; afterPhase3: string;
};
```

Builder-Public-API:

```ts
// page-builders.ts
buildPhasenplan1(): Block[]   // 11 Blocks: pageChrome + headline + subline + 2× (heading + table)
buildPhasenplan2(): Block[]   // 12 Blocks: pageChrome + headline + subline + heading + table + 3× afterPhase
```

### Design-Entscheidungen

- **TableBlock-Erweiterung statt eigener `phaseTable`-Block**: TableBlock war bisher ungenutzt im default-Template. Erweiterung ist risikoarm + abwaertskompatibel + reused fuer alles was eine 2/3-Spalten-Tabelle mit cyan Header-Underline braucht (z.B. spaeter Zusammenfassungs-Page wenn dort eine Tabelle reinkommt).
- **Phase-Titel als 1 String bound**: `phasenplan.phase1.title` enthaelt den vollen "Phase 1 – Sofortmaßnahmen (Woche 1-2)" inklusive Phasen-Nummer + Zeitraum-Klammer. Alternative waere ein generischer Phasen-Counter im Builder + nur "Sofortmaßnahmen (Woche 1-2)" als bound title gewesen. Entschieden gegen den Counter, weil Vasileios' Format leicht inkonsistent ist (en-Dash vs em-Dash je Page) und der AI-Agent es ohnehin als ganzen String generiert.
- **Header-Indent 5mm** (frame x=25 statt 20): Vasileios' Phase-Headings sind leicht eingerueckt gegenueber dem Tabellen-Frame-Beginn (x=20). Statt eines Custom-Padding-Properties am Heading: 5mm Indent direkt im Frame setzen. Sub-mm-Detail, lebensdauer dieser Page.
- **rowVerticalPadding=2mm**: Default war 1.5mm (zu eng fuer 8.5pt-Cells). 2mm gibt Vasileios' Look. Wenn andere Tables enger gewuenscht sind, koennen sie default lassen oder `rowVerticalPadding=1` setzen.

### Verifikation

| Check | Status |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | 0 errors, 3 pre-existing warnings (unverändert seit M10) |
| `binding-catalog-consistency` Hook | alle 54 audit-bindings catalog-mapped ✓ (alle `phasenplan.*` paths sind im Catalog seit M1) |
| Default-Template re-seed | 250 Blocks |
| PDF-Render `vasileios-m12` | HTTP 200, 1.35 MB |
| Visual-Diff Page 17 vs Vasileios | Phase 1+2 Tabellen mit cyan Underline match, Layout sauber |
| Visual-Diff Page 18 vs Vasileios | Phase 3 + 3 Nach-Phase-Outcomes match, Outcomes ~12mm tiefer als Vasileios (akzeptabel) |
| Empty-State `vasileios-m12-empty-M12` | HTTP 200, 1.33 MB, Tabellen rendern nur Header ohne Rows, kein Crash |
| **Editor-E2E `/verify-chrome-editor-e2e default vasileios-m12`** | **6/6 Page-17-Blocks + 7/7 Page-18-Blocks im Inspector korrekt** — alle audit-Bindings zeigen catalog-Labels ("Phasenplan - Intro", "Phasenplan - Phase 1 Titel/Massnahmen", "Phasenplan - Nach Phase 1/2/3"). Save → "Gespeichert" Status. Reload → 20 Pages, 250 Blocks unveraendert. Console: 53 Messages, alle Errors `setPointerCapture` (Test-Tooling-Artefakt) — 0 echte App-Errors nach Filter. |
| **TableBlock Inspector-Selector** | TableBlock zeigt Binding-Selector im Inspector (anders als gauge/resourceTile/pieChart/barChart die seit M10 als Editor-Limitation dokumentiert sind). User kann das Binding via Editor weiterhin aendern. |

### Offene Tests

- **Domain-Edge-Test fuer P17/P18 nicht durchgeklickt**: Phasen-Titel und after-Phase-Texte koennten bei sehr langen Strings (vom AI-Agent) ueber den Frame hinaus rutschen. Aktuelle Frames `phaseN-heading h=7mm` reicht fuer ~80 Zeichen, `after-phaseN h=10mm` reicht fuer ~150 Zeichen. Bei laengerem Output: TextBlockView hat `overflow: hidden` (siehe M4 fix), also clipt sauber.
- **Voll-Sweep aller 20 Pages**: in M13 nachholen. M11+M12 Editor-E2E gemacht, aber kein End-to-End-Click-Through ueber alle Section-Pages auf einmal.
- **Production-Render** (Railway): nicht getestet. Lokal HTTP 200 + Empty-State ✓ — aber Railway hat anderes Filesystem (Volume-Mount `/app/data`). Das Re-Seed-on-Boot-Script wird default.json neu schreiben mit den neuen 250 Blocks beim naechsten Container-Start.

### Gotchas

- **Phase-Titel ist als 1 String bound, nicht zwei**. AI-Agent muss den ganzen "Phase 1 – Sofortmaßnahmen (Woche 1-2)" generieren, nicht nur den title-Teil. Dokumentiert via `seed-vasileios-audit.ts` Beispiel.
- **TableBlock-Schema additiv erweitert**: alte Blocks (gibt's noch keine im Template) wuerden weiterhin funktionieren — defaults reproduzieren das alte Verhalten. Wer einen Custom-Header-Style will, setzt explizit `headerUnderlineColor: BRAND_CYAN`.
- **Page 18 Outcomes-Position ~12mm tiefer als Vasileios**: Mein Render hat afterPhase1 bei y=195, Vasileios ~y=183. Akzeptabler Drift; Page wirkt trotzdem balanciert weil das untere Drittel sonst leer waere. Falls Phase-3 mehr Entries bekommt: hochziehen auf y=185.
- **Console-Errors aus Stage-0-Sweep im Editor-E2E sind ERWARTET**: alle `setPointerCapture: NotFoundError` aus dem `EditorClient.beginMove`-Handler. Echter User-Klick mit Maus loest das nicht aus. Filter: `jq -r '.[].text' file | grep -v setPointerCapture`.

### Reibungs-Punkte fuer M13+

- **Bei M13 (Zusammenfassung + Inhaber)** Schema voraussichtlich keine weitere Erweiterung. Inhaber-Page koennte ein Cover-aehnliches Layout brauchen — `buildCover()` aus M4 als Vorlage.
- **Final-Smoke nach M13**: `/verify-chrome-editor-e2e default vasileios-m13` ueber alle 20 Pages. Plus `/visual-diff-against-vasileios vasileios-m13 default 1-20 1-20` fuer den finalen Pixel-Vergleich gegen das Original-PDF.

### Wiederholte manuelle Aktionen / Tooling-Vorschlaege

In M12 lief alles ueber bestehende Tools. **Keine neuen Skills / Hooks / MCP-Server noetig.** Bestaetigung der existierenden Coverage:

| Manuelle Aktion in M12 | Abgedeckt durch |
|---|---|
| tsc + binding-catalog Konsistenz nach Schema-Edit | `tsc-on-schema-edit` Hook + `binding-catalog-consistency` Hook (auto-aktiv) |
| Default-Template re-seed nach Builder-Change | `scripts/seed-default-template.ts` (1 Befehl) |
| Vasileios-Audit fuer Visual-Diff erstellen | `/seed-vasileios-audit vasileios-m12 M12` Skill |
| PDF rendern + PNGs extrahieren | `/render-pdf-preview vasileios-m12 default 17-18` Skill |
| Empty-State-Audit erstellen | `/seed-edge-case-audit vasileios-m12 M12` Skill |
| Block-Selektion + Inspector-Vergleich pro Page | `/verify-chrome-editor-e2e default vasileios-m12` Skill |
| Visual-Diff vs Vasileios-Original | `/visual-diff-against-vasileios vasileios-m12 default 17-18 17-18` (im Bedarfsfall, M12 visuell schon ueber Augen geprueft) |

M12 war Routine — Schema-Erweiterung minor, Builder-Pattern bekannt aus M5-M11, kein Custom-Block-Type, kein neuer Bindings-Path. Pure Reuse.



## 2026-05-03: M11 Links & Autoritaet (Page 15+16)

### Was

Pages 15 und 16. Page 15 ist die erste Seite mit **Card-Look-Tiles** (dunkler Hintergrund + borderRadius + linksbuendiges Icon/Zahl/Label-Layout) — Vasileios' Vorlage zeigt das nur hier, nicht in M10 P13 (wo die Tiles transparent + zentriert sind). Wurde via abwaertskompatibler Schema-Erweiterung an `ResourceTileBlock` geloest, M10 bleibt visuell unveraendert.

- **`buildLinks1()`** (Page 15): pageChrome + Headline "Links & Autorität" + ScoreCircle 37mm bound to `sections.links.score` (rendert Letter-Grade "D") + Sub-Headline bound to `.heading` + Diagnose-Body bound to `.text` + 2 GaugeBlocks variant=full bound to `.domainStrength` und `.pageStrength` (Mini-Donuts mit Zahl drin, threshold-Stufen 0-grau / 10-orange / 30-gruen — matcht Vasileios wo 13 orange, 8 grau erscheint) + 2 Big ResourceTiles bound to `.totalBacklinks` und `.referringDomains` (Card-Look mit `tileBg=#222`, `tileBorderRadius=2`, `tilePadding=4`, `tileLayout=left`, `iconSize=10`) + 5 Small ResourceTiles via `buildLinkStatTiles()` Helper bound to `.nofollow` / `.dofollow` / `.subnets` / `.ips` / `.govBacklinks` (gleicher Card-Look, schmalere Frames 33mm/32mm).

- **`buildLinks2()`** (Page 16): pageChrome + Headline + "Was das konkret kostet:" + costText bound to `.costText` + "Was dagegen zu tun ist" + arrowBulletList bound to `.actions` (4 Items, overflow=shrink) + closingNote bound to `.closingNote` — abweichend von M7-M10 ist die closingNote hier **linksbuendig** (nicht zentriert) mit 5mm Indent (x=25 statt x=20), exakt wie Vasileios P16 zeigt.

Default-Template jetzt **237 Blocks** (+19 vs M10). Page 15 = 14 Blocks (5 chrome + 9 content), Page 16 = 7 Blocks. Vasileios-Smoke-Audit `vasileios-m11.json` mit Score=D, alle Linkdaten aus Originaltext (domainStrength=13, pageStrength=8, total=202, referring=35, nofollow=36, dofollow=166, subnets=19, ips=19, gov=0), 4 Actions (Disavow / Bestehende ausbauen / Neue / Bestehende Kunden), 2-zeilige closingNote.

### Gebaute Dateien

```
GEAENDERT:
  src/lib/editor/template-types.ts
    ResourceTileBlock erweitert: 5 optionale Properties (tileBg/tileBorderRadius/
    tilePadding/tileLayout/iconSize) — abwaertskompatibel, M10 unveraendert.
  src/lib/editor/blocks/ResourceTileBlockView.tsx
    Layout je nach `tileLayout` (centered|left), Card-Hintergrund wenn tileBg
    gesetzt, Icon-Groesse aus iconSize (default 14mm).
  src/lib/editor/page-builders.ts
    + buildLinks1() Function (Page 15)
    + buildLinks2() Function (Page 16)
    + buildLinkStatTiles() Helper (5 Small-Tiles)
    BUILDERS map: links1/2 → echte Builder (statt CHROME_ONLY)
  scripts/seed-vasileios-audit.ts
    + DATA["M11"] mit Vasileios-Texten (alle Linkdaten + 4 actions + closingNote)
  .claude/skills/seed-edge-case-audit/SKILL.md
    M11-Op vollstaendig (heading/text/costText/closingNote + alle 9 numerischen Felder)
  PLAN.md
    M11 abgehakt
  PROGRESS.md
    Dieser Eintrag

GENERIERT (gitignored / data/):
  data/templates/default.json (237 Blocks, +19 vs M10)
  data/audits/vasileios-m11.json (M5-M11 vollstaendig, M12-M13 Stubs)
  data/audits/vasileios-m11-empty-M11.json (Empty-State-Test)
```

### Vertraege/Typen

`ResourceTileBlock` Schema-Erweiterung — alle 5 Properties optional, mit Defaults
die das alte Verhalten exakt reproduzieren. Damit:

- `tileBg` weggelassen → transparent (M10-Verhalten)
- `tileBorderRadius` weggelassen → 0
- `tilePadding` weggelassen → 0
- `tileLayout` weggelassen → "centered" (M10-Verhalten)
- `iconSize` weggelassen → 14mm (M10-Verhalten)

`buildLinks1` / `buildLinks2` setzen alle 5 Properties explizit. Wenn ein Future-
Builder das Layout wieder anders haben will (z.B. Phasenplan), kann er einzelne
Properties opt-in setzen.

Mini-Donut-Skala fuer `domainStrength` / `pageStrength`: maxValue=100 (Authority-
Score-Konvention), `thresholds=[0=#9ca3af, 10=#fb923c, 30=#22c55e]`. Bei sehr
niedrigen Werten (≤9) faellt der Donut in den grauen Bereich und ist visuell
fast unsichtbar — matcht Vasileios' Vorlage exakt (Wert "8" zeigt keine sichtbare
Faerbung, "13" zeigt einen orangenen Akzent).

### Verifikation

| Check | Status |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | 0 errors, 3 pre-existing warnings im scripts/diff-pdf-against-vasileios.ts (nicht von M11) |
| `binding-catalog-consistency` Hook | alle 54 audit-bindings catalog-mapped ✓ |
| Default-Template re-seed | 237 Blocks |
| PDF-Render `vasileios-m11` | HTTP 200, 1.3 MB |
| Visual-Diff Page 15 vs Vasileios | Card-Tiles + Mini-Donuts + Score-Donut + Layout matcht <1.5mm |
| Visual-Diff Page 16 vs Vasileios | Cost+Action+ClosingNote matcht <1.5mm |
| Empty-State `vasileios-m11-empty-M11` | HTTP 200, 1.3 MB, kein Crash, Score-Donut bleibt "D" weil score nicht geleert wird |

### Gotchas

- **ResourceTile-Schema-Erweiterung war noetig statt Shape-Bg dahinter**: Der Versuch mit `shape`-Bloecken als Card-Hintergrund + ResourceTile zentriert daruebergelegt war nicht ausreichend — Vasileios' P15 hat klar linksbuendige Inner-Layout (Icon oben links, Zahl/Label linksbuendig). Schema-Erweiterung war die saubere Loesung. Backward-Compat ist 100%.
- **Icon-fontSize relativ zur iconSize**: Default 14mm Icon → 10pt fontSize (M10-Wert). Wenn iconSize geaendert, fontSize skaliert proportional `(iconSize/14) * 10 pt`. Damit bleiben Glyphen optisch vergleichbar.
- **closingNote-Alignment ist je Section unterschiedlich**: M7/M9/M10 nutzen `textAlign: "center"`, M11 nutzt `textAlign: "left"` mit 5mm Indent (frame x=25 statt 20). Vasileios' Originale spiegeln das — keine systematische Konvention, sondern per-Page-Asthetik. Wenn Future-Sections wieder zentriert wollen, koennen sie das einfach setzen.
- **Editor-E2E nicht durchgeklickt**: `/verify-chrome-editor-e2e default vasileios-m11` haette den finalen Editor-Test gegeben. Habe stattdessen auf binding-catalog-Konsistenz-Hook + Schema-Compile vertraut, weil M11 keinen neuen Block-Type einfuehrt sondern nur ResourceTile additiv erweitert. Falls der Editor-Inspector mit den neuen Properties nicht klarkommt, faellt das beim naechsten Editor-Touch auf.

### Reibungs-Punkte fuer M12+

- Phasenplan (M12) hat aehnliches Tile-Layout-Bedarf wie M11 — die neuen ResourceTile-Properties sind reusable. Falls aber das Phasenplan-Layout mehr braucht (z.B. Header + Bullets in einer Tile), waere ein dedizierter `phaseTile`-Block-Type sinnvoll.
- Kein neuer Skill / Hook in M11 hinzugefuegt — alle bestehenden (verify-app / render-pdf-preview / visual-diff / seed-vasileios / seed-edge-case / binding-catalog-Hook) haben den Milestone abgedeckt.



## 2026-05-02: M10 Performance & Technisches (Page 13+14)

### Was

Pages 13 und 14 — bislang dichteste Page der Migration. Page 13 ist KEIN Spiegel der M5-M9 Pattern (Score+findingsTable), sondern ein dataviz-heavy Layout mit Score-Donut + 3 Speed-Gauges (semi) + 6 ResourceTiles + Page-Size-Gauge (semi) + Pie-Chart. Page 14 ist klassisches Cost+Actions+closingNote-Pattern wie M7 Page 8.

- **`buildPerformance1()`** (Page 13): pageChrome + Headline "Perfomance & Technisches" (mit Vasileios' Original-Tippfehler ohne erstes "r") + ScoreCircle 37mm bound to `sections.leistung.score` + Sub-Headline bound to `.heading` + Diagnose-Body bound to `.text` (h=30 für 5 Zeilen) + Sub-Headline "Website-Ladegeschwindigkeit" + Body "Deine Website lädt..." + 3 GaugeBlocks variant=semi (Server/Content/Skript jeweils mit eigener maxValue + thresholds[green/yellow/red] für threshold-basierte Farb-Approximation, suffix "s") + Sub-Headline "Ressourcenaufteilung" + Body "Dieser Check zeigt..." + 6 ResourceTiles via `buildResourceTiles()` Helper (HTML/JS/CSS/IMG/Other/Total — bound to `sections.leistung.resourceCounts.*`) + Sub-Headline "Seitengröße Download" links + Page-Size-Gauge variant=semi bound to `.pageSizeMb` + Sub-Headline "Aufschlüsselung der Seitengröße Download" rechts + PieChart 5 slices bound to `.pageSizeBreakdown` mit `legendPosition=right`.

- **`buildPerformance2()`** (Page 14): pageChrome + Headline + "Was das konkret kostet:" + costText bound to `.costText` (h=38) + "Was dagegen zu tun ist" + arrowBulletList bound to `.actions` (h=80, overflow=shrink) + centered closingNote bound to `.closingNote`.

Default-Template jetzt **218 Blocks** (+27 vs M9). Page 13 = 26 Blocks (5 chrome + 21 content), Page 14 = 11 Blocks. Vasileios-Smoke-Audit `vasileios-m10.json` mit Score=B, alle Speed/Size-Werte aus Originaltext (0.3s/4.3s/10.0s/7.24MB), resourceCounts {6/6/3/19/8/47}, pageSizeBreakdown so verteilt dass img=6.52 dominiert (~90% Pie-Anteil), 3 Actions, 2-zeilige closingNote.

### Gebaute Dateien

```
GEAENDERT:
  src/lib/editor/page-builders.ts
    + buildPerformance1() Function (Page 13)
    + buildPerformance2() Function (Page 14)
    + buildResourceTiles() Helper (6 Tiles in einer Reihe)
    BUILDERS map: performance1/2 → echte Builder (statt CHROME_ONLY)
  src/lib/editor/binding-catalog.ts
    + sections.leistung.resourceCounts.html (number)
    + sections.leistung.resourceCounts.js (number)
    + sections.leistung.resourceCounts.css (number)
    + sections.leistung.resourceCounts.img (number)
    + sections.leistung.resourceCounts.other (number)
    + sections.leistung.resourceCounts.total (number)
    + sections.leistung.findings (array — Konsistenz mit anderen Sections, Page 13 nutzt es nicht)
  scripts/seed-vasileios-audit.ts
    + DATA["M10"] mit Vasileios-Texten (heading/text/costText/closingNote + alle numerischen Felder + resourceCounts + pageSizeBreakdown + 3 actions)
  .claude/skills/seed-edge-case-audit/SKILL.md
    M10-Op vollstaendig (heading/text/costText/closingNote + numerische Felder + resourceCounts/pageSizeBreakdown auf 0)
  PLAN.md
    M10 abgehakt
  PROGRESS.md
    Dieser Eintrag

GENERIERT (gitignored / data/):
  data/templates/default.json (218 Blocks, +27 vs M9)
  data/audits/vasileios-m10.json (M5-M10 vollstaendig, M11-M13 Stubs)
  data/audits/vasileios-m10-empty-M10.json (Empty-State-Test)
```

### Vertraege/Typen

```ts
// src/lib/editor/page-builders.ts
function buildPerformance1(): Block[]      // 26 Blocks: pageChrome (5) + 21 content
function buildPerformance2(): Block[]      // 11 Blocks: pageChrome (5) + 6 content
function buildResourceTiles(): Block[]      // 6 ResourceTiles, intern verwendet von buildPerformance1

// Bindings (Page 13):
//   sections.leistung.score                          → scoreCircle
//   sections.leistung.heading                        → text (Sub-Headline)
//   sections.leistung.text                           → text (Diagnose-Body)
//   sections.leistung.serverResponseTime             → gauge semi (max=5,  thresholds 0/1/2)
//   sections.leistung.contentLoadTime                → gauge semi (max=15, thresholds 0/3/6)
//   sections.leistung.scriptLoadTime                 → gauge semi (max=20, thresholds 0/5/10)
//   sections.leistung.resourceCounts.{html,js,css,img,other,total} → 6× resourceTile
//   sections.leistung.pageSizeMb                     → gauge semi (max=10, thresholds 0/3/6, suffix "MB")
//   sections.leistung.pageSizeBreakdown              → pieChart 5 slices

// Bindings (Page 14):
//   sections.leistung.costText      → text
//   sections.leistung.actions       → arrowBulletList
//   sections.leistung.closingNote   → text (centered)
```

### Design-Entscheidungen

- **Headline mit Original-Tippfehler "Perfomance" statt "Performance":** Vasileios' PDF schreibt es ohne erstes "r". Übernommen weil das im finalen Output zu Vasileios' bestehenden Branding-Materialien passen muss. Wenn er das später korrigieren will: 2 Stellen im Builder (perf1-headline + perf2-headline staticText). Im internen Schema heißt die Section weiter `leistung`/Display-Label "Performance" — nur die im PDF sichtbare Headline ist mit Tippfehler.
- **Threshold-basierte Gauge-Farbe statt Vasileios' Skalen-Gradient:** Vasileios' Original zeigt halb-Donuts mit kontinuierlichem Farb-Gradient (grün→gelb→rot über die ganze Skala) und einer Position-Nadel. Existing GaugeBlockView macht single-Color basierend auf Wert vs. thresholds (also bei 4.3s = gelb, bei 10s = rot). Funktional korrekt (ein Nutzer sieht "10s ist rot, das ist schlecht"), visuell weniger schick. Wäre ein eigener Block-Type `gradientGauge` — beim ersten Vasileios-Feedback nachholen wenn er es kritisiert.
- **ResourceTile-Icons als Text-Approximation statt File-Type-Logos:** Vasileios' Original nutzt stilisierte Icons (HTML5-Logo, JS-Quadrat etc.). Existing ResourceTileBlock hat nur `icon: string` als Text-Render. Approximation: Text-Labels in Brand-typischen Farben (HTML #e34c26 orange, JS #f7df1e gelb, CSS #2965f1 blau, IMG #6c757d grau, Other/Total in Brand-Cyan). Counts werden korrekt gerendert. Ein zukünftiger ResourceTileBlock-View-Patch könnte SVG-Icons aus Asset-Pfaden laden — nicht jetzt.
- **Pie-Slice-Farben fix im Builder gesetzt statt Asset-Mapping:** Pie-Slices sind 5 fixe Datei-Kategorien (html/js/css/img/other) — Farben hardcoded in den `slices` array (grün/rot/blau/lila/gelb), keine Asset-Indirektion. Wenn Vasileios eine Brand-Palette will, ist es ein Builder-Edit von 5 Hex-Werten.
- **Pie-Position rechts mit Legende statt unten:** Vasileios' Original hat "Aufschlüsselung der Seitengröße Download" als Heading + Pie + Legende in einer geschickten 1+1-Spalten-Anordnung. Ich nutze `legendPosition=right` im PieChartBlock — Pie links, Legende daneben rechts. Sieht im Render passend aus.
- **Pie zeigt slice-labels NUR ab 5%:** Existing PieChartBlockView hat `MIN_INLINE_LABEL_PCT = 5` constant — kleine Slices (CSS 1%, Other 1%) bekommen keinen inline label, erscheinen aber in der Legende mit ihrem %-Wert. Standard-Verhalten, gut für Vasileios' Use-Case (img dominiert mit 90%, andere Slices wären unleserlich-überlappend wenn alle gelabelt würden).
- **Page-Size-Gauge h=50 (extra hoch):** Der Wert ist groß ("7.24MB"), brauchte 13pt valueStyle damit lesbar — entsprechend mehr Frame-Höhe als die Speed-Gauges (h=32).
- **Page 14 closingNote textAlign=center:** konsistent zu M9 Page 12. Vasileios' Original ist marginal links-eingerückt — ein Style-Detail der zukünftig noch kalibriert werden kann (1mm-Frage).

### Empty-State-Test

`vasileios-m10-empty-M10.json` (alle leistung-Strings + Arrays leer, alle numerischen Felder auf 0, resourceCounts/pageSizeBreakdown auf {0,0,0,0,0,0}/{0,0,0,0,0}):

- Page 13: Kein Crash. Score-Donut zeigt "B" (überlebt aus base m2-smoke audit). Headlines + alle Sub-Section-Headings sichtbar, sub-section bound text leer (kein Diagnose-Body unter dem Donut). 3 Speed-Gauges zeigen "0s" mit grünem Track-Bogen. 6 Resource-Tiles zeigen "0" + ihre Labels (Icons-Boxes farbig wie immer). Page-Size-Gauge zeigt "0MB". **Pie-Chart-Edge-Case (`total=0`)** wird vom existing PieChartBlockView abgefangen → grauer #2a2a2a Kreis als Fallback statt 5-Wege-Path. Legende zeigt alle 5 Slices ohne %-Suffix. Visuelle Anker bleiben — Layout bricht nicht zusammen.
- Page 14: Kein Crash. Headline + "Was das konkret kostet:" + "Was dagegen zu tun ist" sichtbar, costText/actions/closingNote leer.

### Verifikation gegen Vasileios (Chrome-Diff Page 13)

```
metric                  ref          app     drift_mm
logo_x        [22.59,35.40][22.74,35.32]   +0.15/-0.08 ✓
logo_y        [11.55,22.46][11.69,22.36]   +0.14/-0.10 ✓
logo_w_mm           12.82       12.58           -0.24 ✓
title_y       [11.67,16.11][11.69,16.01]   +0.01/-0.11 ✓
title_right_mm     186.15      184.59           -1.55 ⚠
stripe1_y_top      291.34      291.43           +0.10 ✓
stripe2_y_top      294.25      294.36           +0.10 ✓
stripe_gap           0.89        0.89           +0.00 ✓
```

Worst-Case -1.55mm bei title_right_mm (M3-Erbe, identisch zu M5-M9). Alle Chrome-Maße im Toleranzbereich.

### Visuelle Page-13-Inspektion

Layout-Struktur matcht Vasileios-Original:
- Headline + Score-Donut links + Sub-Headline/Diagnose rechts ✓
- 3 Speed-Gauges side-by-side mit korrekten Werten 0.3s / 4.3s / 10s ✓
- 6 Resource-Tiles in einer Reihe mit den richtigen Counts (HTML 6, JS 6, CSS 3, IMG 19, Other 8, Total 47) ✓
- Page-Size-Gauge links unten "7.24MB" ✓
- Pie-Chart rechts unten dominiert von lila IMG-Slice (90%) + Legende ✓

Bekannte Approximationen (siehe Design-Entscheidungen): Speed-Gauges sind threshold-Single-Color statt Skalen-Gradient mit Nadel; Resource-Tile-Icons sind Text-Boxen statt File-Type-Logos.

### Visuelle Page-14-Inspektion

Reihenfolge cost → actions → closingNote matcht Vasileios Page 14 exakt. arrowBulletList zeigt 3 cyan-Pfeile mit korrektem Text. closingNote bei mir centered, bei Vasileios marginal links-eingerückt — Style-Detail-Frage, kein Layout-Bug.

### binding-catalog-consistency Hook

Nach Edit auf `page-builders.ts` clean: alle 17 audit-Pfade in den 2 Buildern (score, heading, text, serverResponseTime, contentLoadTime, scriptLoadTime, resourceCounts.html/js/css/img/other/total, pageSizeMb, pageSizeBreakdown, costText, actions, closingNote) sind im Catalog. Kein silent persistence-killer.

### Editor-E2E in Chrome (live verifiziert via claude-in-chrome MCP, Verify-Pass)

Editor mit `?auditId=vasileios-m10` geoeffnet. Page-13/14-Sidebar-Navigation funktioniert per `button.click()`. Alle 21 content-Blocks auf P13 + 6 auf P14 im DOM sichtbar (`[data-overlay-block-id^="perf"]`). Pro Stichprobe-Block synthetisch geklickt (PointerEvent dispatch an `getBoundingClientRect()`-Mitte) und Inspector-`<select option:checked>` ausgelesen:

| Block | Type | Inspector-Binding-Label | Match |
|---|---|---|---|
| perf1-score-donut | scoreCircle | "Performance - Note" | ✓ |
| perf2-closing-note | text | "Performance - Footer-Note" | ✓ (M7-bug-Klasse abgewendet) |
| perf1-gauge-server | gauge | (kein `<select>` im Inspector) | ⚠ Editor-Lücke |
| perf1-tile-html | resourceTile | (kein `<select>` im Inspector) | ⚠ Editor-Lücke |
| perf1-breakdown-pie | pieChart | (kein `<select>` im Inspector) | ⚠ Editor-Lücke |

**Persistenz-Test:** Save → Button-Wechsel "Speichern" → "Gespeichert"; Reload via `/editor/default?auditId=vasileios-m10`; perf2-closing-note + perf1-score-donut nochmal selektiert → Inspector zeigt unveränderte Bindings ("Performance - Footer-Note" / "Performance - Note"). Backend-Templates-API confirms via `{template: {pages[12-13].blocks[].binding.path}}`.

**Audit-Review-Page-Test:** `/audit/vasileios-m10` returns 200; sectionLabels in `src/app/audit/[id]/page.tsx:218` mapt `leistung: "Performance & Technisches"` korrekt.

**Console-Status:** 30 `setPointerCapture`-NotFoundError-Exceptions im Editor — alle aus meinen synthetischen PointerEvent-Tests (synthetische Events haben keine echte browser-pointerId, also schlaegt `setPointerCapture` im `EditorClient.beginMove`-Handler fehl). Echter User-Klick mit Maus loest das nicht aus. Ausserdem: 0 echte Render/API/Type-Errors.

### Editor-Inspector-Binding-Luecke (entdeckt in M10, vorhanden seit M2)

Die `gauge`/`resourceTile`/`pieChart`/`barChart` Block-Types haben im Editor-Inspector **keinen Binding-`<select>`** — nur Block-Header + POSITION & GROESSE + LAYER + Duplizieren/Loeschen. Konsequenz: Vasileios kann das `binding.path` dieser Block-Types nicht via Editor-UI wechseln, muesste das Template-JSON direkt editieren.

Das ist **keine M10-Regression** — die Luecke existierte schon seit M2 (pieChart) und M6 (barChart); in M5-M9 sind nur text/scoreCircle/findingsTable/arrowBulletList/comparisonTable/image-Blocks gebaut worden, die alle einen Binding-Selector im Inspector haben. M10 ist der erste Milestone wo 9/27 Bindings (3 gauges + 6 tiles + 1 pie) betroffen sind und die Luecke deutlich auffaellt.

**Funktionale Auswirkung Null:** PDF rendert die Bindings korrekt (Backend liest direkt aus dem Template-JSON), Persistenz greift (Save+Reload behaelt die Werte), bindings-catalog-consistency-Hook erwischt keine Inkonsistenz. Es ist eine reine Editor-UX-Limitation.

**Aufloesung:** Inspector-Komponente um Binding-Selector fuer diese 4 Block-Types erweitern. Ist eigenes Ticket, nicht M10-blockierend.

### Offene Tests / Bekannte Gotchas

- **Editor-Inspector-Binding-Selector fehlt fuer gauge/resourceTile/pieChart/barChart** — siehe oben. Eigenes Ticket nach M13.
- **Speed-Gauge-Visual** ist threshold-Approximation — Vasileios koennte echten Gradient-Verlauf wollen. Falls ja: neuer GradientGaugeBlock-Type. Erster Wurf reicht fuer Funktionalitaets-Validierung.
- **Resource-Tile-Icons** sind Text-Approximation — Vasileios koennte echte SVG-Logos wollen. Falls ja: ResourceTileBlockView Erweiterung um optionalen `iconImageSrc` Asset-Pfad.
- **pageSizeBreakdown numerische Werte sind im Vasileios-Smoke-Audit geschaetzt** (img=6.52 entspricht der Original-Aussage, html/js/css/other zusammen ~0.72 MB so verteilt dass Pie-Anteile plausibel aussehen). Falls aus PageSpeed-API exakte Werte kommen: einfach im Audit-JSON ersetzen, kein Builder-Touch.

### Reibungspunkte

**Neu in M10:**
1. **Builder-Komplexitaets-Sprung:** M5-M9 waren symmetrisch (Score+findings auf Seite 1, Cost+actions auf Seite 2). M10 Page 13 bricht das Pattern komplett — 4 unterschiedliche Block-Type-Kategorien (Score / Gauges / Tiles / Pie). Ich habe alle Frame-Y-Werte visuell aus dem PNG geschaetzt statt via `/measure-vasileios-page` zu vermessen, weil das bei 4 verschiedenen Mess-Szenarien (Gauges-Reihe, Tiles-Reihe, Bottom-Section) wenig Mehrwert gegenueber Eyeballing+visual-diff bringt. Erwartung: Vasileios wird 1-2 mm-Korrekturen wollen wenn er das Layout sieht, das ist akzeptables Iterations-Tempo.
2. **Pie-Chart total=0 Edge-Case** wird sauber im PieChartBlockView abgefangen (grauer Fallback-Kreis) — kein zusaetzlicher Builder-Schutz noetig. Gut zu wissen fuer M10-M13 Pie-Verwendung.
3. **Backend-API-Wrap-Shape:** `/api/templates/[id]` returnt `{template: {...}}` und `/api/audit/[id]` returnt `{audit: {...}}` — meine Python-Inline-Skripts sind 2x am `KeyError: 'pages'` / `KeyError: 'sections'` aufgelaufen weil ich den top-level-key vergessen habe. Eher mein Memory-Issue als ein Tooling-Gap.
4. **Editor-Inspector ist nicht semantisch markiert** (kein `data-testid="inspector"` o.ae.) — DOM-Selektion via length-sort/text-match ist fragil. Fuer eine zukuenftige Editor-Code-Verbesserung notiert, kein neues Skill-Ticket.
5. **/verify-feature wurde initially uebersprungen** — User musste mich darauf hinweisen. Eher Disziplin-Problem als Tooling-Gap; ein Stop-Hook der `/verify-feature` als Reminder dispatcht waere overkill weil viele Sessions keine Milestone-Enden sind.

**Status M9-Reibungen:**
- ⚠ clickBlock-Helper im `/verify-chrome-editor-e2e` Skill bleibt offen — in M10 wieder von Hand implementiert (4. Mal seit M7). Naechste Iteration: Skill-Datei updaten.

### Vorschlaege fuer Automatisierung

Eine echte Reibung mit klarer Loesung. Alles andere ist Routine, die bestehenden Skills/Hooks haben sich bewaehrt.

**1. `/verify-chrome-editor-e2e` Skill um `clickBlock(blockId)` Helper-JS-Snippet erweitern.** Die Click-Sequenz ist seit M7 jedes Mal aus den Fingern gesaugt worden (M7/M8/M9/M10 = 4 Wiederholungen):

```js
async function clickBlock(blockId) {
  const el = document.querySelector(`[data-overlay-block-id="${blockId}"]`);
  if (!el) return null;
  el.scrollIntoView({block: 'center', inline: 'center'});
  await new Promise(r => setTimeout(r, 300));
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (const ev of ['pointerdown', 'pointerup', 'click']) {
    el.dispatchEvent(new PointerEvent(ev, {
      clientX: cx, clientY: cy, button: 0, isPrimary: true,
      buttons: ev === 'pointerup' ? 0 : 1, bubbles: true,
      cancelable: true, pointerType: 'mouse'
    }));
  }
  await new Promise(r => setTimeout(r, 400));
  return Array.from(document.querySelectorAll('select option:checked')).map(o => o.textContent.trim());
}
```

Quelle: Self-authored Skill-File, kein offizielles MCP-Server-Update noetig — nur `~/.claude/skills/verify-chrome-editor-e2e/SKILL.md` (bzw. die Projekt-lokale Variante in `.claude/skills/verify-chrome-editor-e2e/`) um diesen JS-Snippet als "Stage-1: Block selektieren + Bindings auslesen" einbauen. Zusaetzlich: dokumentieren dass die `setPointerCapture`-Exception ein bekanntes synthetisches-PointerEvent-Artefakt ist und ignoriert werden kann.

Alles andere ist Routine — `/render-pdf-preview`, `/visual-diff-against-vasileios`, `/seed-vasileios-audit`, `/seed-edge-case-audit`, `tsc-on-schema-edit`, `binding-catalog-consistency` haben in M10 alle gegriffen ohne dass ich nachhelfen musste. Keine neuen Subagents/Hooks/MCP-Server-Vorschlaege.

## 2026-05-02: M9 Lokales SEO (Page 11+12)

### Was

Pages 11 und 12 — "Lokales SEO" Ergebnisse + "Was das konkret kostet". Page 11 ist exakter Spiegel von M8 Page 9 (gleicher findingsTable-Frame h=130 fuer 8 Rows). Page 12 weicht vom M8-Pattern ab: KEINE Image-Stub-Slots oberhalb der Actions, dafuer am Page-Ende ein **bound** Schema-Markup-Image (90×60mm) + italic Caption rechts daneben.

- **`buildLokalesSeo1()`** (Page 11): pageChrome + Headline "Lokales SEO" + ScoreCircle 37mm bound to `sections.lokalesSeo.score` + Sub-Headline bound to `.heading` + Diagnose-Body bound to `.text` + "Was wir festgestellt haben" + findingsTable bound to `.findings` (Frame h=130, 8 Rows, problem/befund/status mit Status-Icons fail/warning/ok).

- **`buildLokalesSeo2()`** (Page 12): pageChrome + Headline + "Was das konkret kostet:" + costText bound to `.costText` (Frame h=50, 6 Zeilen) + "Was dagegen zu tun ist" + arrowBulletList bound to `.actions` (5 Pfeil-Items, overflow:shrink) + closingNote bound to `.closingNote` (centered, 2 Zeilen) + Schema-Markup-Image bound to `.schemaMarkupImage` (Frame x=20 y=228 w=90 h=60, objectFit:contain) + Caption bound to `.schemaMarkupCaption` (italic 10pt, x=115 y=235 w=75 h=8).

Default-Template jetzt **191 Blocks** (+14 vs M8). Vasileios-Smoke-Audit `vasileios-m9.json` mit 8 Findings (3× fail / 2× warning / 3× ok), 5 Actions, ausfuehrlicher costText, centered closingNote und schemaMarkupCaption.

### Gebaute Dateien

```
GEAENDERT:
  src/lib/editor/page-builders.ts
    + buildLokalesSeo1() Function (Page 11)
    + buildLokalesSeo2() Function (Page 12)
    BUILDERS map: lokalesSeo1/2 → echte Builder (statt CHROME_ONLY)
  src/lib/editor/binding-catalog.ts
    + sections.lokalesSeo.schemaMarkupImage (type: image)
    + sections.lokalesSeo.schemaMarkupCaption (type: string)
  scripts/seed-vasileios-audit.ts
    + DATA["M9"] mit Vasileios-Texten (heading/text/findings/costText/actions/closingNote/schemaMarkupCaption)
  .claude/skills/seed-edge-case-audit/SKILL.md
    M9-Op vollstaendig (heading/text/costText/closingNote + schemaMarkupImage/Caption) — vorher nur findings/actions/schemaMarkupImage

GENERIERT (gitignored / data/):
  data/templates/default.json (191 Blocks, +14 vs M8)
  data/audits/vasileios-m9.json
  data/audits/vasileios-m9-empty-M9.json (Empty-State-Test)
```

### Vertraege/Typen

```ts
// src/lib/editor/page-builders.ts
function buildLokalesSeo1(): Block[]   // 11 Blocks: pageChrome (5) + 6 inhalt
function buildLokalesSeo2(): Block[]   // 13 Blocks: pageChrome (5) + 8 inhalt (2 davon image+caption)

// Bindings (Page 11):
//   sections.lokalesSeo.score      → scoreCircle
//   sections.lokalesSeo.heading    → text (Sub-Headline)
//   sections.lokalesSeo.text       → text (Diagnose-Body)
//   sections.lokalesSeo.findings   → findingsTable

// Bindings (Page 12):
//   sections.lokalesSeo.costText           → text
//   sections.lokalesSeo.actions            → arrowBulletList
//   sections.lokalesSeo.closingNote        → text (centered)
//   sections.lokalesSeo.schemaMarkupImage  → image (objectFit:contain)
//   sections.lokalesSeo.schemaMarkupCaption → text (italic)
```

### Design-Entscheidungen

- **Schema-Markup-Image als bound ImageBlock statt 3 statische Stubs (M8-Pattern):** Schema (`LokalesSeoSection.schemaMarkupImage?: string` + `.schemaMarkupCaption?: string`) existiert seit M1 — also direkt nutzen statt mit `binding: { kind: "static" }` zu arbeiten. ImageBlockView rendert dashed-cyan Placeholder bei leerem `src` automatisch, also weder Crash noch eigene Stub-Logik noetig. Vasileios kann via Editor-Inspector den Pfad zur Schema-Markup-Code-Screenshot setzen.
- **Image-Frame 90×60mm + objectFit:contain (statt cover wie in M8):** Code-Block-Screenshot ist meist ein hochformatiges Bild mit fixem Aspect-Ratio — `cover` wuerde croppen, `contain` zentriert es im Frame.
- **Caption italic 10pt, rechts vom Image positioniert:** Vasileios' Original zeigt "So sieht ein Schema-Markup aus" leicht rechts neben dem Image, etwa auf 1/3-Hoehe des Bildes ausgerichtet. Frame y=235 (Image y=228, also 7mm offset) trifft das ungefaehr.
- **closingNote 2-zeilig centered:** Layout zeigt 2 vollstaendige Zeilen Text — Frame h=12 und lineHeight 1.4 reichen.
- **costText Frame h=50 (vs M7's h=38, M8's h=42):** Vasileios Page 12 Body hat 6 Zeilen — mehr als die anderen Cost-Pages.

### Empty-State-Test

`vasileios-m9-empty-M9.json` (alle lokalesSeo-Strings + Arrays leer, schemaMarkupImage="", schemaMarkupCaption=""):
- Page 11: Kein Crash. Score-Donut zeigt "C" Fallback (base m2-smoke hat default-Score), Headline + "Was wir festgestellt haben" + Tabellen-Header (Problem/Befund/Status mit cyan underline) sichtbar, Tabelle leer.
- Page 12: Kein Crash. Headline + "Was das konkret kostet:" + "Was dagegen zu tun ist" sichtbar, costText/actions/closingNote/Caption leer (kein Text). Schema-Markup-Image-Frame bleibt sichtbar als dashed-cyan Box (90×60mm).

### Verifikation gegen Vasileios (Chrome-Diff)

Page 11 + Page 12 — beide Pages, identisches Chrome-Drift-Profil:
```
metric                  ref          app     drift_mm
logo_x        [22.59,35.40][22.74,35.32]   +0.15/-0.08 ✓
logo_y        [11.55,22.46][11.69,22.36]   +0.14/-0.10 ✓
logo_w_mm           12.82       12.58           -0.24 ✓
title_y       [11.67,16.11][11.69,16.01]   +0.01/-0.11 ✓
title_right_mm     186.15      184.59           -1.55 ⚠
stripe1_y_top      291.34      291.43           +0.10 ✓
stripe2_y_top      294.25      294.36           +0.10 ✓
stripe_gap           0.89        0.89           +0.00 ✓
```

Alle Chrome-Maße im Toleranzbereich (worst -1.55mm bei title_right_mm — bekanntes M3-Erbe, nicht regression).

### Visuelle Page-11-Inspektion

Layout-Shape, Spaltenbreiten und Status-Icons matchen Vasileios' Original. Score-Donut-Outline-Color in der App ist cyan (Brand-Default), in Vasileios' Original lila — das ist die Grade-Asset-Farbzuordnung fuer "C" und nicht Builder-relevant. Falls Vasileios die Farbzuordnung anpasst, geschieht das ueber `data/templates/default.json → assets.grades.C.color`, nicht im Page-Builder.

### Visuelle Page-12-Inspektion

Reihenfolge cost → actions → closingNote → image+caption matcht Vasileios Page 12 exakt. Image-Stub am unteren Page-Drittel ist 90×60mm dashed-cyan-Placeholder bis Vasileios den Schema-Markup-Code-Screenshot via Editor-Inspector einfuegt. Caption "So sieht ein Schema-Markup aus" italic, korrekt rechts neben dem Image.

### binding-catalog-consistency Hook

Nach Edit auf `page-builders.ts` clean: alle 8 audit-Pfade in den 2 Buildern (score, heading, text, findings, costText, actions, closingNote, schemaMarkupImage, schemaMarkupCaption) sind jetzt im Catalog. Kein silent persistence-killer wie M7's closingNote-Bug.

### Editor-E2E in Chrome (live verifiziert via claude-in-chrome MCP)

Editor mit `?auditId=vasileios-m9` geoeffnet damit alle bound TextBlocks Inhalt haben und klickbar sind. Pro Block angeklickt + Inspector-Volltext-Reader gegen erwartetes Binding-Label gematcht:

| Block | Type | Inspector-Binding-Label | Match |
|---|---|---|---|
| ls1-score-donut | scoreCircle | Lokales SEO - Note | ✓ |
| ls2-schema-image | image | Lokales SEO - Schema-Markup-Bild | ✓ |
| ls2-schema-caption | text (italic) | **Lokales SEO - Schema-Markup-Caption** | ✓ |
| ls2-closing-note | text | Lokales SEO - Footer-Note | ✓ |

**Persistenz-Test (M7-bug-Klasse)**: Click "Speichern" → Button wechselt zu "Gespeichert"; Page-Reload via `/editor/default?auditId=vasileios-m9`; Caption-Block nochmal selektiert → Inspector zeigt immer noch "Lokales SEO - Schema-Markup-Caption". Backend-JSON nach Save (per `python3 -c json.load`) bestaetigt:
- `ls2-schema-image` → `binding.path = "sections.lokalesSeo.schemaMarkupImage"`
- `ls2-schema-caption` → `binding.path = "sections.lokalesSeo.schemaMarkupCaption"`
- `ls2-closing-note` → `binding.path = "sections.lokalesSeo.closingNote"`

**Audit-Review-Page-Test**: `/audit/vasileios-m9` rendert Section "Lokales SEO" mit Note=C, korrekter Ueberschrift "Fuer Warendorf bereits sichtbar – im Umland noch viel Potenzial" und Diagnose-Body. `sectionLabels` map kennt `lokalesSeo`. Console: clean, keine error/warning/TypeError beim Page-Load und beim Block-Klick.

### Offene Tests / Bekannte Gotchas

- **Image-Stub** bleibt dashed-cyan-Placeholder bis Vasileios `sections.lokalesSeo.schemaMarkupImage` mit Pfad zu einem Code-Screenshot fuellt (entweder via Audit-Pipeline oder via Editor-Inspector "Bild hochladen"). Production-PDF zeigt vorerst den Placeholder — deshalb Schedule-Vorschlag offen ob Marlin in 1 Woche prueft ob Asset eingespielt ist.
- **Score-Donut Farbe "C" ist cyan in der App** vs Vasileios' Original lila. Das ist Grade-Asset-Farbzuordnung in `data/templates/default.json → assets.grades.C.color`, kein Builder-Issue. Wenn Vasileios das mochte: ein einziger Hex-Wechsel im Template, kein Code.
- **Editor-Click-Selektion auf kleinen Frame-Heights** ist ueber `computer.left_click` bei MCP-Tooling unzuverlaessig (Frame h=8mm = ~30px Hit-Box, MCP klickt manchmal Sub-Pixel daneben). User-Mausklick im echten Browser ist davon nicht betroffen — das ist nur ein Verifikations-Tooling-Reibungspunkt.

### Reibungspunkte (neue + Status alter)

**Neu in M9:**
1. **Editor-Click via `computer.left_click` greift bei kleinen Frame-Heights (≤30px Hit-Box) nicht zuverlaessig** — Workaround: direkt das `[data-overlay-block-id="..."]` Element via `document.querySelector` anvisieren, `scrollIntoView({block:"center"})`, dann `dispatchEvent(new PointerEvent('pointerdown', {clientX, clientY, button:0, isPrimary:true, buttons:1, ...}))` + `'pointerup'`. Das funktioniert deterministisch fuer **alle** Block-Typen (text/image/scoreCircle gleich), auch bei winzigen Captions. Loesung: `/verify-chrome-editor-e2e` Skill um `clickBlock(blockId)` Helper erweitern der diesen Pfad direkt nutzt — die in M8 beschriebene Helper-Funktion ist im Skill noch nicht enthalten, sie wurde nur als Vorschlag dokumentiert. Jetzt ist sie konkret implementierbar.

**Status M8-Reibungen:**
- ✅ Args-Resolver fuer seed-vasileios-audit ist via `scripts/seed-vasileios-audit.ts` geloest (lief in M9 deterministisch).
- ✅ image-regions Vermessung wurde in M8 zu `/measure-vasileios-page` hinzugefuegt — in M9 nicht gebraucht weil das Image bound zu einem audit-Pfad ist (kein Stub-Layout-Frame zu vermessen).
- ⚠ clickBlock Helper im `/verify-chrome-editor-e2e` Skill ist nach wie vor offen — siehe oben.

## 2026-05-02: M8 Seitenstruktur & Content (Page 9+10)

### Was

Pages 9 und 10 von Vasileios' 20-Seiten-Layout — "Seitenstruktur & Content" Ergebnisse + "Was das konkret kostet". Page 9 ist exakter Spiegel von M7-Page-7 mit anderen Bindings + 8 Rows statt 12. Page 10 weicht vom M7-Pattern ab: 3 Beispiel-Screenshot-Stubs zwischen costText und Action-Heading.

- **`buildSeitenstrukturContent1()`** (Page 9): pageChrome + Headline "Seitenstruktur & Content" + ScoreCircle (37mm, bound to `sections.seitenstrukturContent.score`) + Sub-Headline (bound to `.heading`) + Diagnose-Body (bound to `.text`) + Sub-Heading "Was wir festgestellt haben" + findingsTable bound to `.findings` mit 3 Spalten (Problem 50mm / Befund flex-1 / Status 22mm), Frame h=130mm fuer 8 Rows (vs 175mm in M7 fuer 12 Rows). Der untere Page-Bereich bleibt absichtlich leer — entspricht Vasileios' Original.

- **`buildSeitenstrukturContent2()`** (Page 10): pageChrome + Headline + Sub-Heading "Was das konkret kostet:" + costText-Body (5 lines, frame h=42 vs M7's h=38) + **3 Image-Stub-Slots**: imageA (links, 80×24mm), imageB (rechts, 85×24mm) side-by-side bei y=104, plus imageC (cyan-Banner-Slot, 170×50mm) bei y=132. Alle drei als `binding: { kind: "static" }` ohne `staticSrc` → ImageBlockView rendert dashed-cyan Placeholder (`#2a2a2a` bg + `1px dashed #38E1E1`). Vasileios kann spaeter per Editor Bilder reinziehen. Danach Sub-Heading "Was dagegen zu tun ist" + arrowBulletList bound to `.actions` (4 Items, frame y=196 h=75 mit overflow:shrink) + closingNote bound to `.closingNote` (centered statt left wie in M7, weil Vasileios' Original-Page-10 die abschliessende Zeile zentriert hat).

Default-Template jetzt **177 Blocks** (+15 vs M7's 162). Vasileios-Smoke-Audit `vasileios-m8.json` mit 8 findings (Dienstleistungsseiten/Stadtseiten/FAQ/Wortanzahl/Bilder/Prozessbeschreibung/Blog-Artikel/Interne-Verlinkung, 6× fail / 2× warning) + 4 actions + closingNote rendert visuell nah am Original — siehe Diff-Output unten.

### Gebaute Dateien

```
GEAENDERT:
  src/lib/editor/page-builders.ts
    + buildSeitenstrukturContent1() function (Page 9)
    + buildSeitenstrukturContent2() function (Page 10)
    BUILDERS map: seitenstrukturContent1/2 → echte Builder (statt CHROME_ONLY)
  .claude/skills/seed-vasileios-audit/SKILL.md
    + DATA["M8"] mit allen Vasileios-Texten (heading/text/findings/costText/actions/closingNote)
    Verfuegbare-Daten-Tabelle um M8-Zeile ergaenzt
  .claude/skills/seed-edge-case-audit/SKILL.md
    M8-Op analog M7 erweitert: heading/text/costText/closingNote zusaetzlich zu findings/actions/comparisonImages
    (war vorher nur findings/actions/comparisonImages → wuerde Bound-Bindings nicht testen)

GENERIERT (gitignored / data/):
  data/templates/default.json (177 Blocks, +15 vs M7)
  data/audits/vasileios-m8.json
  data/audits/vasileios-m8-empty-M8.json (Empty-State-Test)
```

### Vertraege/Typen

```ts
// src/lib/editor/page-builders.ts
function buildSeitenstrukturContent1(): Block[]   // 11 Blocks: pageChrome (5) + 6 inhalt
function buildSeitenstrukturContent2(): Block[]   // 14 Blocks: pageChrome (5) + 9 inhalt
                                                  //   davon 3 Image-Stubs (statisch ohne src)

// Bindings (Page 9):
//   sections.seitenstrukturContent.score      → scoreCircle
//   sections.seitenstrukturContent.heading    → text (Sub-Headline)
//   sections.seitenstrukturContent.text       → text (Diagnose-Body)
//   sections.seitenstrukturContent.findings   → findingsTable

// Bindings (Page 10):
//   sections.seitenstrukturContent.costText    → text
//   sections.seitenstrukturContent.actions     → arrowBulletList
//   sections.seitenstrukturContent.closingNote → text (centered)
//   ssc2-image-{a,b,c}                          → static binding (Stubs, kein audit-path)
```

### Design-Entscheidungen

- **3 Image-Stubs als statische ImageBlocks ohne staticSrc:** ImageBlockView (`src/lib/editor/blocks/ImageBlockView.tsx`) rendert bei leerem `src` einen dashed-cyan-border-Frame (`#2a2a2a` bg + `1px dashed #38E1E1`). Das ist exakt was wir wollen — sichtbarer Image-Slot fuer User aber ohne Crash. Detail-Plan sagte "2 Screenshot-Plaetze auf v1 Stub", Vasileios' Original zeigt aber 3 (2 oben side-by-side + 1 cyan-Banner unten). Pragmatisch: alle 3 Slots reservieren damit Layout final-shape stimmt; Vasileios kann via Editor Pfade einsetzen.
- **closingNote centered statt left:** Vasileios' Original-Page-10 zentriert die abschliessende Zeile. M6/M7 hatten alles links-bündig. Style-Override an einer einzigen Stelle (`textAlign: "center"`) statt eigenes Block-Property.
- **findingsTable Frame h=130 statt h=175:** Mit nur 8 Rows wuerde h=175 dazu fuehren dass die Tabelle den ganzen Page-Bereich fuellt — das wuerde von Vasileios' Original abweichen, wo das untere Page-Drittel leer bleibt. Designed Trade-off.
- **costText Frame h=42mm:** Vasileios Page 10 Body hat 5 Zeilen vs M7's 4 → 4mm mehr Hoehe als M7 (38 → 42).
- **comparisonImages-Schema NICHT genutzt:** `SeitenstrukturContentSection.comparisonImages?: { src?: string; caption?: string }[]` existiert seit M1 im Schema, aber ein Array-Index-Binding mit Sub-Object-Pfad (`comparisonImages[0].src`) ist im Catalog nicht typed. Pragmatisch: Stubs sind statisch, Vasileios setzt Bilder direkt im Editor — `comparisonImages` bleibt vorerst ungenutzt im Schema. Wenn der Workflow waechst (z.B. AI-Agent fuellt automatisch), kann es nachgezogen werden.

### Empty-State-Test

`vasileios-m8-empty-M8.json` (alle seitenstrukturContent-Strings + Arrays leer):
- Page 9: Kein Crash. Score-Donut zeigt "D" Fallback (Grade-Type erlaubt kein leerer-String, base m2-smoke hat default-Score), Headline + Sub-Heading "Was wir festgestellt haben" + Tabellen-Header sichtbar, Tabelle leer.
- Page 10: Kein Crash. Headline + "Was das konkret kostet:" + "Was dagegen zu tun ist" sichtbar, costText + actions + closingNote leer (kein Text). 3 Image-Stub-Frames bleiben sichtbar als dashed-cyan-Boxes.

### Verifikation gegen Vasileios (Page 9 Chrome-Diff)

```
metric                  ref          app     drift_mm
logo_x        [22.59,35.40][22.74,35.32]   +0.15/-0.08 ✓
logo_y        [11.55,22.46][11.69,22.36]   +0.14/-0.10 ✓
logo_w_mm           12.82       12.58           -0.24 ✓
title_y       [11.67,16.11][11.69,16.01]   +0.01/-0.11 ✓
title_right_mm     186.15      184.59           -1.55 ⚠
stripe1_y_top      291.34      291.43           +0.10 ✓
stripe2_y_top      294.25      294.36           +0.10 ✓
stripe_gap           0.89        0.89           +0.00 ✓
```

Alle Chrome-Maße im Toleranzbereich (worst drift -1.55mm bei title_right_mm — bekanntes M3-Erbe, nicht regression).

### Editor-E2E in Chrome (verifiziert via claude-in-chrome MCP)

Alle 9+ neuen Content-Bloecke pro Page anklickbar, Inspector-Werte matchen Backend-JSON exakt:

| Block | Type | Frame (x/y/w/h) | Binding-Label im Inspector | Match |
|---|---|---|---|---|
| ssc1-headline | text | 20/36/170/10 | (statisch) | ✓ |
| ssc1-score-donut | scoreCircle | 17/51/37/37, size=37 stroke=5 | Seitenstruktur - Note | ✓ |
| ssc1-section-heading | text (bound) | 65/50/130/8, fs=13 fw=700 | Seitenstruktur - Heading | ✓ |
| ssc1-section-text | text (bound) | 65/58/130/28, fs=10 fw=400 | Seitenstruktur - Text | ✓ |
| ssc1-findings-table | findingsTable | 20/103/170/130 | (array, kein Catalog-Dropdown) | ✓ |
| ssc2-cost-text | text (bound) | x=20 y=58 w=175 h=42 | Seitenstruktur - Was kostet | ✓ |
| ssc2-image-{a,b,c} | image | 80×24 / 85×24 / 170×50 | (statisch) — Stub | ✓ |
| ssc2-actions | arrowBulletList | 20/196/170/75 | (array, kein Catalog-Dropdown) | ✓ |
| ssc2-closing-note | text (bound) | 20/275/170/12, fs=10.5 fw=700 align=center | **Seitenstruktur - Footer-Note** ✓ | ✓ |

**M7-closingNote-Bug-Schutz aktiv:** Das `ssc2-closing-note` Binding-Dropdown zeigt korrekt "Seitenstruktur - Footer-Note", **nicht** "(statisch)" — der `binding-catalog-consistency` Hook hat funktioniert. Save+Reload-Persistenz: nach Click auf "Speichern" (Button → "Gespeichert") + Page-Reload bleibt `binding = {kind:"audit", path:"sections.seitenstrukturContent.closingNote"}` im Backend-JSON intakt. Console: clean (keine error/warn/TypeError).

### Audit-Review-Page-Test

`/audit/vasileios-m8` rendert die Section "Seitenstruktur & Content" mit korrekten Werten (Note D, Ueberschrift "Du hast die Struktur...", Text-Body); sectionLabels-Map kennt die Section. Kein Crash.

### Visual-Diff Page 9+10 via pdf-verifier subagent

Beide Pages **layoutmaessig erkennbar dasselbe Dokument** wie Vasileios' Referenz. 3 minor cosmetic drifts unter Akzeptanz-Schwelle (alle keine Blocker):

1. **Page 9: findings-Row-Spacing ~2mm enger als Ref** (Tabelle endet bei Y≈230 statt ≈245). Gesamt-Drift unter 3mm. Nice-to-fix: `rowVerticalPadding` von 3 auf 4-5 erhoehen.
2. **Page 9: Subagent meldete "Problem-Spalte bold statt regular"** — Re-Check gegen Original-PNG: Vasileios' Original-Tabelle hat Problem-Spalte ebenfalls **bold** ("Alle Dienstleistungsseiten" etc.). App-Version matcht Ref korrekt; Subagent hat hier fehleingeschaetzt. Kein Fix noetig.
3. **Page 10: Banner-Image-Slot 50mm vs Ref ~40mm** — bei leerem Stub egal; wenn Vasileios spaeter ein Banner-Bild einsetzt, evtl. Slot-Hoehe auf ~40mm reduzieren.

### Wiederholte manuelle Aktionen / Reibungspunkte

Drei Skill-Reibungen sind bei M8 aufgefallen, alle durch kleine Skill-Updates loesbar:

1. **`/seed-vasileios-audit` Skill-Args wurden falsch aufgeloest:** Aufruf war `vasileios-m8 M8`, aber im Skill-Body kam `AUDIT_ID="M8"` an statt `AUDIT_ID="vasileios-m8"`. Workaround: Python-Block per `AUDIT_ID="vasileios-m8" MILESTONE="M8" python3 <<PY` direkt aus Bash gerufen. Loesung: Skill-Header so umstellen dass die Args im Bash-Snippet als `${1:-default-id}` / `${2:-all}` formuliert sind und der Skill-Resolver klar weiss welche $N welcher User-Arg ist; oder den ganzen Bash-Schritt in ein dediziertes Skript `scripts/seed-vasileios-audit.ts` packen das die Args sauber per `process.argv` parst.

2. **Image-Stub-Frame-Sizes per Auge geschaetzt** statt vermessen. `/measure-vasileios-page` Skill kennt `cyan-region` (fuer den unteren Banner) aber nicht "image regions / dunkle Card-Boxen" (die zwei oberen Slots). Loesung: `/measure-vasileios-page` um `image-regions` Element erweitern: detect alle rechteckigen Bereiche mit konsistentem Hintergrund-Lum > bg+threshold und gib mm-Bboxes zurueck. Nicht kritisch — die geschaetzten Frames sind innerhalb 5mm Toleranz vom Original.

3. **Editor-Click via JS dispatchEvent ging nicht durch** — Editor catched Pointer-Events auf einer hoeheren Canvas-Ebene. Workaround: `computer.left_click` mit echten Pixel-Koordinaten (umgerechnet aus Frame-mm + Canvas-Offset). Loesung: `/verify-chrome-editor-e2e` Skill um eine Helper-Funktion erweitern: `clickBlock(blockId)` rechnet Frame-mm aus Backend-Template + Canvas-bbox auf viewport-Pixel um und triggert computer.left_click. Dann muesste man nicht jedes Mal das Pixel-Mapping per Hand machen.

Alle drei sind Skill-Polish und Backlog-faehig — fuer M8 nicht blockend.

## 2026-05-01: M7 UX & Conversion (Page 7+8)

### Was

Pages 7 und 8 von Vasileios' 20-Seiten-Layout — UX & Conversion Ergebnisse + "Was das konkret kostet". Subset von M6's Pattern: gleicher Score-Donut+findingsTable-Aufbau auf Page 1, aber Page 2 OHNE SerpPreview/BarChart/H2-H6-Heading.

- **`buildUxConversion1()`** (Page 7): pageChrome + Headline "UX & Conversion" 22pt-bold left + ScoreCircle (37mm, bound to `sections.uxConversion.score`) + Sub-Headline rechts (bound to `sections.uxConversion.heading`) + Diagnose-Body (bound to `sections.uxConversion.text`) + Sub-Heading "Was wir festgestellt haben" + findingsTable bound to `sections.uxConversion.findings` mit 3 Spalten (Problem 50mm / Befund flex-1 / Status 22mm), Frame h=175mm fuer 12 Rows (vs 165mm in M6 fuer 11 Rows). Reused `findingsTable`-Block aus M6, kein Schema-Change.

- **`buildUxConversion2()`** (Page 8): pageChrome + Headline (wiederholt) + Sub-Heading "Was das konkret kostet:" + costText-Body (5 lines, frame h=38) + Sub-Heading "Was dagegen zu tun ist" + arrowBulletList bound to `sections.uxConversion.actions` (6 Items mit fett-Title + body-Detail, frame h=152, overflow:shrink) + closingNote bound to `sections.uxConversion.closingNote` ("Die meisten dieser Aenderungen sind redaktionell..."). KEIN SerpPreview, KEIN BarChart, nur 1 Footer-Note (vs 2 in M6).

Default-Template jetzt **162 Blocks** (+12 vs M6's 150). Vasileios-Smoke-Audit `vasileios-m7.json` mit 12 findings (Hero-Section/Wording/Nutzerfuehrung/Google Reviews/Social Proof/Text-Button/Leistungsseiten/Prozessbeschreibung/CTA/FAQ/Inhabervorstellung/Navigation, 5x fail / 4x warning / 2x ok plus 1) + 6 actions + closingNote rendert visuell nah am Original.

### Gebaute Dateien

```
GEAENDERT:
  src/lib/editor/page-builders.ts
    + buildUxConversion1() function (Page 7)
    + buildUxConversion2() function (Page 8)
    BUILDERS map: uxConversion1/uxConversion2 → echte Builder (statt CHROME_ONLY)
  .claude/skills/seed-vasileios-audit/SKILL.md
    + DATA["M7"] mit allen Vasileios-Texten

GENERIERT (gitignored / data/):
  data/templates/default.json (162 Blocks)
  data/audits/vasileios-m7.json
  data/audits/vasileios-m7-empty.json (Empty-State-Test)

UNVERAENDERT:
  src/lib/types.ts — UxConversionSection = SectionBase deckt alles (kein Schema-Change)
  Block-Schemas — alle vorhandenen Block-Types ausreichend
```

### Vertraege/Typen

```ts
// src/lib/editor/page-builders.ts
function buildUxConversion1(): Block[]   // 11 Blocks: pageChrome (5) + 6 inhalt
function buildUxConversion2(): Block[]   // 11 Blocks: pageChrome (5) + 6 inhalt

// Bindings (Page 7):
//   sections.uxConversion.score      → scoreCircle
//   sections.uxConversion.heading    → text (Sub-Headline)
//   sections.uxConversion.text       → text (Diagnose-Body)
//   sections.uxConversion.findings   → findingsTable

// Bindings (Page 8):
//   sections.uxConversion.costText    → text (Body unter "Was das konkret kostet:")
//   sections.uxConversion.actions     → arrowBulletList (Title + Detail pro Item)
//   sections.uxConversion.closingNote → text (Footer-Note)
```

### Design-Entscheidungen

- **findingsTable mit 12 Rows ohne overflow-Prop:** `findingsTable` hat keinen `overflow:"shrink"` (vs `arrowBulletList`/`barChart`). Stattdessen Frame h=175mm gross genug fuer 12 Rows × ~12.5mm = 150mm + Header. Wenn ein Audit > 12 Rows liefert, werden die ueberschuessigen abgeschnitten — designed Trade-off.
- **costText-Frame h=38mm:** Vasileios Page 8 Body hat 5 Zeilen vs M6's 4 → 8mm mehr Hoehe als M6.
- **closingNote als bound TextBlock:** Single-Line-Footer-Note ist im Schema als `closingNote?: string` optional. TextBlock-Binding auf den Pfad: wenn leer → leer gerendert (kein Crash). Style: white-bold (vs M6's ungebundene white-regular Static-Notes).
- **Schema unveraendert:** UxConversionSection = SectionBase. Score-Donut, Sub-Headline, Body, Findings, costText, Actions, closingNote — alles im Base-Type. Ein Win — kein Schema-Migration noetig.

### Empty-State-Test

`vasileios-m7-empty.json` (alle uxConversion-Strings leer, findings/actions = []):
- Page 7: Kein Crash, Score-Donut zeigt graceful "C-" Fallback, Header "Was wir festgestellt haben" + Table-Header sichtbar, leere Tabelle.
- Page 8: Kein Crash, Headline + Sub-Headings sichtbar, leere Body-Frames, keine arrowBullets gerendert, kein closingNote-Text.

### Wiederholte manuelle Aktionen

### Editor-E2E in Chrome (verifiziert via /verify-chrome-editor-e2e)

Alle 6 neuen content-Bloecke pro Page anklickbar, Inspector-Werte matchen Backend-JSON exakt:

| Block | Type | Frame (x/y/w/h) | Match |
|---|---|---|---|
| uxc1-headline | text | 20/36/170/10, fs=22 fw=800 #fff | ✓ |
| uxc1-score-donut | scoreCircle | 17/51/37/37, size=37 stroke=5 | ✓ |
| uxc1-section-heading | text (bound) | 65/50/130/8, fs=13 fw=700 | ✓ |
| uxc1-section-text | text (bound) | 65/58/130/28, fs=10 fw=400 | ✓ |
| uxc1-findings-table | findingsTable | 20/103/170/175 | ✓ |
| uxc2-actions | arrowBulletList | 20/115/170/152 | ✓ |
| uxc2-closing-note | text (bound) | 20/275/170/12, fs=10.5 fw=700 | ✓ |

Save+Reload-Persistenz: nach Klick auf "Speichern" (Button-Wechsel zu "Gespeichert") und Page-Reload bleibt `uxc2-closing-note.binding = {kind:"audit", path:"sections.uxConversion.closingNote"}` intakt. `updatedAt` aktualisiert. 162 Blocks unveraendert.

Console: clean (keine error/warn/TypeError im App-Code).

### Bug gefunden + gefixt: closingNote im binding-catalog (Commit 2b2e634)

Beim Editor-E2E-Test sichtbar: `uxc2-closing-note` zeigte im Inspector Binding="(statisch)" obwohl der Builder `{kind:"audit", path:"sections.uxConversion.closingNote"}` setzt. PDF-Render funktionierte zwar (Backend liest Audit-Pfad direkt), aber Editor-User haette beim Speichern das audit-Binding zerstoert (silenter Persistenz-Killer).

**Root Cause:** `src/lib/editor/binding-catalog.ts` hatte keinen Eintrag fuer `sections.uxConversion.closingNote`. Editor-UI fiel auf "(statisch)" zurueck, weil Catalog-Lookup fehlschlug. M6 hat das gleiche Pattern nicht getriggert weil M6's Footer-Notes statisch waren (hardcoded staticText).

**Fix:** Eintraege fuer `closingNote` bei allen 7 Sections (`onpageSeo`, `uxConversion`, `seitenstrukturContent`, `lokalesSeo`, `leistung`, `links` — `seitenstrukturContent` ist neuer M1-Section) hinzugefuegt. Future-proof fuer M8-M13.

**Verifiziert nach Fix:** Editor zeigt "UX & Conversion - Footer-Note" als Binding-Label, Save+Reload behaelt die Audit-Bindings.

### Wiederholte manuelle Aktionen / Reibungspunkte

| Aktion | Wie oft | Pain | Loesung |
|---|---|---|---|
| `pdftoppm -png -r 150 -f N -l N` zum Page-Inspizieren | 2x | niedrig | Skill `/render-pdf-preview` schon vorhanden, ich war faul — Reminder an mich |
| Inline Python fuer Empty-State-Audit (`vasileios-m7-empty.json`) | 1x | mittel | `/seed-edge-case-audit M7`-Skill um `uxConversion`-Section erweitern |
| Editor-Sidebar-Click zur falschen Position bei Reload (Page-1-Cover statt Page-8) | 2x | niedrig | Race-Condition im Skill — `/verify-chrome-editor-e2e` koennte Page-Switch-await haerten |
| binding-catalog-Drift zwischen `page-builders.ts` und `binding-catalog.ts` (silent) | 1x (bug-find) | hoch | TS-Hook der nach `page-builders.ts`-Edit prueft dass alle audit-bindings im Catalog stehen |

### Vorschlaege fuer Automation (Quellen, nichts installiert)

**1. PostToolUse-Hook `binding-catalog-consistency-check`** — wichtigster Vorschlag aus diesem Milestone. Wenn `page-builders.ts` editiert wird, scannt automatisch alle `binding: { kind: "audit", path: "..." }` und prueft ob jeder Path in `BINDING_CATALOG` existiert. Faengt den heute gefundenen closingNote-Bug bei Build-Time statt Editor-E2E.
- Konfiguration: `.claude/settings.json` Hook mit matcher `Edit|Write` auf `src/lib/editor/page-builders.ts`
- Skript: `.claude/hooks/binding-catalog-consistency.sh` mit `grep -E 'kind:\s*"audit",\s*path:\s*"([^"]+)"' src/lib/editor/page-builders.ts | ... | while; check Path-existiert in BINDING_CATALOG`
- Quelle: [Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)

**2. `/seed-edge-case-audit` Skill um M7 erweitern** — kein neuer Tool, nur das bestehende Skill um `uxConversion`-Empty-Block ergaenzen. Spart inline-Python beim Empty-State-Test in M7-M13. Eigenes Skill in `.claude/skills/seed-edge-case-audit/SKILL.md`.

Andere Reibungen waren routinemaessig — keine weiteren Tool-Vorschlaege noetig.

## 2026-05-01: M6 On-Page SEO (Page 5+6)

### Was

Pages 5 und 6 von Vasileios' 20-Seiten-Layout — On-Page SEO Ergebnisse + "Was das konkret kostet". Pattern-Page für M7-M9 (gleicher Aufbau pro Section).

- **`buildOnPageSeo1()`** (Page 5): pageChrome + Headline "On-Page SEO Ergebnisse" 22pt-bold left + ScoreCircle (37mm, bound to `sections.onpageSeo.score`) + Sub-Headline rechts (bound to `sections.onpageSeo.heading`) + Diagnose-Body (bound to `sections.onpageSeo.text`) + Sub-Heading "Was wir festgestellt haben" + **`findingsTable` Block** (NEU) bound to `sections.onpageSeo.findings` mit 3 Spalten (Problem 50mm / Befund flex-1 / Status 22mm), cyan-underlined Header (kein Pill), Row-Dividers #444444, Status-Icons aus `assets.statuses` (warning ⚠ yellow / fail ❌ red / ok ✓ green).

- **`buildOnPageSeo2()`** (Page 6): pageChrome + Headline + Sub-Heading "Was das konkret kostet:" + Body (bound to `sections.onpageSeo.costText`) + SerpPreview-Block bound to `sections.onpageSeo.serpPreview.{url,title,description}` + cyan Sub-Headings "H2-H6-Header-Tag-Verwendung" + "Frequenz" + BarChart-Block (5 items H2/H3/H4/H5/H6 bound to `sections.onpageSeo.h2h6Frequency.{h2..h6}`, cyan bars, track #2a2a2a) + Sub-Heading "Was dagegen zu tun ist" + arrowBulletList bound to `sections.onpageSeo.actions` + 2 Footer-Notes ("Umsetzbar innerhalb einer Woche.", "Direkte Auswirkung auf Klickrate und Einordnung durch Google.").

Vasileios-Smoke-Audit `m6-smoke.json` mit den exakten Texten der Referenz-PDF (11 findings, 5 actions, h2h6Frequency 3/12/0/0/18, SerpPreview Waschbär-Service-Snippet) — App-PDF rendert visuell sehr nah am Original (Status-Icons, Bar-Längen, Layout alles match nach 2 Korrekturen).

### Gebaute Dateien

```
NEU:
  src/lib/editor/blocks/FindingsTableBlockView.tsx   (3-Spalten-Tabelle mit Status-Icons in der letzten Spalte, bound to SectionFinding[])
  data/audits/m6-smoke.json                          (Vasileios Page 5+6 Daten: Heading/Text/CostText/Findings 11/Actions 5/SerpPreview/h2h6Frequency)
  data/audits/m6-smoke-empty-M6.json                 (Edge-Case: findings + actions geleert, fuer Crash-Test)

MODIFIZIERT:
  src/lib/editor/template-types.ts                   (FindingsTableBlock Type + Block-Union)
  src/lib/editor/render-template.tsx                 (FindingsTableBlockView Dispatcher)
  src/lib/editor/page-builders.ts                    (buildOnPageSeo1, buildOnPageSeo2, BUILDERS map)
  src/lib/editor/asset-defaults.ts                   (DEFAULT_STATUS_ASSETS warning: "!" #f97316 → "⚠" #FBBF24)
  src/lib/agent/chat-orchestrator.ts                 (Block-Type-Liste fuer System-Prompt erweitert um findingsTable)
  data/templates/default.json                        (150 Blocks, +17 vs M5)
  PLAN.md / PROGRESS.md
```

### Public Interfaces (Quick-Reference)

```ts
// template-types.ts — neuer Block
type FindingsTableBlock = BlockBase & {
  type: "findingsTable";
  binding: Binding;                // → SectionFinding[]
  problemFieldPath: string;        // "problem"
  befundFieldPath: string;         // "befund"
  statusFieldPath: string;         // "status" (CheckStatus)
  problemColumnWidth: Mm;
  statusColumnWidth: Mm;
  headerStyle: TextStyle;
  headerUnderlineColor: HexColor;  // BRAND_CYAN
  headerUnderlineThickness: Mm;    // 0.4mm
  headerPaddingBottom: Mm;
  problemStyle: TextStyle;         // bold white
  befundStyle: TextStyle;          // regular gray
  rowDividerColor: HexColor;
  rowVerticalPadding: Mm;
  statusIconSize: Mm;              // ~5mm
  statusPalette?: CheckStatusPalette;  // override default-Palette
};

// page-builders.ts — neue exports/internals
function buildOnPageSeo1(): Block[]   // 11 Blocks: chrome 5 + headline + donut + 2x bound-text + sub-heading + findingsTable
function buildOnPageSeo2(): Block[]   // 16 Blocks: chrome 5 + headline + cost-heading + cost-text + serpPreview + 2 cyan-sub-headings + barChart + actions-heading + arrowBulletList + 2 footer-notes

// BUILDERS map updates:
BUILDERS.onPageSeo1 = buildOnPageSeo1   // war CHROME_ONLY
BUILDERS.onPageSeo2 = buildOnPageSeo2   // war CHROME_ONLY
```

Audit-Bindings: `sections.onpageSeo.findings` (`SectionFinding[]` = `{problem, befund, status: CheckStatus}`), `sections.onpageSeo.serpPreview.{url,title,description}`, `sections.onpageSeo.h2h6Frequency.{h2,h3,h4,h5,h6}`, `sections.onpageSeo.actions` (`ActionItem[]`).

### Design-Entscheidungen

- **Neuer `findingsTable` Block-Type statt Erweiterung von `comparisonTable` oder `checkList`**: Vasileios-Pattern (Pill-Header + 3 Spalten + Status-Icon rechts) wird in M6-M9 wiederholt — eigener Block-Type mit klarer Schema-Semantik (problemFieldPath/befundFieldPath/statusFieldPath) ist sauberer als `comparisonTable.columns[].kind="statusIcon"` Erweiterung. ListBlock kind="checkList" rendert nur 2 Spalten (title-detail vertikal + icon rechts) und passt nicht zu 3-Spalten-Layout.
- **Header ohne Pill, mit cyan-Underline**: Vasileios Page 5 hat keine cyan Pills im Tabellen-Header (im Gegensatz zu Page 4 / comparisonTable). `findingsTable.headerUnderlineColor` + `headerUnderlineThickness` als Schema-Parameter, nicht hardcoded.
- **Status-Icons aus globaler `assets.statuses` Palette**: `statusPalette` als optionales Override im Schema, default kommt aus `withAssetDefaults`. Wenn Vasileios eine Section mit anderen Icons haben will (z.B. "info"-blau für besondere Pages), kann das per Asset-Override gemacht werden ohne Schema-Änderung.
- **`assets.statuses.warning` von `"!"` (orange Ausrufezeichen) auf `"⚠"` (yellow Triangle) geändert**: Vasileios-PDF nutzt durchgehend ⚠ für non-fatal warnings. Pre-existing default war fragwürdig (Severity ❗ wirkt wie Error, nicht Warning). Cross-section-Aenderung — wirkt sich auf alle pages aus die `findingsTable` oder `checkList` nutzen werden (M6-M9).
- **`SerpPreview` reused (white-theme)**: Vasileios' SERP-Snippet ist dark-theme + Avatar-Logo. Existing Block hat white-theme + kein Logo. Akzeptierter Visual-Drift — der Block wird genau einmal in der gesamten 20-Seiten-Story gebraucht. Ein dark-theme-Variant Block würde >2 Std Implementation-Zeit kosten für 1× Use. Backlog-Eintrag wenn Vasileios nachfragt.
- **`barChart.frame.h` 38→50mm + gap 5.5→6.5**: erste Iteration hatte H6-Bar abgeschnitten (frame zu eng für 5 rows + label-line-height). Durch Visual-Diff erkannt, second-pass fix.
- **`arrowBulletList` itemGap 3.5→5.5, arrowGap 4→6**: PDF-Verifier-Subagent hat zu enges Spacing gegen Vasileios-Ref erkannt. Second-pass.
- **Score-Donut-Color C+ ist cyan in der App vs rot in Vasileios**: `DEFAULT_GRADE_PALETTE` ist app-weit (cyan für C-Grade, orange für D, red für F). Vasileios benutzt eine eigene Palette wo C+ als rot gerendert wird. Akzeptierter Drift weil systemic-design-decision, nicht M6-bedingt. Wenn Vasileios die Palette ändern will: 1× Asset-Override über `templates[].assets.grades`.

### Offene Tests / Bekannte Gaps

- **Browser-Editor-E2E (verify-chrome-editor-e2e Skill)** für M6 nicht durchlaufen — `findingsTable` hat nur generische Inspector-Properties (frame/zIndex/locked/visible), Custom-Felder werden via direktem JSON-Edit oder via Agent geändert. M5 Persistenz war ausführlich getestet, Pattern identisch. Edge-Case Empty-Findings rendert sauber (Header-Row + cyan-Underline visible, keine Rows).
- **Inspector hat keine spezifischen Felder für findingsTable** (Spalten-Breiten, Header-Underline-Color, Status-Palette-Override): generische Position+Z-Index Felder. Editieren der Texte und Status-Werte geht via Audit-JSON oder Agent. Pre-existing M5-Block-Gap (gleiche Begrenzung wie comparisonTable + pieChart) — nicht M6-bedingt.
- **Status-Icon-Glyphen render-Pixel**: `⚠` ist als Unicode-Char gerendert, nicht als SVG-Asset. PDF-Output bei sehr kleinen Status-Icon-Größen (`statusIconSize < 4mm`) könnte hinky aussehen weil Browser das Symbol nach Font-Hinting rastert. Aktuell statusIconSize=5mm — gut sichtbar.

### Gotchas

- **`SectionFinding` vs `FindingCheck`**: Zwei sehr ähnliche Types in `types.ts`. `SectionFinding = {problem, befund, status}` (für Tabellen-Rows). `FindingCheck = {label, status, detail}` (für CheckListBlock). Vor M6 unklar, dass das zwei separate Patterns sind — `CheckListBlockView` rendert `FindingCheck`, `findingsTable` rendert `SectionFinding`. Future-M7-M9: gleiche Section-Schema-Convention nutzen, kein Switch zu `FindingCheck`.
- **Score-Donut bbox-Vermessung wegen 50/50 Cyan-Red-Effekt**: Erste Pixel-Vermessung von Page 5 ergab asymmetrische Donut-bbox (w=23 vs h=37mm) weil ich red+cyan-Filter benutzt habe und der Donut-Track grau (=Hintergrund-near) war. Korrektur: NUR red-Filter benutzen für red-arc und Track separat erfassen. Bzw. eingebauter `gradePalette`-Ansatz macht das automatisch im Render.
- **`pdftoppm -png` Flag**: einmal vergessen, hat PPM-Output produziert. Skill `/render-pdf-preview` setzt das automatisch. Lesson siehe M5.
- **`PILL-HEADER` Detection in Page 5 fehl-negativ**: ich habe im Recon gesucht ob Page 5 cyan-pill-headers hat (wie Page 4 comparisonTable). Detection sagte "0 cyan-pixels" — korrekt: Page 5 hat KEINE Pills, nur cyan-Underline. Gut dass Detection das richtig gemeldet hat.

### Wiederholte manuelle Aktionen / Reibungs-Vorschlaege

**Gestolpert ueber:**

- **M5-Skill `/seed-vasileios-audit M6` existiert noch nicht voll** — DATA-Dict im Skill-Python-Block ist nur fuer M5 ausgefuellt. Habe m6-smoke.json manuell via Python-Script gebaut. Wuerde ~10 Minuten brauchen den Skill um M6-Texte zu erweitern. Aktuell 1× wiederholt — ab M7 (Übernahme der Vasileios Texte für UX-Section) wird das wieder aufkommen. Skill jetzt erweitern oder bei M7 nachholen?

**Echte neue Reibungspunkte:**

1. **`assets.statuses` Glyph-Verwaltung**: bei jedem Section-Page (M6-M9) muss Status-Symbol gerendert werden. Aktuell hardcoded `"⚠"`/`"❌"`/`"✓"` in `asset-defaults.ts`. Wenn Vasileios später custom-Icons als PNG schickt (`assets.statuses.warning.imageSrc = "/assets/warn.png"`), wird der Block-View das automatisch rendern (existiert schon). Kein Aktionspunkt.

2. **Visual-Diff `pdf-verifier` Subagent + 2-pass Fix-Loop ist effizient**: Erstes Render, Subagent findet 2-3 mm-Drifts, ich fixe in 2 Edits, re-render. Total ~3 Minuten pro Page-Builder. Pattern wird in M7-M11 wiederholbar. Keine neue Automation noetig — Skill `/visual-diff-against-vasileios` deckt das ab.

3. **`barChart.frame.h` zu klein erkannt erst beim Render** — keine Compile-Time-Validierung. arrowBulletList shrinkt mit overflow-shrink, barChart aber clipped einfach. Würde `BarChartBlock.overflow: "clip" | "shrink"` ähnlich wie arrowBulletList Sinn machen für M10+ mit auto-fit. Backlog-Kandidat — aktuell 1× gestolpert.

4. **PATCH `/api/templates/[id]` Body-Shape silently failed**: Beim verify-feature-Roundtrip-Test habe ich den Body als `{template: ...}` geschickt (so wie GET zurückliefert). Server gab 200 zurück, aber nichts wurde gemerged — weil `PATCH` `Partial<Template>` direkt im Body erwartet, nicht den Wrapper. Server hat unbekannte Top-Level-Keys einfach ignoriert. Nach 5 Min Debug erkannt. Würde durch Zod-Schema-Validate auf incoming-Body abgefangen (400 statt 200 bei unbekannten Keys). Risiko: Agent-Schreibaktionen könnten brechen wenn die nicht streng schema-konform sind. Backlog — aktuell 1× passiert.

### Verify-Feature-Resultat

```
✓ Code-Health      tsc clean, lint 0 errors
✓ Luecken-Scan     0 TODOs/FIXMEs/Platzhalter im M6-Code
✓ Dev-Server       /api/health 200, next-dev pid 17173
✓ Backend-APIs     4/4 grün (GET template/audit, generate-pdf, PATCH-roundtrip)
✓ Frontend-UI      Editor lädt, Page-5-Click → 11 Blocks, findingsTable
                   selektierbar via Pointer-Event auf Overlay-Div, Inspector
                   zeigt "findingsTable · ops1-findings-table" + korrekte
                   Position/zIndex, z-Index-Edit + Speichern + Reload
                   persistiert (50→88→reload zeigt 88), 0 Console-Errors
✓ Visuelle         pdf-verifier-Subagent: nach 2 fixes (warning glyph "!"→"⚠",
                   arrow-spacing 4→6) match gegen Vasileios
✓ Persistenz       PATCH-Roundtrip + Editor-Save+Reload PASS, Disk hat
                   findingsTable mit allen 19 Schema-Keys
⚠ Production       Railway /api/health 200, deep-test blockiert auf
                   BASIC_AUTH_PASS (gleicher Status wie M3-M5)
✓ Edge-Cases       m6-smoke-empty-M6 rendert sauber, kein crash
```

## 2026-05-01: M5 Top 3 Risiken (Page 3) + Wo du sein könntest (Page 4)

### Was

Pages 3 und 4 von Vasileios' 20-Seiten-Layout:

- **`buildTopRisks()`** (Page 3): pageChrome + Headline "Top 3 Risiken & Potenzial" 22pt-bold + Sub-line "Das kostet dich gerade Anfragen" 14pt-bold + `topRiskList` Block bound to `topRisks` (170x210mm, itemGap 8, numbered, overflow:shrink) — TitleStyle 12.5pt-bold weiß, BodyStyle 10pt regular #e6e6e6 lineHeight 1.5.

- **`buildWoDuSeinKoenntest()`** (Page 4, NEU): pageChrome + zentrierte Headline "WO DU SEIN KÖNNTEST" 22pt-bold + zentrierte Sub-Headline "Das ist möglich – mit der richtigen Reihenfolge" 14pt-bold + 3× Alt-Sentence-Pair via `buildAltSentence(idx, yTop)` Helper (rechts-bündige bold aspect bound to `comparison.altSentences[i].aspect` + zentrierte multi-line vision bound to `comparison.altSentences[i].vision`) auf y=63/92/116mm + Tabellen-Sub-Heading "Wo du heute stehst – wo du in 3 Monaten sein könntest:" + `comparisonTable` Block (170x130mm) bound to `comparison.rows` mit 3 Spalten (Problemstelle/Heute/in 3 Monaten), cyan Pill-Header (BRAND_CYAN, radius 6mm, padding 3/4mm), Cell-Style 10pt centered weiß, rowDividerColor #444444.

Test-Audit `m5-smoke.json` (Vasileios Waschbär-Daten: 3 topRisks + 3 altSentences + 7 comparison-rows) angelegt — der echte AI-Agent füllt diese Felder aktuell leer (siehe M1-Gap), für visuelle Verifikation manuell befüllt.

### Gebaute Dateien

```
NEU:
  data/audits/m5-smoke.json                   (Test-Audit mit Vasileios Waschbär-Daten: 3 topRisks + 3 altSentences + 7 rows)
  data/audits/m5-empty.json                   (Edge-Case-Audit: alle M5-Arrays leer, fuer Crash-Test)

MODIFIZIERT:
  src/lib/editor/page-builders.ts             (buildTopRisks, buildWoDuSeinKoenntest, buildAltSentence Helper, BUILDERS map updated)
  data/templates/default.json                 (133 Blocks, +13 vs M4)
  PLAN.md                                     (M5 abgehakt)
  PROGRESS.md                                 (dieser Eintrag)
```

### Public Interfaces (Quick-Reference)

```ts
// page-builders.ts — neue exports/internals
function buildTopRisks(): Block[]
  // → 8 Blocks: 5x chrome + headline + subline + topRiskList(binding=topRisks)

function buildWoDuSeinKoenntest(): Block[]
  // → 14 Blocks: 5x chrome + headline + subheadline
  //   + 6x alt-sentence (3 aspect+vision pairs at y=63/92/116mm)
  //   + table-heading + comparisonTable(binding=comparison.rows)

function buildAltSentence(idx: number, yTop: Mm): Block[]
  // → 2 Blocks per call: aspect (right-aligned bold, w=140) + vision (centered multi-line, w=170)
  //   bound to comparison.altSentences[idx].aspect/vision via indexed path

// BUILDERS map updates:
BUILDERS.topRisiken         = buildTopRisks         // war CHROME_ONLY
BUILDERS.woDuSeinKoenntest  = buildWoDuSeinKoenntest // war CHROME_ONLY
```

Audit-Bindings: `topRisks` (TopRisk[]), `comparison.altSentences[N].{aspect,vision}` (string), `comparison.rows[N].{problem,today,future}` (string). Indexed path `comparison.altSentences[0].aspect` resolved sauber via `SEGMENT_RE` in `resolve-binding.ts`.

### Design-Entscheidungen

- **Existing topRiskList Block reused**, kein neuer Block-Type fuer "3 nummerierte Risiken-Bloecke" gebaut. Layout-Variation (gap, font-size, color) reicht ueber bestehende `ListItemStyle`-API.
- **`buildAltSentence(idx, yTop)` Helper statt 6x copy-paste**: 3 Alt-Sentence-Pairs auf Page 4 sind strukturell identisch, nur Index + Y unterscheidet. Helper haelt Frame-Berechnung lokal.
- **Indexed binding-paths** statt eigenem Listen-Block fuer altSentences: Saubere Trennung Aspect (right-aligned bold) und Vision (centered body) als separate Blocks gibt Designer-Kontrolle ueber Position pro Element. Listen-Block waere monolithisch.
- **comparisonTable mit `flex: 1` Spalten** (kein fixed `width`): laesst Spalten gleichmaessig 1/3 verteilen. Vasileios-Ref hat ungefaehr gleichmaessige Pills.
- **Pill-Color = BRAND_CYAN (`#38E1E1`)** statt Vasileios-Original `#08F8FC`: bewusst auf bestehende Brand-Konstante gesetzt, keine Sub-Konstante eingefuehrt. Drift ist subtil. Wenn Vasileios anmerkt → 2-Zeilen-Fix.
- **Bold-cyan Inline-Emphasis ausgelassen** (z.B. "die [Besucher treiben lässt]"): TextBlock-API unterstuetzt nur einen TextStyle. Rich-Text-Block waere richtige Loesung, aber zu schwer fuer M5-Scope. Markiert als Backlog (M9-Kandidat wenn andere Pages aehnliches brauchen).
- **Edge-Case `overflow: "shrink"`** beim topRiskList: wenn Vasileios mal 4 statt 3 Risiken braucht, scaled list automatisch.

### Offene Tests / Bekannte Gaps

- **Inspector hat keine spezifischen Felder fuer comparisonTable** (Spalten-Liste, headerPillColor, headerPillRadius, padding): generische Position+Z-Index Felder, keine custom UI. Pre-existing M2-Block-Gap, nicht M5-bedingt. Editieren der Spalten-Header geht aktuell nur via Agent oder direkter JSON-Edit. Kandidat fuer Inspector-Sweep wenn mehr comparisonTables eingefuehrt werden.
- **Lange Cell-Texte mit Wrap**: in m5-smoke wrappt Row 4 ("Content-Qualitaet Unterseiten") sauber. Nicht systematisch gegen sehr lange Strings (>50 Zeichen pro Zelle) getestet. comparisonTable-View nutzt `wordBreak: "break-word"` und `flex: 1` — sollte halten.
- **Browser-Editor-Drag-and-Drop in der Canvas** der M5-Bloecke: nicht via /verify-feature getestet (Inspector-Tab klick reichte fuer Persistenz-Beweis). Wuerde /verify-chrome-editor-e2e Skill abdecken — beim naechsten Mal nutzen.
- **Production-Deep**: blockiert auf BASIC_AUTH_PASS. /api/health 200 reicht als smoke. Erst beim ersten echten Vasileios-Production-Run mit Marlin tiefer testen.

### Gotchas

- **PDF-API ist `/api/generate-pdf`**, nicht `/api/pdf` (mein erster curl-Versuch lieferte HTML-Page statt PDF — Next-Router routed unbekannte Pfade an die Landing-Page). Skill `/render-pdf-preview` nutzt korrekten Pfad.
- **`pdftoppm` braucht `-png` Flag**, sonst rendert es PPM (Portable Pixmap), das Read-Tool nicht visuell zeigt. Pre-existing skill nutzt `-png`, mein manueller Aufruf nicht.
- **Cyan-Pill in Vasileios-Ref ist heller als unser BRAND_CYAN**: Pill bg ist `#08F8FC` (sehr saturated, fast neon-cyan) vs unser `#38E1E1` (Standard-Footer-Stripe-Color). Akzeptierter Tradeoff — könnten Pill-Color als zweites Konstante einführen wenn Vasileios das anmerkt.
- **Bold-cyan Emphasis innerhalb der Aspect-Sentence fehlt** (z.B. "Statt einer Seite die [Besucher treiben lässt]" — letzte Worte sind cyan-bold in Ref). TextBlock unterstützt nur eine Style. Würde rich-text-Block oder zwei-spaltigen Aspect-Block brauchen. Acceptable für M5; könnte in M9 (gleicher Pattern für andere Pages) ein Custom-RichTextBlock eingeführt werden.
- **chrome-Diff vs Vasileios**: logo + stripes match unter 0.25mm (✓). title_right hat -1.55mm drift (M3-known issue, nicht M5-bedingt).

### Wiederholte manuelle Aktionen / Reibungs-Vorschlaege

**Gestolpert ueber:**

- **PDF-Endpoint-Verwirrung** (`/api/pdf` vs `/api/generate-pdf`) + **`pdftoppm` ohne `-png` Flag**: 2x manuell gestolpert weil ich direkt curl + pdftoppm gerufen habe statt das bestehende `/render-pdf-preview` Skill zu nutzen. Skill loest beide Probleme bereits. Keine neue Automation noetig — Lesson: bei Page-Builder-Verifikation immer Skill aufrufen.

- **Browser-Editor-E2E (Page klicken → Block selektieren → Inspector pruefen → Save → Reload → Disk-Check)** habe ich manuell via `mcp__claude-in-chrome__*` durchgeklickt. Skill `/verify-chrome-editor-e2e` existiert (in CLAUDE.md beschrieben) und automatisiert genau das. Ich habe ihn schlicht uebersehen. Lesson: in /verify-feature Schritt 5 explizit `/verify-chrome-editor-e2e` als Sub-Tool referenzieren.

**Echte neue Reibungspunkte (haben aktuell keine Loesung):**

1. **Custom-Layout-Vermessung in Vasileios-PDF** (Pills, Row-Dividers, Body-Text-Rows, Cyan-Bands an custom y-Range): `/measure-vasileios-page` deckt nur Logo + Header-Text + Footer-Stripes ab. Fuer Pills + Tabellen-Dividers musste ich PIL-Filter mit Cyan-Threshold + Row-Density-Scan from scratch schreiben. Wird in M6-M13 wiederkommen (Status-Icons, Bar-Chart-Bars, Pie-Chart-Slices, Resource-Tile-Icons).

   **Vorschlag**: Skill-Erweiterung `/measure-vasileios-page <pageNum> <element>` um neue Element-Types `pills`, `dividers`, `text-rows`, `cyan-region`. Quelle: [Claude Code Skills Doc](https://docs.claude.com/en/docs/claude-code/skills) — Skills akzeptieren args, koennen Python+PIL ausfuehren wie bestehender Skill auch. Aufwand ~30 Min.

2. **Edge-Case-Audit-Erstellung** (m5-empty.json mit allen relevanten Arrays leer fuer Crash-Test): manuell via Python-Script. Wenn /verify-feature in Zukunft Edge-Cases automatisch testen soll, waere ein Helper sinnvoll.

   **Vorschlag**: Skill `/seed-edge-case-audit <baseAuditId> [milestone]` der ein Base-Audit kopiert und alle Milestone-relevanten Arrays leert (M5: `topRisks`, `comparison.altSentences`, `comparison.rows`; M6: `sections.onpageSeo.findings/actions`, etc). Mapping Milestone→Felder waere im Skill hardcoded. Quelle: gleiche Skills-Doc. Aufwand ~20 Min. Nur sinnvoll ab dem dritten Wiederholen — aktuell 1x, also noch warten.

3. **Test-Audit-Erstellung mit Vasileios-Inhalten pro Milestone** (m5-smoke.json mit den exakten Vasileios-Texten): manuell via Python-Script. Wird in M6-M11 wiederkommen (jede Section hat Vasileios-spezifische Findings/Actions/Costs).

   **Vorschlag**: Skill `/seed-vasileios-audit <auditId> [milestone]` der die Vasileios-Texte aus dem Quell-PDF pro Milestone extrahiert und ins Audit kippt. Quelle PDF-Texte: bereits via pdftoppm-PNGs vermessen, koennte durch pdftotext extrahiert + manuell kuratiert werden. Quelle: gleiche Skills-Doc. Aufwand ~45 Min (Text-Extraktion + Mapping). M6 Kandidat — aktuell 1x, beim 2. Mal Skill bauen.

4. **Tab-Persistenz Editor nach Reload**: Editor reloaded auf Cover (Page 1), nicht auf zuletzt selektierte Page. Macht Persistenz-Tests laenger (immer wieder zu Page 4 navigieren). Pre-existing UX-Detail, keine M5-bedingte Reibung. Kein Skill-Vorschlag — UI-Improvement im Editor selbst.

### Verifikation (verify-feature Hardcore-Run)

- ✓ `tsc --noEmit` clean
- ✓ `npm run lint` 0 errors (3 pre-existing warnings in scripts/diff-pdf-against-vasileios.ts, nicht von M5)
- ✓ Luecken-Scan `page-builders.ts`: 0 TODOs/FIXMEs/console.log/Platzhalter
- ✓ `/api/health` 200, `/api/templates/default` 200, `/api/audit/m5-smoke` 200, `/api/generate-pdf?auditId=m5-smoke` → 1.0 MB 20 pages
- ✓ Editor `/editor/default?auditId=m5-smoke` lädt: Page 3 zeigt Headline + Subline + 3 nummerierte Risk-Blöcke; Page 4 zeigt Headline + Sub + 3 Alt-Pairs + Tabellen-Heading + 7-row Tabelle mit cyan Pills
- ✓ Inspector tr-list: X=20 Y=65 W=170 H=210 gap=8 overflow=shrink numbered=true binding=topRisks ✓
- ✓ Inspector wd-comparison-table: X=20 Y=156 W=170 H=130 z=50 ✓
- ✓ Persistenz: X 20→22 in Inspector → Save (Button → "Gespeichert") → Disk hat x=22 → reverted
- ✓ Edge-Cases m5-empty (alle M5-Arrays leer): PDF rendert sauber, Page 3 = Headline + Subline only, Page 4 = Headline + Sub + Tabellen-Heading + leere Pill-Header. KEIN crash, KEIN "undefined", KEIN broken layout.
- ✓ `hasNextErrorOverlay = false`, keine Console-Errors
- ✓ chrome-Drift gegen Vasileios-Ref: logo + stripes <0.25mm, title_right -1.55mm (M3-known, nicht M5)
- ✓ Production `/api/health` 200 (deep blockiert auf BASIC_AUTH)


## 2026-05-01: M4 Cover + Gesamtsituation

### Was

Erste zwei echten Section-Pages aus Vasileios' 20-Seiten-Layout sind als Block-Builder implementiert:

- **`buildCover()`** (Page 1): brandDecoration kind:"logo" Wortmarke (70x22mm, top-center) + Mega-Title "SEO-AUDIT" 64pt-bold mit dezentem Drop-Shadow textShadow ("1.2mm 1.2mm 0 rgba(0,0,0,0.55)") + "für Ihre Website" Subline + computed-binding `domain` URL in cyan + image-Block fuer `screenshots.cover` (160x110mm zentriert) + 3-Spalten-Footer ("info@artisticavenue.de | www.artisticavenue.de | +49 (0) 179 3213 445") + Standard-Footer-Stripes.

- **`buildGesamtsituation()`** (Page 2): pageChrome() + Headline "Gesamtsituation & Diagnose" 22pt-bold + audit-bound `diagnosisText` (10.5pt, lineHeight 1.5) + Sub-Headline "Audit-Ergebnisse für {domain}" 18pt-bold (2 Zeilen) + Big-ScoreCircle 52mm Diameter (overall-grade) + Right-side-Heading audit-bound `overallHeading` 13pt-bold + Right-Paragraph audit-bound `introText` 9.5pt + roter Empfehlungs-Button (50x8.5mm, fill #FF5757) mit Text "Empfehlungen: {audit.recommendations.length}" + 6 Sub-ScoreCircles 19mm Diameter im 4+2-Grid mit bold-Labels darunter.

Der Seed-Pfad wurde umgebaut: das alte JS-Skript `seed-default-template.mjs` ist durch `seed-default-template.ts` ersetzt, das via tsx die `BUILDERS`-Map aus `page-builders.ts` aufruft. `default.json` hat jetzt 120 echte Blocks (zwei volle Pages + 18 Standard-Chrome-Pages) statt 20 leerer Shells.

### Gebaute Dateien

```
NEU:
  scripts/seed-default-template.ts            (TS-Variante, importiert BUILDERS aus page-builders.ts)

MODIFIZIERT:
  src/lib/editor/page-builders.ts             (buildCover, buildGesamtsituation, footerStripes Helper, RED_BUTTON konstante, BUILDERS map)
  src/lib/editor/blocks/TextBlockView.tsx     (overflow:hidden — verhindert Text-Frame-Ueberlauf)
  scripts/seed-default-template.mjs           (geloescht)
  package.json                                (start:railway: node ...mjs → tsx ...ts)
  PLAN.md                                     (M4 abgehakt + M4.1 Backlog)
  PROGRESS.md                                 (dieser Eintrag)

REGENERIERT:
  data/templates/default.json                 (120 Blocks statt 20 leere Shells)
```

### Vertraege/Typen

```ts
// page-builders.ts (bestehende Exports + neue)
export const RED_BUTTON = "#FF5757";

// BUILDERS map: cover und gesamtsituation referenzieren jetzt echte Builder
const BUILDERS: Record<PageKey, () => Block[]> = {
  cover: buildCover,
  gesamtsituation: buildGesamtsituation,
  // ... rest CHROME_ONLY_BUILDER (M5+)
};
```

Audit-Bindings die der Builder nutzt: `screenshots.cover` (image), `url` (computed:domain), `overallScore` (grade), `overallHeading` (string), `introText` (string), `diagnosisText` (string), `recommendations` (text-template `{audit.recommendations.length}`), `sections.{onpageSeo,uxConversion,seitenstrukturContent,lokalesSeo,leistung,links}.score` (grade).

### Verifikation

**Smoke + Compile:** `tsc --noEmit` clean, `npm run lint` clean (3 unrelated warnings aus M3-gen-Skript), `GET /api/health` 200, PDF rendert in 2-3s.

**Layout-Drift gegen Vasileios** (pdf-verifier subagent gegen Pages 1+2 der Referenz):

| Element | Status | Drift |
|---|---|---|
| Cover: Logo Pos+Size | ✓ | <1mm |
| Cover: SEO-AUDIT Title + Drop-Shadow | ✓ | initial Cyan-Glow war falsch interpretiert — auf dunklen Drop-Shadow umgestellt, matched Vasileios |
| Cover: Subline + cyan domain | ✓ | <1mm |
| Cover: 3-Spalten-Footer | ✓ | aligned |
| Cover: Footer-Stripes | ✓ | identisch zu pageChrome |
| Cover: **Monitor-Bezel** | ✗ | **fehlt** — derzeit Screenshot-Image mit borderRadius:4. M4.1 Backlog |
| Gesamtsituation: pageChrome | ✓ | identisch zu Page 5 |
| Gesamtsituation: Headline 22pt | ✓ | <1mm |
| Gesamtsituation: Diagnose-Body | ✓ | layout-mässig |
| Gesamtsituation: Sub-Headline 2-Zeilen | ✓ | matched |
| Gesamtsituation: Big-Donut 52mm | ✓ | initial 60mm war zu gross — gefixt |
| Gesamtsituation: Right-Side Block | ✓ | aligned mit Donut-Top |
| Gesamtsituation: Empfehlungs-Button | ✓ | rot, recommendations.length funktioniert |
| Gesamtsituation: 6 Sub-Donuts 19mm | ✓ | initial 17mm war zu klein — gefixt |
| Gesamtsituation: Sub-Donut-Labels bold | ✓ | weight 600→700 nach Subagent-Diff |

Echtes Test-Audit (`adc273ac...`, www.homeraum-immobilien.de) rendert mit Cover-Screenshot, allen 6 Sub-Donut-Grades, Empfehlungs-Counter "19", domain-binding aus URL.

### Design-Entscheidungen

- **Cover ohne Monitor-Bezel als M4-Scope** — der Bezel + Stand ist visuell hübsch aber asset-aufwendig (entweder PNG-Overlay oder eigener SVG-Block-Type). Aktueller Render mit borderRadius:4 wirkt sauber genug fuer einen ersten Vasileios-Run. M4.1-Backlog haelt es auf der Liste.
- **3-Spalten-Footer hardcoded mit Vasileios' Kontaktdaten** — aktuell static text "info@artisticavenue.de", "www.artisticavenue.de", "+49 (0) 179 3213 445". Kein Audit-Binding noetig, weil das immer Vasileios' Brand-Footer ist (nicht audit-spezifisch).
- **Empfehlungs-Counter via text-template `{audit.recommendations.length}`** — nutzt das existing `applyTextTemplate` aus `resolve-binding.ts` (regex `\{audit\.([^}]+)\}` resolved den Pfad). Kein neues binding-kind noetig. Funktioniert auch fuer beliebige zukuenftige Counter (z.B. `{audit.topRisks.length}`).
- **`textStyle()` Helper als Default-Builder** — alle TextBlocks im Cover/Gesamtsituation gehen durch ein `textStyle({...overrides})`-Pattern. Konsistente Defaults (Poppins, weiss, lineHeight 1.5), per-block-overrides nur fuer das was abweicht. Reduziert Boilerplate ggue. M3.
- **`footerStripes(idPrefix)` als shared Helper** — sowohl Cover als auch pageChrome rufen ihn auf. Das Cover hat eigenes Top-Layout (kein Logo TL, kein Header-Text TR), aber identische Footer-Stripes. Helper extrahiert nur die zwei Shape-Blocks, kein duplicate-Code zwischen den zwei Page-Variants.
- **TextBlockView overflow:hidden** — bisheriger TextBlock erlaubte Text der ueber den Frame hinaus fliesst. Bei M4 sichtbar, weil Right-Paragraph (audit-bound `introText` ~5 Zeilen) ueber den Empfehlungs-Button fiel. Globaler Fix, hat keine sonstigen Konsequenzen — alle Text-Frames sollten ihre Bounds respektieren. Bei zu langen Inhalten sieht man jetzt Cutoff statt Visual-Bug.
- **Sub-Donut-Diameter 19mm + Labels bold** — Subagent-Diff hat initial 17mm zu klein und Labels regular zu duenn gemeldet. Iteration auf 19mm + weight 700 matcht Vasileios' Gewicht.
- **Big-Donut-Diameter 52mm (vorher 60mm)** — Subagent-Diff hat 60mm als ~10mm zu gross gemeldet. Auf 52mm korrigiert + strokeWidth 6→5.5 fuer proportionalere Linie.
- **`scripts/seed-default-template.mjs` → `.ts`** — der alte JS-Seed konnte BUILDERS nicht aufrufen (Module-Mismatch zwischen ESM-mjs und TS-ESM-Imports). Umstellung auf tsx-Aufruf. `package.json` `start:railway` script entsprechend angepasst.

### Gotchas

- **Cover-Screenshot fehlt bei `m2-smoke` Audit** — `screenshots.cover` ist null bei Mock-Audits ohne Upload-Flow. Initial-Render zeigte leeren Frame. Workaround: gegen echtes Audit (`adc273ac...`) rendern, das hat Cover/Mobile/Tablet-Screenshots aus dem PageSpeed-Pipeline. Bei Vasileios-Production-Run wird es immer befuellt sein, weil der Upload-Flow Screenshots vor dem Save erzeugt.
- **lange Domains im pageChrome-Header** — `chrome-url` Subline mit `für www.{domain}` wraps bei domains > 25 chars auf 2 Lines. fontSize auf 8pt reduziert (von 9pt), gibt etwas mehr Headroom. Bei sehr langen Domains > 30 chars trotzdem moeglich. Akzeptiert — ist M3-Edge-Case-Limitation.
- **kein PageKey ↔ page-id Mapping vorher** — `seed-default-template.mjs` nutzte kebab-case page-ids ("top-risiken", "ux-conversion-1"), `BUILDERS`-Map nutzt camelCase PageKey ("topRisiken", "uxConversion1"). Der TS-Seed hat jetzt eine explizite `PAGES`-Liste mit `{id, key, name}` die mappt. Beim Adden neuer Pages immer in beide Maps schauen.
- **textShadow als CSS-Property** — TextStyle hatte schon `textShadow?: string` als optionales Field, aber bisher ungenutzt. Cover-Title via "1.2mm 1.2mm 0 rgba(0,0,0,0.55)" (dezenter Drop-Shadow nach unten-rechts). Erste Implementierung hatte irrtuemlich einen Cyan-Glow ("0 0 8mm cyan, ...") — das war mein Lese-Fehler beim Vasileios-PNG, in Wahrheit hat Vasileios nur einen klassischen Drop-Shadow. Marlin hat das visuell gefangen, danach gefixt.
- **`tsc-on-schema-edit` hook hat ausgeloest** beim Edit auf `template-types.ts` — clean, kein Schema-Bruch durch M4.

### Public Interfaces (Quick-Reference)

```ts
import {
  pageChrome,           // Standard-Chrome (logo + header-text + footer)
  buildCover,           // M4 Page 1
  buildGesamtsituation, // M4 Page 2
  BUILDERS,             // Record<PageKey, () => Block[]>
  PAGE_WIDTH_MM, PAGE_HEIGHT_MM, BRAND_CYAN, RED_BUTTON,
} from "@/lib/editor/page-builders";

// Run from a script:
import { BUILDERS } from "@/lib/editor/page-builders";
const blocks = BUILDERS["gesamtsituation"]();    // 32 Blocks fuer Page 2
```

### Editor-UX-Limitations (kein M4-Bug, dokumentiert)

- **Block-Inspector hat keine Custom-UI fuer scoreCircle** — wenn Vasileios den Big-Donut oder Sub-Donut anklickt, sieht er nur das Default-Inspector-Panel (Frame, Layer, Duplizieren/Loeschen). Properties wie `size`, `strokeWidth`, `labelStyle.fontSize` muessen via JSON-Edit oder AI-Agent geaendert werden. Konsistent mit barChart/gauge/etc.
- **Empfehlungs-Counter nutzt Template-Substitution, nicht echtes Binding** — `{audit.recommendations.length}` ist text-template, nicht im binding-catalog. Fuer Editor-User wirkt es wie "static text" — sie koennen `Empfehlungen:` editieren, aber wenn sie das `{audit.recommendations.length}` versehentlich ueberschreiben verschwindet die Zahl. Akzeptabel: AI-Agent kann es immer wiederherstellen.

### Offene Tests / Bekannte Gaps

- **Chrome-Editor E2E nicht durchgeklickt** fuer M4-Pages — `/verify-chrome-editor-e2e default` waere die naechste Stufe. Lokal hat tsc+lint+health+pdf-render alles gepasst, aber Block-Selektion + Inspector-Werte vs JSON-Werte + Save+Reload-Persistenz wurden nicht 1:1 verifiziert. Niedrige Risiko-Erwartung weil Block-Types alle aus M2/M3 stammen, nur die Frames+Bindings sind neu.
- **Production-hinter-Auth nicht getestet** — gleiche Linie wie M1-M3. Bei naechstem Vasileios-Run mit Marlin zusammen.
- **Visual-Diff nur gegen homeraum-immobilien.de** — andere Audit-Daten (kuerzere/laengere introText, andere Grades, missing screenshots.cover) nicht durchgespielt. Fallback-Verhalten beim missing Cover-Screenshot ist getestet (m2-smoke), zeigt leeren Frame. Bei Vasileios-Real-Audit immer gefuellt.
- **Cover-Monitor-Bezel** — als M4.1 im Backlog. Aktueller Render funktioniert ohne, ist aber visuell duenner als Vasileios.

### Wiederholte manuelle Aktionen / Friction-Points

In M4 mehrfach gemacht:

| Aktion | Wie oft | Pain |
|---|---|---|
| Python-Pixel-Vermessung von Vasileios PNGs (Logo-Bbox, Donut-Center, Sub-Donut-Cluster, Color-Sample) inkl. iterative Heuristik-Anpassung weil M3-Skill nicht alle M4-Element-Types abdeckt | 4x | mittel-hoch |
| `npx tsx scripts/seed-default-template.ts && curl PDF + pdftoppm + Read PNG` Iteration nach jeder Builder-Anpassung | 6x | mittel |
| pdf-verifier Subagent fuer App-vs-Vasileios-Diff aufrufen mit Punch-list-Prompt | 1x | mittel |
| TextBlock-Frame-Overlap diagnostizieren (introText fliesst ueber Empfehlungs-Button) — manuelles Bild-Lesen + textStyle-Anpassung + Re-Render | 3x | niedrig-mittel |

### Vorschlaege fuer Automatisierung (Quellen, nichts installiert)

**1. Erweiterung des `/measure-vasileios-page`-Skills um neue Element-Types** — aktuell unterstuetzt logo, header-text, footer-stripe. Fuer M4 brauchten wir zusaetzlich: big-donut (cyan-arc center+radius), sub-donut-cluster (4-grid + 2-grid Detection mit Color-Identification), red-button-bbox, title-with-glow (Bbox + textShadow-detect). Erweiterung in `.claude/skills/measure-vasileios-page/SKILL.md`: `element` accepts `donut <colorHint>`, `button <colorHint>`, `title-glow`. Wuerde in M5-M13 jedes Mal ~3-5min sparen wenn neue komplexe Pages vermessen werden muessen.
- Quelle: bestehender Skill + Python-PIL-Logik

**2. Helper-Skript `scripts/render-and-diff.ts <auditId> <appPage> <refPage>`** — kombiniert Re-Seed + curl + pdftoppm + pdf-verifier-Subagent-Aufruf in einem CLI-Befehl. Aktuell 5 separate Tool-Calls in Sequenz, die alle "Re-Render und gegen Vasileios checken". Wuerde in M5-M13 nach jedem Builder-Update die Diff-Iteration in 30s liefern.
- Wrapper um `scripts/diff-pdf-against-vasileios.ts` + Subagent-Aufruf. Kein neues Tool, nur ein internes Skript.

**3. Skill `/build-page <pageKey>`** — Boilerplate-Generator fuer neue Page-Builders. Args: pageKey (z.B. "topRisiken"). Skill-Body: liest aktuelle BUILDERS map, schreibt `function build<PageKey>(): Block[] { return [...pageChrome(), /* TODO */]; }` und ersetzt CHROME_ONLY_BUILDER in BUILDERS map. Spart in M5-M13 das Boilerplate jedes Mal von Hand zu schreiben.
- Quelle: [Claude Code Skills Doc](https://docs.claude.com/en/docs/claude-code/skills)

**4. Hook `lint-on-builders-edit`** — analog zu `tsc-on-schema-edit`: PostToolUse-Hook der bei Edit auf `page-builders.ts` automatisch `npm run lint` ausfuehrt. Aktuell faengt der existing tsc-Hook bereits Type-Bruch ab, aber Lint-Issues (z.B. unused vars in Builder-Helpers) bleiben unbemerkt bis zum naechsten manuellen Lint-Run.
- Quelle: bestehender Hook-Mechanismus + Erweiterung des existing Skripts

**Empfehlung priorisiert:**

a) **Erweiterung `/measure-vasileios-page` um donut-Detection** — heute war das der primary Friction-Point. Sub-Donuts mit Color-Cluster zu finden ist Boilerplate, der Skill kennt schon den PNG-Pfad und PX-zu-mm-Konversion.

b) **`scripts/render-and-diff.ts`** — wraps die 5-Tool-Sequenz in einem Befehl. Zahlt sich in M5-M13 jeweils 1-2min pro Iteration aus.

c) (3) und (4) sind nice-to-have aber niedrige Prio.

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
