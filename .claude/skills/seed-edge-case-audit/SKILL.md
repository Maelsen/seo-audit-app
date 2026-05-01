---
name: seed-edge-case-audit
description: Erzeugt aus einem Base-Audit ein Edge-Case-Audit mit allen milestone-relevanten Arrays geleert (topRisks, comparison.rows, findings etc.). Nutzt /verify-feature um Empty-State-Crashes zu fangen ohne dass das Base-Audit angefasst wird. Args - baseAuditId [milestone]. milestone ist M5|M6|M7|M8|M9|M10|M11|M12|M13|all (Default all).
---

# seed-edge-case-audit

Beim Bauen von Page-Buildern in M5-M13 muss jedes Mal getestet werden ob die Builder mit leeren Arrays sauber rendern (kein "undefined", kein crash, kein broken layout). Manuell ein Audit kopieren und Felder von Hand leeren ist Tipp-Arbeit. Dieser Skill macht das pro Milestone.

## Args

Format: `<baseAuditId> [milestone]`.

- `baseAuditId`: Pflicht. Audit-JSON dessen Inhalte als Source dienen — wird kopiert, dann werden die milestone-relevanten Arrays geleert. Typisch `m5-smoke` oder `m2-smoke`.
- `milestone` (optional, Default `all`): `M5` | `M6` | `M7` | `M8` | `M9` | `M10` | `M11` | `M12` | `M13` | `all`.

Output-Audit wird unter `data/audits/<baseAuditId>-empty-<milestone>.json` gespeichert (oder `<baseAuditId>-empty.json` bei `all`).

## Milestone-zu-Felder-Mapping

| Milestone | Felder die geleert werden |
|---|---|
| M5 | `topRisks=[]`, `comparison.altSentences=[]`, `comparison.rows=[]` |
| M6 | `sections.onpageSeo.findings=[]`, `sections.onpageSeo.actions=[]` |
| M7 | `sections.uxConversion.findings=[]`, `sections.uxConversion.actions=[]`, `sections.uxConversion.heading=""`, `sections.uxConversion.text=""`, `sections.uxConversion.costText=""`, `sections.uxConversion.closingNote=""` |
| M8 | `sections.seitenstrukturContent.findings=[]`, `sections.seitenstrukturContent.actions=[]`, `sections.seitenstrukturContent.comparisonImages=[]` |
| M9 | `sections.lokalesSeo.findings=[]`, `sections.lokalesSeo.actions=[]`, `sections.lokalesSeo.schemaMarkupImage=""` |
| M10 | `sections.leistung.findings=[]`, `sections.leistung.actions=[]`, `sections.leistung.resourceCounts={html:0,js:0,css:0,img:0,other:0,total:0}`, `sections.leistung.pageSizeBreakdown={html:0,js:0,css:0,img:0,other:0}`, numerische Felder auf 0 |
| M11 | `sections.links.findings=[]`, `sections.links.actions=[]`, alle numerischen Links-Felder auf 0 |
| M12 | `phasenplan.phase1.entries=[]`, `phasenplan.phase2.entries=[]`, `phasenplan.phase3.entries=[]` |
| M13 | `recommendations=[]` |
| all | alle obigen kombiniert |

Beispiele:
- `m5-smoke M5` → `m5-smoke-empty-M5.json` mit nur M5-Arrays leer
- `m2-smoke all` → `m2-smoke-empty.json` mit allen Section-Arrays leer

## Schritte

### 1. Voraussetzungen

```bash
BASE_AUDIT="$1"; MILESTONE="${2:-all}"
test -f "data/audits/${BASE_AUDIT}.json" || { echo "FEHLT: data/audits/${BASE_AUDIT}.json"; exit 1; }
case "$MILESTONE" in
  M5|M6|M7|M8|M9|M10|M11|M12|M13|all) ;;
  *) echo "milestone muss eines von M5-M13 oder all sein, war: $MILESTONE"; exit 1;;
esac
```

### 2. Audit kopieren + Felder leeren

Inline-Python via Bash:

