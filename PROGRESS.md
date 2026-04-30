# Progress Log

Was gebaut wurde, welche Vertraege/Typen entstanden, welche Gotchas auftraten.

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
