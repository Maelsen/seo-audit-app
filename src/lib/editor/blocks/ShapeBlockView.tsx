import type { CSSProperties, ReactElement } from "react";
import type { ShapeBlock } from "../template-types";
import { frameStyle } from "../frame-style";

type Props = { block: ShapeBlock };

export function ShapeBlockView({ block }: Props): ReactElement {
  const base: CSSProperties = { ...frameStyle(block.frame) };
  if (block.shape === "ellipse") {
    base.borderRadius = "50%";
  }
  if (block.gradient) {
    base.backgroundImage = `linear-gradient(${block.gradient.angle}deg, ${block.gradient.from}, ${block.gradient.to})`;
  } else if (block.fill) {
    base.background = block.fill;
  }
  if (block.stroke) {
    base.border = `${block.strokeWidth ?? 1}px solid ${block.stroke}`;
  }
  if (block.shape !== "ellipse" && block.borderRadius != null) {
    base.borderRadius = `${block.borderRadius}mm`;
  }
  if (block.boxShadow) {
    base.boxShadow = block.boxShadow;
  }
  return (
    <div
      data-block-id={block.id}
      data-block-type={`shape-${block.shape}`}
      style={base}
    />
  );
}
