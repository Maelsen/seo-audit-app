import type { ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding, resolvePath } from "../resolve-binding";
import type { BarChartBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: BarChartBlock; audit: AuditData };

const PT_TO_MM = 0.3528;

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

  const overflow = block.overflow ?? "clip";
  let scale = 1;
  if (overflow === "shrink" && entries.length > 0) {
    const labelMm = block.labelStyle.fontSize * (block.labelStyle.lineHeight || 1.2) * PT_TO_MM;
    const rowMm = Math.max(labelMm, block.barHeight);
    const neededMm = rowMm * entries.length + block.gap * Math.max(0, entries.length - 1);
    if (neededMm > block.frame.h) {
      scale = Math.max(0.55, block.frame.h / neededMm);
    }
  }

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
              marginBottom: idx < entries.length - 1 ? `${block.gap * scale}mm` : 0,
            }}
          >
            <div
              style={{
                ...textStyleToCss(block.labelStyle),
                fontSize: `${block.labelStyle.fontSize * scale}pt`,
                width: "10mm",
              }}
            >
              {entry.label}
            </div>
            <div
              style={{
                ...textStyleToCss(block.valueStyle),
                fontSize: `${block.valueStyle.fontSize * scale}pt`,
                width: "10mm",
              }}
            >
              {entry.value}
            </div>
            <div
              style={{
                flex: 1,
                height: `${block.barHeight * scale}mm`,
                background: block.trackColor,
                borderRadius: `${(block.barHeight * scale) / 2}mm`,
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
