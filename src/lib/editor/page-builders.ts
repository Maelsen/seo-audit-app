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

export function pageChrome(): Block[] {
  return [
    {
      id: "chrome-logo",
      type: "brandDecoration",
      kind: "signet",
      frame: { x: 20.6, y: 10.2, w: 16.7, h: 13.7 },
      zIndex: 100,
    },
    {
      id: "chrome-title",
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
      id: "chrome-url",
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
    ...footerStripes("chrome-footer"),
  ];
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
        textShadow:
          "0 0 8mm #38E1E1, 0 0 4mm #38E1E1, 0 0 2mm rgba(56,225,225,0.8)",
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
    // Monitor / Cover-Screenshot
    {
      id: "cover-screenshot",
      type: "image",
      binding: { kind: "audit", path: "screenshots.cover" },
      frame: { x: 25, y: 130, w: 160, h: 110 },
      zIndex: 50,
      objectFit: "cover",
      objectPosition: "top",
      borderRadius: 4,
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

const EMPTY_BUILDER = (): Block[] => [];

// M3: alle Section-Pages bekommen Standard-pageChrome.
// Cover und Inhaber haben eigenes Chrome-Layout (M4 / M13).
const CHROME_ONLY_BUILDER = (): Block[] => pageChrome();

export const BUILDERS: Record<PageKey, () => Block[]> = {
  cover: buildCover,
  gesamtsituation: buildGesamtsituation,
  topRisiken: CHROME_ONLY_BUILDER,
  woDuSeinKoenntest: CHROME_ONLY_BUILDER,
  onPageSeo1: CHROME_ONLY_BUILDER,
  onPageSeo2: CHROME_ONLY_BUILDER,
  uxConversion1: CHROME_ONLY_BUILDER,
  uxConversion2: CHROME_ONLY_BUILDER,
  seitenstrukturContent1: CHROME_ONLY_BUILDER,
  seitenstrukturContent2: CHROME_ONLY_BUILDER,
  lokalesSeo1: CHROME_ONLY_BUILDER,
  lokalesSeo2: CHROME_ONLY_BUILDER,
  performance1: CHROME_ONLY_BUILDER,
  performance2: CHROME_ONLY_BUILDER,
  links1: CHROME_ONLY_BUILDER,
  links2: CHROME_ONLY_BUILDER,
  phasenplan1: CHROME_ONLY_BUILDER,
  phasenplan2: CHROME_ONLY_BUILDER,
  zusammenfassung: CHROME_ONLY_BUILDER,
  inhaber: EMPTY_BUILDER,
};

export function decomposePageBlocks(pageKey: string): Block[] {
  const builder = BUILDERS[pageKey as PageKey];
  return builder ? builder() : [];
}

// Used in M4+ to mark unused symbols as referenced for tree-shaking analyzers.
export type { Frame };
