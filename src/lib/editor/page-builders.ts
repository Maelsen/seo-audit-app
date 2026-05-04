import type { Block, Mm, Frame, TextStyle } from "./template-types";

// Page builders for Vasileios' 20-page layout (M3-M13).
// Each builder returns an array of Blocks for one page.

export const PAGE_WIDTH_MM: Mm = 210;
export const PAGE_HEIGHT_MM: Mm = 297;
export const BRAND_CYAN = "#38E1E1";
export const RED_BUTTON = "#FF5757";

// ---------- Page-Chrome (Header + Footer) ----------
//
// Vermessen aus docs/measurements/page-05.png (Vasileios SEO AUDIT WASCHBÄR SERVICE.pdf):
// - Logo TL: visible bbox 22.6/11.5 mm 12.8x10.9 mm. PNG-Asset hat 23% Whitespace,
//   daher Frame entsprechend größer (16.7x13.7 mm) um nach objectFit:contain
//   die richtige rendered size zu landen.
// - TR-Text-Block ist horizontal zentriert über beide Zeilen ("SEO-Audit" wirkt
//   mittig, weil das Subline länger ist und beide center-aligned sind).
// - "SEO-Audit" cyan, ~13pt bold; "für {domain}" hellgrau ~9pt regular
// - Footer 2 Stripes je 2.03 mm dick, gap 0.89 mm, ends 0.63 mm vor page bottom

const STRIPE_BOTTOM_MARGIN: Mm = 0.63;
const STRIPE_THICKNESS: Mm = 2.03;
const STRIPE_GAP: Mm = 0.89;
const STRIPE_2_Y = PAGE_HEIGHT_MM - STRIPE_BOTTOM_MARGIN - STRIPE_THICKNESS;
const STRIPE_1_Y = STRIPE_2_Y - STRIPE_GAP - STRIPE_THICKNESS;

function footerStripes(idPrefix: string): Block[] {
  return [
    {
      id: `${idPrefix}-stripe-1`,
      type: "shape",
      shape: "rect",
      fill: BRAND_CYAN,
      frame: { x: 0, y: STRIPE_1_Y, w: PAGE_WIDTH_MM, h: STRIPE_THICKNESS },
      zIndex: 100,
    },
    {
      id: `${idPrefix}-stripe-2`,
      type: "shape",
      shape: "rect",
      fill: BRAND_CYAN,
      frame: { x: 0, y: STRIPE_2_Y, w: PAGE_WIDTH_MM, h: STRIPE_THICKNESS },
      zIndex: 100,
    },
  ];
}

// M13: pageHeader extrahiert, damit Page 19 (kein Footer-Stripe) den
// Standard-Header weiterverwenden kann ohne pageChrome() zu rufen.
export function pageHeader(idPrefix: string = "chrome"): Block[] {
  return [
    {
      id: `${idPrefix}-logo`,
      type: "brandDecoration",
      kind: "signet",
      frame: { x: 20.6, y: 10.2, w: 16.7, h: 13.7 },
      zIndex: 100,
    },
    {
      id: `${idPrefix}-title`,
      type: "text",
      binding: { kind: "static" },
      staticText: "SEO-Audit",
      frame: { x: 140, y: 11.5, w: 60, h: 6.5 },
      zIndex: 100,
      style: {
        fontFamily: "Poppins",
        fontSize: 16,
        fontWeight: 700,
        color: BRAND_CYAN,
        lineHeight: 1.05,
        textAlign: "center",
      },
    },
    {
      id: `${idPrefix}-url`,
      type: "text",
      binding: { kind: "static" },
      staticText: "für {domain}",
      frame: { x: 138, y: 17.0, w: 64, h: 5 },
      zIndex: 100,
      style: {
        fontFamily: "Poppins",
        fontSize: 8,
        fontWeight: 400,
        color: "#cfcfcf",
        lineHeight: 1.05,
        textAlign: "center",
      },
    },
  ];
}

export function pageChrome(): Block[] {
  return [...pageHeader("chrome"), ...footerStripes("chrome-footer")];
}

// ---------- Helper: small-text style preset ----------

function textStyle(overrides: Partial<TextStyle>): TextStyle {
  return {
    fontFamily: "Poppins",
    fontSize: 11,
    fontWeight: 400,
    color: "#ffffff",
    lineHeight: 1.5,
    textAlign: "left",
    ...overrides,
  };
}

// ---------- M4: Cover (Page 1) ----------
//
// Vermessen aus docs/measurements/page-01.png:
// - "ARTISTIC AVENUE" Wortmarke (mit Signet), center, y[31, 44]mm, width 52mm, height 12.8mm
// - "SEO-AUDIT" Mega-Title (white, cyan glow textShadow), y[~50, ~95]mm, height ~38mm
// - "für Ihre Website" subline (white, ~16pt), y[80, 85]mm
// - Cyan Domain "www.{domain}", y[90, 95]mm, height 5.5mm, ~18pt cyan
// - Monitor/Screenshot, y[106, 220]mm, x[24, 186]mm, 163x114mm
// - Footer 3 cols (white, ~9pt), y[282, 286]mm
// - Footer-Stripes wie Standard

