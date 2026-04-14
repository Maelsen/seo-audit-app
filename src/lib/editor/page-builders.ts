import type { Block, LegacyPageKey, TextStyle, Frame, Binding, StaticCheckItem } from "./template-types";

// Measured from legacy renderer (scripts/measure-legacy.mjs → tmp/measurements/*.txt)
// All coordinates in millimeters. Page is 210x296mm. PageLayout has padding 34/18/14/18.

const P = "Poppins";
const O = "Open Sans";
const C = "#38E1E1";
const W = "#ffffff";
const G = "#d4d4d4"; // body text on dark
const G2 = "#c2c2c2"; // check detail text

function fr(x: number, y: number, w: number, h: number): Frame {
  return { x, y, w, h };
}

function ts(
  f: string, sz: number, wt: 300|400|500|600|700|800|900,
  c: string, a: "left"|"center"|"right" = "left", lh = 1.2,
  extra?: Partial<TextStyle>,
): TextStyle {
  return { fontFamily: f, fontSize: sz, fontWeight: wt, color: c, lineHeight: lh, textAlign: a, ...extra };
}

function txt(
  id: string, x: number, y: number, w: number, h: number,
  binding: Binding, style: TextStyle, staticText?: string, z = 5,
): Block {
  const b: Block = { id, type: "text", zIndex: z, frame: fr(x, y, w, h), binding, style } as Block;
  if (staticText !== undefined) (b as { staticText?: string }).staticText = staticText;
  return b;
}

// Shared page chrome -------------------------------------------------------
// Signet image at (18, 10, 18.32, 15), SEO-Audit label at (131.82, 10), URL at (131.82, 14.05)
const hdr: Block[] = [
  { id: "bg-glow", type: "brandDecoration", kind: "radialGlow", zIndex: 0, frame: fr(0, 0, 210, 296) } as Block,
  { id: "signet", type: "brandDecoration", kind: "signet", zIndex: 10, frame: fr(18, 10, 18.32, 15) } as Block,
  txt("header-label", 131.82, 10, 60.18, 3.6, { kind: "static" }, ts(P, 10, 700, C, "right", 1), "SEO-Audit"),
  txt("header-url", 131.82, 14.05, 60.18, 4.3, { kind: "static" }, ts(P, 8, 400, W, "right", 1.2), "für {audit.url}", 5),
];
const ftr: Block = { id: "footer-bar", type: "brandDecoration", kind: "footerBar", zIndex: 1, frame: fr(0, 290, 210, 6) } as Block;

// Section header (matches legacy SectionHeader component):
//   section title at y=34, w=174, fs=10 uppercase, ls=0.3
//   score circle at y=41.41, x=18, size=19.58 (74px)
//   heading at y=41.41, x=41.28, w=150.72, fs=10 fw=700 color=#38E1E1
//   description text at y=47.76, x=41.28, w=150.72, fs=8 fw=400 color=#d4d4d4, lh=1.55
function secHdr(pfx: string, title: string, scorePath: string): Block[] {
  const hp = scorePath.replace(/\.score$/, ".heading");
  const tp = scorePath.replace(/\.score$/, ".text");
  return [
    txt(`${pfx}-stitle`, 18, 34, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2, { textTransform: "uppercase", letterSpacing: 0.3 }), title),
    { id: `${pfx}-score`, type: "scoreCircle", zIndex: 6, frame: fr(18, 41.41, 19.58, 19.58), binding: { kind: "audit", path: scorePath }, size: 19.58, strokeWidth: 2.1, labelStyle: ts(P, 9, 700, W, "center", 1) } as Block,
    txt(`${pfx}-heading`, 41.28, 41.41, 150.72, 5.3, { kind: "audit", path: hp }, ts(P, 10, 700, C, "left", 1.2)),
    txt(`${pfx}-text`, 41.28, 47.76, 150.72, 13.5, { kind: "audit", path: tp }, ts(P, 8, 400, G, "left", 1.55)),
  ];
}

function chk(id: string, x: number, y: number, w: number, h: number, path: string): Block {
  return {
    id, type: "checkList", zIndex: 5, frame: fr(x, y, w, h),
    binding: { kind: "audit", path }, itemGap: 3, overflow: "shrink",
    itemStyle: { titleStyle: ts(P, 10, 700, W, "left", 1.3), bodyStyle: ts(P, 8, 400, G2, "left", 1.5) },
  } as Block;
}

function staticChk(id: string, x: number, y: number, w: number, h: number, items: StaticCheckItem[]): Block {
  return {
    id, type: "checkList", zIndex: 5, frame: fr(x, y, w, h),
    binding: { kind: "static" },
    staticItems: items,
    itemGap: 3, overflow: "shrink",
    itemStyle: { titleStyle: ts(P, 10, 700, W, "left", 1.3), bodyStyle: ts(P, 8, 400, G2, "left", 1.5) },
  } as unknown as Block;
}

function shell(blocks: Block[]): Block[] {
  return [...hdr, ...blocks, ftr];
}

