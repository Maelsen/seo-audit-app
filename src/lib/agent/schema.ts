import { z } from "zod";

const gradeValues = [
  "A+", "A", "A-",
  "B+", "B", "B-",
  "C+", "C", "C-",
  "D+", "D", "D-",
  "F",
] as const;

const checkStatus = z.enum(["ok", "warning", "fail", "info"]);

const finding = z.object({
  label: z.string(),
  status: checkStatus,
  detail: z.string().optional(),
});

const grade = z.enum(gradeValues);

const categoryBase = z.object({
  score: grade,
  heading: z.string(),
  text: z.string(),
});

export const auditSchema = z.object({
  overallScore: grade,
  overallHeading: z.string(),
  introText: z.string(),
  sections: z.object({
    onpageSeo: categoryBase.extend({
      titleTag: z.object({
        value: z.string(),
        length: z.number(),
        status: checkStatus,
      }),
      metaDescription: z.object({
        value: z.string(),
        length: z.number(),
        status: checkStatus,
      }),
      serpPreview: z.object({
        title: z.string(),
        url: z.string(),
        description: z.string(),
      }),
      language: z.object({ value: z.string(), status: checkStatus }),
      h1: z.object({ value: z.string(), status: checkStatus }),
      h2h6Frequency: z.object({
        h2: z.number(),
        h3: z.number(),
        h4: z.number(),
        h5: z.number(),
        h6: z.number(),
      }),
      wordCount: z.object({ value: z.number(), status: checkStatus }),
      technicalChecks: z.array(finding),
    }),
    uxConversion: categoryBase.extend({
      findings: z.array(finding),
      summary: z.string(),
    }),
    usability: categoryBase.extend({
      mobilePageSpeed: z.number(),
      desktopPageSpeed: z.number(),
      coreWebVitals: checkStatus,
      viewport: checkStatus,
      pageSpeedStatus: checkStatus,
    }),
    leistung: categoryBase.extend({
      serverResponseTime: z.number(),
      contentLoadTime: z.number(),
      scriptLoadTime: z.number(),
      resources: z.object({
        html: z.number(),
        js: z.number(),
        css: z.number(),
        img: z.number(),
        other: z.number(),
        total: z.number(),
      }),
      jsErrors: checkStatus,
      http2: checkStatus,
      imagesOptimized: checkStatus,
      minified: checkStatus,
    }),
    social: categoryBase.extend({
      checks: z.array(finding),
    }),
    lokalesSeo: categoryBase.extend({
      businessSchema: checkStatus,
      gbpIdentified: checkStatus,
      gbpCompleteness: checkStatus,
      address: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      reviewsStatus: checkStatus,
      googleReviews: z
        .object({
          rating: z.number(),
          count: z.number(),
          distribution: z.array(
            z.object({
              stars: z.union([
                z.literal(1),
                z.literal(2),
                z.literal(3),
                z.literal(4),
                z.literal(5),
              ]),
              count: z.number(),
            }),
          ),
        })
        .optional(),
    }),
    links: categoryBase.extend({
      domainStrength: z.number(),
      pageStrength: z.number(),
      totalBacklinks: z.number(),
      referringDomains: z.number(),
      nofollow: z.number(),
      dofollow: z.number(),
      subnets: z.number(),
      ips: z.number(),
      govBacklinks: z.number(),
      topBacklinks: z.array(
        z.object({
          domainStrength: z.number(),
          url: z.string(),
          title: z.string(),
          anchor: z.string(),
        }),
      ),
      topPages: z.array(
        z.object({ url: z.string(), backlinks: z.number() }),
      ),
      topAnchors: z.array(
        z.object({ anchor: z.string(), backlinks: z.number() }),
      ),
      topTlds: z.array(z.object({ tld: z.string(), count: z.number() })),
      topCountries: z.array(
        z.object({ country: z.string(), count: z.number() }),
      ),
      internalLinks: z.number(),
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
  recommendations: z.array(
    z.object({
      title: z.string(),
      priority: z.enum(["hoch", "mittel", "niedrig"]),
      text: z.string().optional(),
    }),
  ),
});

export type AuditSchema = z.infer<typeof auditSchema>;
