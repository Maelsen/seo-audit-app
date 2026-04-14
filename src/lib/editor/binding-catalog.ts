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

  {
    path: "sections.onpageSeo.score",
    label: "On-Page SEO - Note",
    type: "grade",
  },
  {
    path: "sections.onpageSeo.heading",
    label: "On-Page SEO - Heading",
    type: "string",
  },
  {
    path: "sections.onpageSeo.text",
    label: "On-Page SEO - Text",
    type: "string",
  },
  {
    path: "sections.onpageSeo.titleTag.value",
    label: "On-Page SEO - Title-Tag",
    type: "string",
  },
  {
    path: "sections.onpageSeo.metaDescription.value",
    label: "On-Page SEO - Meta Description",
    type: "string",
  },
  {
    path: "sections.onpageSeo.h1.value",
    label: "On-Page SEO - H1",
    type: "string",
  },
  {
    path: "sections.onpageSeo.wordCount.value",
    label: "On-Page SEO - Wortanzahl",
    type: "number",
  },

  {
    path: "sections.uxConversion.score",
    label: "UX & Conversion - Note",
    type: "grade",
  },
  {
    path: "sections.uxConversion.heading",
    label: "UX & Conversion - Heading",
    type: "string",
  },
  {
    path: "sections.uxConversion.text",
    label: "UX & Conversion - Text",
    type: "string",
  },
  {
    path: "sections.uxConversion.summary",
    label: "UX & Conversion - Summary",
    type: "string",
  },

  {
    path: "sections.usability.score",
    label: "Usability - Note",
    type: "grade",
  },
  {
    path: "sections.usability.heading",
    label: "Usability - Heading",
    type: "string",
  },
  {
    path: "sections.usability.text",
    label: "Usability - Text",
    type: "string",
  },
  {
    path: "sections.usability.mobilePageSpeed",
    label: "Usability - Mobile PageSpeed",
    type: "number",
  },
  {
    path: "sections.usability.desktopPageSpeed",
    label: "Usability - Desktop PageSpeed",
    type: "number",
  },

  {
    path: "sections.leistung.score",
    label: "Leistung - Note",
    type: "grade",
  },
  {
    path: "sections.leistung.heading",
    label: "Leistung - Heading",
    type: "string",
  },
  { path: "sections.leistung.text", label: "Leistung - Text", type: "string" },
  {
    path: "sections.leistung.serverResponseTime",
    label: "Leistung - Server Response (ms)",
    type: "number",
  },
  {
    path: "sections.leistung.contentLoadTime",
    label: "Leistung - Content Load (ms)",
    type: "number",
  },
  {
    path: "sections.leistung.scriptLoadTime",
    label: "Leistung - Script Load (ms)",
    type: "number",
  },

  { path: "sections.social.score", label: "Social - Note", type: "grade" },
  { path: "sections.social.heading", label: "Social - Heading", type: "string" },
  { path: "sections.social.text", label: "Social - Text", type: "string" },

  {
    path: "sections.lokalesSeo.score",
    label: "Lokales SEO - Note",
    type: "grade",
  },
  {
    path: "sections.lokalesSeo.heading",
    label: "Lokales SEO - Heading",
    type: "string",
  },
  {
    path: "sections.lokalesSeo.text",
    label: "Lokales SEO - Text",
    type: "string",
  },
  {
    path: "sections.lokalesSeo.address",
    label: "Lokales SEO - Adresse",
    type: "string",
  },
  {
    path: "sections.lokalesSeo.phone",
    label: "Lokales SEO - Telefon",
    type: "string",
  },
  {
    path: "sections.lokalesSeo.website",
    label: "Lokales SEO - Website",
    type: "string",
  },

  { path: "sections.links.score", label: "Links - Note", type: "grade" },
  { path: "sections.links.heading", label: "Links - Heading", type: "string" },
  { path: "sections.links.text", label: "Links - Text", type: "string" },
  {
    path: "sections.links.domainStrength",
    label: "Links - Domain Strength",
    type: "number",
  },
  {
    path: "sections.links.totalBacklinks",
    label: "Links - Total Backlinks",
    type: "number",
  },
  {
    path: "sections.links.referringDomains",
    label: "Links - Referring Domains",
    type: "number",
  },

  { path: "topRisks", label: "Top Risiken (Liste)", type: "array" },
  { path: "recommendations", label: "Empfehlungen (Liste)", type: "array" },
  {
    path: "sections.onpageSeo.technicalChecks",
    label: "On-Page Technical Checks (Liste)",
    type: "array",
  },
  {
    path: "sections.uxConversion.findings",
    label: "UX Findings (Liste)",
    type: "array",
  },
  {
    path: "sections.links.topBacklinks",
    label: "Top Backlinks (Tabelle)",
    type: "array",
  },
  {
    path: "sections.links.topPages",
    label: "Top Pages (Tabelle)",
    type: "array",
  },

  { path: "screenshots.cover", label: "Cover Screenshot", type: "image" },
  { path: "screenshots.mobile", label: "Mobile Screenshot", type: "image" },
  { path: "screenshots.tablet", label: "Tablet Screenshot", type: "image" },
];

export function bindingsForValueTypes(
  types: BindingValueType[],
): BindingEntry[] {
  return BINDING_CATALOG.filter((entry) => types.includes(entry.type));
}