// ---------------------------------------------------------------------------
// COVER (already decomposed – keep existing good layout)
function buildCover(): Block[] {
  const titleShadow = "3px 3px 6px rgba(0, 0, 0, 0.55)";
  return [
    { id: "bg-glow", type: "brandDecoration", kind: "radialGlow", zIndex: 0, frame: fr(0, 0, 210, 296) } as Block,
    { id: "logo", type: "brandDecoration", kind: "logo", zIndex: 10, frame: fr(63, 18, 84, 24) } as Block,
    txt("cover-title", 18, 52, 174, 44, { kind: "static" }, ts(P, 61.5, 700, W, "center", 1, { letterSpacing: 2, textShadow: titleShadow }), "WEBSITE-AUDIT"),
    txt("cover-sub", 18, 109, 174, 11, { kind: "static" }, ts(P, 20, 700, W, "center", 1), "für Ihre Website"),
    txt("cover-url", 18, 122, 174, 11, { kind: "audit", path: "url" }, ts(P, 20, 700, C, "center", 1)),
    { id: "cover-frame", type: "shape", zIndex: 3, frame: fr(37, 142, 136, 93), shape: "rect", fill: "#3a3a3a", stroke: "#2a2a2a", strokeWidth: 0.5, borderRadius: 3, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" } as Block,
    { id: "cover-browser-bar", type: "shape", zIndex: 4, frame: fr(99.7, 146, 10.6, 1.6), shape: "rect", fill: "#2a2a2a", borderRadius: 0.8 } as Block,
    { id: "cover-inner", type: "shape", zIndex: 4, frame: fr(40.8, 149.8, 128.4, 82), shape: "rect", fill: "#ffffff", borderRadius: 1 } as Block,
    { id: "cover-screenshot", type: "image", zIndex: 5, frame: fr(40.8, 149.8, 128.4, 82), binding: { kind: "audit", path: "screenshots.cover" }, objectFit: "cover", objectPosition: "top", borderRadius: 1 } as Block,
    txt("cover-intro", 18, 246, 174, 20, { kind: "static" }, ts(O, 12, 400, G, "center", 1.55), "Dieses Audit wurde exklusiv für {domain} erstellt, um konkrete Hebel aufzuzeigen, mit denen Ihre Website mehr Sichtbarkeit und Anfragen erzielt."),
    txt("cover-email", 18, 279, 56, 7, { kind: "static" }, ts(P, 12, 500, W, "left", 1), "info@artisticavenue.de"),
    txt("cover-web", 81, 279, 50, 7, { kind: "static" }, ts(P, 12, 500, W, "center", 1), "www.artisticavenue.de"),
    txt("cover-phone", 148, 279, 44, 7, { kind: "static" }, ts(P, 12, 500, W, "right", 1), "+49 (0) 179 3213 445"),
    ftr,
  ];
}

// ---------------------------------------------------------------------------
// OVERVIEW (page 1)
// Legacy measurements:
//   h2 "Website-Bericht für\n{url}" at y=34, x=18, w=174, h=16.23, fs=20, fw=700, lh=1.15
//   introText at y=54.23, x=18, w=174, h=30.63, fs=14, fw=400, c=#d4d4d4, lh=1.55
//   h3 "Audit-Ergebnisse für\n{url}" at y=95.85, same style as h2
//   big score circle at y=117.08, x=18, size=37.04 (140px), strokeWidth=14px=3.7mm
//   heading "Solides ..." at y=125.02, x=61.39, w=117.42, fs=14, fw=700
//   badge "Empfehlungen: X" at y=135.34, x=61.39, w=53.22, h=10.85 (bg #ef4444 borderRadius 6px)
//   small circles y=162.12 (row1) + y=202.6 (row2), x=[22.5,54.78,87.06,119.34,151.62], dia=17.46
//   labels at y=183.55 (row1) / y=224.04 (row2), x=[18,50.28,82.56,114.84,147.12], w=26.46
function buildOverview(): Block[] {
  const scores = [
    { id: "onpage", label: "On-Page SEO", path: "sections.onpageSeo.score" },
    { id: "ux",     label: "UX & Conversion", path: "sections.uxConversion.score" },
    { id: "usab",   label: "Usability", path: "sections.usability.score" },
    { id: "perf",   label: "Leistung", path: "sections.leistung.score" },
    { id: "soc",    label: "Social", path: "sections.social.score" },
    { id: "loc",    label: "Lokales SEO", path: "sections.lokalesSeo.score" },
    { id: "lnk",    label: "Links", path: "sections.links.score" },
  ];
  // Circle columns: x=22.5,54.78,87.06,... col-step=32.28, but label x=18, step=32.28, w=26.46
  const COL_STEP = 32.28;
  const CIRC_OFFSET_X = 4.5; // circle x = labelX + 4.5, circle is inside 26.46 wide column centered (diff=(26.46-17.46)/2≈4.5)
  const blocks: Block[] = [
    ...hdr,
    // h2: Website-Bericht für + url on second line (handled via <br> — here two stacked texts)
    txt("ov-h2a", 18, 34, 174, 8, { kind: "static" }, ts(P, 20, 700, W, "left", 1.15), "Website-Bericht für"),
    txt("ov-h2b", 18, 42, 174, 9, { kind: "audit", path: "url" }, ts(P, 20, 700, W, "left", 1.15)),
    // intro (mb 7mm from h2 bottom = 54.23)
    txt("ov-intro", 18, 54.23, 174, 31, { kind: "audit", path: "introText" }, ts(O, 14, 400, G, "left", 1.55)),
    // h3: Audit-Ergebnisse für + url
    txt("ov-h3a", 18, 95.85, 174, 8, { kind: "static" }, ts(P, 20, 700, W, "left", 1.15), "Audit-Ergebnisse für"),
    txt("ov-h3b", 18, 104, 174, 9, { kind: "audit", path: "url" }, ts(P, 20, 700, W, "left", 1.15)),
    // Big score circle
    { id: "ov-score", type: "scoreCircle", zIndex: 6, frame: fr(18, 117.08, 37.04, 37.04), binding: { kind: "audit", path: "overallScore" }, size: 37.04, strokeWidth: 3.7, labelStyle: ts(P, 14, 700, W, "center", 1) } as Block,
    // Heading right of circle
    txt("ov-heading", 61.39, 125.02, 117.42, 8, { kind: "audit", path: "overallHeading" }, ts(P, 14, 700, W, "left", 1.2)),
    // Badge
    { id: "ov-badge-bg", type: "shape", zIndex: 4, frame: fr(61.39, 135.34, 53.22, 10.85), shape: "rect", fill: "#ef4444", borderRadius: 1.6 } as Block,
    txt("ov-badge", 61.39, 135.34, 53.22, 10.85, { kind: "static" }, ts(P, 14, 700, W, "center", 1), "Empfehlungen: {audit.recommendations.length}", 5),
  ];
  const ROW_Y = [162.12, 202.6];
  const ROW_LABEL_Y = [183.55, 224.04];
  const LABEL_X = [18, 50.28, 82.56, 114.84, 147.12];
  scores.forEach((s, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const labelX = LABEL_X[col];
    const circX = labelX + CIRC_OFFSET_X;
    const circY = ROW_Y[row];
    blocks.push({ id: `ov-${s.id}-c`, type: "scoreCircle", zIndex: 6, frame: fr(circX, circY, 17.46, 17.46), binding: { kind: "audit", path: s.path }, size: 17.46, strokeWidth: 1.6, labelStyle: ts(P, 8, 700, W, "center", 1) } as Block);
    blocks.push(txt(`ov-${s.id}-l`, labelX, ROW_LABEL_Y[row], COL_STEP, 13.5, { kind: "static" }, ts(O, 14, 600, W, "center", 1.2), s.label));
    // note: legacy uses width:100 (26.46mm); use COL_STEP 32.28 to prevent long-word wrap differences
  });
  blocks.push(ftr);
  return blocks;
}

// ---------------------------------------------------------------------------
// TOP RISKS (page 2)
// Title "Top 3 Risiken" at y=38, x=18, w=174, h=10.58, fs=20 fw=700
// First risk title at y=56.58 → list starts at y=56.58
function buildTopRisks(): Block[] {
  return shell([
    txt("tr-title", 18, 38, 174, 11, { kind: "static" }, ts(P, 20, 700, W, "left", 1.15), "Top 3 Risiken"),
    { id: "top-risks-list", type: "topRiskList", zIndex: 5, frame: fr(18, 56.58, 174, 226), binding: { kind: "audit", path: "topRisks" }, itemGap: 8, overflow: "shrink", numbered: true, itemStyle: { titleStyle: ts(P, 14, 700, W, "left", 1.3), bodyStyle: ts(O, 14, 400, G, "left", 1.55) } } as Block,
  ]);
}

// ---------------------------------------------------------------------------
// RECOMMENDATIONS (page 3) – already decomposed in default.json.
// Keeping existing good builder to support "elements bearbeiten".
function buildRecommendations(): Block[] {
  return shell([
    txt("rec-title", 18, 38, 174, 11, { kind: "static" }, ts(P, 20, 700, W, "left", 1.15), "Empfehlungen"),
    { id: "rec-list", type: "recommendationList", zIndex: 5, frame: fr(18, 56.58, 174, 226), binding: { kind: "audit", path: "recommendations" }, itemGap: 3, overflow: "shrink", dividerColor: "#2a2a2a", itemStyle: { titleStyle: ts(O, 14, 400, W, "left", 1.3), bodyStyle: ts(P, 12, 700, W) } } as Block,
  ]);
}

// ---------------------------------------------------------------------------
// ON-PAGE SEO 1 (page 4)
// secHdr "On-Page SEO Ergebnisse" / "OnPage SEO"
// CheckItems: width 165 (x=18..183), icon at x=187.24 (fs=14pt on right)
// Title-Tag @68.4, body @74.48, value @79.77 (+ Länge span inline)
// Meta @87.18, body+value block
// SERP @114.43, with white box @126.34, w=165 h=24.61, br=6
// Sprache @154.12, H1 @167.62
// H2-H6 heading @181.11, bars from y=187.73 onward (5 rows)
function buildOnPage1(): Block[] {
  const hp = "sections.onpageSeo.heading";
  const tp = "sections.onpageSeo.text";
  return shell([
    // Section header
    txt("op1-stitle", 18, 34, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2, { textTransform: "uppercase", letterSpacing: 0.3 }), "On-Page SEO Ergebnisse"),
    { id: "op1-score", type: "scoreCircle", zIndex: 6, frame: fr(18, 41.41, 19.58, 19.58), binding: { kind: "audit", path: "sections.onpageSeo.score" }, size: 19.58, strokeWidth: 2.1, labelStyle: ts(P, 9, 700, W, "center", 1) } as Block,
    txt("op1-heading", 41.28, 41.41, 150.72, 5.3, { kind: "audit", path: hp }, ts(P, 10, 700, C, "left", 1.2)),
    txt("op1-text", 41.28, 47.76, 150.72, 13.5, { kind: "audit", path: tp }, ts(P, 8, 400, G, "left", 1.55)),
    // CheckItems: Title-Tag + Meta
    staticChk("op1-chk1", 18, 68.4, 174, 36, [
      { title: "Title-Tag", detail: "Title-Tags sind sehr wichtig, damit Suchmaschinen Ihren Inhalt korrekt verstehen und kategorisieren können.", detailPath: "sections.onpageSeo.titleTag.value", statusPath: "sections.onpageSeo.titleTag.status" },
      { title: "Metabeschreibungs-Tag", detail: "Eine Meta-Beschreibung ist wichtig, damit Suchmaschinen den Inhalt Ihrer Seite verstehen können und wird oft als Beschreibungstext in den Suchergebnissen angezeigt.", detailPath: "sections.onpageSeo.metaDescription.value", statusPath: "sections.onpageSeo.metaDescription.status" },
    ]),
    // SERP label + info icon
    txt("op1-serp-lbl", 18, 114.43, 165, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "SERP Snippet Vorschau"),
    txt("op1-serp-i", 187.24, 114.43, 4.76, 4.94, { kind: "static" }, ts(P, 14, 400, C, "right", 1), "i"),
    txt("op1-serp-sub", 18, 120.52, 165, 4.3, { kind: "static" }, ts(P, 8, 400, G2, "left", 1.5), "Dies veranschaulicht, wie Ihre Seite in den Suchergebnissen erscheinen kann."),
    { id: "op1-serp-box", type: "shape", zIndex: 4, frame: fr(18, 126.34, 165, 24.61), shape: "rect", fill: "#ffffff", borderRadius: 2 } as Block,
    txt("op1-serp-url", 20.65, 128.99, 159.71, 4.3, { kind: "audit", path: "url" }, ts(P, 8, 400, "#555555", "left", 1.2)),
    txt("op1-serp-title", 20.65, 133.75, 159.71, 5.3, { kind: "audit", path: "sections.onpageSeo.serpPreview.title" }, ts(P, 10, 700, "#1a0dab", "left", 1.2)),
    txt("op1-serp-desc", 20.65, 139.83, 159.71, 8.5, { kind: "audit", path: "sections.onpageSeo.serpPreview.description" }, ts(P, 8, 400, "#333333", "left", 1.3)),
    // Sprache + H1
    staticChk("op1-chk2", 18, 154.12, 174, 24, [
      { title: "Sprache", detail: "Ihre Seite verwendet das Lang-Attribut. Deklariert: {audit.sections.onpageSeo.language.value}", statusPath: "sections.onpageSeo.language.status" },
      { title: "H1-Header-Tag-Verwendung", detail: "Ihre Seite hat einen H1-Tag. > {audit.sections.onpageSeo.h1.value}", statusPath: "sections.onpageSeo.h1.status" },
    ]),
    // H2-H6 bar chart
    txt("op1-bar-lbl", 18, 181.11, 130, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "H2-H6-Header-Tag-Verwendung"),
    txt("op1-bar-freq", 170, 181.11, 22, 5.3, { kind: "static" }, ts(P, 10, 700, W, "right", 1.2), "Frequenz"),
    { id: "op1-h2h6", type: "barChart", zIndex: 5, frame: fr(18, 187.73, 174, 30), binding: { kind: "audit", path: "sections.onpageSeo.h2h6Frequency" }, items: [{ label: "H2", fieldPath: "h2" }, { label: "H3", fieldPath: "h3" }, { label: "H4", fieldPath: "h4" }, { label: "H5", fieldPath: "h5" }, { label: "H6", fieldPath: "h6" }], barColor: C, trackColor: "#2a2a2a", labelStyle: ts(P, 8, 400, G), valueStyle: ts(P, 8, 400, G), barHeight: 1.85, gap: 1.2 } as Block,
  ]);
}

