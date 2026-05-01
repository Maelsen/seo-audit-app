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
| M6-M13 | TODO — Daten ergaenzen wenn der Milestone gebaut wird | dito |

Wenn ein nicht-implementierter Milestone angefragt wird: Skill warnt + ueberspringt, statt zu crashen.

## Schritte

### 1. Voraussetzungen

```bash
AUDIT_ID="$1"; MILESTONE="${2:-all}"
test -n "$AUDIT_ID" || { echo "auditId fehlt"; exit 1; }
case "$MILESTONE" in
  M5|M6|M7|M8|M9|M10|M11|M12|M13|all) ;;
  *) echo "milestone muss eines von M5-M13 oder all sein, war: $MILESTONE"; exit 1;;
esac
# Base-Audit laden — wir nehmen m2-smoke als Geruest (hat alle Section-Shells)
test -f data/audits/m2-smoke.json || { echo "FEHLT: data/audits/m2-smoke.json"; exit 1; }
```

### 2. Audit aus m2-smoke ableiten + Vasileios-Texte einkippen

```bash
AUDIT_ID="$1" MILESTONE="${2:-all}" python3 <<'PY'
import json, os, copy

AID = os.environ["AUDIT_ID"]
MS = os.environ["MILESTONE"]

src = json.load(open("data/audits/m2-smoke.json"))
a = copy.deepcopy(src)
a["id"] = AID
a["url"] = "https://www.waschbaer-service.de"
a["projectName"] = "Waschbär Service"

# Milestone-Daten
DATA = {
    "M5": {
        "topRisks": [
            {
                "title": "Die Seite führt Besucher nicht – sie lässt sie treiben",
                "description": "Wer auf eure Startseite kommt sieht zuerst einen Cookie-Banner der das halbe Display einnimmt, dann allgemeine Informationen – aber keinen klaren Grund anzurufen. Kein auffälliger Button, keine Telefonnummer im sichtbaren Bereich, keine Bewertungen beim ersten Eindruck. Der Traffic ist da. Die Anfragen bleiben aus."
            },
            {
                "title": "Google vertraut deiner Seite kaum",
                "description": "3 Backlinks von 2 Domains. Kein lokales Schema-Markup. Kein Identity-Schema. Google Reviews sind vorhanden aber werden nicht auf der Website eingebunden – nur ein externer Link führt zum GBP. Das bedeutet: Google sieht eine Seite ohne externe Bestätigung, ohne strukturierte Daten und ohne klares Autoritätssignal. In umkämpften Suchanfragen verlierst du damit gegen Wettbewerber die diese Basics gesetzt haben – unabhängig davon wie gut dein Service ist."
            },
            {
                "title": "Dein Content ist überall, aber nirgendwo stark genug",
                "description": "Stadtseiten existieren, aber sie sind reines Keyword-Stuffing ohne echten Mehrwert für den Leser. Die Dienstleistungsseiten haben keine Painpoints, keine konkreten Beispiele, kein spezifisches FAQ. Das gleiche FAQ steht auf jeder einzelnen Seite. Google erkennt Duplicate Content und stuft diese Seiten entsprechend niedrig ein. Du hast die Struktur, aber nicht die Substanz."
            },
        ],
        "comparison": {
            "heading": "Wo du heute stehst – wo du in 3 Monaten sein könntest",
            "altSentences": [
                {
                    "aspect": "Statt einer Seite die Besucher treiben lässt",
                    "vision": "Eine Hero-Section mit einer Kernbotschaft die einen Painpoint trifft – „Zuverlässige Gebäudereinigung in Warendorf – ohne Ausfälle, ohne Erklärungsaufwand, mit festem Ansprechpartner.\" Darunter direkt Social Proof und ein CTA der Verbindlichkeit schafft."
                },
                {
                    "aspect": "Statt einer Seite der Google kaum vertraut",
                    "vision": "Schema-Markup gesetzt, Reviews direkt auf der Startseite eingebunden, erste Backlinks aus lokalen Quellen aufgebaut. Google ordnet dich eindeutig ein und zeigt dich häufiger."
                },
                {
                    "aspect": "Statt Stadtseiten die wie Keyword-Stuffing klingen",
                    "vision": "Jede Stadtseite spricht ein konkretes Problem an, hat ein eigenes seitenspezifisches FAQ und gibt Google genug Substanz zum Ranken. Gleiches gilt für alle Dienstleistungsseiten."
                },
            ],
            "rows": [
                {"problem": "Nutzerführung Startseite",       "today": "Unklar, kein roter Faden", "future": "Klarer Funnel mit Ziel"},
                {"problem": "Lokale Rankings",                "today": "Vereinzelt",               "future": "Stabil Top 5 in der Region"},
                {"problem": "Domain-Autorität",               "today": "Minimal",                  "future": "Erste externe Signale"},
                {"problem": "Content-Qualität Unterseiten",   "today": "Dünn & austauschbar",      "future": "Spezifisch & rankingfähig"},
                {"problem": "Google Reviews sichtbar",        "today": "Nur externer Link",        "future": "Direkt auf der Startseite"},
                {"problem": "Stadtseiten-Qualität",           "today": "Keyword-Stuffing",         "future": "Echte Landingpages"},
                {"problem": "Mobile Ladezeit",                "today": "13 Sekunden",              "future": "Unter 3 Sekunden"},
            ],
        },
    },
    # M6-M13: noch nicht erfasst. Pro Milestone hier ergaenzen wenn der Builder gebaut wird.
    # Format pro Milestone:
    #   "M6": { "sections": { "onpageSeo": { "findings": [...], "actions": [...], "costText": "..." } } }
}

milestones = [MS] if MS != "all" else ["M5","M6","M7","M8","M9","M10","M11","M12","M13"]
applied = []
skipped = []
for m in milestones:
    if m not in DATA:
        skipped.append(m)
        continue
    # Deep merge data into audit
    def deep_merge(dst, src):
        for k, v in src.items():
            if isinstance(v, dict) and isinstance(dst.get(k), dict):
                deep_merge(dst[k], v)
            else:
                dst[k] = v
    deep_merge(a, DATA[m])
    applied.append(m)

out_path = f"data/audits/{AID}.json"
json.dump(a, open(out_path, "w"), ensure_ascii=False, indent=2)
print(f"Wrote {out_path}")
print(f"Applied milestones: {', '.join(applied) if applied else '(none)'}")
if skipped:
    print(f"Skipped (no data yet): {', '.join(skipped)}")
PY
```

