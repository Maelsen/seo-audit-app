import type { CSSProperties, ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding, resolvePath } from "../resolve-binding";
import type { ComparisonTableBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: ComparisonTableBlock; audit: AuditData };

function toCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return value.toLocaleString("de-DE");
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function ComparisonTableBlockView({
  block,
  audit,
}: Props): ReactElement {
  const raw =
    block.binding.kind === "audit" ? resolveBinding(audit, block.binding) : [];
  const rows = Array.isArray(raw) ? raw : [];

  const pad = block.headerPillPadding;
  const headerCss: CSSProperties = {
    ...textStyleToCss(block.headerStyle),
    background: block.headerPillColor,
    borderRadius: `${block.headerPillRadius}mm`,
    padding: `${pad.top}mm ${pad.right}mm ${pad.bottom}mm ${pad.left}mm`,
    boxSizing: "border-box",
    flex: 1,
    textAlign: "center",
  };

  const cellCss: CSSProperties = {
    ...textStyleToCss(block.cellStyle),
    padding: `${block.rowVerticalPadding}mm 2mm`,
    flex: 1,
    wordBreak: "break-word",
    boxSizing: "border-box",
  };

  return (
    <div
      data-block-id={block.id}
      data-block-type="comparisonTable"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: `${block.headerCellGap}mm`,
        }}
      >
        {block.columns.map((col, idx) => (
          <div
            key={idx}
            style={col.width ? { ...headerCss, flex: `0 0 ${col.width}mm` } : headerCss}
          >
            {col.header}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: "1.5mm" }}>
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "flex",
              gap: `${block.headerCellGap}mm`,
              borderBottom:
                rowIdx < rows.length - 1
                  ? `1px solid ${block.rowDividerColor}`
                  : "none",
              alignItems: "center",
            }}
          >
            {block.columns.map((col, colIdx) => (
              <div
                key={colIdx}
                style={
                  col.width
                    ? { ...cellCss, flex: `0 0 ${col.width}mm` }
                    : cellCss
                }
              >
                {toCell(resolvePath(row, col.fieldPath))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
