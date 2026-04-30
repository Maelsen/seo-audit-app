# Progress Log

Was gebaut wurde, welche Vertraege/Typen entstanden, welche Gotchas auftraten.

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

1. POST `/api/upload` mit homeraum-immobilien.de → Audit erstellt (auditId persistiert), Screenshots cover/mobile/tablet, PageSpeed 46/43
2. GET `/api/audit/{id}` → JSON enthaelt alle 6 neuen Sections, comparison{}, phasenplan{}, diagnosisText, KEIN usability/social
3. GET `/audit/{id}` (UI) → Audit-Review-Page rendert: Gesamt, Top 3 Risiken, Empfehlungen, On-Page SEO, UX & Conversion, Seitenstruktur & Content, Lokales SEO, Performance & Technisches, Links & Autoritaet, Tipp fürs nächste Mal — exakt 6 Section-Cards
4. POST `/api/analyze` → Anthropic-Agent laeuft 175s durch, Output-Validation gegen Zod gruen, 18 Empfehlungen, 3 Top-Risiken, alle 6 Sub-Scores gesetzt
5. GET `/api/generate-pdf?auditId=...&templateId=default` → PDF 200, 10KB (20 leere Pages, blocks-arrays leer wie erwartet bis M3-M13)
6. GET `/editor/default` (mit Audit-Context) → Editor zeigt alle 20 Pages-Sidebar, Canvas leer (Cover hat 0 Bloecke)
7. POST `/api/agent/chat` mit Editor-Context → Agent liest Template via `read_file`, antwortet korrekt nach 5s, 2 Iterationen



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
