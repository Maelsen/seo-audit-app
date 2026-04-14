export type SeoptimerSection = {
  name: string;
  score?: string;
  text: string;
  items: { label: string; status: string; detail?: string }[];
};

export type SeoptimerData = {
  overallScore?: string;
  recommendationCount?: number;
  sections: SeoptimerSection[];
  recommendations: { title: string; priority: string }[];
  rawText: string;
};

export async function parseSeoptimerPdf(
  buffer: Buffer,
): Promise<SeoptimerData> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return extractFromText(result.text ?? "");
  } finally {
    await parser.destroy();
  }
}

export function parseSeoptimerText(text: string): SeoptimerData {
  return extractFromText(text);
}

function extractFromText(text: string): SeoptimerData {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const recommendations: { title: string; priority: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(
      /(High|Medium|Low|Hohe|Mittlere|Niedrige|Hoch|Mittel|Niedrig)\s*Priorit/i,
    );
    if (match) {
      const prev = lines[i - 1];
      if (prev && prev.length > 5 && prev.length < 200) {
        recommendations.push({
          title: prev,
          priority: mapPriority(match[1]),
        });
      }
    }
  }

  const overallMatch = text.match(/(A\+?|A-|B\+?|B-|C\+?|C-|D\+?|D-|F)[^\w]/);
  return {
    overallScore: overallMatch ? overallMatch[1] : undefined,
    recommendationCount: recommendations.length || undefined,
    sections: [],
    recommendations,
    rawText: text,
  };
}

function mapPriority(p: string): string {
  const low = p.toLowerCase();
  if (low.startsWith("h")) return "hoch";
  if (low.startsWith("m")) return "mittel";
  if (low.startsWith("l") || low.startsWith("n")) return "niedrig";
  return "niedrig";
}
