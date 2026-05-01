---
name: verify-feature
description: Harte 100%-Verifikation der gerade gebauten Funktion - keine Lücken, keine Platzhalter, keine "ich nehme an"-Stellen. Geht durch Compile, Backend-APIs, Frontend-UI in Chrome, Persistenz, Lücken-Scan und Production. Vor JEDEM "done" laufen lassen. Tiefer als /verify-app.
---

# verify-feature

Pflicht-Verifikation einer gerade gebauten Funktion. Ich gehe alle Schichten durch (Code, API, Browser-UI, Lücken-Scan) und melde am Ende ehrlich was getestet wurde und was nicht. Kein "ich nehme an" — nur was ich tatsaechlich gesehen habe.

Wenn der User diesen Skill aufruft, BIN ICH IM HARDCORE-MODUS. Anti-Pattern (verboten): "kompiliert sauber" als Beweis, "Health 200" als Production-Verifikation, "API gibt 200" ohne UI-Check, "ich nehme an dass es geht" — beweisen, nicht annehmen.

## Pflicht-Checks (alle, in dieser Reihenfolge)

### 1. Code-Health

```bash
npx tsc --noEmit          # muss clean sein
npm run lint              # muss clean sein
```

Wenn rot: stop, fix, retry. Nicht weiterarbeiten mit roten Compile-Fehlern.

### 2. Lücken-Scan (KRITISCH)

Suche im aktuellen Diff/in allen geaenderten Files nach:

```bash
# TODO/FIXME/XXX als Beweis dass was unfertig ist
git diff --name-only main HEAD | xargs grep -nE "TODO|FIXME|XXX|HACK|console\.log\(" 2>/dev/null

# Platzhalter-Strings die ich vergessen haben koennte
git diff --name-only main HEAD | xargs grep -nE "lorem ipsum|placeholder|tbd|coming soon|test.test|foo bar|asdf" -i 2>/dev/null

# Hardcoded localhost / dev URLs
git diff --name-only main HEAD | xargs grep -nE "localhost:3000|127\.0\.0\.1" 2>/dev/null

# Auskommentierter Code (Reste)
git diff --name-only main HEAD | xargs grep -nE "^[[:space:]]*//.*(TODO|fix|temp)" 2>/dev/null
```

Jeder Fund: explizit beim Verify-Bericht als ⚠️ benennen UND fixen oder dokumentieren warum es bleiben darf.

### 3. Dev-Server stabil

```bash
curl -s http://localhost:3000/api/health      # 200 = ok
pgrep -f "next dev" | head -3                 # process laeuft
```

Bei Schema-Aenderungen: wenn dev-Server in 500-State ist, Restart noetig. Nicht testen mit halb-laufendem Server.

### 4. Backend-APIs

Alle Endpoints die die Funktion betreffen mit echten Daten anpingen:

- `GET /api/templates/{id}` — Template laedt
- `PATCH /api/templates/{id}` — Save funktioniert, persistiert auf Disk
- `GET /api/audit/{id}` — Audit-JSON komplett
- `GET /api/generate-pdf?...` — PDF rendert (200, content-length sinnvoll)
- ggf. weitere

Per `curl` aufrufen, Status-Code + Response-Shape pruefen. Nicht nur 200, sondern Body-Shape. Bei 500: fix.

### 5. Frontend-UI in Chrome (PFLICHT, NICHT optional)

Ich nutze die `mcp__claude-in-chrome__*` Tools um SELBST durchzuklicken:

- Editor-Page laden, Screenshot
- Block selektieren, Inspector zeigt korrekte Werte
- Drag/Resize testen, Live-Update sichtbar
- Save-Button klicken
- Reload, schauen ob Aenderung persistiert (UI + JSON)
- Console-Errors lesen (`read_console_messages` mit pattern `error|Error`)

Niemals den User fragen "magst du mal kurz draufklicken". Default ist: ich klicke selber.

### 6. Visuelle Verifikation

- PDF generieren → `pdftoppm -r 200` → PNGs lesen mit Read-Tool
- Pixel-Vermessung mit Python+PIL gegen Vasileios-Referenz wenn relevant
- Im Browser: Screenshots der relevanten Pages

### 7. Persistenz

- Save → Reload → Daten bleiben? (Editor + API-Response)
- Volume-Konsistenz: schreibt es in `data/templates/` etc?

### 8. Production (mit Auth-Frage wenn noetig)

- `curl https://seo-audit-app-production-578b.up.railway.app/api/health` → 200
- Tieferes Production-Testing braucht BASIC_AUTH_PASS — wenn relevant fuer das Feature: User kurz nach Passwort fragen, nicht skippen.

### 9. Edge-Cases

- Empty input, max input, missing fields
- Concurrent operations falls relevant
- Long-running operations falls relevant

## Output-Format

Am Ende einen kompakten Bericht mit dieser Struktur:

```
verify-feature: <feature-name>

✓ Code-Health        tsc clean / lint clean
✓ Luecken-Scan       0 TODOs/FIXMEs/Platzhalter im Diff (oder: 1 TODO geblieben - dokumentiert weil ...)
✓ Dev-Server         /api/health 200, next-dev pid X
✓ Backend-APIs       4/4 endpoints (auflisten)
✓ Frontend-UI        Editor laedt, Block-Click → Inspector korrekt, Drag funktioniert, Save+Reload persistiert
✓ Visuelle           PDF rendert, gegen Vasileios-Referenz <0.3mm Drift
✓ Persistenz         Save→Reload behaelt Werte
⚠ Production         /api/health 200, deep-test blockiert auf BASIC_AUTH_PASS (gleiche Linie wie M1+M2)
✓ Edge-Cases         Empty input gepruerft

VERDIKT: 100% verified / X Luecken zu fixen
```

Wenn auch nur EIN Punkt ⚠ oder ✗ ist: KEIN "done", sondern weiterarbeiten oder explizit dokumentieren warum diese Luecke akzeptabel ist.

## Wann nutzen

- VOR jedem "M3 fertig" / "Feature done" / "Milestone abgeschlossen"
- Nach groesseren Refactors
- Vor Production-Deploys
- Wenn User explizit fragt "ist das wirklich fertig?"

## Beziehung zu existing Skills

- `/verify-app` ist der schnelle Smoke-Check (tsc + lint + health + templates-API). Gut fuer Zwischenchecks waehrend des Bauens.
- `/verify-feature` (dieser Skill) ist der vollstaendige E2E-Check inkl. Browser. Fuer den finalen "done"-Moment.

Beide ergaenzen sich, sind nicht redundant.
