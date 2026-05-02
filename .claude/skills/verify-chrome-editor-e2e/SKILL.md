---
name: verify-chrome-editor-e2e
description: Klickt im Chrome-Browser jeden Block eines Templates an, liest dessen Inspector-Werte und vergleicht sie mit der Backend-JSON. Wraps die manuelle Editor-E2E-Sequenz aus M3 (Block selektieren, Inspector pruefen, Save, Reload, Persistenz). Args - templateId [auditId]. Setzt voraus dass next dev laeuft und claude-in-chrome MCP verfuegbar ist.
---

# verify-chrome-editor-e2e

Automatisiert die "manuell jeden Block durchklicken" Verifikation die in M3 ~30min gedauert hat. Output: ✓/✗ pro Block, Console-Errors, Save+Reload-Persistenz.

## Args

Format: `<templateId> [auditId]`.

- `templateId`: Pflicht, z.B. `m3-chrome`, `default`, `m2-edges`
- `auditId`: Optional, Default `m2-smoke`. Wird fuer den `?auditId=...` Query-Param gebraucht damit Bindings aufgeloest werden.

Beispiele:
- `m3-chrome` → vergleicht alle 5 Chrome-Blocks gegen JSON
- `default m2-smoke` → 20 Pages, prueft pro Page die ersten 1-2 Blocks (Default-Template ist groesser, voll-Sweep ist teurer)
- `m2-edges m2-edges` → drei Edge-Pages

## Voraussetzungen

```bash
cd "/Users/marlinwiethuechter/Projects/shared projects/Vasileios Mavridis/seo-audit-app"
test -f "data/templates/${TEMPLATE_ID}.json" || { echo "Template fehlt"; exit 1; }
test -f "data/audits/${AUDIT_ID:-m2-smoke}.json" || { echo "Audit fehlt"; exit 1; }
curl -s -o /dev/null -w "health=%{http_code}\n" http://localhost:3000/api/health
```

claude-in-chrome MCP muss aktiv sein. Bevor du `mcp__claude-in-chrome__*` Tools nutzt, lade sie via ToolSearch (z.B. `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__find,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__browser_batch`).

## Schritte

### 1. Block-Liste aus Backend lesen

```bash
TEMPLATE_ID="$1"
AUDIT_ID="${2:-m2-smoke}"
python3 -c "
import json
t = json.load(open(f'data/templates/${TEMPLATE_ID}.json'))
print(f'pages={len(t[\"pages\"])}, height={t[\"pages\"][0][\"height\"]}')
for pi, page in enumerate(t['pages']):
    for b in page['blocks']:
        f = b['frame']
        print(f'  page{pi+1} | {b[\"id\"]:32} | {b[\"type\"]:18} | x={f[\"x\"]} y={f[\"y\"]} w={f[\"w\"]} h={f[\"h\"]} z={b[\"zIndex\"]}')
"
```

Notiere die Block-Liste (id, type, frame). Diese sind die "Erwartung" gegen die der Inspector geprueft wird.

### 2. Editor in Chrome oeffnen

```
mcp__claude-in-chrome__tabs_context_mcp createIfEmpty=true
# Tab-ID notieren oder neuen anlegen
mcp__claude-in-chrome__tabs_create_mcp
mcp__claude-in-chrome__navigate url="http://localhost:3000/editor/${TEMPLATE_ID}?auditId=${AUDIT_ID}" tabId=...
mcp__claude-in-chrome__computer action=wait duration=3 tabId=...
mcp__claude-in-chrome__computer action=screenshot tabId=...
```

Erster Sanity-Check aus dem Screenshot:
- Sidebar zeigt `pages` Pages (Anzahl matcht JSON)
- Canvas zeigt erste Page mit erwarteten Blocks
- Keine 500-Error-Page, kein leerer Bildschirm

### 3. Pro Block: anklicken + Inspector lesen

**Robuster Pfad: clickBlock-Helper** — dispatchEvent oder synthetic clicks gehen am Editor-Pointer-Layer vorbei. Stabil ist nur `computer.left_click` mit echten Pixel-Koordinaten. Der Helper unten liest aus dem DOM die Viewport-Pixel-Mitte des Block-Frames + scrollt ihn in den View und gibt `{x, y}` zurueck — die du dann an `computer.left_click` reichst:

