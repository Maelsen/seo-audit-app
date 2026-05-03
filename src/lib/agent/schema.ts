import { z } from "zod";

const gradeValues = [
  "A+", "A", "A-",
  "B+", "B", "B-",
  "C+", "C", "C-",
  "D+", "D", "D-",
  "F",
] as const;

const checkStatus = z.enum(["ok", "warning", "fail", "info"]);

const sectionFinding = z.object({
  problem: z.string(),
  befund: z.string(),
  status: checkStatus,
});

const actionItem = z.object({
  title: z.string(),
  detail: z.string().optional(),
});

const grade = z.enum(gradeValues);

const sectionBase = z.object({
  score: grade,
  heading: z.string(),
  text: z.string(),
  findings: z.array(sectionFinding),
  costText: z.string(),
  actions: z.array(actionItem),
  closingNote: z.string().optional(),
});

export const auditSchema = z.object({
  overallScore: grade,
  overallHeading: z.string(),
  introText: z.string(),
  diagnosisText: z.string(),
  sections: z.object({
    onpageSeo: sectionBase.extend({
      serpPreview: z.object({
        title: z.string(),
        url: z.string(),
        description: z.string(),
      }),
      h2h6Frequency: z.object({
        h2: z.number(),
        h3: z.number(),
        h4: z.number(),
        h5: z.number(),
        h6: z.number(),
      }),
    }),
    uxConversion: sectionBase,
    seitenstrukturContent: sectionBase.extend({
      comparisonImages: z
        .array(
          z.object({
            src: z.string().optional(),
            caption: z.string().optional(),
          }),
        )
        .optional(),
    }),
    lokalesSeo: sectionBase.extend({
      schemaMarkupImage: z.string().optional(),
      schemaMarkupCaption: z.string().optional(),
    }),
    leistung: sectionBase.extend({
      serverResponseTime: z.number(),
      contentLoadTime: z.number(),
      scriptLoadTime: z.number(),
      resourceCounts: z.object({
        html: z.number(),
        js: z.number(),
        css: z.number(),
        img: z.number(),
        other: z.number(),
        total: z.number(),
      }),
      pageSizeMb: z.number(),
      pageSizeBreakdown: z.object({
        html: z.number(),
        js: z.number(),
        css: z.number(),
        img: z.number(),
        other: z.number(),
      }),
    }),
    links: sectionBase.extend({
      domainStrength: z.number(),
      pageStrength: z.number(),
      totalBacklinks: z.number(),
      referringDomains: z.number(),
      nofollow: z.number(),
      dofollow: z.number(),
      subnets: z.number(),
      ips: z.number(),
      govBacklinks: z.number(),
    }),
  }),
  topRisks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .length(3),
  comparison: z.object({
    heading: z.string(),
    altSentences: z.array(
      z.object({
        aspect: z.string(),
        vision: z.string(),
      }),
    ),
    rows: z.array(
      z.object({
        problem: z.string(),
        today: z.string(),
        future: z.string(),
      }),
    ),
  }),
  phasenplan: z.object({
    intro: z.string(),
    phase1: z.object({
      title: z.string(),
      entries: z.array(
        z.object({ measure: z.string(), impact: z.string() }),
      ),
    }),
    phase2: z.object({
      title: z.string(),
      entries: z.array(
        z.object({ measure: z.string(), impact: z.string() }),
      ),
    }),
    phase3: z.object({
      title: z.string(),
      entries: z.array(
        z.object({ measure: z.string(), impact: z.string() }),
      ),
    }),
    afterPhase1: z.string(),
    afterPhase2: z.string(),
    afterPhase3: z.string(),
  }),
  summary: z.object({
    heading: z.string(),
    subline: z.string(),
    topIssues: z.array(
      z.object({ headline: z.string(), body: z.string() }),
    ),
    closingHeadline: z.string(),
    closingSubline: z.string(),
    closingBody: z.string(),
    ctaCyan: z.string(),
    ctaBold: z.string(),
  }),
  inhaber: z.object({
    thankYou: z.string(),
    body: z.string(),
    outroItalic: z.string(),
    ps: z.string(),
    name: z.string(),
    role: z.string(),
    photo: z.string().optional(),
    phone: z.string(),
    email: z.string(),
    website: z.string(),
  }),
  recommendations: z.array(
    z.object({
      title: z.string(),
      priority: z.enum(["hoch", "mittel", "niedrig"]),
      text: z.string().optional(),
    }),
  ),
});

export type AuditSchema = z.infer<typeof auditSchema>;
