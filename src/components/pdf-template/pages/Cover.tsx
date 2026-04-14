import { PageLayout } from "../PageLayout";
import { getBrandLogo } from "../brand-state";

type Props = {
  url: string;
  screenshotDataUrl?: string;
};

const POPPINS = "'Poppins', Arial, sans-serif";
const OPEN_SANS = "'Open Sans', Arial, sans-serif";

export function CoverPage({ url, screenshotDataUrl }: Props) {
  const logoDataUrl = getBrandLogo();
  return (
    <PageLayout isCover>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1a1a1a",
          color: "#ffffff",
          padding: "18mm 18mm 10mm 18mm",
          boxSizing: "border-box",
          position: "relative",
          fontFamily: POPPINS,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "8mm" }}>
          {logoDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoDataUrl}
              alt="Artistic Avenue"
              style={{ height: "24mm", width: "auto", objectFit: "contain" }}
            />
          ) : null}
        </div>

        <h1
          style={{
            fontFamily: POPPINS,
            fontSize: "61.5pt",
            fontWeight: 700,
            textAlign: "center",
            margin: 0,
            color: "#ffffff",
            textShadow: "3px 3px 6px rgba(0, 0, 0, 0.55)",
            letterSpacing: 1.5,
            lineHeight: 1,
          }}
        >
          WEBSITE-AUDIT
        </h1>

        <div
          style={{
            fontFamily: POPPINS,
            fontSize: "20pt",
            fontWeight: 700,
            textAlign: "center",
            color: "#ffffff",
            marginTop: "14mm",
          }}
        >
          für Ihre Website
        </div>
        <div
          style={{
            fontFamily: POPPINS,
            fontSize: "20pt",
            fontWeight: 700,
            textAlign: "center",
            color: "#38E1E1",
            marginTop: "2mm",
            marginBottom: "10mm",
          }}
        >
          {url}
        </div>

        <div
          style={{
            width: "78%",
            margin: "0 auto",
            position: "relative",
            aspectRatio: "16 / 10",
          }}
        >
          <div
            style={{
              background: "#3a3a3a",
              borderRadius: 12,
              padding: 12,
              border: "2px solid #2a2a2a",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: 6,
                background: "#2a2a2a",
                borderRadius: 3,
                width: 40,
                margin: "0 auto 8px",
              }}
            />
            <div
              style={{
                flex: 1,
                background: "#ffffff",
                borderRadius: 4,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {screenshotDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={screenshotDataUrl}
                  alt="Website"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "top",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontSize: "10pt",
                    fontFamily: OPEN_SANS,
                  }}
                >
                  Screenshot
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "10mm",
            textAlign: "center",
            fontFamily: OPEN_SANS,
            fontSize: "12pt",
            color: "#d4d4d4",
            lineHeight: 1.55,
            padding: "0 12mm",
          }}
        >
          Dieses Audit wurde exklusiv für {getDomain(url)} erstellt, um
          konkrete Hebel aufzuzeigen, mit denen Ihre Website mehr Sichtbarkeit
          und Anfragen erzielt.
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: POPPINS,
            fontSize: "12pt",
            fontWeight: 500,
            color: "#ffffff",
            width: "100%",
          }}
        >
          <span>info@artisticavenue.de</span>
          <span>www.artisticavenue.de</span>
          <span>+49 (0) 179 3213 445</span>
        </div>
      </div>
    </PageLayout>
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}