// ---------------------------------------------------------------------------
// ON-PAGE SEO 2 (page 5)
// No secHdr in legacy — just wordCount check at y=38.23, technicalChecks below.
// First check at y=38.23, last at y=161.8. Gap between checks varies 6-13mm.
function buildOnPage2(): Block[] {
  return shell([
    // Content has marginTop 16px → 4.23mm from padding-top 34mm = y≈38.23
    staticChk("op2-wc", 18, 38.23, 174, 18, [
      { title: "Menge des Inhalts", detail: "Es ist gut erforscht, dass ein höheres Textinhalt-Volumen im Allgemeinen mit einer besseren Rankingfähigkeit zusammenhängt. Wortanzahl {audit.sections.onpageSeo.wordCount.value}", statusPath: "sections.onpageSeo.wordCount.status" },
    ]),
    chk("op2-checks", 18, 61.25, 174, 220, "sections.onpageSeo.technicalChecks"),
  ]);
}

// ---------------------------------------------------------------------------
// UX & CONVERSION (page 6)
// secHdr: "UX & Conversion" / heading "UX & Conversion" / text
// findings list from y=68.93 to y≈169.47
// Gesamteinschätzung at y=176.88, summary at y=183.23
function buildUx(): Block[] {
  return shell([
    ...secHdr("ux", "UX & Conversion", "sections.uxConversion.score"),
    chk("ux-findings", 18, 68.93, 174, 105, "sections.uxConversion.findings"),
    txt("ux-sum-lbl", 18, 176.88, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "Gesamteinschätzung"),
    txt("ux-sum", 18, 183.23, 174, 30, { kind: "audit", path: "sections.uxConversion.summary" }, ts(P, 8, 400, G, "left", 1.55)),
  ]);
}

