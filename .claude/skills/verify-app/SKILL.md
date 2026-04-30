---
name: verify-app
description: Run the full smoke-test sequence for the SEO Audit App locally — tsc, lint, dev-server health, templates API, optional PDF render. Use BEFORE declaring any milestone "done". Catches schema breaks, lint regressions, dev-server crashes, or template-seed issues in 30 seconds.
---

# verify-app

Du bist gerade dabei zu pruefen ob die SEO-Audit-App lokal stabil laeuft — nach einem Code-Edit, vor einem Commit, oder als Smoke-Test vor "done"-Meldung.

## Schritte

Fuehre folgende Befehle in dieser Reihenfolge aus, jeden via `Bash`. Nach jedem Schritt: bei Fehler STOP und melde welcher Schritt was geliefert hat. Bei Erfolg weiter.

### 1. TypeScript Compile
```bash
cd "/Users/marlinwiethuechter/Projects/shared projects/Vasileios Mavridis/seo-audit-app" && npx tsc --noEmit 2>&1 | tail -30
```
Erwartet: leere Ausgabe oder "Done."

### 2. ESLint
```bash
cd "/Users/marlinwiethuechter/Projects/shared projects/Vasileios Mavridis/seo-audit-app" && npm run lint 2>&1 | tail -10
```
Erwartet: nur Header-Output, keine `error` Lines.

### 3. Dev-Server Health
```bash
curl -s -o /dev/null -w "health=%{http_code} time=%{time_total}s\n" http://localhost:3000/api/health
```
Erwartet: `health=200`. Wenn 500 oder kein Response → Dev-Server muss neu gestartet werden:
```bash
pkill -f "next dev"; cd "/Users/marlinwiethuechter/Projects/shared projects/Vasileios Mavridis/seo-audit-app" && nohup npm run dev > /tmp/seo-dev.log 2>&1 & disown; sleep 8; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health
```

### 4. Templates-API
```bash
curl -s http://localhost:3000/api/templates | head -c 300
```
Erwartet: `{"templates":[{"id":"default","name":"Artistic Avenue Default",...}]}`. Wenn `templates: []` → Seed laeuft nicht:
```bash
cd "/Users/marlinwiethuechter/Projects/shared projects/Vasileios Mavridis/seo-audit-app" && node scripts/seed-default-template.mjs
```

### 5. Optional: Smoke-PDF-Generation
Wenn ein bestehender Audit verfuegbar ist (audit-id im PROGRESS.md notiert), pruefe PDF-Render:
```bash
curl -s -o /tmp/verify-pdf.pdf "http://localhost:3000/api/generate-pdf?auditId=AUDIT_ID_HIER&templateId=default" && pdfinfo /tmp/verify-pdf.pdf | grep -i pages
```
Erwartet: `Pages: 20`.

## Output

Schreibe ein kompaktes Resume:
```
verify-app:
  tsc      ✓
  lint     ✓
  health   ✓ (200)
  templates ✓ (20 pages)
  pdf      ✓ (20 pages, 10KB)  [oder skip wenn keine audit-id]
```
Bei Fehler: zeig die Output-Zeile die kaputt ist + was zu tun ist. Nicht selber "fixen" — nur diagnostisch.
