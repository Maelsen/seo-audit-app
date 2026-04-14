import { PageLayout } from "../PageLayout";
import { SectionHeader } from "../SectionHeader";
import { CheckItem } from "../CheckItem";
import type { AuditData } from "@/lib/types";

type Props = {
  audit: AuditData;
};

export function LokalesSeoPage({ audit }: Props) {
  const s = audit.sections.lokalesSeo;
  return (
    <PageLayout url={audit.url}>
      <SectionHeader
        title="Lokales SEO"
        score={s.score}
        heading={s.heading}
        text={s.text}
      />

      <div style={{ marginTop: 20 }}>
        <CheckItem
          label="Lokales Geschäftsschema"
          status={s.businessSchema}
          detail="Kein lokales Geschäftsschema auf der Seite identifiziert."
        />
        <CheckItem
          label="Google Business-Profil identifiziert"
          status={s.gbpIdentified}
          detail="Es wurde ein Google Business-Profil identifiziert, das auf diese Website verweist."
        />
        <CheckItem
          label="Vollständigkeit des Google Business-Profils"
          status={s.gbpCompleteness}
          detail="Die wichtigen Geschäftsdaten sind im Google Business-Profil vorhanden."
        >
          <div style={{ marginTop: 6, fontFamily: "monospace" }}>
            {s.address && <div>Adresse {s.address}</div>}
            {s.phone && <div>Telefonnummer {s.phone}</div>}
            {s.website && <div>Website {s.website}</div>}
          </div>
        </CheckItem>
        <CheckItem
          label="Google Bewertungen"
          status={s.reviewsStatus}
          detail={
            s.googleReviews
              ? `Rating: ${s.googleReviews.rating} Sterne bei ${s.googleReviews.count} Bewertungen`
              : "Ihr Google Business-Profil hat eine geringe Anzahl von Bewertungen."
          }
        >
          {s.googleReviews && (
            <>
              <div style={{ marginTop: 8, color: "#f5a623" }}>
                {"★".repeat(Math.round(s.googleReviews.rating))}
                {"☆".repeat(5 - Math.round(s.googleReviews.rating))}{" "}
                <span style={{ color: "#d4d4d4" }}>
                  {s.googleReviews.rating} ({s.googleReviews.count} reviews)
                </span>
              </div>
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    fontFamily: "'Poppins', Arial, sans-serif",
                    fontSize: "10pt",
                    color: "#ffffff",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Bewertung
                </div>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const entry = s.googleReviews!.distribution.find(
                    (d) => d.stars === stars,
                  );
                  const count = entry?.count ?? 0;
                  const max = s.googleReviews!.count || 1;
                  return (
                    <div
                      key={stars}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 3,
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          color: "#d4d4d4",
                          fontFamily: "'Poppins', Arial, sans-serif",
                          fontSize: "8pt",
                        }}
                      >
                        {stars}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: "#2a2a2a",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${(count / max) * 100}%`,
                            height: "100%",
                            background: "#38E1E1",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CheckItem>
      </div>
    </PageLayout>
  );
}