// ---------------------------------------------------------------------------
// LINKS 1 (page 7)
// Section title at y=35.06, sub-heading at y=42.47, text at y=49.35
// Domainstärke circle at y=62.86 x=18 size=18.52 (stroke only)
// Seitenstärke circle at y=62.86 x=49.39 size=18.52 (stroke only)
// Labels below at y=82.96
// Row 1 tiles at y=93.02: "Gesamte Backlinks" x=18 w=33.02 h=25.93, "Verweisende Domänen" x=54.2 w=39.22 h=25.93
// Row 2 tiles at y=122.12 h=18.79: 5 tiles x=[18,53.5,89,118.11,147.21] w=[32.85,32.86,26.46,26.46,26.46]
function buildLinks1(): Block[] {
  return shell([
    txt("lk1-title", 18, 35.06, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2, { textTransform: "uppercase", letterSpacing: 0.3 }), "Links"),
    txt("lk1-sub", 18, 42.47, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "Backlink-Übersicht"),
    txt("lk1-text", 18, 49.35, 174, 9, { kind: "audit", path: "sections.links.text" }, ts(P, 8, 400, G, "left", 1.55)),
    // Domainstärke circle + label
    { id: "lk1-ds-circ", type: "shape", zIndex: 3, frame: fr(18, 62.86, 18.52, 18.52), shape: "ellipse", stroke: "#f4a8a8", strokeWidth: 1.3 } as Block,
    txt("lk1-ds-v", 18, 62.86, 18.52, 18.52, { kind: "audit", path: "sections.links.domainStrength" }, ts(P, 14, 700, W, "center", 1)),
    txt("lk1-ds-l", 18, 82.96, 20.81, 4.3, { kind: "static" }, ts(P, 8, 700, G, "center", 1.2), "Domainstärke"),
    // Seitenstärke circle + label
    { id: "lk1-ps-circ", type: "shape", zIndex: 3, frame: fr(49.39, 62.86, 18.52, 18.52), shape: "ellipse", stroke: C, strokeWidth: 1.3 } as Block,
    txt("lk1-ps-v", 49.39, 62.86, 18.52, 18.52, { kind: "audit", path: "sections.links.pageStrength" }, ts(P, 14, 700, W, "center", 1)),
    txt("lk1-ps-l", 49.39, 82.96, 18.52, 4.3, { kind: "static" }, ts(P, 8, 700, G, "center", 1.2), "Seitenstärke"),
    // Row 1 tiles
    tile("lk1-t-bl", 18, 93.02, 33.02, 25.93, "sections.links.totalBacklinks", "Gesamte Backlinks", "🔗"),
    tile("lk1-t-rd", 54.2, 93.02, 39.22, 25.93, "sections.links.referringDomains", "Verweisende Domänen", "↗"),
    // Row 2 tiles
    tile("lk1-t-nf", 18, 122.12, 32.85, 18.79, "sections.links.nofollow", "Nofollow-Backlinks", ""),
    tile("lk1-t-df", 53.5, 122.12, 32.86, 18.79, "sections.links.dofollow", "Dofollow-Backlinks", ""),
    tile("lk1-t-sn", 89, 122.12, 26.46, 18.79, "sections.links.subnets", "Subnets", ""),
    tile("lk1-t-ip", 118.11, 122.12, 26.46, 18.79, "sections.links.ips", "IPs", ""),
    tile("lk1-t-gb", 147.21, 122.12, 26.46, 18.79, "sections.links.govBacklinks", "Gov-Backlinks", ""),
  ]);
}

