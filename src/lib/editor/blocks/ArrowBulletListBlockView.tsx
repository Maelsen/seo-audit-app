import type { CSSProperties, ReactElement } from "react";
import type { ActionItem, AuditData } from "../../types";
import { resolveBinding } from "../resolve-binding";
import type { ArrowBulletListBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: ArrowBulletListBlock; audit: AuditData };

export function ArrowBulletListBlockView({ block, audit }: Props): ReactElement {
  const raw =
    block.binding.kind === "audit"
      ? resolveBinding(audit, block.binding)
      : block.staticItems;
  const items: ActionItem[] = Array.isArray(raw)
    ? (raw as ActionItem[])
    : [];

  const max =
    block.maxItems != null && block.maxItems > 0 && items.length > block.maxItems
      ? block.maxItems
      : items.length;
  const visible = items.slice(0, max);

  const titleCss: CSSProperties = textStyleToCss(block.titleStyle);
  const detailCss: CSSProperties = textStyleToCss(block.detailStyle);

  return (
    <div
      data-block-id={block.id}
      data-block-type="arrowBulletList"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        flexDirection: "column",
        gap: `${block.itemGap}mm`,
        overflow: "hidden",
      }}
    >
      {visible.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: `${block.arrowGap}mm`,
          }}
        >
          <ArrowGlyph color={block.arrowColor} sizeMm={block.arrowSize} />
          <div style={{ flex: 1 }}>
            <div style={titleCss}>{item.title}</div>
            {item.detail ? (
              <div style={{ ...detailCss, marginTop: "0.8mm" }}>
                {item.detail}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArrowGlyph({
  color,
  sizeMm,
}: {
  color: string;
  sizeMm: number;
}): ReactElement {
  return (
    <svg
      width={`${sizeMm}mm`}
      height={`${sizeMm}mm`}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0, marginTop: "0.6mm" }}
      aria-hidden="true"
    >
      <polygon points="4,4 4,20 20,12" fill={color} />
    </svg>
  );
}
