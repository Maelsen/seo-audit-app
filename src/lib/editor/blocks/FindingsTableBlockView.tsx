import type { CSSProperties, ReactElement } from "react";
import type { AuditData, CheckStatus } from "../../types";
import { resolveBinding, resolvePath } from "../resolve-binding";
import type { FindingsTableBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";
import { useTemplateAssets } from "../asset-context";

type Props = { block: FindingsTableBlock; audit: AuditData };

function toText(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

export function FindingsTableBlockView({ block, audit }: Props): ReactElement {
  const assets = useTemplateAssets();
  const raw =
    block.binding.kind === "audit" ? resolveBinding(audit, block.binding) : [];
  const rows = Array.isArray(raw) ? raw : [];

  const palette = {
    ok: block.statusPalette?.ok ?? assets.statuses.ok,
    warning: block.statusPalette?.warning ?? assets.statuses.warning,
    fail: block.statusPalette?.fail ?? assets.statuses.fail,
    info: block.statusPalette?.info ?? assets.statuses.info,
  };

  const headerCellBase: CSSProperties = {
    ...textStyleToCss(block.headerStyle),
    boxSizing: "border-box",
    paddingBottom: `${block.headerPaddingBottom}mm`,
    borderBottom: `${block.headerUnderlineThickness}mm solid ${block.headerUnderlineColor}`,
  };
  const problemCellBase: CSSProperties = {
    ...textStyleToCss(block.problemStyle),
    padding: `${block.rowVerticalPadding}mm 2mm`,
    boxSizing: "border-box",
    wordBreak: "break-word",
  };
  const befundCellBase: CSSProperties = {
    ...textStyleToCss(block.befundStyle),
    padding: `${block.rowVerticalPadding}mm 2mm`,
    boxSizing: "border-box",
    wordBreak: "break-word",
  };
  const statusCellBase: CSSProperties = {
    padding: `${block.rowVerticalPadding}mm 2mm`,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      data-block-id={block.id}
      data-block-type="findingsTable"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex" }}>
        <div
          style={{
            ...headerCellBase,
            flex: `0 0 ${block.problemColumnWidth}mm`,
            textAlign: "left",
          }}
        >
          Problem
        </div>
        <div style={{ ...headerCellBase, flex: 1, textAlign: "left" }}>
          Befund
        </div>
        <div
          style={{
            ...headerCellBase,
            flex: `0 0 ${block.statusColumnWidth}mm`,
            textAlign: "right",
          }}
        >
          Status
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((row, rowIdx) => {
          const status = (resolvePath(row, block.statusFieldPath) ??
            "info") as CheckStatus;
          const icon = palette[status] ?? palette.info;
          const iconImage =
            "imageSrc" in icon
              ? (icon as { imageSrc?: string }).imageSrc
              : undefined;

          return (
            <div
              key={rowIdx}
              style={{
                display: "flex",
                borderBottom:
                  rowIdx < rows.length - 1
                    ? `0.3mm solid ${block.rowDividerColor}`
                    : "none",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  ...problemCellBase,
                  flex: `0 0 ${block.problemColumnWidth}mm`,
                }}
              >
                {toText(resolvePath(row, block.problemFieldPath))}
              </div>
              <div style={{ ...befundCellBase, flex: 1 }}>
                {toText(resolvePath(row, block.befundFieldPath))}
              </div>
              <div
                style={{
                  ...statusCellBase,
                  flex: `0 0 ${block.statusColumnWidth}mm`,
                }}
              >
                {iconImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconImage}
                    alt={status}
                    style={{
                      height: `${block.statusIconSize}mm`,
                      width: "auto",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      color: icon.color,
                      fontSize: `${block.statusIconSize * 2.835}pt`,
                      lineHeight: 1,
                      fontWeight: 700,
                    }}
                  >
                    {icon.symbol}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