function tile(id: string, x: number, y: number, w: number, h: number, path: string, label: string, icon: string): Block {
  return {
    id, type: "resourceTile", zIndex: 5, frame: fr(x, y, w, h),
    binding: { kind: "audit", path }, label, icon,
    iconBg: "#2a2a2a", iconColor: C,
    valueStyle: ts(P, 14, 700, W, "center", 1),
    labelStyle: ts(P, 8, 400, G2, "center", 1.2),
  } as Block;
}

// ---------------------------------------------------------------------------
// LINKS 2 (page 8)
// "Top Backlinks" at y=36.65, sub at y=43, headers at y=49.35
// "Top-Pages nach Backlinks" y=60.72, "Top-Anker nach Backlinks" y=70.25, "Top-Regionen von ..." y=79.77
// Pie labels y=87.18 (Top-TLDs x=59.42, Top Länder x=91.17, On-Page-Links x=122.92)
// Values y=93.53; Circles y=98.82 size=26.46 at same x
function buildLinks2(): Block[] {
  const CIRC_D = 26.46;
  const pieCols = [
    { id: "tld",   x: 59.42,  w: 26.46, label: "Top-TLDs",      valPath: "sections.links.topTlds[0].tld",     cntPath: "sections.links.topTlds[0].count",     fill: C,         valStatic: "-" },
    { id: "cntry", x: 91.17,  w: 26.46, label: "Top Länder",    valPath: "sections.links.topCountries[0].country", cntPath: "sections.links.topCountries[0].count", fill: C,    valStatic: "-" },
    { id: "onpg",  x: 122.92, w: 27.65, label: "On-Page-Links", valPath: "",                                 cntPath: "sections.links.internalLinks",          fill: "#22c55e", valStatic: "Internal" },
  ];
  const blocks: Block[] = shell([
    txt("l2-h", 18, 36.65, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "Top Backlinks"),
    txt("l2-sub", 18, 43, 174, 4.3, { kind: "static" }, ts(P, 8, 400, G, "left", 1.2), "Dies sind die externen Seiten mit dem höchsten Wert."),
    { id: "top-bl", type: "table", zIndex: 5, frame: fr(18, 49.35, 174, 10), binding: { kind: "audit", path: "sections.links.topBacklinks" }, columns: [{ header: "Domainstärke", fieldPath: "domainStrength", width: 71.42 }, { header: "URL", fieldPath: "url", width: 23.82 }, { header: "Titel", fieldPath: "title", width: 26.98 }, { header: "Ankertext", fieldPath: "anchor", width: 51.78 }], headerStyle: ts(P, 8, 700, W, "left", 1.2), cellStyle: ts(P, 8, 400, G, "left", 1.3), rowDividerColor: "#2a2a2a" } as Block,
    txt("l2-tp", 18, 60.72, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "Top-Pages nach Backlinks"),
    txt("l2-ta", 18, 70.25, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "Top-Anker nach Backlinks"),
    txt("l2-tr", 18, 79.77, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "Top-Regionen von weiterleitenden Domains"),
  ]);
  pieCols.forEach(pc => {
    blocks.push(txt(`l2-${pc.id}-lbl`, pc.x, 87.18, pc.w, 5.3, { kind: "static" }, ts(P, 10, 700, W, "center", 1.2), pc.label));
    if (pc.valPath) {
      blocks.push(txt(`l2-${pc.id}-val`, pc.x, 93.53, pc.w, 4.3, { kind: "audit", path: pc.valPath }, ts(P, 8, 400, pc.fill, "center", 1.2)));
    } else {
      blocks.push(txt(`l2-${pc.id}-val`, pc.x, 93.53, pc.w, 4.3, { kind: "static" }, ts(P, 8, 400, pc.fill, "center", 1.2), pc.valStatic));
    }
    blocks.push({ id: `l2-${pc.id}-circ`, type: "shape", zIndex: 3, frame: fr(pc.x, 98.82, CIRC_D, CIRC_D), shape: "ellipse", fill: pc.fill } as Block);
    blocks.push(txt(`l2-${pc.id}-cnt`, pc.x, 118.93, pc.w, 4.3, { kind: "audit", path: pc.cntPath }, ts(P, 8, 700, "#1a1a1a", "center", 1.2)));
  });
  return blocks;
}