```javascript
// In claude-in-chrome javascript_tool ausfuehren — gibt JSON {ok, x, y, page, frame_mm}
((blockId) => {
  const el = document.querySelector(`[data-block-id="${blockId}"]`);
  if (!el) return JSON.stringify({ok: false, reason: "block not in DOM (wrong page?)"});
  // Scroll into view falls noetig (block evtl unter dem Fold)
  el.scrollIntoView({block: "center", inline: "center", behavior: "instant"});
  const r = el.getBoundingClientRect();
  // Wenn Block 0-size hat (degenerate frame), als Fehler melden
  if (r.width < 2 || r.height < 2) return JSON.stringify({ok: false, reason: `degenerate frame ${r.width}x${r.height}`});
  return JSON.stringify({
    ok: true,
    x: Math.round(r.left + r.width / 2),
    y: Math.round(r.top + r.height / 2),
    width: Math.round(r.width),
    height: Math.round(r.height),
  });
})("ssc1-section-heading")
```

Dann `computer.left_click` an diesen Pixel-Koordinaten:

```
mcp__claude-in-chrome__computer action=left_click coordinate=[x, y] tabId=...
```

Per `browser_batch` kannst du den javascript_tool Read + den Click in einem Round-Trip machen (Helper liefert Koords, Click nutzt sie als Vorgabe). Wenn `block not in DOM` zurueckkommt: erst die richtige Page in der Sidebar selektieren (Click auf Page-Button), dann erneut Helper aufrufen.

**Alternative `find`-Pfad (wenn der Block-Type sichtbaren Text hat):**

```
mcp__claude-in-chrome__find query="text containing 'Seitenstruktur & Content'" tabId=...
mcp__claude-in-chrome__computer action=left_click ref="${REF}" tabId=...
```

`find` ist gut fuer Buttons / Headlines mit eindeutigem Text. Fuer leere Frames (Image-Stubs, gebundene Bloecke ohne sichtbaren Text) braucht es den clickBlock-Helper.

c) Inspector-Werte lesen — schnell per JS aus dem rechten Panel:

```javascript
new Promise(r => setTimeout(r, 250)).then(() => {
  const p = Array.from(document.querySelectorAll('div')).find(
    d => d.offsetWidth > 280 && d.offsetWidth < 350 && d.offsetHeight > 400
         && (d.innerText || '').includes('POSITION')
  );
  if (!p) return JSON.stringify({ok: false, reason: "inspector not visible"});
  const txt = p.innerText || '';
  // "<type> · <blockId>" header — z.B. "text · ssc1-section-heading"
  const blockMatch = txt.match(/(\w+) · ([\w-]+)/);
  // Selected option pro <select> (font, weight, align, binding-label)
  const selects = Array.from(p.querySelectorAll('select')).map(
    s => s.options[s.selectedIndex]?.textContent
  );
  return JSON.stringify({ok: true, blockHeader: blockMatch?.[0], selects});
})
```

Output-Beispiel: `{"ok":true,"blockHeader":"text · ssc1-section-heading","selects":["Poppins","700","left","Seitenstruktur - Heading"]}`. Vergleiche gegen Erwartung aus Schritt 1.

**Kritisch fuer Binding-Pruefung:** Der LETZTE Eintrag in `selects` ist das Binding-Label. Falls dort `(statisch)` steht obwohl der Builder ein audit-Binding setzt, ist es der M7-closingNote-Bug — Catalog-Eintrag fehlt in `binding-catalog.ts`. Der `binding-catalog-consistency` PostToolUse-Hook faengt das normalerweise schon zur Edit-Time, aber dieser E2E-Check ist die zweite Verteidigungslinie.

d) Block-spezifische Felder:
- `text`: TEXT-Field mit staticText, fontSize, fontWeight, color, textAlign, lineHeight
- `shape`: Form (Rechteck/Ellipse/Linie), Fill
- `image` / `brandDecoration`: kein extra Inspector-Block, aber Bilder muessen geladen sein
- `arrowBulletList` / `comparisonTable` / `pieChart`: kein Custom-Inspector heute (siehe M2 Caveat)

### 4. Drag-Sanity-Check (optional, nur fuer 1-2 Blocks)

