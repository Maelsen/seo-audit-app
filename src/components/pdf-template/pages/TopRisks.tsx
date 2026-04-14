import { PageLayout } from "../PageLayout";
import type { AuditData } from "@/lib/types";

const POPPINS = "'Poppins', Arial, sans-serif";
const OPEN_SANS = "'Open Sans', Arial, sans-serif";

type Props = {
  audit: AuditData;
};

export function TopRisksPage({ audit }: Props) {
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
        Top 3 Risiken
      </h2>
      {audit.topRisks.map((risk, idx) => (
        <div key={idx} style={{ marginBottom: "8mm" }}>
          <div
            style={{
              fontFamily: POPPINS,
              fontSize: "14pt",
              color: "#ffffff",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {idx + 1}. {risk.title}
          </div>
          <div
            style={{
              fontFamily: OPEN_SANS,
              fontSize: "14pt",
              color: "#d4d4d4",
              lineHeight: 1.55,
              whiteSpace: "pre-line",
            }}
          >
            {risk.description}
          </div>
        </div>
      ))}
    </PageLayout>
  );
}
