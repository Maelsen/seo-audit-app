import { PageLayout } from "../PageLayout";
import type { AuditData } from "@/lib/types";

const POPPINS = "'Poppins', Arial, sans-serif";

type Props = {
  audit: AuditData;
};

function NumberCircle({ value, color }: { value: number; color: string }) {
  return (
    <div
      style={{
        width: 70,
        height: 70,
        borderRadius: "50%",
        border: `5px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontFamily: POPPINS,
        fontSize: "14pt",
        fontWeight: 700,
      }}
    >
      {value}
    </div>
  );
}

function Tile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: string;
}) {
  return (
    <div
      style={{
        background: "#252525",
        borderRadius: 8,
        padding: 12,
        minWidth: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        fontFamily: POPPINS,
      }}
    >
      {icon && (
        <div
          style={{
            color: "#38E1E1",
            fontSize: "10pt",
            marginBottom: 4,
          }}
        >
          {icon}
        </div>
      )}
      <div
        style={{
          color: "#ffffff",
          fontSize: "14pt",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      <div style={{ color: "#c2c2c2", fontSize: "8pt", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

export function LinksPage1({ audit }: Props) {
  const s = audit.sections.links;
  return (
    <PageLayout url={audit.url}>
      <h2
        style={{
          fontFamily: POPPINS,
          fontSize: "10pt",
          color: "#ffffff",
          fontWeight: 700,
          marginTop: 4,
          marginBottom: 8,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        Links
      </h2>
      <div
        style={{
          fontFamily: POPPINS,
          fontSize: "10pt",
          color: "#ffffff",
          fontWeight: 700,
        }}
      >
        Backlink-Übersicht
      </div>
      <div
        style={{
          fontFamily: POPPINS,
          fontSize: "8pt",
          color: "#d4d4d4",
          lineHeight: 1.55,
          marginTop: 6,
          marginBottom: 18,
        }}
      >
        {s.text}
      </div>

      <div style={{ display: "flex", gap: 40, marginBottom: 22 }}>
        <div style={{ textAlign: "center" }}>
          <NumberCircle value={s.domainStrength} color="#f4a8a8" />
          <div
            style={{
              marginTop: 6,
              color: "#d4d4d4",
              fontFamily: POPPINS,
              fontSize: "8pt",
              fontWeight: 700,
            }}
          >
            Domainstärke
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <NumberCircle value={s.pageStrength} color="#38E1E1" />
          <div
            style={{
              marginTop: 6,
              color: "#d4d4d4",
              fontFamily: POPPINS,
              fontSize: "8pt",
              fontWeight: 700,
            }}
          >
            Seitenstärke
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Tile label="Gesamte Backlinks" value={s.totalBacklinks} icon="🔗" />
        <Tile
          label="Verweisende Domänen"
          value={s.referringDomains}
          icon="↗"
        />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Tile label="Nofollow-Backlinks" value={s.nofollow} />
        <Tile label="Dofollow-Backlinks" value={s.dofollow} />
        <Tile label="Subnets" value={s.subnets} />
        <Tile label="IPs" value={s.ips} />
        <Tile label="Gov-Backlinks" value={s.govBacklinks} />
      </div>
    </PageLayout>
  );
}

export function LinksPage2({ audit }: Props) {
  const s = audit.sections.links;
  return (
    <PageLayout url={audit.url}>
      <div style={{ marginTop: 10, fontFamily: POPPINS }}>
        <h3
          style={{
            fontFamily: POPPINS,
            fontSize: "10pt",
            color: "#ffffff",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Top Backlinks
        </h3>
        <div
          style={{
            fontFamily: POPPINS,
            fontSize: "8pt",
            color: "#d4d4d4",
            marginBottom: 8,
          }}
        >
          Dies sind die externen Seiten mit dem höchsten Wert.
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: POPPINS,
            fontSize: "8pt",
            color: "#ffffff",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #555" }}>
              <th style={{ textAlign: "left", padding: 5, fontSize: "8pt" }}>
                Domainstärke
              </th>
              <th style={{ textAlign: "left", padding: 5, fontSize: "8pt" }}>
                URL
              </th>
              <th style={{ textAlign: "left", padding: 5, fontSize: "8pt" }}>
                Titel
              </th>
              <th style={{ textAlign: "left", padding: 5, fontSize: "8pt" }}>
                Ankertext
              </th>
            </tr>
          </thead>
          <tbody>
            {s.topBacklinks.map((b, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #2a2a2a" }}>
                <td style={{ padding: 5 }}>{b.domainStrength}</td>
                <td
                  style={{
                    padding: 5,
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "#38E1E1",
                  }}
                >
                  {b.url}
                </td>
                <td style={{ padding: 5 }}>{b.title}</td>
                <td style={{ padding: 5 }}>{b.anchor}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3
          style={{
            fontFamily: POPPINS,
            fontSize: "10pt",
            color: "#ffffff",
            fontWeight: 700,
            marginTop: 16,
            marginBottom: 4,
          }}
        >
          Top-Pages nach Backlinks
        </h3>
        {s.topPages.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: POPPINS,
              fontSize: "8pt",
              padding: "3px 0",
              color: "#d4d4d4",
              borderBottom: "1px solid #2a2a2a",
            }}
          >
            <span>{p.url}</span>
            <span>{p.backlinks}</span>
          </div>
        ))}

        <h3
          style={{
            fontFamily: POPPINS,
            fontSize: "10pt",
            color: "#ffffff",
            fontWeight: 700,
            marginTop: 16,
            marginBottom: 4,
          }}
        >
          Top-Anker nach Backlinks
        </h3>
        {s.topAnchors.map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: POPPINS,
              fontSize: "8pt",
              padding: "3px 0",
              color: "#d4d4d4",
            }}
          >
            <span style={{ width: 140 }}>{a.anchor}</span>
            <span style={{ width: 30 }}>{a.backlinks}</span>
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
                  width: `${Math.min(100, a.backlinks * 50)}%`,
                  height: "100%",
                  background: "#38E1E1",
                }}
              />
            </div>
          </div>
        ))}

        <h3
          style={{
            fontFamily: POPPINS,
            fontSize: "10pt",
            color: "#ffffff",
            fontWeight: 700,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Top-Regionen von weiterleitenden Domains
        </h3>
        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          <PieChart
            label="Top-TLDs"
            value={s.topTlds[0]?.tld ?? "-"}
            count={s.topTlds[0]?.count ?? 0}
            color="#38E1E1"
          />
          <PieChart
            label="Top Länder"
            value={s.topCountries[0]?.country ?? "-"}
            count={s.topCountries[0]?.count ?? 0}
            color="#38E1E1"
          />
          <PieChart
            label="On-Page-Links"
            value="Internal"
            count={s.internalLinks}
            color="#22c55e"
          />
        </div>
      </div>
    </PageLayout>
  );
}

function PieChart({
  label,
  value,
  count,
  color,
}: {
  label: string;
  value: string;
  count: number;
  color: string;
}) {
  return (
    <div style={{ textAlign: "center", fontFamily: POPPINS }}>
      <div style={{ color: "#ffffff", fontSize: "10pt", fontWeight: 700, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: "8pt", color, marginBottom: 4 }}>{value}</div>
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: 8,
        }}
      >
        <span style={{ color: "#1a1a1a", fontSize: "8pt", fontWeight: 700 }}>
          {value} {count}
        </span>
      </div>
    </div>
  );
}