// ---------------------------------------------------------------------------
// USABILITY (page 9)
// secHdr "Usability"
// "Geräte-Rendering" at y=68.4, sub at y=74.75
// Mobile screenshot at y=81.1 x=18 w=34.4 h=60.86
// Tablet  screenshot at y=81.1 x=57.69 w=47.63 h=60.86
// Then 3 checks at y=148.3, 166.03, 179.52
// Speed gauges at y=195.13: Mobile x=74.57, Desktop x=108.97, size=26.46
// Labels at y=222.65
function buildUsability(): Block[] {
  return shell([
    ...secHdr("us", "Usability", "sections.usability.score"),
    txt("u-gr-lbl", 18, 68.4, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "Geräte-Rendering"),
    txt("u-gr-sub", 18, 74.75, 174, 4.3, { kind: "static" }, ts(P, 8, 400, G, "left", 1.2), "Dieser Check zeigt visuell, wie Ihre Seite auf verschiedenen Geräten gerendert wird."),
    { id: "u-mob-ss", type: "image", zIndex: 5, frame: fr(18, 81.1, 34.4, 60.86), binding: { kind: "audit", path: "screenshots.mobile" }, objectFit: "cover", objectPosition: "top", borderRadius: 3 } as Block,
    { id: "u-tab-ss", type: "image", zIndex: 5, frame: fr(57.69, 81.1, 47.63, 60.86), binding: { kind: "audit", path: "screenshots.tablet" }, objectFit: "cover", objectPosition: "top", borderRadius: 2 } as Block,
    staticChk("u-checks", 18, 148.3, 174, 45, [
      { title: "Core Web Vitals von Google", detail: "Core Web Vitals sind von Google erstellte UI-Metriken, die das Seitenerlebnis messen und als Ranking-Faktor immer wichtiger werden.", statusPath: "sections.usability.coreWebVitals" },
      { title: "Verwendung von mobilen Ansichtsfeldern", detail: "Ihre Seite gibt einen Viewport an, der der Größe des Geräts entspricht.", statusPath: "sections.usability.viewport" },
      { title: "Googles PageSpeed Insights > Mobil & Desktop", detail: "Google gibt an, wie Ihre Seite bei der PageSpeed Insights-Bewertung abschneidet.", statusPath: "sections.usability.pageSpeedStatus" },
    ]),
    { id: "u-mob-g", type: "gauge", zIndex: 5, frame: fr(74.57, 195.13, 26.46, 26.46), binding: { kind: "audit", path: "sections.usability.mobilePageSpeed" }, variant: "full", minValue: 0, maxValue: 100, thresholds: [{ value: 0, color: "#ef4444" }, { value: 50, color: "#f97316" }, { value: 90, color: "#22c55e" }], trackColor: "#4a4a4a", valueStyle: ts(P, 14, 700, W, "center", 1), labelStyle: ts(P, 10, 700, W, "center", 1), labelText: "", strokeWidth: 4 } as Block,
    { id: "u-desk-g", type: "gauge", zIndex: 5, frame: fr(108.97, 195.13, 26.46, 26.46), binding: { kind: "audit", path: "sections.usability.desktopPageSpeed" }, variant: "full", minValue: 0, maxValue: 100, thresholds: [{ value: 0, color: "#ef4444" }, { value: 50, color: "#f97316" }, { value: 90, color: "#22c55e" }], trackColor: "#4a4a4a", valueStyle: ts(P, 14, 700, W, "center", 1), labelStyle: ts(P, 10, 700, W, "center", 1), labelText: "", strokeWidth: 4 } as Block,
    txt("u-mob-lbl", 74.57, 222.65, 26.46, 5.3, { kind: "static" }, ts(P, 10, 700, W, "center", 1.2), "Mobil"),
    txt("u-desk-lbl", 108.97, 222.65, 26.46, 5.3, { kind: "static" }, ts(P, 10, 700, W, "center", 1.2), "Desktop"),
  ]);
}

