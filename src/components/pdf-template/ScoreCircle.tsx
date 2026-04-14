import { gradeColor, gradeToPercent } from "@/lib/grade";
import type { Grade } from "@/lib/types";

type Props = {
  grade: Grade;
  size?: number;
  strokeWidth?: number;
  textSize?: number;
  showDot?: boolean;
};

export function ScoreCircle({
  grade,
  size = 64,
  strokeWidth = 7,
  textSize,
  showDot = false,
}: Props) {
  const color = gradeColor(grade);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = gradeToPercent(grade);
  const dashOffset = circumference * (1 - percent / 100);
  const fontSize = textSize ?? Math.round(size * 0.35);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-block",
      }}
    >
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4a4a4a"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
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
          fill="#ffffff"
          fontSize={fontSize}
          fontWeight="bold"
          fontFamily="'Poppins', Arial, sans-serif"
        >
          {grade}
        </text>
      </svg>
      {showDot && (
        <div
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
          }}
        />
      )}
    </div>
  );
}
