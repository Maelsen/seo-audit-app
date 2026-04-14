import { ScoreCircle } from "./ScoreCircle";
import type { Grade } from "@/lib/types";

const POPPINS = "'Poppins', Arial, sans-serif";

type Props = {
  title: string;
  score: Grade;
  heading: string;
  text: string;
};

export function SectionHeader({ title, score, heading, text }: Props) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2
        style={{
          fontFamily: POPPINS,
          fontSize: "10pt",
          color: "#ffffff",
          margin: 0,
          marginBottom: 8,
          fontWeight: 700,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <ScoreCircle grade={score} size={74} strokeWidth={8} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: POPPINS,
              color: "#38E1E1",
              fontSize: "10pt",
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {heading}
          </div>
          <div
            style={{
              fontFamily: POPPINS,
              color: "#d4d4d4",
              fontSize: "8pt",
              lineHeight: 1.55,
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}
