import type { CSSProperties, ReactElement } from "react";
import {
  getBrandLogo,
  getBrandSignet,
} from "@/components/pdf-template/brand-state";
import type { BrandDecorationBlock } from "../template-types";
import { frameStyle } from "../frame-style";
import { useTemplateAssets } from "../asset-context";

type Props = { block: BrandDecorationBlock };

export function BrandDecorationBlockView({ block }: Props): ReactElement {
  const assets = useTemplateAssets();
  const base: CSSProperties = { ...frameStyle(block.frame) };

  if (block.kind === "footerBar") {
    return (
      <div
        data-block-id={block.id}
        data-block-type="brand-footerBar"
        style={{
          ...base,
          background:
            "linear-gradient(90deg, transparent, #38E1E1 20%, #38E1E1 80%, transparent)",
        }}
      />
    );
  }

  if (block.kind === "radialGlow") {
    return (
      <div
        data-block-id={block.id}
        data-block-type="brand-radialGlow"
        style={{
          ...base,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(56,225,225,0.04), transparent 40%), radial-gradient(circle at 80% 90%, rgba(56,225,225,0.04), transparent 40%)",
        }}
      />
    );
  }

  const templateSrc =
    block.kind === "logo" ? assets.logo : assets.signet;
  const moduleSrc =
    block.kind === "logo" ? getBrandLogo() : getBrandSignet();
  const publicFallback =
    block.kind === "logo"
      ? "/assets/ArtisticAvenue-Logo.png"
      : "/assets/ArtisticAvenue-Signet.png";
  const src = templateSrc ?? moduleSrc ?? publicFallback;

  if (!src) {
    return (
      <div
        data-block-id={block.id}
        data-block-type={`brand-${block.kind}-missing`}
        style={{ ...base, border: "1px dashed #38E1E1" }}
      />
    );
  }

  return (
    <div
      data-block-id={block.id}
      data-block-type={`brand-${block.kind}`}
      style={{
        ...base,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Artistic Avenue"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
