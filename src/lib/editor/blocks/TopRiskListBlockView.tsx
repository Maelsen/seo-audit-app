import type { ReactElement } from "react";
import type { AuditData, TopRisk } from "../../types";
import { resolveBinding } from "../resolve-binding";
import type { ListBlock } from "../template-types";
import { frameStyle } from "../frame-style";
import { resolveShrink, scaleStyle } from "./list-helpers";

type Props = { block: ListBlock; audit: AuditData };

export function TopRiskListBlockView({ block, audit }: Props): ReactElement {
  const raw =
    block.binding.kind === "audit" ? resolveBinding(audit, block.binding) : [];
  const risks: TopRisk[] = Array.isArray(raw) ? (raw as TopRisk[]) : [];
  const { scale, displayCount, overflowCount } = resolveShrink(
    block,
    risks.length,
  );
  const visible = risks.slice(0, displayCount);

  return (
    <div
      data-block-id={block.id}
      data-block-type="topRiskList"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        flexDirection: "column",
        gap: `${block.itemGap * scale}mm`,
        overflow: "hidden",
      }}
    >
      {visible.map((risk, idx) => (
        <div key={idx}>
          <div
            style={{
              ...scaleStyle(block.itemStyle.titleStyle, scale),
              marginBottom: `${1.2 * scale}mm`,
            }}
          >
            {block.numbered === false ? "" : `${idx + 1}. `}
            {risk.title}
          </div>
          <div
            style={{
              ...scaleStyle(block.itemStyle.bodyStyle, scale),
              whiteSpace: "pre-line",
            }}
          >
            {risk.description}
          </div>
        </div>
      ))}
      {overflowCount > 0 && (
        <div
          style={{
            ...scaleStyle(block.itemStyle.bodyStyle, scale),
            opacity: 0.6,
            fontStyle: "italic",
          }}
        >
          +{overflowCount} weitere
        </div>
      )}
    </div>
  );
}
