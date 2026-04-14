import type { CSSProperties } from "react";
import type { ListBlock, TextStyle } from "../template-types";

const PT_TO_MM = 0.3528;

export function resolveShrink(
  block: ListBlock,
  itemCount: number,
): { scale: number; displayCount: number; overflowCount: number } {
  const max =
    block.maxItems != null && block.maxItems > 0
      ? Math.min(block.maxItems, itemCount)
      : itemCount;
  if (block.overflow === "clip") {
    return { scale: 1, displayCount: max, overflowCount: itemCount - max };
  }
  if (block.overflow === "shrink") {
    if (max === 0) return { scale: 1, displayCount: 0, overflowCount: 0 };
    const title = block.itemStyle.titleStyle.fontSize;
    const body = block.itemStyle.bodyStyle.fontSize;
    const titleLh = block.itemStyle.titleStyle.lineHeight || 1.2;
    const bodyLh = block.itemStyle.bodyStyle.lineHeight || 1.4;
    const perItemMm =
      (title * titleLh + body * bodyLh) * PT_TO_MM + (block.itemGap ?? 0);
    const neededMm = perItemMm * max;
    const availableMm = block.frame.h;
    const scale =
      neededMm <= availableMm ? 1 : Math.max(0.55, availableMm / neededMm);
    return { scale, displayCount: max, overflowCount: 0 };
  }
  return { scale: 1, displayCount: itemCount, overflowCount: 0 };
}

export function scaleStyle(style: TextStyle, scale: number): CSSProperties {
  return {
    fontFamily: `'${style.fontFamily}', Arial, sans-serif`,
    fontSize: `${style.fontSize * scale}pt`,
    fontWeight: style.fontWeight,
    color: style.color,
    lineHeight: style.lineHeight,
    letterSpacing:
      style.letterSpacing != null
        ? `${style.letterSpacing * scale}pt`
        : undefined,
    textAlign: style.textAlign,
    textTransform: style.textTransform,
  };
}

export const DEFAULT_PRIORITY_PALETTE = {
  hoch: { label: "Hohe Priorität", color: "#ef4444" },
  mittel: { label: "Mittlere Priorität", color: "#f97316" },
  niedrig: { label: "Niedrige Priorität", color: "#22c55e" },
};

export const DEFAULT_STATUS_PALETTE = {
  ok: { symbol: "✓", color: "#22c55e" },
  warning: { symbol: "!", color: "#f97316" },
  fail: { symbol: "✕", color: "#ef4444" },
  info: { symbol: "i", color: "#38E1E1" },
};
