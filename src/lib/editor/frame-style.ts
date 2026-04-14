import type { CSSProperties } from "react";
import type { Frame, TextStyle } from "./template-types";

export function frameStyle(frame: Frame): CSSProperties {
  const transform = frame.rotation ? `rotate(${frame.rotation}deg)` : undefined;
  return {
    position: "absolute",
    left: `${frame.x}mm`,
    top: `${frame.y}mm`,
    width: `${frame.w}mm`,
    height: `${frame.h}mm`,
    transform,
    transformOrigin: "top left",
  };
}

export function textStyleToCss(style: TextStyle): CSSProperties {
  const pad = style.padding;
  return {
    fontFamily: `'${style.fontFamily}', Arial, sans-serif`,
    fontSize: `${style.fontSize}pt`,
    fontWeight: style.fontWeight,
    color: style.color,
    lineHeight: style.lineHeight,
    letterSpacing:
      style.letterSpacing != null ? `${style.letterSpacing}pt` : undefined,
    textAlign: style.textAlign,
    textTransform: style.textTransform,
    textShadow: style.textShadow,
    fontStyle: style.fontStyle,
    padding: pad
      ? `${pad.top}mm ${pad.right}mm ${pad.bottom}mm ${pad.left}mm`
      : undefined,
    boxSizing: pad ? "border-box" : undefined,
    backgroundColor: style.backgroundColor,
    borderRadius: style.borderRadius != null ? `${style.borderRadius}mm` : undefined,
  };
}
