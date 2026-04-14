import type { ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding, resolvePath } from "../resolve-binding";
import type { BarChartBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: BarChartBlock; audit: AuditData };

export function BarChartBlockView({ block, audit }: Props): ReactElement {
  const root =
    block.binding.kind === "audit"
      ? resolveBinding(audit, block.binding)
      : audit;
  const entries = block.items.map((item) => ({
    label: item.label,
    value: Number(resolvePath(root, item.fieldPath) ?? 0),
  }));
  const max =
    block.maxValue ??
    Math.max(10, ...entries.map((e) => e.value));

  return (
    <div
      data-block-id={block.id}
      data-block-type="barChart"
      style={{ ...frameStyle(block.frame), overflow: "hidden" }}
    >
      {entries.map((entry, idx) => {
        const pct = max > 0 ? Math.min(100, (entry.value / max) * 100) : 0;
        return (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              marginBottom: idx < entries.length - 1 ? `${block.gap}mm` : 0,
            }}
          >
            <div
              style={{ ...textStyleToCss(block.labelStyle), width: "10mm" }}
            >
              {entry.label}
            </div>
            <div
              style={{ ...textStyleToCss(block.valueStyle), width: "10mm" }}
            >
              {entry.value}
            </div>
            <div
              style={{
                flex: 1,
                height: `${block.barHeight}mm`,
                background: block.trackColor,
                borderRadius: `${block.barHeight / 2}mm`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: block.barColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
