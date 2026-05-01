import type { Block, Mm } from "./template-types";

// Page builders for Vasileios' 20-page layout (M3-M13).
// Each builder returns an array of Blocks for one page.
// Currently all builders are empty stubs - blocks added per milestone.

export const PAGE_WIDTH_MM: Mm = 210;
export const PAGE_HEIGHT_MM: Mm = 297;
export const BRAND_CYAN = "#38E1E1";

// Vermessen aus docs/measurements/page-05.png (Vasileios SEO AUDIT WASCHBÄR SERVICE.pdf):
// - Logo TL: visible bbox 22.6/11.5 mm 12.8x10.9 mm. PNG-Asset hat 23% Whitespace,
//   daher Frame entsprechend größer (16.7x13.7 mm) um nach objectFit:contain
//   die richtige rendered size zu landen.
// - TR-Text-Block ist horizontal zentriert über beide Zeilen ("SEO-Audit" wirkt
//   mittig, weil das Subline länger ist und beide center-aligned sind).
// - "SEO-Audit" cyan, ~13pt bold; "für {domain}" hellgrau ~9pt regular
// - Footer 2 Stripes je 2.03 mm dick, gap 0.89 mm, ends 0.63 mm vor page bottom
export function pageChrome(): Block[] {
  const stripeBottomMargin: Mm = 0.63;
  const stripeThickness: Mm = 2.03;
  const stripeGap: Mm = 0.89;
  const stripe2Y = PAGE_HEIGHT_MM - stripeBottomMargin - stripeThickness;
  const stripe1Y = stripe2Y - stripeGap - stripeThickness;

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
        fontSize: 9,
        fontWeight: 400,
        color: "#cfcfcf",
        lineHeight: 1.05,
        textAlign: "center",
      },
    },
    {
      id: "chrome-footer-stripe-1",
      type: "shape",
      shape: "rect",
      fill: BRAND_CYAN,
      frame: { x: 0, y: stripe1Y, w: PAGE_WIDTH_MM, h: stripeThickness },
      zIndex: 100,
    },
    {
      id: "chrome-footer-stripe-2",
      type: "shape",
      shape: "rect",
      fill: BRAND_CYAN,
      frame: { x: 0, y: stripe2Y, w: PAGE_WIDTH_MM, h: stripeThickness },
      zIndex: 100,
    },
  ];
}

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

// M3: alle Section-Pages (alles ausser Cover) bekommen Page-Chrome.
// Cover und Inhaber haben eigenes Chrome-Layout (M4 / M13).
const CHROME_ONLY_BUILDER = (): Block[] => pageChrome();

export const BUILDERS: Record<PageKey, () => Block[]> = {
  cover: EMPTY_BUILDER,
  gesamtsituation: CHROME_ONLY_BUILDER,
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