```
# nach Block-Selection von oben:
mcp__claude-in-chrome__computer action=left_click_drag start_coordinate=[bx, by] coordinate=[bx+50, by+50] tabId=...
mcp__claude-in-chrome__computer action=wait duration=1 tabId=...
mcp__claude-in-chrome__computer action=screenshot tabId=...
```

Erwartet: Inspector X/Y haben sich um ~13mm geaendert (50px / Canvas-mm-zu-px), Block visuell verschoben.

Danach Reload (siehe naechster Schritt) verwirft den Drag — gut fuer Test, schlecht fuer User-Experience wenn er gerade Save vermisst.

### 5. Save + Reload + Persistenz

```
# Save-Button finden + klicken
mcp__claude-in-chrome__find query="Speichern button in editor toolbar" tabId=...
mcp__claude-in-chrome__computer action=left_click ref="${SAVE_REF}" tabId=...
mcp__claude-in-chrome__computer action=wait duration=2 tabId=...
mcp__claude-in-chrome__computer action=screenshot tabId=...
# Erwartet: Button-Text "Gespeichert"

# Reload
mcp__claude-in-chrome__navigate url="http://localhost:3000/editor/${TEMPLATE_ID}?auditId=${AUDIT_ID}" tabId=...
mcp__claude-in-chrome__computer action=wait duration=3 tabId=...

# JSON nach reload lesen + mit pre-save vergleichen
python3 -c "import json; t=json.load(open('data/templates/${TEMPLATE_ID}.json')); print('blocks:', sum(len(p['blocks']) for p in t['pages']))"
```

### 6. Console-Errors

```
mcp__claude-in-chrome__read_console_messages pattern="error|Error|fail|Fail|500|warn" tabId=... limit=50
```

Erwartet: Nur React-DevTools-Info und HMR-Connect-Logs. Keine `[error]` oder `[fail]` Zeilen aus dem App-Code.

## Output

Tabelle pro Block + Summary:

```
Template: m3-chrome (1 page, 5 blocks)

Block                          Type             JSON                     Inspector                Match
chrome-logo                    brandDecoration  20.6/10.2 16.7x13.7      20.6/10.2 16.7x13.7      ✓
chrome-title                   text             140/11.5 60x6.5 fs=16    140/11.5 60x6.5 fs=16    ✓
chrome-url                     text             138/17 64x5 fs=9         138/17 64x5 fs=9         ✓
chrome-footer-stripe-1         shape            0/291.42 210x2.03        0/291.42 210x2.03        ✓
chrome-footer-stripe-2         shape            0/294.34 210x2.03        0/294.34 210x2.03        ✓

Drag-Test: chrome-logo X 20.6→48.12 ✓
Save → Speichern (button feedback "Gespeichert") ✓
Reload → JSON unveraendert (5 blocks persisted) ✓
Console: clean (nur HMR + React-DevTools-Info)

Editor E2E: 5/5 blocks match, 0 console errors. PASS.
```

Bei Fehler: zeige genauen Drift (z.B. `chrome-logo: JSON x=20.6 vs Inspector x=20.7`), Console-Error-Lines, Screenshot-Refs.

## Wann nutzen

- Nach jedem Page-Builder-Update in M4-M13, BEVOR der Builder als "fertig" abgehakt wird
- Wenn unsicher ob ein neuer Block-Type im Editor sauber selektierbar ist (Custom-Inspector-Caveat)
- Vor jedem Commit der `page-builders.ts` aendert

## Hinweise

- Setzt `next dev` voraus (Health 200). Wenn nicht: erst `verify-app` Skill.
- Setzt voraus dass das Template existiert und Blocks gerendert werden. Bei `templateId=default` mit 20 leeren Page-Shells gibt es auf Page 1 (Cover) nichts zu klicken — dann skip Drag/Inspector pro Page und teste nur dass alle 20 Pages in der Sidebar erscheinen.
- Drag-Test loescht beim Reload den unsaved State (gewollt). Wenn der State persistiert werden soll: Save VOR Reload.
- Custom-Property-Inspector-Felder (fuer arrowBulletList/comparisonTable/pieChart) existieren heute nicht — pruefe nur die Standard-Felder (id, type, frame, zIndex).
- Bei großen Templates (`default` mit 20 Pages, viele Blocks pro Page in M4+) wird der Skill langsam. Dann pro Page nur die ersten 1-2 Blocks pruefen, oder als Argument einen Page-Range erlauben (Erweiterung).
