---
name: seed-vasileios-audit
description: Erzeugt ein Audit-JSON mit den exakten Vasileios Waschbär-Service Texten pro Milestone. Spart manuelle Python-Skripte beim Visual-Diff gegen Vasileios' Referenz-PDF. Args - auditId [milestone]. milestone ist M5|M6|M7|M8|M9|M10|M11|M12|M13|all (Default all).
---

# seed-vasileios-audit

Beim Visual-Diff App-PDF vs. Vasileios' Referenz-PDF brauchen wir ein Audit das die EXAKTEN Vasileios-Texte enthaelt — sonst vergleicht man Apfel mit Birne. Der echte AI-Agent fuellt diese Felder leer (siehe M1-Gap), also muss manuell gefuellt werden. Dieser Skill kippt die Vasileios-Daten pro Milestone in ein Audit.

## Args

Format: `<auditId> [milestone]`.

- `auditId`: Pflicht. Output-Audit-ID, z.B. `vasileios-m5` oder `vasileios-full`. Wird unter `data/audits/<auditId>.json` gespeichert (ueberschreibt wenn existiert).
- `milestone` (optional, Default `all`): `M5` | `M6` | `M7` | `M8` | `M9` | `M10` | `M11` | `M12` | `M13` | `all`. `all` wendet alle bisher verfuegbaren Milestones an.

## Verfuegbare Milestone-Daten

| Milestone | Daten enthalten | Quelle |
|---|---|---|
| M5 | `topRisks` (3), `comparison.altSentences` (3), `comparison.rows` (7) | Vasileios SEO AUDIT WASCHBÄR SERVICE.pdf, Pages 3-4 |
| M6 | `sections.onpageSeo.*` (heading/text/findings(11)/costText/actions(5)/serpPreview/h2h6Frequency) | Pages 5-6 |
| M7 | `sections.uxConversion.*` (heading/text/findings(12)/costText/actions(6)/closingNote) | Pages 7-8 |
| M8 | `sections.seitenstrukturContent.*` (heading/text/findings(8)/costText/actions(4)/closingNote) | Pages 9-10 |
| M9-M13 | TODO — Daten ergaenzen wenn der Milestone gebaut wird | dito |

Wenn ein nicht-implementierter Milestone angefragt wird: Skript warnt + ueberspringt, statt zu crashen.

## Schritte

### 1. Voraussetzungen

```bash
test -f data/audits/m2-smoke.json || { echo "FEHLT: data/audits/m2-smoke.json"; exit 1; }
test -f scripts/seed-vasileios-audit.ts || { echo "FEHLT: scripts/seed-vasileios-audit.ts"; exit 1; }
```

### 2. Skript aufrufen

```bash
npx tsx scripts/seed-vasileios-audit.ts <auditId> [milestone]
```

Beispiel:

```bash
npx tsx scripts/seed-vasileios-audit.ts vasileios-m8 M8
```

Output:

```
Wrote /…/data/audits/vasileios-m8.json
Applied milestones: M8
```

Bei `all` ohne implementierte M9-M13:

```
Wrote /…/data/audits/vasileios-full.json
Applied milestones: M5, M6, M7, M8
Skipped (no data yet): M9, M10, M11, M12, M13
```

### 3. Smoke-Render (optional)

```bash
curl -sS -o "/tmp/<auditId>.pdf" \
  "http://localhost:3000/api/generate-pdf?auditId=<auditId>&templateId=default" \
  -w "PDF: HTTP %{http_code} %{size_download} bytes\n"
```

## Wann nutzen

- VOR `/visual-diff-against-vasileios` damit das App-PDF die gleichen Texte zeigt wie die Referenz
- Wenn `/verify-feature` ein Audit mit Vasileios-Inhalten braucht (statt m2-smoke das zufaellige Texte hat)
- Beim Page-Builder-Bau, sobald die Empty-Variante (`/seed-edge-case-audit`) durch ist und die Real-Daten-Variante getestet werden soll

## Wie M9-M13 ergaenzt werden

Wenn der naechste Milestone gebaut wird:

1. Vasileios-Texte aus dem Quell-PDF (`docs/measurements/page-NN.png` visuell ablesen oder per `pdftotext` extrahieren)
2. In `scripts/seed-vasileios-audit.ts` im `DATA` Object einen neuen Key fuer den Milestone hinzufuegen
3. Nested struktur entsprechend dem AuditData-Type halten (siehe `src/lib/types.ts`)
4. Skript-Aenderung committen — beim naechsten Mal wird der Milestone aus `all` mit beruecksichtigt
5. Tabelle oben in dieser SKILL.md ebenfalls um eine Zeile ergaenzen

## Hinweis

Das Skript nutzt `data/audits/m2-smoke.json` als Geruest. Wenn m2-smoke geloescht wird oder schema-incompatible wird: Voraussetzung-Step schlaegt fehl mit klarer Meldung. Optional koennte stattdessen ein "blank scaffold" gebaut werden, aber m2-smoke hat alle Section-Shells und ist stabil seit M2.

Reibungspunkt vor dem Refactor (M8): Der Skill hatte einen Inline-Python-Block mit `AUDIT_ID="$1"` — der Skill-Args-Resolver loeste `$1` aber nicht zuverlaessig auf, sodass der Aufruf `vasileios-m8 M8` als `AUDIT_ID="M8"` ankam. Mit `process.argv` im TS-Skript ist das deterministisch.
