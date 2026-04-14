import type { TemplateAssets } from "./template-types";
import { DEFAULT_TEMPLATE_ASSETS, withAssetDefaults } from "./asset-defaults";

let currentAssets: TemplateAssets = DEFAULT_TEMPLATE_ASSETS;

export function setTemplateAssets(assets: TemplateAssets | undefined): void {
  currentAssets = withAssetDefaults(assets);
}

export function useTemplateAssets(): TemplateAssets {
  return currentAssets;
}