```bash
BASE_AUDIT="$1" MILESTONE="${2:-all}" python3 <<'PY'
import json, os, copy

BASE = os.environ["BASE_AUDIT"]
MS = os.environ["MILESTONE"]

src = json.load(open(f"data/audits/{BASE}.json"))
a = copy.deepcopy(src)

# OutputId
suffix = "" if MS == "all" else f"-{MS}"
out_id = f"{BASE}-empty{suffix}"
a["id"] = out_id

# Milestone → field-clearing operations
ops = {
    "M5":  lambda a: (
        a.update({"topRisks": []}),
        a["comparison"].update({"altSentences": [], "rows": []}),
    ),
    "M6":  lambda a: a["sections"]["onpageSeo"].update({"findings": [], "actions": []}),
    "M7":  lambda a: a["sections"]["uxConversion"].update({
        "findings": [], "actions": [],
        "heading": "", "text": "", "costText": "", "closingNote": "",
    }),
    "M8":  lambda a: a["sections"]["seitenstrukturContent"].update({
        "findings": [], "actions": [], "comparisonImages": []
    }),
    "M9":  lambda a: a["sections"]["lokalesSeo"].update({
        "findings": [], "actions": [], "schemaMarkupImage": ""
    }),
    "M10": lambda a: a["sections"]["leistung"].update({
        "findings": [], "actions": [],
        "serverResponseTime": 0, "contentLoadTime": 0, "scriptLoadTime": 0,
        "pageSizeMb": 0,
        "resourceCounts": {"html": 0, "js": 0, "css": 0, "img": 0, "other": 0, "total": 0},
        "pageSizeBreakdown": {"html": 0, "js": 0, "css": 0, "img": 0, "other": 0},
    }),
    "M11": lambda a: a["sections"]["links"].update({
        "findings": [], "actions": [],
        "domainStrength": 0, "pageStrength": 0, "totalBacklinks": 0,
        "referringDomains": 0, "nofollow": 0, "dofollow": 0,
        "subnets": 0, "ips": 0, "govBacklinks": 0,
    }),
    "M12": lambda a: (
        a["phasenplan"]["phase1"].update({"entries": []}),
        a["phasenplan"]["phase2"].update({"entries": []}),
        a["phasenplan"]["phase3"].update({"entries": []}),
    ),
    "M13": lambda a: a.update({"recommendations": []}),
}

milestones = [MS] if MS != "all" else ["M5","M6","M7","M8","M9","M10","M11","M12","M13"]
for m in milestones:
    ops[m](a)

out_path = f"data/audits/{out_id}.json"
json.dump(a, open(out_path, "w"), ensure_ascii=False, indent=2)
print(f"Wrote {out_path}")
print(f"Cleared milestones: {', '.join(milestones)}")
PY
```

### 3. Smoke-Render

Optional: PDF rendern um Crash-Test zu bestaetigen. Default-Template wird oft genug benutzt.

```bash
BASE_AUDIT="$1" MILESTONE="${2:-all}"
suffix=""; [ "$MILESTONE" != "all" ] && suffix="-$MILESTONE"
OUT_ID="${BASE_AUDIT}-empty${suffix}"
curl -sS -o "/tmp/${OUT_ID}.pdf" \
  "http://localhost:3000/api/generate-pdf?auditId=${OUT_ID}&templateId=default" \
  -w "PDF: HTTP %{http_code} %{size_download} bytes\n"
```

Wenn HTTP 200 + size > 100 KB: Builder uebersteht den Empty-Case.
Wenn 500: Empty-Case crasht — lokal in Builder pruefen.

### 4. Output

```
seed-edge-case-audit:
  base:      data/audits/m5-smoke.json
  milestone: M5
  output:    data/audits/m5-smoke-empty-M5.json
  cleared:   topRisks, comparison.altSentences, comparison.rows
  smoke:     PDF 200, 1014 KB → kein Empty-Case-Crash ✓
```

### 5. Cleanup

Nicht automatisch — die Edge-Audits sind klein (10-50 KB) und gitignored. User kann sie manuell loeschen mit `rm data/audits/<base>-empty*.json`.

## Wann nutzen

- VOR jedem `/verify-feature` Run am Milestone-Ende — fuer den Edge-Case-Check
- Wenn ein neuer Page-Builder eingefuehrt wird und Bedenken bestehen ob er Null-Inputs sauber handhabt
- Beim Code-Review eines BlockView wenn das Empty-Verhalten unklar ist

## Hinweis

Der Skill leert NUR Felder die der Milestone bedient. `audit.url`, `audit.overallScore`, `audit.screenshots` etc. bleiben befuellt — sonst wuerden Cover-Page und Gesamtsituation auch leer rendern und der Edge-Test wuerde mehr testen als noetig.

Wenn ein neuer Milestone Mxx hinzukommt: Mapping-Tabelle oben + `ops`-Dict im Python-Code erweitern.
