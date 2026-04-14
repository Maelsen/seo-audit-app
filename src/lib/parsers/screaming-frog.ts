import Papa from "papaparse";

export type ScreamingFrogIssue = {
  issueName: string;
  issueType: string;
  issuePriority: string;
  urls: number;
  percentOfTotal: number;
  description?: string;
};

export type ScreamingFrogData = {
  issues: ScreamingFrogIssue[];
  totals: {
    missingTitleTags: number;
    shortTitles: number;
    longTitles: number;
    missingMetaDescriptions: number;
    missingAltAttributes: number;
    brokenLinks: number;
    redirects: number;
    duplicateContent: number;
    missingH1: number;
    multipleH1: number;
  };
  raw: Record<string, string>[];
};

function normalizeNumber(v: string): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/,/g, "."));
  return isNaN(n) ? 0 : n;
}

function matchesAny(label: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(label));
}

export function parseScreamingFrogCsv(csvText: string): ScreamingFrogData {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  const rows = parsed.data;

  const issues: ScreamingFrogIssue[] = rows
    .map((row) => {
      const issueName =
        row["Issue Name"] ??
        row["Issue"] ??
        row["Problem"] ??
        row["Problemname"] ??
        "";
      const issueType =
        row["Issue Type"] ?? row["Type"] ?? row["Problemtyp"] ?? "";
      const issuePriority =
        row["Issue Priority"] ??
        row["Priority"] ??
        row["Problempriorität"] ??
        row["Priorität"] ??
        "";
      const urlsStr =
        row["URLs"] ?? row["URL Count"] ?? row["Anzahl URLs"] ?? "0";
      const percentStr =
        row["% of Total"] ??
        row["Percent of Total"] ??
        row["% der URLs"] ??
        "0";
      const desc = row["Description"] ?? row["Beschreibung"];
      return {
        issueName,
        issueType,
        issuePriority,
        urls: Math.round(normalizeNumber(urlsStr)),
        percentOfTotal: normalizeNumber(percentStr),
        description: desc,
      };
    })
    .filter((i) => i.issueName);

  const totals = {
    missingTitleTags: sumIssues(issues, [
      /missing\s*title/i,
      /title.*fehlt/i,
      /title.*missing/i,
    ]),
    shortTitles: sumIssues(issues, [/short\s*title/i, /title.*zu.*kurz/i]),
    longTitles: sumIssues(issues, [/long\s*title/i, /title.*zu.*lang/i]),
    missingMetaDescriptions: sumIssues(issues, [
      /missing.*meta.*description/i,
      /meta.*description.*fehlt/i,
    ]),
    missingAltAttributes: sumIssues(issues, [
      /missing.*alt/i,
      /alt.*attribut.*fehlt/i,
      /images?.*missing.*alt/i,
    ]),
    brokenLinks: sumIssues(issues, [
      /broken/i,
      /client\s*error\s*\(4xx\)/i,
      /server\s*error\s*\(5xx\)/i,
      /404/,
    ]),
    redirects: sumIssues(issues, [/redirect/i, /3xx/i, /weiterleitung/i]),
    duplicateContent: sumIssues(issues, [/duplicate/i, /duplikat/i]),
    missingH1: sumIssues(issues, [/missing.*h1/i, /h1.*fehlt/i]),
    multipleH1: sumIssues(issues, [/multiple.*h1/i, /mehrere.*h1/i]),
  };

  return { issues, totals, raw: rows };
}

function sumIssues(issues: ScreamingFrogIssue[], patterns: RegExp[]): number {
  return issues
    .filter((i) => matchesAny(i.issueName, patterns))
    .reduce((sum, i) => sum + i.urls, 0);
}
