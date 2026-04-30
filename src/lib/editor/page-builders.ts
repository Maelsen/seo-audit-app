import type { Block } from "./template-types";

// Page builders for Vasileios' 20-page layout (M3-M13).
// Each builder returns an array of Blocks for one page.
// Currently all builders are empty stubs - blocks added per milestone.

export type PageKey =
  | "cover"
  | "gesamtsituation"
  | "topRisiken"
  | "woDuSeinKoenntest"
  | "onPageSeo1"
  | "onPageSeo2"
  | "uxConversion1"
  | "uxConversion2"
  | "seitenstrukturContent1"
  | "seitenstrukturContent2"
  | "lokalesSeo1"
  | "lokalesSeo2"
  | "performance1"
  | "performance2"
  | "links1"
  | "links2"
  | "phasenplan1"
  | "phasenplan2"
  | "zusammenfassung"
  | "inhaber";

const EMPTY_BUILDER = (): Block[] => [];

export const BUILDERS: Record<PageKey, () => Block[]> = {
  cover: EMPTY_BUILDER,
  gesamtsituation: EMPTY_BUILDER,
  topRisiken: EMPTY_BUILDER,
  woDuSeinKoenntest: EMPTY_BUILDER,
  onPageSeo1: EMPTY_BUILDER,
  onPageSeo2: EMPTY_BUILDER,
  uxConversion1: EMPTY_BUILDER,
  uxConversion2: EMPTY_BUILDER,
  seitenstrukturContent1: EMPTY_BUILDER,
  seitenstrukturContent2: EMPTY_BUILDER,
  lokalesSeo1: EMPTY_BUILDER,
  lokalesSeo2: EMPTY_BUILDER,
  performance1: EMPTY_BUILDER,
  performance2: EMPTY_BUILDER,
  links1: EMPTY_BUILDER,
  links2: EMPTY_BUILDER,
  phasenplan1: EMPTY_BUILDER,
  phasenplan2: EMPTY_BUILDER,
  zusammenfassung: EMPTY_BUILDER,
  inhaber: EMPTY_BUILDER,
};

export function decomposePageBlocks(pageKey: string): Block[] {
  const builder = BUILDERS[pageKey as PageKey];
  return builder ? builder() : [];
}
