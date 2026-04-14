import type { ReactNode } from "react";
import { getBrandSignet } from "./brand-state";

type Props = {
  url?: string;
  children: ReactNode;
  isCover?: boolean;
};

export function PageLayout({ url, children, isCover = false }: Props) {
  const signetDataUrl = getBrandSignet();
  return (
    <section
      className="audit-page"
      style={{
        width: "210mm",
        height: "296mm",
        background: "#1a1a1a",
        color: "#ffffff",
        position: "relative",
        padding: isCover ? "0" : "34mm 18mm 14mm 18mm",
        boxSizing: "border-box",
        fontFamily: "'Poppins', 'Open Sans', Arial, sans-serif",
        pageBreakAfter: "always",
        breakAfter: "page",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(56,225,225,0.04), transparent 40%), radial-gradient(circle at 80% 90%, rgba(56,225,225,0.04), transparent 40%)",
          pointerEvents: "none",
        }}
      />

      {!isCover && (
        <>
          <div
            style={{
              position: "absolute",
              top: "10mm",
              left: "18mm",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {signetDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={signetDataUrl}
                alt="Artistic Avenue"
                style={{ height: "15mm", width: "auto", objectFit: "contain" }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #ffffff 40%, #38E1E1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  fontSize: "14pt",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                A
              </div>
            )}
          </div>

          {url && (
            <div
              style={{
                position: "absolute",
                top: "10mm",
                right: "18mm",
                textAlign: "right",
                fontFamily: "'Poppins', Arial, sans-serif",
              }}
            >
              <div
                style={{
                  color: "#38E1E1",
                  fontSize: "10pt",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                SEO-Audit
              </div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "8pt",
                  marginTop: 2,
                }}
              >
                für {url}
              </div>
            </div>
          )}
        </>
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "6mm",
          background:
            "linear-gradient(90deg, transparent, #38E1E1 20%, #38E1E1 80%, transparent)",
        }}
      />
    </section>
  );
}