### 3. Smoke-Render

```bash
AUDIT_ID="$1"
curl -sS -o "/tmp/${AUDIT_ID}.pdf" \
  "http://localhost:3000/api/generate-pdf?auditId=${AUDIT_ID}&templateId=default" \
  -w "PDF: HTTP %{http_code} %{size_download} bytes\n"
```

### 4. Output

```
seed-vasileios-audit:
  output:    data/audits/vasileios-m5.json
  applied:   M5
  skipped:   (none)
  smoke:     PDF 200, 1018 KB
```

## Wann nutzen

- VOR `/visual-diff-against-vasileios` damit das App-PDF die gleichen Texte zeigt wie die Referenz
- Wenn `/verify-feature` ein Audit mit Vasileios-Inhalten braucht (statt m2-smoke das zufaellige Texte hat)
- Beim Page-Builder-Bau, sobald die Empty-Variante (`/seed-edge-case-audit`) durch ist und die Real-Daten-Variante getestet werden soll

## Wie M6-M13 ergaenzt werden

Wenn der naechste Milestone gebaut wird:

1. Vasileios-Texte aus dem Quell-PDF (`docs/measurements/page-NN.png` visuell ablesen oder per `pdftotext` extrahieren)
2. Im DATA-Dict im Python-Block oben einen neuen Key fuer den Milestone hinzufuegen
3. Nested struktur entsprechend dem AuditData-Type halten (siehe `src/lib/types.ts`)
4. Skill committen — beim naechsten Mal wird der Milestone aus `all` mit beruecksichtigt

## Hinweis

Der Skill nutzt m2-smoke als Geruest. Wenn m2-smoke geloescht wird oder schema-incompatible wird: Voraussetzung-Step schlaegt fehl mit klarer Meldung. Optional koennte stattdessen ein "blank scaffold" gebaut werden, aber m2-smoke hat alle Section-Shells und ist stabil seit M2.
