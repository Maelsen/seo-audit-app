import { PageLayout } from "../PageLayout";
import { ScoreCircle } from "../ScoreCircle";
import type { AuditData } from "@/lib/types";

const POPPINS = "'Poppins', Arial, sans-serif";
const OPEN_SANS = "'Open Sans', Arial, sans-serif";

type Props = {
  audit: AuditData;
};

export function OverviewPage({ audit }: Props) {
  const categories: {
    key: string;
    label: string;
    grade: (typeof audit.sections.onpageSeo)["score"];
  }[] = [
    { key: "onpage", label: "On-Page SEO", grade: audit.sections.onpageSeo.score },
    { key: "ux", label: "UX & Conversion", grade: audit.sections.uxConversion.score },
    { key: "usability", label: "Usability", grade: audit.sections.usability.score },
    { key: "leistung", label: "Leistung", grade: audit.sections.leistung.score },
    { key: "social", label: "Social", grade: audit.sections.social.score },
    { key: "lokales", label: "Lokales SEO", grade: audit.sections.lokalesSeo.score },
    { key: "links", label: "Links", grade: audit.sections.links.score },
  ];

  return (
    <PageLayout url={audit.url}>
      <h2
        style={{
          fontFamily: POPPINS,
          fontSize: "20pt",
          color: "#ffffff",
          fontWeight: 700,
          marginTop: 0,
          marginBottom: "4mm",
          lineHeight: 1.15,
        }}
      >
        Website-Bericht für
        <br />
        {audit.url}
      </h2>
      <p
        style={{
          fontFamily: OPEN_SANS,
          fontSize: "14pt",
          lineHeight: 1.55,
          color: "#d4d4d4",
          marginBottom: "7mm",
        }}
      >
        {audit.introText}
      </p>

      <h3
        style={{
          fontFamily: POPPINS,
          fontSize: "20pt",
          color: "#ffffff",
          fontWeight: 700,
          marginTop: "4mm",
          marginBottom: "5mm",
          lineHeight: 1.15,
        }}
      >
        Audit-Ergebnisse für
        <br />
        {audit.url}
      </h3>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <ScoreCircle grade={audit.overallScore} size={140} strokeWidth={14} />
        <div>
          <div
            style={{
              fontFamily: POPPINS,
              fontSize: "14pt",
              color: "#ffffff",
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            {audit.overallHeading}
          </div>
          <div
            style={{
              display: "inline-block",
              background: "#ef4444",
              color: "#ffffff",
              padding: "6px 16px",
              borderRadius: 6,
              fontFamily: POPPINS,
              fontWeight: 700,
              fontSize: "14pt",
            }}
          >
            Empfehlungen: {audit.recommendations.length}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 22,
          marginTop: "8mm",
          justifyContent: "flex-start",
        }}
      >
        {categories.map((cat) => (
          <div key={cat.key} style={{ textAlign: "center", width: 100 }}>
            <ScoreCircle grade={cat.grade} size={66} strokeWidth={6} />
            <div
              style={{
                marginTop: 8,
                fontFamily: OPEN_SANS,
                fontSize: "14pt",
                color: "#ffffff",
                fontWeight: 600,
              }}
            >
              {cat.label}
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
