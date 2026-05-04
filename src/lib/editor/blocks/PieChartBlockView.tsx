import type { CSSProperties, ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding } from "../resolve-binding";
import type { PieChartBlock, PieSlice } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: PieChartBlock; audit: AuditData };

type ResolvedSlice = PieSlice & { value: number; pct: number };

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function polarToCartesian(cx: number, cy: number, r: number, rad: number) {
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startRad: number,
  endRad: number,
): string {
  const largeArc = endRad - startRad > Math.PI ? 1 : 0;
  const o1 = polarToCartesian(cx, cy, outerR, startRad);
  const o2 = polarToCartesian(cx, cy, outerR, endRad);
  if (innerR > 0) {
    const i1 = polarToCartesian(cx, cy, innerR, endRad);
    const i2 = polarToCartesian(cx, cy, innerR, startRad);
    return [
      `M ${o1.x} ${o1.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
      `L ${i1.x} ${i1.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${i2.x} ${i2.y}`,
      "Z",
    ].join(" ");
  }
  return [
    `M ${cx} ${cy}`,
    `L ${o1.x} ${o1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
    "Z",
  ].join(" ");
}

export function PieChartBlockView({ block, audit }: Props): ReactElement {
  const raw =
    block.binding.kind === "audit"
      ? resolveBinding(audit, block.binding)
      : undefined;
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;

  const sliceValues: ResolvedSlice[] = block.slices.map((s) => ({
    ...s,
    value: asNumber(source[s.fieldPath]),
    pct: 0,
  }));
  const total = sliceValues.reduce((acc, s) => acc + (s.value > 0 ? s.value : 0), 0);
  if (total > 0) {
    for (const s of sliceValues) s.pct = (s.value / total) * 100;
  }

  const containerStyle: CSSProperties = {
    ...frameStyle(block.frame),
    display: "flex",
    flexDirection: block.legendPosition === "right" ? "row" : "column",
    alignItems: block.legendPosition === "right" ? "center" : "flex-start",
    gap: `${block.legendGap}mm`,
    overflow: "hidden",
  };

  const pie = renderPie(block, sliceValues, total);
  const legend = block.showLegend ? renderLegend(block, sliceValues) : null;

  return (
    <div
      data-block-id={block.id}
      data-block-type="pieChart"
      style={containerStyle}
    >
      {pie}
      {legend}
    </div>
  );
}

function renderPie(
  block: PieChartBlock,
  slices: ResolvedSlice[],
  total: number,
): ReactElement {
  const diameter = block.pieDiameter;
  const labelOffset = block.showSliceLabels ? block.sliceLabelOffset : 0;
  // Reserve enough margin around the pie so percentage labels never get clipped.
  // Text up to ~8mm wide (e.g. "100%") needs ~5mm half-width plus the offset.
  const labelMargin = block.showSliceLabels ? labelOffset + 8 : 0;
  const svgSizeMm = diameter + labelMargin * 2;
  const cx = svgSizeMm / 2;
  const cy = svgSizeMm / 2;
  const outerR = diameter / 2;
  const innerR = block.innerRadius ?? 0;

  if (total <= 0) {
    return (
      <svg
        width={`${svgSizeMm}mm`}
        height={`${svgSizeMm}mm`}
        viewBox={`0 0 ${svgSizeMm} ${svgSizeMm}`}
        style={{ flexShrink: 0 }}
      >
        <circle cx={cx} cy={cy} r={outerR} fill="#2a2a2a" />
      </svg>
    );
  }

  // If exactly one slice carries the full total, an arc with start==end has zero
  // area and renders nothing — fall back to a full circle (or annulus) for it.
  const nonZero = slices.filter((s) => s.value > 0);
  const fullCircleSlice = nonZero.length === 1 ? nonZero[0] : null;

  let cumulative = 0;
  const labelStyle = textStyleToCss(block.sliceLabelStyle);
  return (
    <svg
      width={`${svgSizeMm}mm`}
      height={`${svgSizeMm}mm`}
      viewBox={`0 0 ${svgSizeMm} ${svgSizeMm}`}
      style={{ flexShrink: 0 }}
    >
      {fullCircleSlice ? (
        innerR > 0 ? (
          <path
            d={buildAnnulusPath(cx, cy, outerR, innerR)}
            fill={fullCircleSlice.color}
            fillRule="evenodd"
          />
        ) : (
          <circle cx={cx} cy={cy} r={outerR} fill={fullCircleSlice.color} />
        )
      ) : (
        slices.map((slice, idx) => {
          if (slice.value <= 0) return null;
          const startRad = -Math.PI / 2 + (cumulative / total) * Math.PI * 2;
          cumulative += slice.value;
          const endRad = -Math.PI / 2 + (cumulative / total) * Math.PI * 2;
          const path = buildArcPath(cx, cy, outerR, innerR, startRad, endRad);
          return <path key={idx} d={path} fill={slice.color} />;
        })
      )}
      {block.showSliceLabels &&
        renderSliceLabels(slices, total, cx, cy, outerR, innerR, labelOffset, labelStyle)}
    </svg>
  );
}

function buildAnnulusPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
): string {
  // Outer ring + inner ring with even-odd fill creates a donut.
  return [
    `M ${cx - outerR} ${cy}`,
    `A ${outerR} ${outerR} 0 1 0 ${cx + outerR} ${cy}`,
    `A ${outerR} ${outerR} 0 1 0 ${cx - outerR} ${cy}`,
    `Z`,
    `M ${cx - innerR} ${cy}`,
    `A ${innerR} ${innerR} 0 1 0 ${cx + innerR} ${cy}`,
    `A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy}`,
    `Z`,
  ].join(" ");
}

// Slices smaller than this percentage skip inline labels — their value still
// appears in the legend, so we avoid the typical small-slice label-collision.
const MIN_INLINE_LABEL_PCT = 5;

function renderSliceLabels(
  slices: ResolvedSlice[],
  total: number,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  offset: number,
  style: CSSProperties,
): ReactElement[] {
  const out: ReactElement[] = [];
  // SVG <text> ignores CSS `color` — must use `fill` (color string).
  const fillColor =
    typeof style.color === "string" ? style.color : "#ffffff";
  let cumulative = 0;
  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    if (slice.value <= 0) {
      continue;
    }
    const startRad = -Math.PI / 2 + (cumulative / total) * Math.PI * 2;
    cumulative += slice.value;
    const endRad = -Math.PI / 2 + (cumulative / total) * Math.PI * 2;
    if (slice.pct < MIN_INLINE_LABEL_PCT) continue;
    const midRad = (startRad + endRad) / 2;
    // Labels INNERHALB der Slice rendern (Vasileios-Style) statt aussen.
    // Bei Donut (innerR > 0): Mitte zwischen innerR + outerR.
    // Bei Voll-Pie (innerR = 0): 65% von outerR (Richtung Slice-Mitte).
    // offset wird ignoriert wenn nicht explizit > 0 gesetzt — das ist der
    // Fix fuer Bug 6 aus full-fidelity-test.
    const r = offset > 0
      ? outerR + offset // Legacy: Aussen-Modus wenn offset gesetzt
      : (innerR > 0 ? (innerR + outerR) / 2 : outerR * 0.65);
    const p = polarToCartesian(cx, cy, r, midRad);
    const pct = Math.round(slice.pct);
    out.push(
      <text
        key={`label-${i}`}
        x={p.x}
        y={p.y}
        style={style}
        fill={fillColor}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {`${pct}%`}
      </text>,
    );
  }
  return out;
}

function renderLegend(
  block: PieChartBlock,
  slices: ResolvedSlice[],
): ReactElement {
  const style = textStyleToCss(block.legendStyle);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: `${block.legendItemGap}mm`,
      }}
    >
      {slices.map((slice, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: `${Math.max(block.legendSwatchSize * 0.5, 1.5)}mm`,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: `${block.legendSwatchSize}mm`,
              height: `${block.legendSwatchSize}mm`,
              background: slice.color,
              borderRadius: "0.5mm",
              flexShrink: 0,
            }}
          />
          <span style={style}>
            {slice.label}
            {slice.value > 0 ? ` (${Math.round(slice.pct)}%)` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
