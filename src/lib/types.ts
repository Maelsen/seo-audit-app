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

export type SectionFinding = {
  problem: string;
  befund: string;
  status: CheckStatus;
};

export type ActionItem = {
  title: string;
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

export type SectionBase = {
  score: Grade;
  heading: string;
  text: string;
  findings: SectionFinding[];
  costText: string;
  actions: ActionItem[];
  closingNote?: string;
};

export type OnPageSeoSection = SectionBase & {
  serpPreview: SerpPreview;
  h2h6Frequency: { h2: number; h3: number; h4: number; h5: number; h6: number };
};

export type UxConversionSection = SectionBase;

export type SeitenstrukturContentSection = SectionBase & {
  comparisonImages?: { src?: string; caption?: string }[];
};

export type LokalesSeoSection = SectionBase & {
  schemaMarkupImage?: string;
  schemaMarkupCaption?: string;
};

export type LeistungSection = SectionBase & {
  serverResponseTime: number;
  contentLoadTime: number;
  scriptLoadTime: number;
  resourceCounts: {
    html: number;
    js: number;
    css: number;
    img: number;
    other: number;
    total: number;
  };
  pageSizeMb: number;
  pageSizeBreakdown: {
    html: number;
    js: number;
    css: number;
    img: number;
    other: number;
  };
};

export type LinksSection = SectionBase & {
  domainStrength: number;
  pageStrength: number;
  totalBacklinks: number;
  referringDomains: number;
  nofollow: number;
  dofollow: number;
  subnets: number;
  ips: number;
  govBacklinks: number;
};

export type ComparisonAlt = {
  aspect: string;
  vision: string;
};

export type ComparisonRow = {
  problem: string;
  today: string;
  future: string;
};

export type ComparisonSection = {
  heading: string;
  altSentences: ComparisonAlt[];
  rows: ComparisonRow[];
};

export type PhaseEntry = {
  measure: string;
  impact: string;
};

export type PhasenplanPhase = {
  title: string;
  entries: PhaseEntry[];
};

export type PhasenplanSection = {
  intro: string;
  phase1: PhasenplanPhase;
  phase2: PhasenplanPhase;
  phase3: PhasenplanPhase;
  afterPhase1: string;
  afterPhase2: string;
  afterPhase3: string;
};

export type SummaryItem = {
  headline: string;
  body: string;
};

export type SummarySection = {
  heading: string;
  subline: string;
  topIssues: SummaryItem[];
  closingHeadline: string;
  closingSubline: string;
  closingBody: string;
  ctaCyan: string;
  ctaBold: string;
};

export type InhaberSection = {
  thankYou: string;
  body: string;
  outroItalic: string;
  ps: string;
  name: string;
  role: string;
  photo?: string;
  phone: string;
  email: string;
  website: string;
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
  diagnosisText: string;
  sections: {
    onpageSeo: OnPageSeoSection;
    uxConversion: UxConversionSection;
    seitenstrukturContent: SeitenstrukturContentSection;
    lokalesSeo: LokalesSeoSection;
    leistung: LeistungSection;
    links: LinksSection;
  };
  topRisks: TopRisk[];
  comparison: ComparisonSection;
  phasenplan: PhasenplanSection;
  summary: SummarySection;
  inhaber: InhaberSection;
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
