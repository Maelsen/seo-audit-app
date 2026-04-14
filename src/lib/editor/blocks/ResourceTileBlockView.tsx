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

  return (
    <div
      data-block-id={block.id}
      data-block-type="resourceTile"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "14mm",
          height: "14mm",
          borderRadius: "1.5mm",
          background: block.iconBg,
          color: block.iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Poppins', Arial, sans-serif",
          fontSize: "10pt",
          fontWeight: 700,
          marginBottom: "1.5mm",
        }}
      >
        {block.icon}
      </div>
      <div style={textStyleToCss(block.valueStyle)}>{value}</div>
      <div
        style={{
          ...textStyleToCss(block.labelStyle),
          marginTop: "0.6mm",
          textAlign: "center",
        }}
      >
        {block.label}
      </div>
    </div>
  );
}
