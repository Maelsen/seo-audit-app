# SEO Audit App (Artistic Avenue)

Interner Tool-Prototyp. Audit-Pipeline + PDF-Report + AI-Editor.

## Lokal starten

```bash
npm install
cp .env.example .env.local    # ANTHROPIC_API_KEY eintragen
npm run dev
```

Oeffnet auf http://localhost:3000

## Live-Umgebung (Railway)

Die Live-URL laeuft **`next dev`** mit HMR, damit der eingebaute AI-Agent
Code-Aenderungen ohne Rebuild sofort live zeigen kann (wie Lovable/Bolt).

Noetige Env-Vars auf Railway:

| Var | Zweck |
|---|---|
| `ANTHROPIC_API_KEY` | Claude-Zugriff (Agent + Audit-Pipeline) |
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` | Browser-Login-Dialog schuetzt die Seite |
| `ENABLE_GIT_SYNC` | `1` auf Railway (nicht lokal!) |
| `GITHUB_PAT` | Fine-grained PAT mit `Contents: read/write` aufs Repo |
| `GITHUB_REPO` | `owner/repo` |
| `NODE_ENV` | `development` (explizit, fuer HMR) |

Volume: `/app/data` (persistent, enthaelt Audits, Templates, Uploads, Agent-Chats, Backups).

## Agent

- Floating-Button unten rechts auf jeder Seite
- Kann Dateien lesen/schreiben/editieren/loeschen (mit Backup + Undo)
- Vision (Screenshot per Paste)
- Auf Railway: kann mit `git_sync` den aktuellen Stand nach GitHub pushen
- Cron pusht zusaetzlich alle 6h automatisch als Backup

## Scripts

```
npm run dev              # lokal
npm run start:railway    # Production-ish auf Railway (next dev + git-cron parallel)
npm run build            # Nur fuer lokale Validierung
```
