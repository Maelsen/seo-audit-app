export type Grade =
  | "A+" | "A" | "A-"
  | "B+" | "B" | "B-"
  | "C+" | "C" | "C-"
  | "D+" | "D" | "D-"
  | "F";

export type Priority = "hoch" | "mittel" | "niedrig";

export type CheckStatus = "ok" | "warning" | "fail" | "info";

export type FindingCheck = {
  label: string;
  status: CheckStatus;
  detail?: string;
};

export type Recommendation = {
  id: string;
  title: string;
  priority: Priority;
  text?: string;
};

export type TopRisk = {
  title: string;
  description: string;
};

export type SerpPreview = {
  title: string;
  url: string;
  description: string;
};

export type OnPageSeoSection = {
  score: Grade;
  heading: string;
  text: string;
  titleTag: { value: string; length: number; status: CheckStatus };
  metaDescription: { value: string; length: number; status: CheckStatus };
  serpPreview: SerpPreview;
  language: { value: string; status: CheckStatus };
  h1: { value: string; status: CheckStatus };
  h2h6Frequency: { h2: number; h3: number; h4: number; h5: number; h6: number };
  wordCount: { value: number; status: CheckStatus };
  technicalChecks: FindingCheck[];
};

export type UxConversionSection = {
  score: Grade;
  heading: string;
  text: string;
  findings: FindingCheck[];
  summary: string;
};

export type LinksSection = {
  score: Grade;
  heading: string;
  text: string;
  domainStrength: number;
  pageStrength: number;
  totalBacklinks: number;
  referringDomains: number;
  nofollow: number;
  dofollow: number;
  subnets: number;
  ips: number;
  govBacklinks: number;
  topBacklinks: {
    domainStrength: number;
    url: string;
    title: string;
    anchor: string;
  }[];
  topPages: { url: string; backlinks: number }[];
  topAnchors: { anchor: string; backlinks: number }[];
  topTlds: { tld: string; count: number }[];
  topCountries: { country: string; count: number }[];
  internalLinks: number;
};

export type UsabilitySection = {
  score: Grade;
  heading: string;
  text: string;
  mobilePageSpeed: number;
  desktopPageSpeed: number;
  coreWebVitals: CheckStatus;
  viewport: CheckStatus;
  pageSpeedStatus: CheckStatus;
};

export type LeistungSection = {
  score: Grade;
  heading: string;
  text: string;
  serverResponseTime: number;
  contentLoadTime: number;
  scriptLoadTime: number;
  resources: {
    html: number;
    js: number;
    css: number;
    img: number;
    other: number;
    total: number;
  };
  jsErrors: CheckStatus;
  http2: CheckStatus;
  imagesOptimized: CheckStatus;
  minified: CheckStatus;
};

export type SocialSection = {
  score: Grade;
  heading: string;
  text: string;
  checks: FindingCheck[];
};

export type LokalesSeoSection = {
  score: Grade;
  heading: string;
  text: string;
  businessSchema: CheckStatus;
  gbpIdentified: CheckStatus;
  gbpCompleteness: CheckStatus;
  address?: string;
  phone?: string;
  website?: string;
  reviewsStatus: CheckStatus;
  googleReviews?: {
    rating: number;
    count: number;
    distribution: { stars: 1 | 2 | 3 | 4 | 5; count: number }[];
  };
};

export type AuditData = {
  id: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  projectName: string;
  overallScore: Grade;
  overallHeading: string;
  introText: string;
  sections: {
    onpageSeo: OnPageSeoSection;
    uxConversion: UxConversionSection;
    usability: UsabilitySection;
    leistung: LeistungSection;
    social: SocialSection;
    lokalesSeo: LokalesSeoSection;
    links: LinksSection;
  };
  topRisks: TopRisk[];
  recommendations: Recommendation[];
  screenshots: {
    cover?: string;
    mobile?: string;
    tablet?: string;
  };
  rawInputs?: {
    screamingFrog?: unknown;
    seoptimer?: unknown;
    pageSpeed?: unknown;
  };
  originalAi?: string;
};

export type EditEntry = {
  id: string;
  auditId: string;
  section: string;
  field: string;
  originalValue: string;
  editedValue: string;
  timestamp: string;
};

export type StyleProfile = {
  updatedAt: string;
  totalEdits: number;
  lastProcessedEditIndex: number;
  learnings: string[];
  lastReasoning?: string;
  explicitTips: string[];
};
