import type { ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding } from "../resolve-binding";
import type { GaugeBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: GaugeBlock; audit: AuditData };

function resolveColor(
  value: number,
  thresholds: GaugeBlock["thresholds"],
  fallback: string,
): string {
  const sorted = [...thresholds].sort((a, b) => a.value - b.value);
  let color = fallback;
  for (const t of sorted) {
    if (value >= t.value) color = t.color;
  }
  return color;
}

export function GaugeBlockView({ block, audit }: Props): ReactElement {
  const raw =
    block.binding.kind === "audit" ? resolveBinding(audit, block.binding) : 0;
  const value = Number(raw ?? 0);
  const range = block.maxValue - block.minValue;
  const clamped = Math.max(block.minValue, Math.min(block.maxValue, value));
  const pct = range > 0 ? (clamped - block.minValue) / range : 0;
  const color = resolveColor(value, block.thresholds, "#38E1E1");

  const stroke = block.strokeWidth;

  if (block.variant === "semi") {
    const viewW = 100;
    const viewH = 60;
    const radius = 40;
    const cx = viewW / 2;
    const cy = viewH - 5;
    const circumference = Math.PI * radius;
    const dashOffset = circumference * (1 - pct);
    return (
      <div
        data-block-id={block.id}
        data-block-type="gauge-semi"
        style={{
          ...frameStyle(block.frame),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {block.labelText && (
          <div
            style={{
              ...textStyleToCss(block.labelStyle),
              marginBottom: "1mm",
            }}
          >
            {block.labelText}
          </div>
        )}
        <svg
          viewBox={`0 0 ${viewW} ${viewH}`}
          style={{ width: "100%", height: "auto", flex: 1 }}
        >
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            stroke={block.trackColor}
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            stroke={color}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            style={textStyleToCss(block.valueStyle)}
            fill={block.valueStyle.color}
          >
            {value}
            {block.suffix ?? ""}
          </text>
        </svg>
      </div>
    );
  }

  const size = 100;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);
  return (
    <div
      data-block-id={block.id}
      data-block-type="gauge-full"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: "100%", height: "auto", flex: 1 }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={block.trackColor}
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          style={textStyleToCss(block.valueStyle)}
          fill={block.valueStyle.color}
        >
          {value}
          {block.suffix ?? ""}
        </text>
      </svg>
      {block.labelText && (
        <div
          style={{
            ...textStyleToCss(block.labelStyle),
            marginTop: "1mm",
          }}
        >
          {block.labelText}
        </div>
      )}
    </div>
  );
}
