import type { ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding } from "../resolve-binding";
import type { SerpPreviewBlock } from "../template-types";
import { frameStyle } from "../frame-style";

type Props = { block: SerpPreviewBlock; audit: AuditData };

function asText(value: unknown): string {
  return value == null ? "" : String(value);
}

export function SerpPreviewBlockView({ block, audit }: Props): ReactElement {
  const url = asText(
    block.urlBinding.kind === "audit"
      ? resolveBinding(audit, block.urlBinding)
      : "",
  );
  const title = asText(
    block.titleBinding.kind === "audit"
      ? resolveBinding(audit, block.titleBinding)
      : "",
  );
  const description = asText(
    block.descriptionBinding.kind === "audit"
      ? resolveBinding(audit, block.descriptionBinding)
      : "",
  );

  return (
    <div
      data-block-id={block.id}
      data-block-type="serpPreview"
      style={{
        ...frameStyle(block.frame),
        background: "#ffffff",
        padding: "2.5mm",
        borderRadius: "1.5mm",
        color: "#1a1a1a",
        fontFamily: "'Open Sans', Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <div style={{ fontSize: "7pt", color: "#555" }}>{url}</div>
      <div
        style={{
          color: "#1a0dab",
          fontSize: "10pt",
          fontWeight: 700,
          marginTop: "0.8mm",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: "8pt", color: "#333", marginTop: "0.8mm" }}>
        {description}
      </div>
    </div>
  );
}
