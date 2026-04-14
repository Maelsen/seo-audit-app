import { PageLayout } from "../PageLayout";
import { SectionHeader } from "../SectionHeader";
import { CheckItem } from "../CheckItem";
import type { AuditData } from "@/lib/types";

const POPPINS = "'Poppins', Arial, sans-serif";

type Props = {
  audit: AuditData;
};

export function OnPageSeoPage1({ audit }: Props) {
  const s = audit.sections.onpageSeo;
  return (
    <PageLayout url={audit.url}>
      <SectionHeader
        title="On-Page SEO Ergebnisse"
        score={s.score}
        heading={s.heading}
        text={s.text}
      />

      <div style={{ marginTop: 14, fontFamily: POPPINS }}>
        <CheckItem
          label="Title-Tag"
          status={s.titleTag.status}
          detail="Title-Tags sind sehr wichtig, damit Suchmaschinen Ihren Inhalt korrekt verstehen und kategorisieren können."
        >
          <div style={{ fontStyle: "italic", marginTop: 3, fontSize: "8pt" }}>
            {s.titleTag.value}
            <span style={{ marginLeft: 12, color: "#888" }}>
              Länge: {s.titleTag.length}
            </span>
          </div>
        </CheckItem>

        <CheckItem
          label="Metabeschreibungs-Tag"
          status={s.metaDescription.status}
          detail="Eine Meta-Beschreibung ist wichtig, damit Suchmaschinen den Inhalt Ihrer Seite verstehen können und wird oft als Beschreibungstext in den Suchergebnissen angezeigt."
        >
          <div style={{ marginTop: 3, fontSize: "8pt" }}>
            {s.metaDescription.value}
          </div>
        </CheckItem>

        <CheckItem
          label="SERP Snippet Vorschau"
          status="info"
          detail="Dies veranschaulicht, wie Ihre Seite in den Suchergebnissen erscheinen kann."
        >
          <div
            style={{
              marginTop: 6,
              background: "#ffffff",
              padding: 10,
              borderRadius: 6,
              color: "#1a1a1a",
            }}
          >
            <div style={{ fontSize: "8pt", color: "#555" }}>
              {s.serpPreview.url}
            </div>
            <div
              style={{
                color: "#1a0dab",
                fontSize: "10pt",
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {s.serpPreview.title}
            </div>
            <div style={{ fontSize: "8pt", color: "#333", marginTop: 3 }}>
              {s.serpPreview.description}
            </div>
          </div>
        </CheckItem>

        <CheckItem
          label="Sprache"
          status={s.language.status}
          detail={`Ihre Seite verwendet das Lang-Attribut. Deklariert: ${s.language.value}`}
        />

        <CheckItem
          label="H1-Header-Tag-Verwendung"
          status={s.h1.status}
          detail={`Ihre Seite hat einen H1-Tag. > ${s.h1.value}`}
        />

        <div style={{ marginTop: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#ffffff",
              fontFamily: POPPINS,
              fontWeight: 700,
              fontSize: "10pt",
              marginBottom: 5,
            }}
          >
            <span>H2-H6-Header-Tag-Verwendung</span>
            <span>Frequenz</span>
          </div>
          {(
            [
              ["H2", s.h2h6Frequency.h2],
              ["H3", s.h2h6Frequency.h3],
              ["H4", s.h2h6Frequency.h4],
              ["H5", s.h2h6Frequency.h5],
              ["H6", s.h2h6Frequency.h6],
            ] as [string, number][]
          ).map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 20,
                  color: "#d4d4d4",
                  fontFamily: POPPINS,
                  fontSize: "8pt",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  width: 30,
                  color: "#d4d4d4",
                  fontFamily: POPPINS,
                  fontSize: "8pt",
                }}
              >
                {value}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 7,
                  background: "#2a2a2a",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, value * 10)}%`,
                    height: "100%",
                    background: "#38E1E1",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

export function OnPageSeoPage2({ audit }: Props) {
  const s = audit.sections.onpageSeo;
  return (
    <PageLayout url={audit.url}>
      <div style={{ marginTop: 16, fontFamily: POPPINS }}>
        <CheckItem
          label="Menge des Inhalts"
          status={s.wordCount.status}
          detail="Es ist gut erforscht, dass ein höheres Textinhalt-Volumen im Allgemeinen mit einer besseren Rankingfähigkeit zusammenhängt."
        >
          <div style={{ marginTop: 3, fontSize: "8pt" }}>
            Wortanzahl {s.wordCount.value}
          </div>
        </CheckItem>

        {s.technicalChecks.map((check, idx) => (
          <CheckItem
            key={idx}
            label={check.label}
            status={check.status}
            detail={check.detail}
          />
        ))}
      </div>
    </PageLayout>
  );
}
