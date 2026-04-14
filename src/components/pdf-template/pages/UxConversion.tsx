import { PageLayout } from "../PageLayout";
import { SectionHeader } from "../SectionHeader";
import { CheckItem } from "../CheckItem";
import type { AuditData } from "@/lib/types";

type Props = {
  audit: AuditData;
};

export function UxConversionPage({ audit }: Props) {
  const s = audit.sections.uxConversion;
  return (
    <PageLayout url={audit.url}>
      <SectionHeader
        title="UX & Conversion"
        score={s.score}
        heading={s.heading}
        text={s.text}
      />

      <div style={{ marginTop: 16, fontFamily: "'Poppins', Arial, sans-serif" }}>
        {s.findings.map((f, idx) => (
          <CheckItem
            key={idx}
            label={f.label}
            status={f.status}
            detail={f.detail}
          />
        ))}

        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontFamily: "'Poppins', Arial, sans-serif",
              fontSize: "10pt",
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: 4,
            }}
          >
            Gesamteinschätzung
          </div>
          <div
            style={{
              fontFamily: "'Poppins', Arial, sans-serif",
              fontSize: "8pt",
              color: "#d4d4d4",
              lineHeight: 1.55,
            }}
          >
            {s.summary}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
