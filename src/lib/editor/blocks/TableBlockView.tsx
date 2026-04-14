import type { CSSProperties, ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding, resolvePath } from "../resolve-binding";
import type { TableBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: TableBlock; audit: AuditData };

function toCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return value.toLocaleString("de-DE");
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function TableBlockView({ block, audit }: Props): ReactElement {
  const raw =
    block.binding.kind === "audit" ? resolveBinding(audit, block.binding) : [];
  const rows = Array.isArray(raw) ? raw : [];
  const divider = block.rowDividerColor ?? "#2a2a2a";

  const headerCss: CSSProperties = {
    ...textStyleToCss(block.headerStyle),
    padding: "1.5mm 2mm",
    borderBottom: `1px solid ${divider}`,
  };
  const cellCss: CSSProperties = {
    ...textStyleToCss(block.cellStyle),
    padding: "1.5mm 2mm",
    borderBottom: `1px solid ${divider}`,
    wordBreak: "break-word",
  };

  return (
    <div
      data-block-id={block.id}
      data-block-type="table"
      style={{ ...frameStyle(block.frame), overflow: "hidden" }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          {block.columns.map((col, idx) => (
            <col
              key={idx}
              style={col.width ? { width: `${col.width}mm` } : undefined}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {block.columns.map((col, idx) => (
              <th key={idx} style={{ ...headerCss, textAlign: "left" }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {block.columns.map((col, colIdx) => (
                <td key={colIdx} style={cellCss}>
                  {toCell(resolvePath(row, col.fieldPath))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
