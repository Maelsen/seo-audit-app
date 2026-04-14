import type {
  Grade,
  GradePalette,
  TemplateAssets,
  TemplatePriorityAssets,
  TemplateStatusAssets,
} from "./template-types";

export const DEFAULT_GRADE_PALETTE: GradePalette = {
  "A+": { color: "#22c55e" },
  A: { color: "#22c55e" },
  "A-": { color: "#22c55e" },
  "B+": { color: "#a855f7" },
  B: { color: "#a855f7" },
  "B-": { color: "#a855f7" },
  "C+": { color: "#38E1E1" },
  C: { color: "#38E1E1" },
  "C-": { color: "#38E1E1" },
  "D+": { color: "#f97316" },
  D: { color: "#f97316" },
  "D-": { color: "#f97316" },
  F: { color: "#ef4444" },
};

export const DEFAULT_PRIORITY_ASSETS: TemplatePriorityAssets = {
  hoch: { label: "Hohe Priorität", color: "#ef4444" },
  mittel: { label: "Mittlere Priorität", color: "#f97316" },
  niedrig: { label: "Niedrige Priorität", color: "#22c55e" },
};

export const DEFAULT_STATUS_ASSETS: TemplateStatusAssets = {
  ok: { symbol: "\u2713", color: "#22c55e" },
  warning: { symbol: "!", color: "#f97316" },
  fail: { symbol: "\u2715", color: "#ef4444" },
  info: { symbol: "i", color: "#38E1E1" },
};

export const DEFAULT_TEMPLATE_ASSETS: TemplateAssets = {
  grades: DEFAULT_GRADE_PALETTE,
  priorities: DEFAULT_PRIORITY_ASSETS,
  statuses: DEFAULT_STATUS_ASSETS,
};

export function withAssetDefaults(
  assets: TemplateAssets | undefined,
): TemplateAssets {
  if (!assets) return DEFAULT_TEMPLATE_ASSETS;
  const grades: GradePalette = { ...DEFAULT_GRADE_PALETTE };
  for (const key of Object.keys(DEFAULT_GRADE_PALETTE) as Grade[]) {
    const incoming = assets.grades?.[key];
    if (incoming) grades[key] = { ...grades[key], ...incoming };
  }
  return {
    logo: assets.logo,
    signet: assets.signet,
    grades,
    priorities: {
      hoch: { ...DEFAULT_PRIORITY_ASSETS.hoch, ...assets.priorities?.hoch },
      mittel: { ...DEFAULT_PRIORITY_ASSETS.mittel, ...assets.priorities?.mittel },
      niedrig: { ...DEFAULT_PRIORITY_ASSETS.niedrig, ...assets.priorities?.niedrig },
    },
    statuses: {
      ok: { ...DEFAULT_STATUS_ASSETS.ok, ...assets.statuses?.ok },
      warning: { ...DEFAULT_STATUS_ASSETS.warning, ...assets.statuses?.warning },
      fail: { ...DEFAULT_STATUS_ASSETS.fail, ...assets.statuses?.fail },
      info: { ...DEFAULT_STATUS_ASSETS.info, ...assets.statuses?.info },
    },
  };
}
