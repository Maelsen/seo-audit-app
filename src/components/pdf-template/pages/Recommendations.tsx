import { PageLayout } from "../PageLayout";
import type { AuditData, Priority } from "@/lib/types";

const POPPINS = "'Poppins', Arial, sans-serif";
const OPEN_SANS = "'Open Sans', Arial, sans-serif";

type Props = {
  audit: AuditData;
};

export function RecommendationsPage({ audit }: Props) {
  return (
    <PageLayout url={audit.url}>
      <h2
        style={{
          fontFamily: POPPINS,
          fontSize: "20pt",
          color: "#ffffff",
          fontWeight: 700,
          marginTop: "4mm",
          marginBottom: "8mm",
        }}
      >
        Empfehlungen
      </h2>
      <div>
        {audit.recommendations.map((rec) => (
          <div
            key={rec.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid #2a2a2a",
            }}
          >
            <div
              style={{
                fontFamily: OPEN_SANS,
                color: "#ffffff",
                fontSize: "14pt",
                maxWidth: "72%",
              }}
            >
              {rec.title}
            </div>
            <div
              style={{
                background: priorityColor(rec.priority),
                color: "#ffffff",
                padding: "4px 12px",
                borderRadius: 4,
                fontFamily: POPPINS,
                fontSize: "12pt",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {priorityLabel(rec.priority)}
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}

function priorityColor(p: Priority): string {
  switch (p) {
    case "hoch":
      return "#ef4444";
    case "mittel":
      return "#f97316";
    case "niedrig":
    default:
      return "#22c55e";
  }
}

function priorityLabel(p: Priority): string {
  switch (p) {
    case "hoch":
      return "Hohe Priorität";
    case "mittel":
      return "Mittlere Priorität";
    case "niedrig":
    default:
      return "Niedrige Priorität";
  }
}
