import type { ReactElement } from "react";
import type { AuditData, Grade } from "../../types";
import { gradeToPercent, ALL_GRADES } from "../../grade";
import { resolveBinding } from "../resolve-binding";
import type { ScoreCircleBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";
import { useTemplateAssets } from "../asset-context";

type Props = { block: ScoreCircleBlock; audit: AuditData };

const PT_TO_MM = 0.3527;

function toGrade(value: unknown): Grade {
  if (
    typeof value === "string" &&
    (ALL_GRADES as string[]).includes(value)
  ) {
    return value as Grade;
  }
  return "F";
}

export function ScoreCircleBlockView({ block, audit }: Props): ReactElement {
  const assets = useTemplateAssets();
  const value =
    block.binding.kind === "audit"
      ? resolveBinding(audit, block.binding)
      : undefined;
  const grade = toGrade(value);
  const slot = assets.grades[grade];
  const color = slot.color;
  const imageSrc = slot.imageSrc;
  const percent = gradeToPercent(grade);

  const size = block.size;
  const stroke = block.strokeWidth;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);
  const labelFontMm = block.labelStyle.fontSize * PT_TO_MM;

  if (imageSrc) {
    return (
      <div
        data-block-id={block.id}
        data-block-type="scoreCircle"
        style={{
          ...frameStyle(block.frame),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={grade}
          style={{
            width: `${size}mm`,
            height: `${size}mm`,
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  return (
    <div
      data-block-id={block.id}
      data-block-type="scoreCircle"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={`${size}mm`}
        height={`${size}mm`}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4a4a4a"
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
          style={{
            ...textStyleToCss(block.labelStyle),
            fontSize: `${labelFontMm}mm`,
          }}
          fill={block.labelStyle.color}
        >
          {grade}
        </text>
      </svg>
    </div>
  );
}
