import type { CSSProperties, ReactElement } from "react";
import type { ActionItem, AuditData } from "../../types";
import { resolveBinding } from "../resolve-binding";
import type { ArrowBulletListBlock, TextStyle } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: ArrowBulletListBlock; audit: AuditData };

const PT_TO_MM = 0.3528;

function scaleTextStyle(style: TextStyle, scale: number): CSSProperties {
  const base = textStyleToCss(style);
  return {
    ...base,
    fontSize: `${style.fontSize * scale}pt`,
    letterSpacing:
      style.letterSpacing != null
        ? `${style.letterSpacing * scale}pt`
        : undefined,
  };
}

function resolveLayout(
  block: ArrowBulletListBlock,
  itemCount: number,
  itemsHaveDetail: boolean,
): { scale: number; visibleCount: number } {
  const max =
    block.maxItems != null && block.maxItems > 0
      ? Math.min(block.maxItems, itemCount)
      : itemCount;

  if (block.overflow === "none") {
    return { scale: 1, visibleCount: max };
  }
  if (block.overflow === "clip" || max === 0) {
    return { scale: 1, visibleCount: max };
  }
  // shrink: estimate per-item height in mm and scale to fit frame.h.
  // Clamp scale to >=0.55 for legibility; if still overflowing, drop trailing items.
  const titleMm = block.titleStyle.fontSize * (block.titleStyle.lineHeight || 1.2) * PT_TO_MM;
  const detailMm = itemsHaveDetail
    ? block.detailStyle.fontSize * (block.detailStyle.lineHeight || 1.4) * PT_TO_MM + 0.8
    : 0;
  const perItemMm = Math.max(titleMm + detailMm, block.arrowSize) + block.itemGap;
  const neededMm = perItemMm * max;
  if (neededMm <= block.frame.h) {
    return { scale: 1, visibleCount: max };
  }
  const rawScale = block.frame.h / neededMm;
  if (rawScale >= 0.55) {
    return { scale: rawScale, visibleCount: max };
  }
  const scale = 0.55;
  const fitCount = Math.max(1, Math.floor(block.frame.h / (perItemMm * scale)));
  return { scale, visibleCount: Math.min(max, fitCount) };
}

export function ArrowBulletListBlockView({ block, audit }: Props): ReactElement {
  const raw =
    block.binding.kind === "audit"
      ? resolveBinding(audit, block.binding)
      : block.staticItems;
  const items: ActionItem[] = Array.isArray(raw)
    ? (raw as ActionItem[])
    : [];

  const itemsHaveDetail = items.some((it) => Boolean(it.detail));
  const { scale, visibleCount } = resolveLayout(block, items.length, itemsHaveDetail);
  const visible = items.slice(0, visibleCount);

  const titleCss = scaleTextStyle(block.titleStyle, scale);
  const detailCss = scaleTextStyle(block.detailStyle, scale);

  return (
    <div
      data-block-id={block.id}
      data-block-type="arrowBulletList"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        flexDirection: "column",
        gap: `${block.itemGap * scale}mm`,
        overflow: block.overflow === "none" ? "visible" : "hidden",
      }}
    >
      {visible.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: `${block.arrowGap * scale}mm`,
          }}
        >
          <ArrowGlyph
            color={block.arrowColor}
            sizeMm={block.arrowSize * scale}
          />
          <div style={{ flex: 1 }}>
            <div style={titleCss}>{item.title}</div>
            {item.detail ? (
              <div style={{ ...detailCss, marginTop: `${0.8 * scale}mm` }}>
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
