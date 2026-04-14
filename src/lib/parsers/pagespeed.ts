export type PageSpeedData = {
  mobile: {
    performanceScore: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  };
  desktop: {
    performanceScore: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  };
};

const API =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

type Strategy = "mobile" | "desktop";

async function fetchStrategy(url: string, strategy: Strategy) {
  const params = new URLSearchParams({
    url,
    strategy,
    category: "performance",
  });
  const apiKey =
    process.env.GOOGLE_PAGESPEED_API_KEY || process.env.PAGESPEED_API_KEY;
  if (apiKey) params.append("key", apiKey);
  const res = await fetch(`${API}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(
      `PageSpeed API failed for ${strategy}: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

function extractMetrics(json: unknown) {
  const j = json as {
    lighthouseResult?: {
      categories?: { performance?: { score?: number } };
      audits?: Record<string, { numericValue?: number }>;
    };
  };
  const score = Math.round(
    (j.lighthouseResult?.categories?.performance?.score ?? 0) * 100,
  );
  const audits = j.lighthouseResult?.audits ?? {};
  return {
    performanceScore: score,
    lcp: audits["largest-contentful-paint"]?.numericValue,
    fcp: audits["first-contentful-paint"]?.numericValue,
    cls: audits["cumulative-layout-shift"]?.numericValue,
    ttfb: audits["server-response-time"]?.numericValue,
  };
}

export async function fetchPageSpeed(url: string): Promise<PageSpeedData> {
  const [mobileRaw, desktopRaw] = await Promise.all([
    fetchStrategy(url, "mobile"),
    fetchStrategy(url, "desktop"),
  ]);
  return {
    mobile: extractMetrics(mobileRaw),
    desktop: extractMetrics(desktopRaw),
  };
}
