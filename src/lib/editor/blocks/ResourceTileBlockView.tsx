import type { ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding } from "../resolve-binding";
import type { ResourceTileBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: ResourceTileBlock; audit: AuditData };

export function ResourceTileBlockView({ block, audit }: Props): ReactElement {
  const raw =
    block.binding.kind === "audit" ? resolveBinding(audit, block.binding) : 0;
  const value = raw == null ? 0 : Number(raw);

  const layout = block.tileLayout ?? "centered";
  const isLeft = layout === "left";
  const padding = block.tilePadding ?? 0;
  const borderRadius = block.tileBorderRadius ?? 0;
  const iconSize = block.iconSize ?? 14;

  return (
    <div
      data-block-id={block.id}
      data-block-type="resourceTile"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        flexDirection: "column",
        alignItems: isLeft ? "flex-start" : "center",
        justifyContent: "flex-start",
        overflow: "hidden",
        background: block.tileBg ?? "transparent",
        borderRadius: borderRadius ? `${borderRadius}mm` : undefined,
        padding: padding ? `${padding}mm` : undefined,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: `${iconSize}mm`,
          height: `${iconSize}mm`,
          borderRadius: "1.5mm",
          background: block.iconBg,
          color: block.iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Poppins', Arial, sans-serif",
          fontSize: `${(iconSize / 14) * 10}pt`,
          fontWeight: 700,
          marginBottom: "1.5mm",
          flexShrink: 0,
        }}
      >
        {block.iconSvg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.iconSvg}
            alt=""
            style={{
              width: `${iconSize * 0.65}mm`,
              height: `${iconSize * 0.65}mm`,
              objectFit: "contain",
            }}
          />
        ) : (
          block.icon
        )}
      </div>
      <div
        style={{
          ...textStyleToCss(block.valueStyle),
          textAlign: isLeft ? "left" : "center",
        }}
      >
        {value}
      </div>
      <div
        style={{
          ...textStyleToCss(block.labelStyle),
          marginTop: "0.6mm",
          textAlign: isLeft ? "left" : "center",
        }}
      >
        {block.label}
      </div>
    </div>
  );
}
