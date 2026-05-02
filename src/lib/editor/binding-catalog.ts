export type BindingValueType =
  | "string"
  | "number"
  | "grade"
  | "array"
  | "object"
  | "image";

export type BindingEntry = {
  path: string;
  label: string;
  type: BindingValueType;
};

export const BINDING_CATALOG: BindingEntry[] = [
  { path: "url", label: "Website URL", type: "string" },
  { path: "projectName", label: "Projektname", type: "string" },
  { path: "overallScore", label: "Gesamtnote", type: "grade" },
  { path: "overallHeading", label: "Gesamtheading", type: "string" },
  { path: "introText", label: "Intro-Text", type: "string" },
  { path: "diagnosisText", label: "Diagnose-Text (Page 2)", type: "string" },

  // On-Page SEO
  { path: "sections.onpageSeo.score", label: "On-Page SEO - Note", type: "grade" },
  { path: "sections.onpageSeo.heading", label: "On-Page SEO - Heading", type: "string" },
  { path: "sections.onpageSeo.text", label: "On-Page SEO - Text", type: "string" },
  { path: "sections.onpageSeo.costText", label: "On-Page SEO - Was kostet", type: "string" },
  { path: "sections.onpageSeo.findings", label: "On-Page SEO - Findings (Tabelle)", type: "array" },
  { path: "sections.onpageSeo.actions", label: "On-Page SEO - Aktionen (Pfeil-Bullets)", type: "array" },
  { path: "sections.onpageSeo.closingNote", label: "On-Page SEO - Footer-Note", type: "string" },
  { path: "sections.onpageSeo.h2h6Frequency", label: "On-Page SEO - H2-H6 Frequency (BarChart)", type: "object" },
  { path: "sections.onpageSeo.serpPreview.url", label: "On-Page SEO - SERP Preview URL", type: "string" },
  { path: "sections.onpageSeo.serpPreview.title", label: "On-Page SEO - SERP Preview Title", type: "string" },
  { path: "sections.onpageSeo.serpPreview.description", label: "On-Page SEO - SERP Preview Description", type: "string" },

  // UX & Conversion
  { path: "sections.uxConversion.score", label: "UX & Conversion - Note", type: "grade" },
  { path: "sections.uxConversion.heading", label: "UX & Conversion - Heading", type: "string" },
  { path: "sections.uxConversion.text", label: "UX & Conversion - Text", type: "string" },
  { path: "sections.uxConversion.costText", label: "UX & Conversion - Was kostet", type: "string" },
  { path: "sections.uxConversion.findings", label: "UX & Conversion - Findings (Tabelle)", type: "array" },
  { path: "sections.uxConversion.actions", label: "UX & Conversion - Aktionen", type: "array" },
  { path: "sections.uxConversion.closingNote", label: "UX & Conversion - Footer-Note", type: "string" },

  // Seitenstruktur & Content (NEU)
  { path: "sections.seitenstrukturContent.score", label: "Seitenstruktur - Note", type: "grade" },
  { path: "sections.seitenstrukturContent.heading", label: "Seitenstruktur - Heading", type: "string" },
  { path: "sections.seitenstrukturContent.text", label: "Seitenstruktur - Text", type: "string" },
  { path: "sections.seitenstrukturContent.costText", label: "Seitenstruktur - Was kostet", type: "string" },
  { path: "sections.seitenstrukturContent.findings", label: "Seitenstruktur - Findings (Tabelle)", type: "array" },
  { path: "sections.seitenstrukturContent.actions", label: "Seitenstruktur - Aktionen", type: "array" },
  { path: "sections.seitenstrukturContent.closingNote", label: "Seitenstruktur - Footer-Note", type: "string" },

  // Lokales SEO
  { path: "sections.lokalesSeo.score", label: "Lokales SEO - Note", type: "grade" },
  { path: "sections.lokalesSeo.heading", label: "Lokales SEO - Heading", type: "string" },
  { path: "sections.lokalesSeo.text", label: "Lokales SEO - Text", type: "string" },
  { path: "sections.lokalesSeo.costText", label: "Lokales SEO - Was kostet", type: "string" },
  { path: "sections.lokalesSeo.findings", label: "Lokales SEO - Findings (Tabelle)", type: "array" },
  { path: "sections.lokalesSeo.actions", label: "Lokales SEO - Aktionen", type: "array" },
  { path: "sections.lokalesSeo.closingNote", label: "Lokales SEO - Footer-Note", type: "string" },
  { path: "sections.lokalesSeo.schemaMarkupImage", label: "Lokales SEO - Schema-Markup-Bild", type: "image" },
  { path: "sections.lokalesSeo.schemaMarkupCaption", label: "Lokales SEO - Schema-Markup-Caption", type: "string" },

  // Performance & Technisches (intern: leistung)
  { path: "sections.leistung.score", label: "Performance - Note", type: "grade" },
  { path: "sections.leistung.heading", label: "Performance - Heading", type: "string" },
  { path: "sections.leistung.text", label: "Performance - Text", type: "string" },
  { path: "sections.leistung.costText", label: "Performance - Was kostet", type: "string" },
  { path: "sections.leistung.actions", label: "Performance - Aktionen", type: "array" },
  { path: "sections.leistung.closingNote", label: "Performance - Footer-Note", type: "string" },
  { path: "sections.leistung.serverResponseTime", label: "Performance - Server-Antwort (s)", type: "number" },
  { path: "sections.leistung.contentLoadTime", label: "Performance - Content Load (s)", type: "number" },
  { path: "sections.leistung.scriptLoadTime", label: "Performance - Skript Load (s)", type: "number" },
  { path: "sections.leistung.pageSizeMb", label: "Performance - Page Size (MB)", type: "number" },
  { path: "sections.leistung.pageSizeBreakdown", label: "Performance - Page Size Breakdown (Pie)", type: "object" },
  { path: "sections.leistung.resourceCounts", label: "Performance - Resource Counts (Object)", type: "object" },

  // Links & Autoritaet (intern: links)
  { path: "sections.links.score", label: "Links - Note", type: "grade" },
  { path: "sections.links.heading", label: "Links - Heading", type: "string" },
  { path: "sections.links.text", label: "Links - Text", type: "string" },
  { path: "sections.links.costText", label: "Links - Was kostet", type: "string" },
  { path: "sections.links.actions", label: "Links - Aktionen", type: "array" },
  { path: "sections.links.closingNote", label: "Links - Footer-Note", type: "string" },
  { path: "sections.links.domainStrength", label: "Links - Domain Strength", type: "number" },
  { path: "sections.links.pageStrength", label: "Links - Page Strength", type: "number" },
  { path: "sections.links.totalBacklinks", label: "Links - Total Backlinks", type: "number" },
  { path: "sections.links.referringDomains", label: "Links - Referring Domains", type: "number" },
  { path: "sections.links.nofollow", label: "Links - Nofollow", type: "number" },
  { path: "sections.links.dofollow", label: "Links - Dofollow", type: "number" },
  { path: "sections.links.subnets", label: "Links - Subnets", type: "number" },
  { path: "sections.links.ips", label: "Links - IPs", type: "number" },
  { path: "sections.links.govBacklinks", label: "Links - Gov Backlinks", type: "number" },

  // Top Risks
  { path: "topRisks", label: "Top Risiken (Liste)", type: "array" },

  // Comparison (Wo du sein koenntest)
  { path: "comparison.heading", label: "Vergleich - Heading", type: "string" },
  { path: "comparison.altSentences", label: "Vergleich - Alt-Saetze (Statt-Aussage)", type: "array" },
  { path: "comparison.rows", label: "Vergleich - Tabellen-Zeilen (Heute/In 3 Monaten)", type: "array" },

  // Phasenplan
  { path: "phasenplan.intro", label: "Phasenplan - Intro", type: "string" },
  { path: "phasenplan.phase1.title", label: "Phasenplan - Phase 1 Titel", type: "string" },
  { path: "phasenplan.phase1.entries", label: "Phasenplan - Phase 1 Massnahmen", type: "array" },
  { path: "phasenplan.phase2.title", label: "Phasenplan - Phase 2 Titel", type: "string" },
  { path: "phasenplan.phase2.entries", label: "Phasenplan - Phase 2 Massnahmen", type: "array" },
  { path: "phasenplan.phase3.title", label: "Phasenplan - Phase 3 Titel", type: "string" },
  { path: "phasenplan.phase3.entries", label: "Phasenplan - Phase 3 Massnahmen", type: "array" },
  { path: "phasenplan.afterPhase1", label: "Phasenplan - Nach Phase 1", type: "string" },
  { path: "phasenplan.afterPhase2", label: "Phasenplan - Nach Phase 2", type: "string" },
  { path: "phasenplan.afterPhase3", label: "Phasenplan - Nach Phase 3", type: "string" },

  // Recommendations (legacy, fallback)
  { path: "recommendations", label: "Empfehlungen (Liste)", type: "array" },

  // Screenshots
  { path: "screenshots.cover", label: "Cover Screenshot", type: "image" },
  { path: "screenshots.mobile", label: "Mobile Screenshot", type: "image" },
  { path: "screenshots.tablet", label: "Tablet Screenshot", type: "image" },
];

export function bindingsForValueTypes(
  types: BindingValueType[],
): BindingEntry[] {
  return BINDING_CATALOG.filter((entry) => types.includes(entry.type));
}
