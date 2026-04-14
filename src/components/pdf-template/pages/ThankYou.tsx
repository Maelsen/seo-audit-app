import { PageLayout } from "../PageLayout";
import { getBrandLogo } from "../brand-state";

const POPPINS = "'Poppins', Arial, sans-serif";
const OPEN_SANS = "'Open Sans', Arial, sans-serif";

export function ThankYouPage() {
  const logoDataUrl = getBrandLogo();
  return (
    <PageLayout isCover>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1a1a1a",
          color: "#ffffff",
          padding: "22mm 18mm 14mm 18mm",
          boxSizing: "border-box",
          position: "relative",
          fontFamily: POPPINS,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "12mm" }}>
          {logoDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoDataUrl}
              alt="Artistic Avenue"
              style={{ height: "22mm", width: "auto", objectFit: "contain" }}
            />
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 30, marginTop: "4mm" }}>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontFamily: POPPINS,
                fontSize: "20pt",
                color: "#ffffff",
                fontWeight: 700,
                marginTop: 0,
                marginBottom: "6mm",
                lineHeight: 1.2,
              }}
            >
              Vielen Dank für Ihre Zeit!
            </h2>
            <p
              style={{
                fontFamily: OPEN_SANS,
                fontSize: "14pt",
                color: "#d4d4d4",
                lineHeight: 1.55,
                marginBottom: "5mm",
              }}
            >
              Sie haben heute den ersten und wichtigsten Schritt gemacht,
              Erkenntnisse gewinnen. Aus unserer Erfahrung mit über 80 Kunden
              wissen wir,
            </p>
            <p
              style={{
                fontFamily: OPEN_SANS,
                fontSize: "14pt",
                color: "#d4d4d4",
                lineHeight: 1.55,
                marginBottom: "7mm",
              }}
            >
              Die besten Ergebnisse erzielen diejenigen, die jetzt direkt los
              legen, sei es nur die Bildkomprimierung in 30 Minuten. Jede noch
              so kleine Optimierung bringt Sie nach vorn.
            </p>
            <h3
              style={{
                fontFamily: POPPINS,
                fontSize: "20pt",
                color: "#ffffff",
                fontWeight: 700,
                marginTop: "8mm",
                marginBottom: 4,
                lineHeight: 1.2,
              }}
            >
              Jede Marke hat eine Geschichte.
            </h3>
            <h3
              style={{
                fontFamily: POPPINS,
                fontSize: "20pt",
                color: "#ffffff",
                fontWeight: 700,
                marginTop: 0,
                marginBottom: "6mm",
                lineHeight: 1.2,
              }}
            >
              Lassen Sie uns Ihre zum Erfolg machen.
            </h3>
            <p
              style={{
                fontFamily: OPEN_SANS,
                fontSize: "14pt",
                color: "#d4d4d4",
                fontStyle: "italic",
                lineHeight: 1.55,
              }}
            >
              PS 92% unserer Kunden sehen die ersten Verbesserungen innerhalb
              von 14 Tagen, Sie schaffen das auch!
            </p>
          </div>

          <div style={{ width: 220, textAlign: "center" }}>
            <div
              style={{
                width: 180,
                height: 220,
                borderRadius: 6,
                background: "#2a2a2a",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                fontFamily: OPEN_SANS,
                fontSize: "11pt",
              }}
            >
              Foto Vasilis
            </div>
            <div
              style={{
                fontFamily: POPPINS,
                color: "#ffffff",
                fontSize: "14pt",
                fontWeight: 700,
              }}
            >
              Vasilis Mavridis
            </div>
            <div
              style={{
                fontFamily: OPEN_SANS,
                color: "#d4d4d4",
                fontSize: "12pt",
                marginBottom: 14,
              }}
            >
              Inhaber von Artistic Avenue
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#38E1E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1a1a1a",
                  fontFamily: POPPINS,
                  fontWeight: 700,
                  fontSize: "11pt",
                }}
              >
                in
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#38E1E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1a1a1a",
                  fontFamily: POPPINS,
                  fontWeight: 700,
                  fontSize: "11pt",
                }}
              >
                IG
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#38E1E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1a1a1a",
                  fontFamily: POPPINS,
                  fontWeight: 700,
                  fontSize: "11pt",
                }}
              >
                W
              </div>
            </div>
            <div
              style={{
                textAlign: "left",
                fontFamily: POPPINS,
                fontSize: "12pt",
                color: "#ffffff",
                lineHeight: 1.8,
              }}
            >
              <div>+49 179 3213 445</div>
              <div>info@artisticavenue.de</div>
              <div>www.artisticavenue.de</div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