// ---------------------------------------------------------------------------
// LEISTUNG (page 10)
// secHdr "Leistung"
// "Website-Ladegeschwindigkeit" at y=67.34, sub at y=73.69
// Gauges at y=85.86 (3 semi-gauges), labels above at y=80.57
// "Ressourcenaufteilung" at y=113.64
// 6 tiles row at y=121.05 with icon-boxes (14.29 sq), values y=136.92, labels y=142.75
// Tile cols: x=[18, 48.55, 82.51, 118.63, 140.35, 165.6] w=[30.55, 33.96, 36.12, 21.71, 25.25, 26.4]
// 4 checks starting y=156.5, 170, 183.49, 196.99
function buildLeistung(): Block[] {
  const sg = (id: string, x: number, path: string, label: string): Block =>
    ({ id, type: "gauge", zIndex: 5, frame: fr(x, 85.86, 37.04, 21.17), binding: { kind: "audit", path }, variant: "semi", minValue: 0, maxValue: 15, suffix: "s", thresholds: [{ value: 0, color: "#22c55e" }, { value: 5, color: "#f97316" }, { value: 10, color: "#ef4444" }], trackColor: "#4a4a4a", valueStyle: ts(P, 10, 700, W, "center", 1), labelStyle: ts(P, 8, 600, W, "center", 1), labelText: label, strokeWidth: 2.6 }) as Block;
  const rtile = (id: string, x: number, w: number, path: string, label: string, icon: string): Block =>
    ({ id, type: "resourceTile", zIndex: 5, frame: fr(x, 121.05, w, 30), binding: { kind: "audit", path }, label, icon, iconBg: "#2a2a2a", iconColor: C, valueStyle: ts(P, 10, 700, W, "center", 1), labelStyle: ts(P, 8, 400, G2, "center", 1.2) }) as Block;
  return shell([
    ...secHdr("le", "Leistung", "sections.leistung.score"),
    txt("le-gt-lbl", 18, 67.34, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "Website-Ladegeschwindigkeit"),
    txt("le-gt-sub", 18, 73.69, 174, 4.3, { kind: "static" }, ts(P, 8, 400, G, "left", 1.2), "Ihre Seite wird in einer angemessenen Zeit geladen."),
    // Labels above gauges
    txt("le-g1-lbl", 27.97, 80.57, 37.04, 4.3, { kind: "static" }, ts(P, 8, 400, W, "center", 1.2), "Serverantwort"),
    txt("le-g2-lbl", 84.96, 80.57, 37.04, 4.3, { kind: "static" }, ts(P, 8, 400, W, "center", 1.2), "Alle Seiteninhalte geladen"),
    txt("le-g3-lbl", 141.96, 80.57, 40.07, 4.3, { kind: "static" }, ts(P, 8, 400, W, "center", 1.2), "Alle Seitenskripte vollständig"),
    sg("le-srv-g", 27.97, "sections.leistung.serverResponseTime", ""),
    sg("le-cnt-g", 84.96, "sections.leistung.contentLoadTime", ""),
    sg("le-scr-g", 143.47, "sections.leistung.scriptLoadTime", ""),
    txt("le-rt", 18, 113.64, 174, 5.3, { kind: "static" }, ts(P, 10, 700, W, "left", 1.2), "Ressourcenaufteilung"),
    rtile("le-t-html", 18, 30.55, "sections.leistung.resources.html", "Anzahl der HTML-Seiten", "HTML"),
    rtile("le-t-js",  48.55, 33.96, "sections.leistung.resources.js", "Anzahl der JS-Ressourcen", "JS"),
    rtile("le-t-css", 82.51, 36.12, "sections.leistung.resources.css", "Anzahl der CSS-Ressourcen", "CSS"),
    rtile("le-t-img", 118.63, 21.71, "sections.leistung.resources.img", "Anzahl der Bilder", "IMG"),
    rtile("le-t-oth", 140.35, 25.25, "sections.leistung.resources.other", "Andere Ressourcen", "+"),
    rtile("le-t-tot", 165.6, 26.4, "sections.leistung.resources.total", "Gesamtzahl Objekte", "#"),
    staticChk("le-checks", 18, 156.5, 174, 55, [
      { title: "JavaScript Fehler", detail: "Ihre Seite meldet JavaScript-Fehler beim Laden.", statusPath: "sections.leistung.jsErrors" },
      { title: "HTTP2-Nutzung", detail: "Wir empfehlen das HTTP/2+-Protokoll für deine Website zu aktivieren.", statusPath: "sections.leistung.http2" },
      { title: "Bilder optimieren", detail: "Alle Bilder auf Ihrer Seite scheinen optimiert zu sein.", statusPath: "sections.leistung.imagesOptimized" },
      { title: "Verkleinerung & Veraltetes HTML", detail: "All Ihre JavaScript- und CSS-Dateien scheinen minimiert zu sein.", statusPath: "sections.leistung.minified" },
    ]),
  ]);
}

// ---------------------------------------------------------------------------
// SOCIAL (page 11)
// secHdr "Soziale Ergebnisse" / "Social"
// checks starting at y=69.98
function buildSocial(): Block[] {
  return shell([
    ...secHdr("so", "Soziale Ergebnisse", "sections.social.score"),
    chk("so-checks", 18, 69.98, 174, 210, "sections.social.checks"),
  ]);
}

// ---------------------------------------------------------------------------
// LOKALES SEO (page 12)
// secHdr "Lokales SEO"
// static checks starting at y=69.98
// star rating block starting at y=127.93
function buildLokales(): Block[] {
  return shell([
    ...secHdr("lok", "Lokales SEO", "sections.lokalesSeo.score"),
    staticChk("lok-checks", 18, 69.98, 174, 50, [
      { title: "Lokales Geschäftsschema", detail: "Kein lokales Geschäftsschema auf der Seite identifiziert.", statusPath: "sections.lokalesSeo.businessSchema" },
      { title: "Google Business-Profil identifiziert", detail: "Es wurde ein Google Business-Profil identifiziert, das auf diese Website verweist.", statusPath: "sections.lokalesSeo.gbpIdentified" },
      { title: "Vollständigkeit des Google Business-Profils", detail: "Die wichtigen Geschäftsdaten sind im Google Business-Profil vorhanden.", statusPath: "sections.lokalesSeo.gbpCompleteness" },
      { title: "Google Bewertungen", statusPath: "sections.lokalesSeo.reviewsStatus" },
    ]),
    { id: "lok-stars", type: "starRating", zIndex: 5, frame: fr(18, 127.93, 174, 45),
      ratingBinding: { kind: "audit", path: "sections.lokalesSeo.googleReviews.rating" },
      countBinding: { kind: "audit", path: "sections.lokalesSeo.googleReviews.count" },
      distributionBinding: { kind: "audit", path: "sections.lokalesSeo.googleReviews.distribution" },
      starColor: "#f5a623", trackColor: "#2a2a2a", barColor: C,
      labelStyle: ts(P, 8, 400, G, "left", 1.2), barHeight: 1.59, gap: 1 } as Block,
  ]);
}