function buildCover(): Block[] {
  return [
    // Top brand logo (Wortmarke + Signet)
    {
      id: "cover-brand-logo",
      type: "brandDecoration",
      kind: "logo",
      frame: { x: 70, y: 25, w: 70, h: 22 },
      zIndex: 50,
    },
    // Mega-Title "SEO-AUDIT" with cyan glow shadow
    {
      id: "cover-title",
      type: "text",
      binding: { kind: "static" },
      staticText: "SEO-AUDIT",
      frame: { x: 10, y: 55, w: 190, h: 35 },
      zIndex: 50,
      style: textStyle({
        fontSize: 64,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.0,
        letterSpacing: 1,
        // Subtiler Drop-Shadow analog Vasileios' Original — vorher 1.2mm war
        // zu stark, ueberdeckte den weichen Glow-Effekt.
        textShadow: "0.6mm 0.7mm 0.4mm rgba(0,0,0,0.4)",
        textTransform: "uppercase",
      }),
    },
    // Subline "für Ihre Website"
    {
      id: "cover-subtitle",
      type: "text",
      binding: { kind: "static" },
      staticText: "für Ihre Website",
      frame: { x: 10, y: 95, w: 190, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 16,
        fontWeight: 600,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
    // Cyan Domain
    {
      id: "cover-domain",
      type: "text",
      binding: { kind: "computed", fn: "domain", path: "url" },
      frame: { x: 10, y: 104, w: 190, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 18,
        fontWeight: 700,
        color: BRAND_CYAN,
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
    // Monitor-Mockup-Frame (Bezel hinter dem Screenshot)
    // Vasileios' Page 1 zeigt den Cover-Screenshot in einem dunklen Monitor-
    // Mockup mit Bezel-Rand, Camera-Dot, Stand-Hals und Stand-Sockel. Wird
    // aus 5 Shape/Image-Bloecken zusammengesetzt: bezel (zIndex 49) UNTER
    // screenshot (zIndex 50), camera-dot + stand UEBER ueblichem Hintergrund.
    {
      id: "cover-monitor-bezel",
      type: "shape",
      shape: "rect",
      frame: { x: 22, y: 127, w: 166, h: 116 },
      zIndex: 49,
      fill: "#2a2a2a",
      borderRadius: 3,
      boxShadow: "0 2mm 6mm rgba(0,0,0,0.45)",
    },
    {
      id: "cover-monitor-camera",
      type: "shape",
      shape: "ellipse",
      frame: { x: 104, y: 128.5, w: 2, h: 1 },
      zIndex: 51,
      fill: "#555555",
    },
    {
      id: "cover-monitor-stand-neck",
      type: "shape",
      shape: "rect",
      frame: { x: 99, y: 243, w: 12, h: 6 },
      zIndex: 49,
      fill: "#2a2a2a",
    },
    // Trapez-Sockel mit 2 gestaffelten rects approximiert (oben schmaler,
    // unten breiter). Vasileios' Original hat einen klassischen Monitor-
    // Trapez-Sockel — kein echter Polygon-Block im Schema, deshalb 2 rects.
    {
      id: "cover-monitor-stand-base-top",
      type: "shape",
      shape: "rect",
      frame: { x: 86, y: 249, w: 38, h: 2 },
      zIndex: 49,
      fill: "#aaaaaa",
      borderRadius: 0.6,
    },
    {
      id: "cover-monitor-stand-base",
      type: "shape",
      shape: "rect",
      frame: { x: 78, y: 251, w: 54, h: 2.5 },
      zIndex: 49,
      fill: "#aaaaaa",
      borderRadius: 1,
    },
    {
      id: "cover-screenshot",
      type: "image",
      binding: { kind: "audit", path: "screenshots.cover" },
      frame: { x: 25, y: 130, w: 160, h: 110 },
      zIndex: 50,
      objectFit: "cover",
      objectPosition: "top",
      borderRadius: 2,
    },
    // 3-column footer
    {
      id: "cover-footer-email",
      type: "text",
      binding: { kind: "static" },
      staticText: "info@artisticavenue.de",
      frame: { x: 5, y: 280, w: 65, h: 6 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
    {
      id: "cover-footer-website",
      type: "text",
      binding: { kind: "static" },
      staticText: "www.artisticavenue.de",
      frame: { x: 72.5, y: 280, w: 65, h: 6 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
    {
      id: "cover-footer-phone",
      type: "text",
      binding: { kind: "static" },
      staticText: "+49 (0) 179 3213 445",
      frame: { x: 140, y: 280, w: 65, h: 6 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
    ...footerStripes("cover-footer"),
  ];
}

// ---------- M4: Gesamtsituation (Page 2) ----------
//
// Vermessen aus docs/measurements/page-02.png:
// - pageChrome standard
// - Headline "Gesamtsituation & Diagnose": y[38, 45], x[21, 125], h ~7.4mm, fontSize ~22pt bold
// - Diagnose body: y[52, 100], multi-line, ~11pt, white, lineHeight 1.5
// - Sub-headline "Audit-Ergebnisse für {domain}": ~bold white, 2 Zeilen, y ~110-128mm
// - Big ScoreCircle: center (~50, ~165), diameter ~65mm
// - Right text "Ihre Seite könnte besser sein" (bold) + paragraph: x[90, 187], y[131, 156]
// - Red button "Empfehlungen: N": y[148, 157], x[86, 135], 49x9mm, fill #FF5757
// - Sub-donut Row 1 (4): centers x ~33, 73, 113, 162; y_top ~200; D ~17mm
// - Sub-donut Row 2 (2): centers x ~33, 73; y_top ~234; D ~17mm

const SUB_DONUT_DIAMETER: Mm = 19;
const SUB_DONUT_LABEL_GAP: Mm = 4;
const SUB_DONUT_LABEL_HEIGHT: Mm = 8;

type SubDonut = {
  id: string;
  cx: Mm;
  cy: Mm;
  scoreBinding: string;
  label: string;
};

function subDonut(d: SubDonut): Block[] {
  const half = SUB_DONUT_DIAMETER / 2;
  return [
    {
      id: `${d.id}-circle`,
      type: "scoreCircle",
      binding: { kind: "audit", path: d.scoreBinding },
      frame: {
        x: d.cx - half,
        y: d.cy - half,
        w: SUB_DONUT_DIAMETER,
        h: SUB_DONUT_DIAMETER,
      },
      zIndex: 50,
      size: SUB_DONUT_DIAMETER,
      strokeWidth: 2.5,
      labelStyle: textStyle({
        fontSize: 11,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1,
      }),
    },
    {
      id: `${d.id}-label`,
      type: "text",
      binding: { kind: "static" },
      staticText: d.label,
      frame: {
        x: d.cx - 22,
        y: d.cy + half + SUB_DONUT_LABEL_GAP,
        w: 44,
        h: SUB_DONUT_LABEL_HEIGHT,
      },
      zIndex: 50,
      style: textStyle({
        fontSize: 9,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
  ];
}

function buildGesamtsituation(): Block[] {
  const subDonutsRow1Y: Mm = 200 + SUB_DONUT_DIAMETER / 2;
  const subDonutsRow2Y: Mm = 234 + SUB_DONUT_DIAMETER / 2;
  const row1Centers: Mm[] = [33, 75, 117, 159];
  const row2Centers: Mm[] = [33, 75];

  return [
    ...pageChrome(),
    // Headline
    {
      id: "gs-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Gesamtsituation & Diagnose",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Diagnose body text (audit-bound)
    {
      id: "gs-diagnose",
      type: "text",
      binding: { kind: "audit", path: "diagnosisText" },
      frame: { x: 20, y: 50, w: 175, h: 50 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    // Sub-headline "Audit-Ergebnisse für {domain}" (2 Zeilen)
    {
      id: "gs-sub-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Audit-Ergebnisse\nfür {domain}",
      frame: { x: 20, y: 110, w: 170, h: 18 },
      zIndex: 50,
      style: textStyle({
        fontSize: 18,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Big ScoreCircle (overall grade)
    {
      id: "gs-big-score",
      type: "scoreCircle",
      binding: { kind: "audit", path: "overallScore" },
      frame: { x: 24, y: 140, w: 52, h: 52 },
      zIndex: 50,
      size: 52,
      strokeWidth: 5.5,
      labelStyle: textStyle({
        fontSize: 34,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1,
      }),
    },
    // Right-side bold heading "Ihre Seite könnte besser sein" (bound to overallHeading)
    {
      id: "gs-right-heading",
      type: "text",
      binding: { kind: "audit", path: "overallHeading" },
      frame: { x: 90, y: 142, w: 100, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Right-side paragraph (intro text)
    {
      id: "gs-right-text",
      type: "text",
      binding: { kind: "audit", path: "introText" },
      frame: { x: 90, y: 152, w: 100, h: 18 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.4,
      }),
    },
    // Red "Empfehlungen: N" button (shape + text overlay)
    {
      id: "gs-rec-button-bg",
      type: "shape",
      shape: "rect",
      fill: RED_BUTTON,
      borderRadius: 1.2,
      frame: { x: 90, y: 174, w: 50, h: 8.5 },
      zIndex: 50,
    },
    {
      id: "gs-rec-button-text",
      type: "text",
      binding: { kind: "static" },
      staticText: "Empfehlungen: {audit.recommendations.length}",
      frame: { x: 90, y: 174, w: 50, h: 8.5 },
      zIndex: 51,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.7,
      }),
    },
    // 6 Sub-Donuts (4 in row 1, 2 in row 2)
    ...subDonut({
      id: "gs-sub-onpage",
      cx: row1Centers[0],
      cy: subDonutsRow1Y,
      scoreBinding: "sections.onpageSeo.score",
      label: "On-Page SEO",
    }),
    ...subDonut({
      id: "gs-sub-ux",
      cx: row1Centers[1],
      cy: subDonutsRow1Y,
      scoreBinding: "sections.uxConversion.score",
      label: "UX & Conversion",
    }),
    ...subDonut({
      id: "gs-sub-content",
      cx: row1Centers[2],
      cy: subDonutsRow1Y,
      scoreBinding: "sections.seitenstrukturContent.score",
      label: "Seitenstruktur\n& Content",
    }),
    ...subDonut({
      id: "gs-sub-perf",
      cx: row1Centers[3],
      cy: subDonutsRow1Y,
      scoreBinding: "sections.leistung.score",
      label: "Performance &\nTechnisches",
    }),
    ...subDonut({
      id: "gs-sub-local",
      cx: row2Centers[0],
      cy: subDonutsRow2Y,
      scoreBinding: "sections.lokalesSeo.score",
      label: "Lokales SEO",
    }),
    ...subDonut({
      id: "gs-sub-links",
      cx: row2Centers[1],
      cy: subDonutsRow2Y,
      scoreBinding: "sections.links.score",
      label: "Links & Autorität",
    }),
  ];
}

// ---------- M5: Top 3 Risiken (Page 3) ----------
//
// Vermessen aus docs/measurements/page-03.png:
// - Headline "Top 3 Risiken & Potenzial": white bold, y[38.4, 43.4]mm, x_left ~30mm, ~22pt
// - Sub-line "Das kostet dich gerade Anfragen": white bold, y[52.5, 56.3]mm, ~14pt
// - Risk 1 title y[69.1, 72.8], body 4 lines y[77.5, 97.9]
// - Risk 2 title y[116.0, 119.5], body 6-7 lines y[124.2, 168.9]
// - Risk 3 title y[187.3, 192.0], body 5 lines y[195.6, 226.6]
// - Title font ~14pt bold, body ~10pt regular gray, line-height 1.5

function buildTopRisks(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "tr-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Top 3 Risiken & Potenzial",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "tr-subline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Das kostet dich gerade Anfragen",
      frame: { x: 20, y: 50, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "tr-list",
      type: "topRiskList",
      binding: { kind: "audit", path: "topRisks" },
      frame: { x: 20, y: 65, w: 170, h: 210 },
      zIndex: 50,
      itemGap: 8,
      itemStyle: {
        titleStyle: textStyle({
          fontSize: 12.5,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.3,
        }),
        bodyStyle: textStyle({
          fontSize: 10,
          fontWeight: 400,
          color: "#e6e6e6",
          lineHeight: 1.5,
        }),
      },
      numbered: true,
      overflow: "shrink",
    },
  ];
}

// ---------- M5: Wo du sein könntest (Page 4, NEU) ----------
//
// Vermessen aus docs/measurements/page-04.png:
// - Headline "WO DU SEIN KÖNNTEST" (uppercase), centered im Content-Bereich, y[38.6, 43.4]mm, ~22pt
// - Sub-headline "Das ist möglich – mit der richtigen Reihenfolge", center, y[52.3, 57.5]mm, ~16pt bold
// - 3 alt-sentences:
//   - alt 0 aspect y[64.6, 67.8], vision y[72.9, 86.1] (3 lines)
//   - alt 1 aspect y[94.1, 97.2], vision y[102.2, 110.1] (2 lines)
//   - alt 2 aspect y[117.9, 121.2], vision y[126.2, 134.1] (2 lines)
//   - aspect right-aligned, vision center-aligned, gap aspect→vision ~6mm
// - Table sub-headline "Wo du heute stehst – wo du in 3 Monaten sein könntest:" y[146.1, 149.2]
// - Vergleichstabelle: pill-Header y[157.2, 171.6] (h ~14.4mm, color cyan #38E1E1),
//   3 Spalten gleich breit (~55mm), kleine Gaps zwischen Pills
// - Row dividers y_mm: 172.2, 186.7, 201.8, 216.9, 236.7, 251.8, 267.5, 281.9 (8 dividers = 7 rows)
// - Row height ~15mm normal, ~20mm wenn Cell-Text wrapt

function buildWoDuSeinKoenntest(): Block[] {
  return [
    ...pageChrome(),
    // Big headline (centered)
    {
      id: "wd-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "WO DU SEIN KÖNNTEST",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
    // Sub-headline (centered)
    {
      id: "wd-subheadline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Das ist möglich – mit der richtigen Reihenfolge",
      frame: { x: 20, y: 50, w: 170, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
    // Alt-sentences (3 blocks of aspect + vision)
    ...buildAltSentence(0, 63),
    ...buildAltSentence(1, 92),
    ...buildAltSentence(2, 116),
    // Table sub-headline
    {
      id: "wd-table-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Wo du heute stehst – wo du in 3 Monaten sein könntest:",
      frame: { x: 20, y: 144, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Vergleichstabelle (pill-header + 7 rows)
    {
      id: "wd-comparison-table",
      type: "comparisonTable",
      binding: { kind: "audit", path: "comparison.rows" },
      frame: { x: 20, y: 156, w: 170, h: 130 },
      zIndex: 50,
      columns: [
        { header: "Problemstelle", fieldPath: "problem" },
        { header: "Heute", fieldPath: "today" },
        { header: "in 3 Monaten", fieldPath: "future" },
      ],
      headerPillColor: BRAND_CYAN,
      headerPillRadius: 6,
      headerPillPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      headerCellGap: 2,
      headerStyle: textStyle({
        fontSize: 11,
        fontWeight: 700,
        color: "#0a0a0a",
        textAlign: "center",
        lineHeight: 1.2,
      }),
      cellStyle: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.4,
      }),
      rowDividerColor: "#444444",
      rowVerticalPadding: 4,
    },
  ];
}

function buildAltSentence(idx: number, yTop: Mm): Block[] {
  return [
    {
      id: `wd-alt-${idx}-aspect`,
      type: "text",
      binding: { kind: "audit", path: `comparison.altSentences[${idx}].aspect` },
      frame: { x: 50, y: yTop, w: 140, h: 6 },
      zIndex: 50,
      style: textStyle({
        fontSize: 11,
        fontWeight: 600,
        color: "#ffffff",
        textAlign: "right",
        lineHeight: 1.3,
      }),
    },
    {
      id: `wd-alt-${idx}-vision`,
      type: "text",
      binding: { kind: "audit", path: `comparison.altSentences[${idx}].vision` },
      frame: { x: 20, y: yTop + 7, w: 170, h: 18 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "center",
        lineHeight: 1.5,
      }),
    },
  ];
}

// ---------- M6: On-Page SEO (Pages 5+6) ----------
//
// Vermessen aus docs/measurements/page-05.png + page-06.png:
// PAGE 5 (buildOnPageSeo1):
// - Headline "On-Page SEO Ergebnisse": y[40.86, 45.68], h ~5mm, ~22pt bold left-aligned
// - Score-Donut: ring-bbox x[21, 58] y[51, 88], ~37mm Durchmesser, center ~ x37/y70
// - Sub-Headline "Technisch vorhanden – aber nicht optimal genutzt": y[51.90, 54.82], right-side
// - Diagnose body (3 lines): y[59, 78] right-side
// - Sub-Heading "Was wir festgestellt haben": y[95.17, 98.72]
// - Findings-Tabelle: Header y[106-109] (text only, kein Pill, mit cyan-underline);
//   11 Rows mit Dividers bei y_mm 122.19 / 134.63 / 147.06 / 159.75 / 173.08 / 186.02 / 198.45 /
//   211.14 / 224.47 / 237.15 / 250.35 (gap ~12.5mm, last row goes to ~263)
// - Status-Icons rechts in x ~165-185mm: warning ⚠️ / fail ❌ / ok ✓
//
// PAGE 6 (buildOnPageSeo2):
// - Headline (gleich wie 5): y[38.70, 43.52]
// - Sub-Heading "Was das konkret kostet:": y[50.12, 53.67]
// - Body text 4 lines: y[59.89, 78.42]
// - SERP-Snippet card: x[21, 139] y[92, 132], h ~40mm, w ~120mm
// - Sub-Heading "H2-H6-Header-Tag-Verwendung" / "Frequenz": y ~135 (cyan)
// - Bar-Chart H2-H6: 5 rows, y ~143-180, lange cyan bar bei H6
// - Sub-Heading "Was dagegen zu tun ist": y ~196
// - ArrowBulletList: 5 items y ~204-265
// - Footer "Umsetzbar innerhalb einer Woche.": y ~274
// - Footer "Direkte Auswirkung auf Klickrate und Einordnung durch Google.": y ~280

function buildOnPageSeo1(): Block[] {
  return [
    ...pageChrome(),
    // Headline
    {
      id: "ops1-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "On-Page SEO Ergebnisse",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Score-Donut (links, grade-color comes from grade-Palette)
    {
      id: "ops1-score-donut",
      type: "scoreCircle",
      binding: { kind: "audit", path: "sections.onpageSeo.score" },
      frame: { x: 17, y: 51, w: 37, h: 37 },
      zIndex: 50,
      size: 37,
      strokeWidth: 5,
      labelStyle: textStyle({
        fontSize: 24,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1,
      }),
    },
    // Right-side sub-headline (bound)
    {
      id: "ops1-section-heading",
      type: "text",
      binding: { kind: "audit", path: "sections.onpageSeo.heading" },
      frame: { x: 65, y: 50, w: 130, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
    },
    // Right-side diagnose body
    {
      id: "ops1-section-text",
      type: "text",
      binding: { kind: "audit", path: "sections.onpageSeo.text" },
      frame: { x: 65, y: 58, w: 130, h: 28 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    // Sub-Heading "Was wir festgestellt haben"
    {
      id: "ops1-findings-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was wir festgestellt haben",
      frame: { x: 20, y: 93, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Findings-Table (Problem | Befund | Status mit Status-Icons)
    {
      id: "ops1-findings-table",
      type: "findingsTable",
      binding: { kind: "audit", path: "sections.onpageSeo.findings" },
      frame: { x: 20, y: 103, w: 170, h: 165 },
      zIndex: 50,
      problemFieldPath: "problem",
      befundFieldPath: "befund",
      statusFieldPath: "status",
      problemColumnWidth: 50,
      statusColumnWidth: 22,
      headerStyle: textStyle({
        fontSize: 11,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
      headerUnderlineColor: BRAND_CYAN,
      headerUnderlineThickness: 0.4,
      headerPaddingBottom: 2,
      problemStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      befundStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      rowDividerColor: "#444444",
      rowVerticalPadding: 3,
      statusIconSize: 5,
    },
  ];
}

function buildOnPageSeo2(): Block[] {
  return [
    ...pageChrome(),
    // Headline (gleich Page 5)
    {
      id: "ops2-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "On-Page SEO Ergebnisse",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Sub-Heading "Was das konkret kostet:"
    {
      id: "ops2-cost-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was das konkret kostet:",
      frame: { x: 20, y: 48, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Cost body text
    {
      id: "ops2-cost-text",
      type: "text",
      binding: { kind: "audit", path: "sections.onpageSeo.costText" },
      frame: { x: 20, y: 58, w: 175, h: 30 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    // SERP-Snippet
    {
      id: "ops2-serp",
      type: "serpPreview",
      urlBinding: { kind: "audit", path: "sections.onpageSeo.serpPreview.url" },
      titleBinding: { kind: "audit", path: "sections.onpageSeo.serpPreview.title" },
      descriptionBinding: {
        kind: "audit",
        path: "sections.onpageSeo.serpPreview.description",
      },
      frame: { x: 20, y: 92, w: 120, h: 38 },
      zIndex: 50,
    },
    // Sub-Heading "H2-H6-Header-Tag-Verwendung" (cyan)
    {
      id: "ops2-bar-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "H2-H6-Header-Tag-Verwendung",
      frame: { x: 20, y: 138, w: 100, h: 6 },
      zIndex: 50,
      style: textStyle({
        fontSize: 11,
        fontWeight: 700,
        color: BRAND_CYAN,
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Sub-Heading "Frequenz" (cyan)
    {
      id: "ops2-bar-freq-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Frequenz",
      frame: { x: 100, y: 138, w: 50, h: 6 },
      zIndex: 50,
      style: textStyle({
        fontSize: 11,
        fontWeight: 700,
        color: BRAND_CYAN,
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Bar-Chart H2-H6
    {
      id: "ops2-bar-chart",
      type: "barChart",
      binding: { kind: "audit", path: "sections.onpageSeo.h2h6Frequency" },
      items: [
        { label: "H2", fieldPath: "h2" },
        { label: "H3", fieldPath: "h3" },
        { label: "H4", fieldPath: "h4" },
        { label: "H5", fieldPath: "h5" },
        { label: "H6", fieldPath: "h6" },
      ],
      barColor: BRAND_CYAN,
      trackColor: "#2a2a2a",
      labelStyle: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
      valueStyle: textStyle({
        fontSize: 10,
        fontWeight: 600,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
      frame: { x: 20, y: 145, w: 170, h: 50 },
      zIndex: 50,
      barHeight: 2.2,
      gap: 6.5,
      overflow: "shrink",
    },
    // Sub-Heading "Was dagegen zu tun ist"
    {
      id: "ops2-actions-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was dagegen zu tun ist",
      frame: { x: 20, y: 195, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Action-Items (Pfeil-Bullets)
    {
      id: "ops2-actions",
      type: "arrowBulletList",
      binding: { kind: "audit", path: "sections.onpageSeo.actions" },
      frame: { x: 20, y: 204, w: 170, h: 68 },
      zIndex: 50,
      itemGap: 5.5,
      arrowColor: BRAND_CYAN,
      arrowSize: 5,
      arrowGap: 6,
      titleStyle: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
      detailStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      overflow: "shrink",
    },
    // Footer note 1
    {
      id: "ops2-footer-note-1",
      type: "text",
      binding: { kind: "static" },
      staticText: "Umsetzbar innerhalb einer Woche.",
      frame: { x: 20, y: 273, w: 170, h: 5 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 400,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // Footer note 2
    {
      id: "ops2-footer-note-2",
      type: "text",
      binding: { kind: "static" },
      staticText: "Direkte Auswirkung auf Klickrate und Einordnung durch Google.",
      frame: { x: 20, y: 279, w: 170, h: 5 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 400,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
  ];
}

// ---------- M7: UX & Conversion (Pages 7+8) ----------
//
// Vermessen aus docs/measurements/page-07.png + page-08.png:
// Standard-Chrome (logo, header, footer-stripe) identisch zu Page 5/6.
// PAGE 7 (buildUxConversion1): exakter Spiegel von Page 5 — Score-Donut links,
// gebundene Sub-Headline + Diagnose-Body rechts, "Was wir festgestellt haben" + findingsTable.
// findingsTable hat 12 Rows (vs 11 in M6) → Frame h=170 statt 165.
// PAGE 8 (buildUxConversion2): Subset von Page 6 — KEIN SerpPreview/BarChart, KEIN H2-H6-Heading,
// nur Cost-Heading + Body + Action-Heading + arrowBulletList (6 Pfeil-Items mit Title+Detail) + 1 closingNote.

function buildUxConversion1(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "uxc1-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "UX & Conversion",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "uxc1-score-donut",
      type: "scoreCircle",
      binding: { kind: "audit", path: "sections.uxConversion.score" },
      frame: { x: 17, y: 51, w: 37, h: 37 },
      zIndex: 50,
      size: 37,
      strokeWidth: 5,
      labelStyle: textStyle({
        fontSize: 24,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1,
      }),
    },
    {
      id: "uxc1-section-heading",
      type: "text",
      binding: { kind: "audit", path: "sections.uxConversion.heading" },
      frame: { x: 65, y: 50, w: 130, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
    },
    {
      id: "uxc1-section-text",
      type: "text",
      binding: { kind: "audit", path: "sections.uxConversion.text" },
      frame: { x: 65, y: 58, w: 130, h: 28 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    {
      id: "uxc1-findings-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was wir festgestellt haben",
      frame: { x: 20, y: 93, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "uxc1-findings-table",
      type: "findingsTable",
      binding: { kind: "audit", path: "sections.uxConversion.findings" },
      frame: { x: 20, y: 103, w: 170, h: 175 },
      zIndex: 50,
      problemFieldPath: "problem",
      befundFieldPath: "befund",
      statusFieldPath: "status",
      problemColumnWidth: 50,
      statusColumnWidth: 22,
      headerStyle: textStyle({
        fontSize: 11,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
      headerUnderlineColor: BRAND_CYAN,
      headerUnderlineThickness: 0.4,
      headerPaddingBottom: 2,
      problemStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      befundStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      rowDividerColor: "#444444",
      rowVerticalPadding: 3,
      statusIconSize: 5,
    },
  ];
}

function buildUxConversion2(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "uxc2-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "UX & Conversion",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "uxc2-cost-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was das konkret kostet:",
      frame: { x: 20, y: 48, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "uxc2-cost-text",
      type: "text",
      binding: { kind: "audit", path: "sections.uxConversion.costText" },
      frame: { x: 20, y: 58, w: 175, h: 38 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    {
      id: "uxc2-actions-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was dagegen zu tun ist",
      frame: { x: 20, y: 105, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "uxc2-actions",
      type: "arrowBulletList",
      binding: { kind: "audit", path: "sections.uxConversion.actions" },
      frame: { x: 20, y: 115, w: 170, h: 152 },
      zIndex: 50,
      itemGap: 6,
      arrowColor: BRAND_CYAN,
      arrowSize: 5,
      arrowGap: 6,
      titleStyle: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
      detailStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      overflow: "shrink",
    },
    {
      id: "uxc2-closing-note",
      type: "text",
      binding: { kind: "audit", path: "sections.uxConversion.closingNote" },
      frame: { x: 20, y: 275, w: 170, h: 12 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.4,
      }),
    },
  ];
}

// ---------- M8: Seitenstruktur & Content (Pages 9+10) ----------
//
// Vermessen aus docs/measurements/page-09.png + page-10.png:
// PAGE 9 (buildSeitenstrukturContent1): exakter Spiegel von Page 5/7 — Score-Donut links,
// gebundene Sub-Headline + Diagnose-Body rechts, "Was wir festgestellt haben" + findingsTable.
// findingsTable hat 8 Rows (vs 12 in M7, 11 in M6) → Frame h=130 (kompakter, da unteres Page-Drittel
// in Vasileios' Original leer bleibt).
// PAGE 10 (buildSeitenstrukturContent2): Cost-Heading + costText + 3 Beispiel-Screenshot-Stubs
// (2 oben side-by-side ~24mm, 1 cyan-Banner unten ~50mm) + arrowBulletList (4 Pfeil-Items) +
// closingNote. Image-Slots als statische ImageBlocks ohne staticSrc → ImageBlockView rendert
// dashed-cyan Placeholder. Vasileios kann später per Editor Pfade reinziehen.

function buildSeitenstrukturContent1(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "ssc1-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Seitenstruktur & Content",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "ssc1-score-donut",
      type: "scoreCircle",
      binding: { kind: "audit", path: "sections.seitenstrukturContent.score" },
      frame: { x: 17, y: 51, w: 37, h: 37 },
      zIndex: 50,
      size: 37,
      strokeWidth: 5,
      labelStyle: textStyle({
        fontSize: 24,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1,
      }),
    },
    {
      id: "ssc1-section-heading",
      type: "text",
      binding: { kind: "audit", path: "sections.seitenstrukturContent.heading" },
      frame: { x: 65, y: 50, w: 130, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
    },
    {
      id: "ssc1-section-text",
      type: "text",
      binding: { kind: "audit", path: "sections.seitenstrukturContent.text" },
      frame: { x: 65, y: 58, w: 130, h: 28 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    {
      id: "ssc1-findings-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was wir festgestellt haben",
      frame: { x: 20, y: 93, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "ssc1-findings-table",
      type: "findingsTable",
      binding: { kind: "audit", path: "sections.seitenstrukturContent.findings" },
      frame: { x: 20, y: 103, w: 170, h: 130 },
      zIndex: 50,
      problemFieldPath: "problem",
      befundFieldPath: "befund",
      statusFieldPath: "status",
      problemColumnWidth: 50,
      statusColumnWidth: 22,
      headerStyle: textStyle({
        fontSize: 11,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
      headerUnderlineColor: BRAND_CYAN,
      headerUnderlineThickness: 0.4,
      headerPaddingBottom: 2,
      problemStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      befundStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      rowDividerColor: "#444444",
      rowVerticalPadding: 3,
      statusIconSize: 5,
    },
  ];
}

function buildSeitenstrukturContent2(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "ssc2-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Seitenstruktur & Content",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "ssc2-cost-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was das konkret kostet:",
      frame: { x: 20, y: 48, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "ssc2-cost-text",
      type: "text",
      binding: { kind: "audit", path: "sections.seitenstrukturContent.costText" },
      frame: { x: 20, y: 58, w: 175, h: 42 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    // Image-Stub A (links, dark card "Typische Herausforderungen")
    {
      id: "ssc2-image-a",
      type: "image",
      binding: { kind: "static" },
      frame: { x: 20, y: 104, w: 80, h: 24 },
      zIndex: 50,
      objectFit: "cover",
      borderRadius: 1.5,
    },
    // Image-Stub B (rechts, Foto Reinigungskraft)
    {
      id: "ssc2-image-b",
      type: "image",
      binding: { kind: "static" },
      frame: { x: 105, y: 104, w: 85, h: 24 },
      zIndex: 50,
      objectFit: "cover",
      borderRadius: 1.5,
    },
    // Image-Stub C (cyan-Banner "Unser Serviceversprechen auf einen Blick")
    {
      id: "ssc2-image-c",
      type: "image",
      binding: { kind: "static" },
      frame: { x: 20, y: 132, w: 170, h: 50 },
      zIndex: 50,
      objectFit: "cover",
      borderRadius: 1.5,
    },
    {
      id: "ssc2-actions-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was dagegen zu tun ist",
      frame: { x: 20, y: 187, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "ssc2-actions",
      type: "arrowBulletList",
      binding: { kind: "audit", path: "sections.seitenstrukturContent.actions" },
      frame: { x: 20, y: 196, w: 170, h: 75 },
      zIndex: 50,
      itemGap: 5,
      arrowColor: BRAND_CYAN,
      arrowSize: 5,
      arrowGap: 6,
      titleStyle: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
      detailStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      overflow: "shrink",
    },
    {
      id: "ssc2-closing-note",
      type: "text",
      binding: { kind: "audit", path: "sections.seitenstrukturContent.closingNote" },
      frame: { x: 20, y: 275, w: 170, h: 12 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.4,
      }),
    },
  ];
}

// PAGE 11 (buildLokalesSeo1): exakter Spiegel von Page 5/7/9 — Score-Donut links,
// gebundene Sub-Headline + Diagnose-Body rechts, "Was wir festgestellt haben" + findingsTable.
// findingsTable hat 8 Rows (gleiche Höhe wie M8 Page 9, h=130).
// PAGE 12 (buildLokalesSeo2): Cost-Heading + costText + Action-Heading + arrowBulletList +
// closingNote (centered) + Schema-Markup-Image (links unten, bound to schemaMarkupImage) +
// Caption rechts daneben (italic, bound to schemaMarkupCaption).

function buildLokalesSeo1(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "ls1-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Lokales SEO",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "ls1-score-donut",
      type: "scoreCircle",
      binding: { kind: "audit", path: "sections.lokalesSeo.score" },
      frame: { x: 17, y: 51, w: 37, h: 37 },
      zIndex: 50,
      size: 37,
      strokeWidth: 5,
      labelStyle: textStyle({
        fontSize: 24,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1,
      }),
    },
    {
      id: "ls1-section-heading",
      type: "text",
      binding: { kind: "audit", path: "sections.lokalesSeo.heading" },
      // h:8mm war fuer 1 Zeile zu schmal. Vasileios' Originaltext
      // "Für Warendorf bereits sichtbar – im Umland noch viel Potenzial"
      // braucht 2 Zeilen → h:14mm + leicht hoeheres y damit der Subtext
      // darunter nicht ueberlappt.
      frame: { x: 65, y: 48, w: 130, h: 14 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
    },
    {
      id: "ls1-section-text",
      type: "text",
      binding: { kind: "audit", path: "sections.lokalesSeo.text" },
      frame: { x: 65, y: 58, w: 130, h: 28 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    {
      id: "ls1-findings-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was wir festgestellt haben",
      frame: { x: 20, y: 93, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "ls1-findings-table",
      type: "findingsTable",
      binding: { kind: "audit", path: "sections.lokalesSeo.findings" },
      frame: { x: 20, y: 103, w: 170, h: 130 },
      zIndex: 50,
      problemFieldPath: "problem",
      befundFieldPath: "befund",
      statusFieldPath: "status",
      problemColumnWidth: 50,
      statusColumnWidth: 22,
      headerStyle: textStyle({
        fontSize: 11,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
      headerUnderlineColor: BRAND_CYAN,
      headerUnderlineThickness: 0.4,
      headerPaddingBottom: 2,
      problemStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      befundStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      rowDividerColor: "#444444",
      rowVerticalPadding: 3,
      statusIconSize: 5,
    },
  ];
}

function buildLokalesSeo2(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "ls2-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Lokales SEO",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "ls2-cost-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was das konkret kostet:",
      frame: { x: 20, y: 48, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "ls2-cost-text",
      type: "text",
      binding: { kind: "audit", path: "sections.lokalesSeo.costText" },
      frame: { x: 20, y: 58, w: 175, h: 50 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    {
      id: "ls2-actions-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was dagegen zu tun ist",
      frame: { x: 20, y: 115, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "ls2-actions",
      type: "arrowBulletList",
      binding: { kind: "audit", path: "sections.lokalesSeo.actions" },
      frame: { x: 20, y: 125, w: 170, h: 80 },
      zIndex: 50,
      itemGap: 5,
      arrowColor: BRAND_CYAN,
      arrowSize: 5,
      arrowGap: 6,
      titleStyle: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
      detailStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      overflow: "shrink",
    },
    {
      id: "ls2-closing-note",
      type: "text",
      binding: { kind: "audit", path: "sections.lokalesSeo.closingNote" },
      frame: { x: 20, y: 210, w: 170, h: 12 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.4,
      }),
    },
    // Schema-Markup-Code-Image (links unten). ImageBlockView rendert dashed-cyan
    // Placeholder wenn schemaMarkupImage leer ist.
    {
      id: "ls2-schema-image",
      type: "image",
      binding: { kind: "audit", path: "sections.lokalesSeo.schemaMarkupImage" },
      frame: { x: 20, y: 228, w: 90, h: 60 },
      zIndex: 50,
      objectFit: "contain",
      borderRadius: 1.5,
    },
    // Caption rechts neben dem Image, italic
    {
      id: "ls2-schema-caption",
      type: "text",
      binding: { kind: "audit", path: "sections.lokalesSeo.schemaMarkupCaption" },
      frame: { x: 115, y: 235, w: 75, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        fontStyle: "italic",
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.4,
      }),
    },
  ];
}

// ---------- M10: Performance & Technisches (Pages 13 + 14) ----------
//
// PAGE 13 (buildPerformance1): die bislang dichteste Page —
//   Score-Donut links + Sub-Headline/Diagnose rechts
//   3× Speed-Gauge (semi, Server / Content / Skript)
//   6× ResourceTile (HTML / JS / CSS / IMG / Other / Total)
//   Page-Size-Gauge (semi, MB) + Pie-Chart pageSizeBreakdown.
//
// PAGE 14 (buildPerformance2): klassisches Cost+Actions-Pattern wie M7 P8.
//   Cost-Heading + costText + Action-Heading + arrowBulletList + closingNote.
//
// Vasileios' Original schreibt die Headline "Perfomance & Technisches" (ohne
// erstes "r") — übernommen, das ist Markenname/Original-Tippfehler.

function buildPerformance1(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "perf1-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Perfomance & Technisches",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "perf1-score-donut",
      type: "scoreCircle",
      binding: { kind: "audit", path: "sections.leistung.score" },
      frame: { x: 17, y: 51, w: 37, h: 37 },
      zIndex: 50,
      size: 37,
      strokeWidth: 5,
      labelStyle: textStyle({
        fontSize: 24,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1,
      }),
    },
    {
      id: "perf1-section-heading",
      type: "text",
      binding: { kind: "audit", path: "sections.leistung.heading" },
      frame: { x: 65, y: 50, w: 130, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
    },
    {
      id: "perf1-section-text",
      type: "text",
      binding: { kind: "audit", path: "sections.leistung.text" },
      frame: { x: 65, y: 58, w: 130, h: 30 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    // ---- Block: Website-Ladegeschwindigkeit (3 Speed-Gauges) ----
    {
      id: "perf1-speed-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Website-Ladegeschwindigkeit",
      frame: { x: 20, y: 95, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "perf1-speed-text",
      type: "text",
      binding: { kind: "static" },
      staticText: "Deine Website lädt in angemessener Zeit.",
      frame: { x: 20, y: 103, w: 170, h: 5 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
    },
    // 3 Gauges side-by-side (drei Spalten je 55mm, gap ~3mm)
    {
      id: "perf1-gauge-server",
      type: "gauge",
      binding: { kind: "audit", path: "sections.leistung.serverResponseTime" },
      frame: { x: 20, y: 113, w: 55, h: 32 },
      zIndex: 50,
      variant: "semi",
      minValue: 0,
      maxValue: 5,
      suffix: "s",
      thresholds: [
        { value: 0, color: "#22c55e" },
        { value: 1, color: "#fbbf24" },
        { value: 2, color: "#ef4444" },
      ],
      trackColor: "#444444",
      strokeWidth: 8,
      valueStyle: {
        fontFamily: "Poppins",
        fontSize: 11,
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: 1,
        textAlign: "center",
      },
      labelStyle: textStyle({
        fontSize: 8.5,
        fontWeight: 600,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
      labelText: "Serverantwort",
    },
    {
      id: "perf1-gauge-content",
      type: "gauge",
      binding: { kind: "audit", path: "sections.leistung.contentLoadTime" },
      frame: { x: 77.5, y: 113, w: 55, h: 32 },
      zIndex: 50,
      variant: "semi",
      minValue: 0,
      maxValue: 15,
      suffix: "s",
      thresholds: [
        { value: 0, color: "#22c55e" },
        { value: 3, color: "#fbbf24" },
        { value: 6, color: "#ef4444" },
      ],
      trackColor: "#444444",
      strokeWidth: 8,
      valueStyle: {
        fontFamily: "Poppins",
        fontSize: 11,
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: 1,
        textAlign: "center",
      },
      labelStyle: textStyle({
        fontSize: 8.5,
        fontWeight: 600,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
      labelText: "Alle Seiteninhalte geladen",
    },
    {
      id: "perf1-gauge-script",
      type: "gauge",
      binding: { kind: "audit", path: "sections.leistung.scriptLoadTime" },
      frame: { x: 135, y: 113, w: 55, h: 32 },
      zIndex: 50,
      variant: "semi",
      minValue: 0,
      maxValue: 20,
      suffix: "s",
      thresholds: [
        { value: 0, color: "#22c55e" },
        { value: 5, color: "#fbbf24" },
        { value: 10, color: "#ef4444" },
      ],
      trackColor: "#444444",
      strokeWidth: 8,
      valueStyle: {
        fontFamily: "Poppins",
        fontSize: 11,
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: 1,
        textAlign: "center",
      },
      labelStyle: textStyle({
        fontSize: 8.5,
        fontWeight: 600,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
      labelText: "Alle Seitenskripte vollständig",
    },
    // ---- Block: Ressourcenaufteilung (6 Resource-Tiles) ----
    {
      id: "perf1-resources-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Ressourcenaufteilung",
      frame: { x: 20, y: 152, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "perf1-resources-text",
      type: "text",
      binding: { kind: "static" },
      staticText:
        "Dieser Check zeigt die Gesamtanzahl der Dateien an, die von Webservern abgerufen werden müssen, um Ihre Seite zu laden.",
      frame: { x: 20, y: 160, w: 175, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
    },
    // 6 Tiles side-by-side; jeder ~28mm breit + 1mm gap → x=15/45/75/105/135/165
    ...buildResourceTiles(),
    // ---- Block: Seitengröße Download (links) + Aufschlüsselung (rechts) ----
    {
      id: "perf1-pagesize-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Seitengröße Download",
      frame: { x: 20, y: 207, w: 80, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "perf1-pagesize-gauge",
      type: "gauge",
      binding: { kind: "audit", path: "sections.leistung.pageSizeMb" },
      frame: { x: 18, y: 217, w: 80, h: 50 },
      zIndex: 50,
      variant: "semi",
      minValue: 0,
      maxValue: 10,
      suffix: "MB",
      thresholds: [
        { value: 0, color: "#22c55e" },
        { value: 3, color: "#fbbf24" },
        { value: 6, color: "#ef4444" },
      ],
      trackColor: "#444444",
      strokeWidth: 8,
      valueStyle: {
        fontFamily: "Poppins",
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: 1,
        textAlign: "center",
      },
      labelStyle: textStyle({
        fontSize: 8.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
    {
      id: "perf1-breakdown-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Aufschlüsselung der Seitengröße Download",
      frame: { x: 110, y: 207, w: 85, h: 12 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "perf1-breakdown-pie",
      type: "pieChart",
      binding: { kind: "audit", path: "sections.leistung.pageSizeBreakdown" },
      frame: { x: 110, y: 222, w: 85, h: 60 },
      zIndex: 50,
      slices: [
        { label: "HTML", fieldPath: "html", color: "#22c55e" },
        { label: "JS", fieldPath: "js", color: "#ef4444" },
        { label: "CSS", fieldPath: "css", color: "#3b82f6" },
        { label: "IMG", fieldPath: "img", color: "#a855f7" },
        { label: "Other", fieldPath: "other", color: "#fbbf24" },
      ],
      pieDiameter: 38,
      innerRadius: 0,
      showLegend: true,
      legendPosition: "right",
      legendGap: 3,
      legendItemGap: 1.5,
      legendSwatchSize: 2.5,
      legendStyle: textStyle({
        fontSize: 8,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.2,
      }),
      showSliceLabels: true,
      sliceLabelStyle: textStyle({
        fontSize: 7,
        fontWeight: 600,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1,
      }),
      sliceLabelOffset: 3,
    },
  ];
}

// SVG-Icons fuer ResourceTiles (Vasileios-Style: weisse Glyphen auf cyan-Bg).
// Inline data-URLs analog zu M13 Social-Icons. ASCII-only fuer btoa().

const ICON_HTML_TAG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';

const ICON_CODE_BRACES =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>';

const ICON_PAINT =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-9.5"/><circle cx="6" cy="14" r="3"/><path d="M9 11V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6"/></svg>';

const ICON_IMAGE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';

const ICON_FILE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

const ICON_HASH =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>';

const ICON_LINK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

const ICON_LINK_BROKEN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17H7a5 5 0 0 1 0-10h2"/><path d="M15 7h2a5 5 0 0 1 4 8"/><line x1="8" y1="12" x2="12" y2="12"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';

const ICON_ARROW_OUT =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

const ICON_ARROW_RIGHT_BOX =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

const ICON_CUBE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>';

const ICON_LAYERS =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>';

const ICON_FLAG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';

function svgToTileDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// 6 ResourceTiles in einer Reihe, bound to sections.leistung.resourceCounts.*
// Vasileios-Style: alle Tiles mit cyan-Bg + weissen SVG-Glyphen statt
// File-Type-Brand-Colors. Konsistenter Look passend zur Vasileios-Vorlage.
function buildResourceTiles(): Block[] {
  const tileY = 172;
  const tileW = 28;
  const tileH = 30;
  const startX = 16;
  const gap = 2;

  type TileSpec = {
    id: string;
    fieldPath: string;
    label: string;
    icon: string;
    iconSvg: string;
  };
  const specs: TileSpec[] = [
    { id: "html", fieldPath: "html", label: "Anzahl der HTML-Seiten", icon: "HTML", iconSvg: svgToTileDataUrl(ICON_HTML_TAG) },
    { id: "js", fieldPath: "js", label: "Anzahl der JS-Ressourcen", icon: "JS", iconSvg: svgToTileDataUrl(ICON_CODE_BRACES) },
    { id: "css", fieldPath: "css", label: "Anzahl der CSS-Ressourcen", icon: "{ }", iconSvg: svgToTileDataUrl(ICON_PAINT) },
    { id: "img", fieldPath: "img", label: "Anzahl der Bilder", icon: "IMG", iconSvg: svgToTileDataUrl(ICON_IMAGE) },
    { id: "other", fieldPath: "other", label: "Andere Ressourcen", icon: "•••", iconSvg: svgToTileDataUrl(ICON_FILE) },
    { id: "total", fieldPath: "total", label: "Gesamtzahl Objekte", icon: "#", iconSvg: svgToTileDataUrl(ICON_HASH) },
  ];

  return specs.map((s, i) => ({
    id: `perf1-tile-${s.id}`,
    type: "resourceTile" as const,
    binding: {
      kind: "audit" as const,
      path: `sections.leistung.resourceCounts.${s.fieldPath}`,
    },
    frame: { x: startX + i * (tileW + gap), y: tileY, w: tileW, h: tileH },
    zIndex: 50,
    label: s.label,
    icon: s.icon,
    iconSvg: s.iconSvg,
    iconBg: BRAND_CYAN,
    iconColor: "#1a1a1a",
    valueStyle: textStyle({
      fontSize: 13,
      fontWeight: 800,
      color: "#ffffff",
      textAlign: "center",
      lineHeight: 1,
    }),
    labelStyle: textStyle({
      fontSize: 7,
      fontWeight: 400,
      color: "#cfcfcf",
      textAlign: "center",
      lineHeight: 1.2,
    }),
  }));
}

function buildPerformance2(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "perf2-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Perfomance & Technisches",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "perf2-cost-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was das konkret kostet:",
      frame: { x: 20, y: 48, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "perf2-cost-text",
      type: "text",
      binding: { kind: "audit", path: "sections.leistung.costText" },
      frame: { x: 20, y: 58, w: 175, h: 38 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    {
      id: "perf2-actions-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was dagegen zu tun ist",
      frame: { x: 20, y: 102, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "perf2-actions",
      type: "arrowBulletList",
      binding: { kind: "audit", path: "sections.leistung.actions" },
      frame: { x: 20, y: 112, w: 170, h: 80 },
      zIndex: 50,
      itemGap: 5,
      arrowColor: BRAND_CYAN,
      arrowSize: 5,
      arrowGap: 6,
      titleStyle: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
      detailStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      overflow: "shrink",
    },
    {
      id: "perf2-closing-note",
      type: "text",
      binding: { kind: "audit", path: "sections.leistung.closingNote" },
      // Vasileios platziert die closingNote kompakt direkt unter den arrows
      // (nicht am Page-Bottom). y:197 → y:170 fuer engere Anbindung.
      frame: { x: 20, y: 170, w: 170, h: 12 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.4,
      }),
    },
  ];
}

// PAGE 15 (buildLinks1): Score-Donut + Sub-Headline/Diagnose oben (wie M5-M10),
// dann zwei kleine Mini-Donuts (gauge full) für Domain- und Seitenstärke,
// dann zwei große ResourceTiles (Total Backlinks + Verweisende Domänen) und
// fünf kleine ResourceTiles (Nofollow / Dofollow / Subnets / IPs / Gov-Backlinks).
//
// Mini-Donut-Skala: domainStrength + pageStrength sind 0-100 (Authority-Score).
// Threshold-Stufen so gewählt, dass <10 grau wirkt (kaum sichtbar bei dünnem Track),
// 10-30 orange, 30+ grün — matcht Vasileios' Vorlage (13 ist orange, 8 grau).
//
// PAGE 16 (buildLinks2): klassisches Cost+Action-Pattern wie M7 P8 / M10 P14
// mit 4 ArrowBullets und linksbündiger closingNote (Vasileios' P16 zeigt das Closing
// linksbündig mit Indent — alle anderen Pages nutzen center, hier abweichend).

function buildLinks1(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "links1-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Links & Autorität",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "links1-score-donut",
      type: "scoreCircle",
      binding: { kind: "audit", path: "sections.links.score" },
      frame: { x: 17, y: 51, w: 37, h: 37 },
      zIndex: 50,
      size: 37,
      strokeWidth: 5,
      labelStyle: textStyle({
        fontSize: 24,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1,
      }),
    },
    {
      id: "links1-section-heading",
      type: "text",
      binding: { kind: "audit", path: "sections.links.heading" },
      frame: { x: 65, y: 50, w: 130, h: 8 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
    },
    {
      id: "links1-section-text",
      type: "text",
      binding: { kind: "audit", path: "sections.links.text" },
      frame: { x: 65, y: 58, w: 130, h: 30 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    // ---- Mini-Donuts: Domainstärke + Seitenstärke (gauge full, 0-100) ----
    {
      id: "links1-domain-gauge",
      type: "gauge",
      binding: { kind: "audit", path: "sections.links.domainStrength" },
      frame: { x: 17, y: 95, w: 22, h: 28 },
      zIndex: 50,
      variant: "full",
      minValue: 0,
      maxValue: 100,
      thresholds: [
        { value: 0, color: "#9ca3af" },
        { value: 10, color: "#fb923c" },
        { value: 30, color: "#22c55e" },
      ],
      trackColor: "#444444",
      strokeWidth: 3,
      valueStyle: {
        fontFamily: "Poppins",
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: 1,
        textAlign: "center",
      },
      labelStyle: textStyle({
        fontSize: 9,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
      labelText: "Domainstärke",
    },
    {
      id: "links1-page-gauge",
      type: "gauge",
      binding: { kind: "audit", path: "sections.links.pageStrength" },
      frame: { x: 47, y: 95, w: 22, h: 28 },
      zIndex: 50,
      variant: "full",
      minValue: 0,
      maxValue: 100,
      thresholds: [
        { value: 0, color: "#9ca3af" },
        { value: 10, color: "#fb923c" },
        { value: 30, color: "#22c55e" },
      ],
      trackColor: "#444444",
      strokeWidth: 3,
      valueStyle: {
        fontFamily: "Poppins",
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: 1,
        textAlign: "center",
      },
      labelStyle: textStyle({
        fontSize: 9,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
      labelText: "Seitenstärke",
    },
    // ---- Big Tiles: Total Backlinks + Verweisende Domänen ----
    {
      id: "links1-tile-total",
      type: "resourceTile",
      binding: { kind: "audit", path: "sections.links.totalBacklinks" },
      frame: { x: 17, y: 132, w: 84, h: 32 },
      zIndex: 50,
      label: "Total Backlinks",
      icon: "🔗",
      iconSvg: svgToTileDataUrl(ICON_LINK),
      iconBg: BRAND_CYAN,
      iconColor: "#1a1a1a",
      tileBg: "#222222",
      tileBorderRadius: 2,
      tilePadding: 4,
      tileLayout: "left",
      iconSize: 10,
      valueStyle: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1,
      }),
      labelStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "links1-tile-referring",
      type: "resourceTile",
      binding: { kind: "audit", path: "sections.links.referringDomains" },
      frame: { x: 105, y: 132, w: 84, h: 32 },
      zIndex: 50,
      label: "Verweisende Domänen",
      icon: "↗",
      iconSvg: svgToTileDataUrl(ICON_ARROW_OUT),
      iconBg: BRAND_CYAN,
      iconColor: "#1a1a1a",
      tileBg: "#222222",
      tileBorderRadius: 2,
      tilePadding: 4,
      tileLayout: "left",
      iconSize: 10,
      valueStyle: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1,
      }),
      labelStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // ---- Small Tiles: 5 in einer Reihe (Nofollow/Dofollow/Subnets/IPs/Gov) ----
    ...buildLinkStatTiles(),
  ];
}

// 5 kleine ResourceTiles in einer Reihe — angelehnt an buildResourceTiles() von M10.
// Tile-Width 33mm, Gap 1.75mm: 5*33 + 4*1.75 = 172mm; startX=18.5 → endet bei 190.5.
function buildLinkStatTiles(): Block[] {
  const tileY = 170;
  const tileW = 33;
  const tileH = 32;
  const startX = 18.5;
  const gap = 1.75;

  type TileSpec = {
    id: string;
    fieldPath: string;
    label: string;
    icon: string;
    iconSvg: string;
  };
  const specs: TileSpec[] = [
    { id: "nofollow", fieldPath: "nofollow", label: "Nofollow-Backlinks", icon: "⊘", iconSvg: svgToTileDataUrl(ICON_LINK_BROKEN) },
    { id: "dofollow", fieldPath: "dofollow", label: "Dofollow-Backlinks", icon: "▶", iconSvg: svgToTileDataUrl(ICON_ARROW_RIGHT_BOX) },
    { id: "subnets", fieldPath: "subnets", label: "Subnets", icon: "▦", iconSvg: svgToTileDataUrl(ICON_CUBE) },
    { id: "ips", fieldPath: "ips", label: "IPs", icon: "≡", iconSvg: svgToTileDataUrl(ICON_LAYERS) },
    { id: "gov", fieldPath: "govBacklinks", label: "Gov-Backlinks", icon: "⚑", iconSvg: svgToTileDataUrl(ICON_FLAG) },
  ];

  return specs.map((s, i) => ({
    id: `links1-tile-${s.id}`,
    type: "resourceTile" as const,
    binding: {
      kind: "audit" as const,
      path: `sections.links.${s.fieldPath}`,
    },
    frame: { x: startX + i * (tileW + gap), y: tileY, w: tileW, h: tileH },
    zIndex: 50,
    label: s.label,
    icon: s.icon,
    iconSvg: s.iconSvg,
    iconBg: BRAND_CYAN,
    iconColor: "#1a1a1a",
    tileBg: "#222222",
    tileBorderRadius: 2,
    tilePadding: 3,
    tileLayout: "left" as const,
    iconSize: 9,
    valueStyle: textStyle({
      fontSize: 16,
      fontWeight: 800,
      color: "#ffffff",
      textAlign: "left",
      lineHeight: 1,
    }),
    labelStyle: textStyle({
      fontSize: 8,
      fontWeight: 400,
      color: "#cfcfcf",
      textAlign: "left",
      lineHeight: 1.2,
    }),
  }));
}

function buildLinks2(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "links2-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Links & Autorität",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "links2-cost-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was das konkret kostet:",
      frame: { x: 20, y: 48, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "links2-cost-text",
      type: "text",
      binding: { kind: "audit", path: "sections.links.costText" },
      frame: { x: 20, y: 58, w: 175, h: 38 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 400,
        color: "#e6e6e6",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
    {
      id: "links2-actions-heading",
      type: "text",
      binding: { kind: "static" },
      staticText: "Was dagegen zu tun ist",
      frame: { x: 20, y: 102, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 14,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "links2-actions",
      type: "arrowBulletList",
      binding: { kind: "audit", path: "sections.links.actions" },
      frame: { x: 25, y: 112, w: 165, h: 75 },
      zIndex: 50,
      itemGap: 5,
      arrowColor: BRAND_CYAN,
      arrowSize: 5,
      arrowGap: 6,
      titleStyle: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
      detailStyle: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
      overflow: "shrink",
    },
    {
      id: "links2-closing-note",
      type: "text",
      binding: { kind: "audit", path: "sections.links.closingNote" },
      frame: { x: 25, y: 192, w: 165, h: 16 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.4,
      }),
    },
  ];
}

// PAGE 17 (buildPhasenplan1): Headline "Phasierter Maßnahmenplan" + Subline +
// Phase 1 Heading mit cyan Underline + 2-Spalten-Tabelle bound to phase1.entries +
// Phase 2 Heading + 2-Spalten-Tabelle bound to phase2.entries.
//
// PAGE 18 (buildPhasenplan2): gleiche Headline + Subline + Phase 3 Heading +
// 2-Spalten-Tabelle bound to phase3.entries + 3 "Nach Phase X"-Footer-Texte
// bound to afterPhase1/afterPhase2/afterPhase3.

function buildPhasenplan1(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "pp1-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Phasierter Maßnahmenplan",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "pp1-subline",
      type: "text",
      binding: { kind: "audit", path: "phasenplan.intro" },
      frame: { x: 20, y: 50, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
    },
    // ---- Phase 1 ----
    {
      id: "pp1-phase1-heading",
      type: "text",
      binding: { kind: "audit", path: "phasenplan.phase1.title" },
      frame: { x: 25, y: 65, w: 165, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "pp1-phase1-table",
      type: "table",
      binding: { kind: "audit", path: "phasenplan.phase1.entries" },
      frame: { x: 20, y: 73, w: 170, h: 65 },
      zIndex: 50,
      columns: [
        { header: "Maßnahme", fieldPath: "measure", width: 85 },
        { header: "Impact", fieldPath: "impact", width: 85 },
      ],
      headerStyle: textStyle({
        fontSize: 10,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
      cellStyle: textStyle({
        fontSize: 8.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.3,
      }),
      headerUnderlineColor: BRAND_CYAN,
      headerUnderlineThickness: 0.4,
      rowDividerColor: "#333333",
      rowVerticalPadding: 2,
    },
    // ---- Phase 2 ----
    {
      id: "pp1-phase2-heading",
      type: "text",
      binding: { kind: "audit", path: "phasenplan.phase2.title" },
      frame: { x: 25, y: 145, w: 165, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "pp1-phase2-table",
      type: "table",
      binding: { kind: "audit", path: "phasenplan.phase2.entries" },
      frame: { x: 20, y: 153, w: 170, h: 130 },
      zIndex: 50,
      columns: [
        { header: "Maßnahme", fieldPath: "measure", width: 85 },
        { header: "Impact", fieldPath: "impact", width: 85 },
      ],
      headerStyle: textStyle({
        fontSize: 10,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
      cellStyle: textStyle({
        fontSize: 8.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.3,
      }),
      headerUnderlineColor: BRAND_CYAN,
      headerUnderlineThickness: 0.4,
      rowDividerColor: "#333333",
      rowVerticalPadding: 2,
    },
  ];
}

function buildPhasenplan2(): Block[] {
  return [
    ...pageChrome(),
    {
      id: "pp2-headline",
      type: "text",
      binding: { kind: "static" },
      staticText: "Phasierter Maßnahmenplan",
      frame: { x: 20, y: 36, w: 170, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "pp2-subline",
      type: "text",
      binding: { kind: "audit", path: "phasenplan.intro" },
      frame: { x: 20, y: 50, w: 170, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
    },
    // ---- Phase 3 ----
    {
      id: "pp2-phase3-heading",
      type: "text",
      binding: { kind: "audit", path: "phasenplan.phase3.title" },
      frame: { x: 25, y: 65, w: 165, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "pp2-phase3-table",
      type: "table",
      binding: { kind: "audit", path: "phasenplan.phase3.entries" },
      // h:110 war zu generoes — Vasileios' Tabelle ist auf ca. 90mm kompakt.
      // Reduziert auf h:90 damit afterPhase1/2/3-Texte nicht ueberlappen.
      frame: { x: 20, y: 73, w: 170, h: 90 },
      zIndex: 50,
      columns: [
        { header: "Maßnahme", fieldPath: "measure", width: 85 },
        { header: "Impact", fieldPath: "impact", width: 85 },
      ],
      headerStyle: textStyle({
        fontSize: 10,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
      cellStyle: textStyle({
        fontSize: 8.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.3,
      }),
      headerUnderlineColor: BRAND_CYAN,
      headerUnderlineThickness: 0.4,
      rowDividerColor: "#333333",
      rowVerticalPadding: 2,
    },
    // ---- Nach Phase 1/2/3 (3 zeilen-Blocks direkt unter Tabelle) ----
    // Vasileios platziert die Texte kompakt direkt nach der Phase-3-Tabelle
    // (nicht am Page-Bottom). y:195/210/225 → y:175/190/205.
    {
      id: "pp2-after-phase1",
      type: "text",
      binding: { kind: "audit", path: "phasenplan.afterPhase1" },
      frame: { x: 20, y: 175, w: 170, h: 12 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
    },
    {
      id: "pp2-after-phase2",
      type: "text",
      binding: { kind: "audit", path: "phasenplan.afterPhase2" },
      frame: { x: 20, y: 190, w: 170, h: 12 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
    },
    {
      id: "pp2-after-phase3",
      type: "text",
      binding: { kind: "audit", path: "phasenplan.afterPhase3" },
      frame: { x: 20, y: 205, w: 170, h: 12 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.4,
      }),
    },
  ];
}

// ---------- M13: Zusammenfassung (Page 19) ----------
//
// Vermessen aus docs/measurements/page-19.png:
// - pageHeader (Logo TL + cyan SEO-Audit + white "fuer {domain}") – KEINE
//   footer-stripes (Vasileios Page 19 ist die einzige Section-Page ohne
//   stripes, wahrscheinlich weil die Mega-CTA-Headline visuell ohne Marker
//   ausklingen soll)
// - Headline "Zusammenfassung & naechster Schritt" centered y[40, 47]mm,
//   ~22pt bold weiss
// - Subline centered y[54, 58]mm, ~13pt bold weiss
// - 3 Top-Issue Items (jedes hat headline + body):
//     Item 0 headline y~70, body y[74, 82] (2 lines)
//     Item 1 headline y~92, body y[95, 108] (3 lines)
//     Item 2 headline y~118, body y[122, 129] (2 lines)
//   Headlines sind weiss-bold ~10pt, body ~9pt grau lineHeight 1.5
// - Mega-Headline "Das ist loesbar" centered y[150, 158]mm, ~36pt bold weiss
// - closingSubline centered y[165, 167]mm, ~12pt bold weiss
// - closingBody centered y[175, 192]mm 3 lines, ~10pt weiss lineHeight 1.5
// - ctaCyan cyan-bold centered y[214, 217]mm, ~12pt
// - ctaBold weiss-bold centered y[225, 229]mm, ~13pt

function topIssueItem(idx: number, yHeading: Mm, yBody: Mm, bodyHeight: Mm): Block[] {
  return [
    {
      id: `zf-issue${idx}-headline`,
      type: "text",
      binding: {
        kind: "audit",
        path: `summary.topIssues[${idx}].headline`,
      },
      frame: { x: 25, y: yHeading, w: 160, h: 5 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: `zf-issue${idx}-body`,
      type: "text",
      binding: {
        kind: "audit",
        path: `summary.topIssues[${idx}].body`,
      },
      frame: { x: 25, y: yBody, w: 160, h: bodyHeight },
      zIndex: 50,
      style: textStyle({
        fontSize: 9,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.5,
      }),
    },
  ];
}

function buildZusammenfassung(): Block[] {
  return [
    ...pageHeader("zf-chrome"),
    {
      id: "zf-headline",
      type: "text",
      binding: { kind: "audit", path: "summary.heading" },
      frame: { x: 15, y: 38, w: 180, h: 10 },
      zIndex: 50,
      style: textStyle({
        fontSize: 22,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
    {
      id: "zf-subline",
      type: "text",
      binding: { kind: "audit", path: "summary.subline" },
      frame: { x: 15, y: 52, w: 180, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12.5,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }),
    },
    ...topIssueItem(0, 68, 73, 12),
    ...topIssueItem(1, 90, 95, 16),
    ...topIssueItem(2, 116, 121, 12),
    {
      id: "zf-closing-headline",
      type: "text",
      binding: { kind: "audit", path: "summary.closingHeadline" },
      frame: { x: 15, y: 148, w: 180, h: 14 },
      zIndex: 50,
      style: textStyle({
        fontSize: 32,
        fontWeight: 800,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.05,
      }),
    },
    {
      id: "zf-closing-subline",
      type: "text",
      binding: { kind: "audit", path: "summary.closingSubline" },
      frame: { x: 15, y: 164, w: 180, h: 6 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 400,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.3,
      }),
    },
    {
      id: "zf-closing-body",
      type: "text",
      binding: { kind: "audit", path: "summary.closingBody" },
      frame: { x: 25, y: 174, w: 160, h: 25 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.55,
      }),
    },
    {
      id: "zf-cta-cyan",
      type: "text",
      binding: { kind: "audit", path: "summary.ctaCyan" },
      frame: { x: 15, y: 213, w: 180, h: 6 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 700,
        color: BRAND_CYAN,
        textAlign: "center",
        lineHeight: 1.3,
      }),
    },
    {
      id: "zf-cta-bold",
      type: "text",
      binding: { kind: "audit", path: "summary.ctaBold" },
      frame: { x: 15, y: 224, w: 180, h: 6 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.3,
      }),
    },
  ];
}

// ---------- M13: Inhaber (Page 20) ----------
//
// Vermessen aus docs/measurements/page-20.png:
// - KEIN pageChrome – stattdessen "ARTISTIC AVENUE" Wortmarke (mit Schwung-
//   Signet) zentriert oben y[30, 55]mm, x[53, 157]mm (~104x25mm)
// - Footer-Stripes (cyan, identisch zu pageChrome)
// - LEFT column x=20 w=80mm:
//     thankYou-headline cyan-bold y=83 ~14pt
//     body 5-6 Zeilen y=95 weiss ~10pt lineHeight 1.5 (~50mm Hoehe)
//     outroItalic 3 Zeilen italic-bold y=160 (~22mm)
//     ps 3 Zeilen italic-light-grey y=193
// - RIGHT column x=110 w=85mm:
//     photo 80x80mm y[80, 168]mm (rectangle, vasilis.png)
//     name bold ~12pt y=178
//     role light-grey ~9pt y=185
//     3 cyan-circles (Social: LinkedIn / Instagram / Globe) y=190 (gemessen
//       y[171.55, 183.23]mm Wide-cyan-Band, davor Photo, danach Contact-Info)
//     3 Contact-Lines y=205/218/231: cyan-circle 8mm + bound-text rechts
//
// M13.1: Social-Pills + Contact-Pills haben jetzt echte SVG-Icons als
// weisse Glyphen ueber der cyan-Ellipse (statt reiner cyan-Pill). SVGs sind
// inline als data-URL embedded — kein Asset-File-Lookup, kein Inline-Pfad-
// Resolver in build.ts noetig. Icons sind minimal-outlined oder filled,
// einheitliche Optik. Web == Globe (gleiche SVG-Geometrie, fuer social[2]
// und contact[2]). Stand: Lucide-style (24x24 viewBox).

const ICON_LINKEDIN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8 18H5V9h3v9zM6.5 7.5C5.7 7.5 5 6.8 5 6s.7-1.5 1.5-1.5S8 5.2 8 6s-.7 1.5-1.5 1.5zM18 18h-3v-4.5c0-1-.9-1.5-1.5-1.5s-1.5.5-1.5 1.5V18h-3V9h3v1.5c.5-.7 1.5-1.5 3-1.5 2 0 3 1.7 3 3.8V18z"/></svg>';

const ICON_INSTAGRAM =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="white" stroke="none"/></svg>';

const ICON_GLOBE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2 a15 15 0 0 1 0 20 a15 15 0 0 1 0 -20z"/></svg>';

const ICON_PHONE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.05l-2.2 2.17z"/></svg>';

const ICON_MAIL =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3,7 12,13 21,7"/></svg>';

function svgToDataUrl(svg: string): string {
  // base64 ist robust ggue. SVG-Sonderzeichen (& # < " etc.) und vermeidet
  // URL-Encoding-Bugs. Pure ASCII in den Konstanten oben → btoa() reicht,
  // global in Node 16+ und Browser verfuegbar.
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const SOCIAL_ICONS: string[] = [
  svgToDataUrl(ICON_LINKEDIN),
  svgToDataUrl(ICON_INSTAGRAM),
  svgToDataUrl(ICON_GLOBE),
];

const CONTACT_ICONS: string[] = [
  svgToDataUrl(ICON_PHONE),
  svgToDataUrl(ICON_MAIL),
  svgToDataUrl(ICON_GLOBE),
];

function socialCircle(idx: number, x: Mm): Block[] {
  return [
    {
      id: `inh-social${idx}`,
      type: "shape",
      shape: "ellipse",
      fill: BRAND_CYAN,
      frame: { x, y: 187, w: 9, h: 9 },
      zIndex: 50,
    },
    {
      id: `inh-social${idx}-icon`,
      type: "image",
      binding: { kind: "static" },
      staticSrc: SOCIAL_ICONS[idx],
      frame: { x: x + 2, y: 189, w: 5, h: 5 },
      zIndex: 51,
      objectFit: "contain",
    },
  ];
}

function contactLine(idx: number, y: Mm, bindingPath: string): Block[] {
  return [
    {
      id: `inh-contact${idx}-icon-bg`,
      type: "shape",
      shape: "ellipse",
      fill: BRAND_CYAN,
      frame: { x: 115, y: y - 1, w: 7, h: 7 },
      zIndex: 50,
    },
    {
      id: `inh-contact${idx}-icon`,
      type: "image",
      binding: { kind: "static" },
      staticSrc: CONTACT_ICONS[idx],
      frame: { x: 116.5, y: y + 0.5, w: 4, h: 4 },
      zIndex: 51,
      objectFit: "contain",
    },
    {
      id: `inh-contact${idx}-text`,
      type: "text",
      binding: { kind: "audit", path: bindingPath },
      frame: { x: 126, y, w: 70, h: 5 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.3,
      }),
    },
  ];
}

function buildInhaber(): Block[] {
  return [
    // Wortmarke "ARTISTIC AVENUE" (mit Signet) zentriert oben
    {
      id: "inh-brand-logo",
      type: "brandDecoration",
      kind: "logo",
      frame: { x: 50, y: 27, w: 110, h: 28 },
      zIndex: 50,
    },
    // Left column
    {
      id: "inh-thankyou",
      type: "text",
      binding: { kind: "audit", path: "inhaber.thankYou" },
      frame: { x: 20, y: 82, w: 80, h: 7 },
      zIndex: 50,
      style: textStyle({
        fontSize: 13,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "inh-body",
      type: "text",
      binding: { kind: "audit", path: "inhaber.body" },
      frame: { x: 20, y: 98, w: 80, h: 55 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 400,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.65,
      }),
    },
    {
      id: "inh-outro-italic",
      type: "text",
      binding: { kind: "audit", path: "inhaber.outroItalic" },
      frame: { x: 20, y: 162, w: 80, h: 22 },
      zIndex: 50,
      style: textStyle({
        fontSize: 10,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.4,
        fontStyle: "italic",
      }),
    },
    {
      id: "inh-ps",
      type: "text",
      binding: { kind: "audit", path: "inhaber.ps" },
      frame: { x: 20, y: 197, w: 80, h: 22 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.45,
        fontStyle: "italic",
      }),
    },
    // Right column: photo
    {
      id: "inh-photo",
      type: "image",
      binding: { kind: "audit", path: "inhaber.photo" },
      frame: { x: 113, y: 80, w: 80, h: 90 },
      zIndex: 50,
      objectFit: "cover",
      objectPosition: "top",
      borderRadius: 2,
    },
    {
      id: "inh-name",
      type: "text",
      binding: { kind: "audit", path: "inhaber.name" },
      frame: { x: 113, y: 173, w: 80, h: 6 },
      zIndex: 50,
      style: textStyle({
        fontSize: 12,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    {
      id: "inh-role",
      type: "text",
      binding: { kind: "audit", path: "inhaber.role" },
      frame: { x: 113, y: 180, w: 80, h: 5 },
      zIndex: 50,
      style: textStyle({
        fontSize: 9.5,
        fontWeight: 400,
        color: "#cfcfcf",
        textAlign: "left",
        lineHeight: 1.2,
      }),
    },
    // 3 Social-Pills (LinkedIn / Instagram / Globe als reine cyan-Ellipsen)
    ...socialCircle(0, 113),
    ...socialCircle(1, 126),
    ...socialCircle(2, 139),
    // 3 Contact-Lines (phone / email / website)
    ...contactLine(0, 205, "inhaber.phone"),
    ...contactLine(1, 217, "inhaber.email"),
    ...contactLine(2, 229, "inhaber.website"),
    ...footerStripes("inh-footer"),
  ];
}

// ---------- Page-Key registry ----------

export type PageKey =
  | "cover"
  | "gesamtsituation"
  | "topRisiken"
  | "woDuSeinKoenntest"
  | "onPageSeo1"
  | "onPageSeo2"
  | "uxConversion1"
  | "uxConversion2"
  | "seitenstrukturContent1"
  | "seitenstrukturContent2"
  | "lokalesSeo1"
  | "lokalesSeo2"
  | "performance1"
  | "performance2"
  | "links1"
  | "links2"
  | "phasenplan1"
  | "phasenplan2"
  | "zusammenfassung"
  | "inhaber";

// M3: alle Section-Pages bekommen Standard-pageChrome.
// Cover und Inhaber haben eigenes Chrome-Layout (M4 / M13).

export const BUILDERS: Record<PageKey, () => Block[]> = {
  cover: buildCover,
  gesamtsituation: buildGesamtsituation,
  topRisiken: buildTopRisks,
  woDuSeinKoenntest: buildWoDuSeinKoenntest,
  onPageSeo1: buildOnPageSeo1,
  onPageSeo2: buildOnPageSeo2,
  uxConversion1: buildUxConversion1,
  uxConversion2: buildUxConversion2,
  seitenstrukturContent1: buildSeitenstrukturContent1,
  seitenstrukturContent2: buildSeitenstrukturContent2,
  lokalesSeo1: buildLokalesSeo1,
  lokalesSeo2: buildLokalesSeo2,
  performance1: buildPerformance1,
  performance2: buildPerformance2,
  links1: buildLinks1,
  links2: buildLinks2,
  phasenplan1: buildPhasenplan1,
  phasenplan2: buildPhasenplan2,
  zusammenfassung: buildZusammenfassung,
  inhaber: buildInhaber,
};

export function decomposePageBlocks(pageKey: string): Block[] {
  const builder = BUILDERS[pageKey as PageKey];
  return builder ? builder() : [];
}

// Used in M4+ to mark unused symbols as referenced for tree-shaking analyzers.
export type { Frame };