// ---------------------------------------------------------------------------
// THANK YOU – keep existing decomposed layout
function buildThankYou(): Block[] {
  return [
    { id: "bg-glow", type: "brandDecoration", kind: "radialGlow", zIndex: 0, frame: fr(0, 0, 210, 296) } as Block,
    { id: "logo", type: "brandDecoration", kind: "logo", zIndex: 10, frame: fr(66.5, 22, 77, 22) } as Block,
    txt("ty-title", 18, 61.8, 108, 9, { kind: "static" }, ts(P, 20, 700, W, "left", 1.2), "Vielen Dank für Ihre Zeit!"),
    txt("ty-b1", 18, 76.3, 108, 31, { kind: "static" }, ts(O, 14, 400, G, "left", 1.55), "Sie haben heute den ersten und wichtigsten Schritt gemacht, Erkenntnisse gewinnen. Aus unserer Erfahrung mit über 80 Kunden wissen wir,"),
    txt("ty-b2", 18, 111.9, 108, 31, { kind: "static" }, ts(O, 14, 400, G, "left", 1.55), "Die besten Ergebnisse erzielen diejenigen, die jetzt direkt los legen, sei es nur die Bildkomprimierung in 30 Minuten. Jede noch so kleine Optimierung bringt Sie nach vorn."),
    txt("ty-h3a", 18, 150.6, 108, 17, { kind: "static" }, ts(P, 20, 700, W, "left", 1.2), "Jede Marke hat eine Geschichte."),
    txt("ty-h3b", 18, 168.6, 108, 17, { kind: "static" }, ts(P, 20, 700, W, "left", 1.2), "Lassen Sie uns Ihre zum Erfolg machen."),
    txt("ty-ps", 18, 191.5, 108, 23, { kind: "static" }, ts(O, 14, 400, G, "left", 1.55, { fontStyle: "italic" } as Partial<TextStyle>), "PS 92% unserer Kunden sehen die ersten Verbesserungen innerhalb von 14 Tagen, Sie schaffen das auch!"),
    { id: "ty-photo", type: "shape", zIndex: 3, frame: fr(133.8, 61.8, 58.2, 58.2), shape: "rect", fill: "#2a2a2a", borderRadius: 1.6 } as Block,
    txt("ty-photo-txt", 133.8, 84, 58.2, 12, { kind: "static" }, ts(O, 11, 400, "#666", "center"), "Foto Vasilis"),
    txt("ty-name", 133.8, 124.3, 58.2, 8, { kind: "static" }, ts(P, 14, 700, W, "center"), "Vasilis Mavridis"),
    txt("ty-role", 133.8, 132, 58.2, 6, { kind: "static" }, ts(O, 12, 400, G, "center"), "Inhaber von Artistic Avenue"),
    { id: "ty-icon-in", type: "shape", zIndex: 3, frame: fr(147.5, 141.5, 8.5, 8.5), shape: "ellipse", fill: C } as Block,
    { id: "ty-icon-ig", type: "shape", zIndex: 3, frame: fr(158.7, 141.5, 8.5, 8.5), shape: "ellipse", fill: C } as Block,
    { id: "ty-icon-w",  type: "shape", zIndex: 3, frame: fr(169.8, 141.5, 8.5, 8.5), shape: "ellipse", fill: C } as Block,
    txt("ty-icon-in-t", 147.5, 141.5, 8.5, 8.5, { kind: "static" }, ts(P, 11, 700, "#1a1a1a", "center"), "in"),
    txt("ty-icon-ig-t", 158.7, 141.5, 8.5, 8.5, { kind: "static" }, ts(P, 11, 700, "#1a1a1a", "center"), "IG"),
    txt("ty-icon-w-t",  169.8, 141.5, 8.5, 8.5, { kind: "static" }, ts(P, 11, 700, "#1a1a1a", "center"), "W"),
    txt("ty-phone", 133.8, 154.7, 58.2, 7.6, { kind: "static" }, ts(P, 12, 400, W, "left", 1.8), "+49 179 3213 445"),
    txt("ty-email", 133.8, 162.3, 58.2, 7.6, { kind: "static" }, ts(P, 12, 400, W, "left", 1.8), "info@artisticavenue.de"),
    txt("ty-web",   133.8, 170,   58.2, 7.6, { kind: "static" }, ts(P, 12, 400, W, "left", 1.8), "www.artisticavenue.de"),
    ftr,
  ];
}

const BUILDERS: Record<LegacyPageKey, () => Block[]> = {
  cover: buildCover,
  overview: buildOverview,
  topRisks: buildTopRisks,
  recommendations: buildRecommendations,
  onPageSeo1: buildOnPage1,
  onPageSeo2: buildOnPage2,
  uxConversion: buildUx,
  links1: buildLinks1,
  links2: buildLinks2,
  usability: buildUsability,
  leistung: buildLeistung,
  social: buildSocial,
  lokalesSeo: buildLokales,
  thankYou: buildThankYou,
};

export function decomposePageBlocks(pageKey: LegacyPageKey): Block[] {
  return BUILDERS[pageKey]();
}
