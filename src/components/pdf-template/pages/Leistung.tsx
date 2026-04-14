import { PageLayout } from "../PageLayout";
import { SectionHeader } from "../SectionHeader";
import { CheckItem } from "../CheckItem";
import type { AuditData } from "@/lib/types";

const POPPINS = "'Poppins', Arial, sans-serif";

type Props = {
  audit: AuditData;
};

function SpeedGauge({
  label,
  seconds,
  maxSeconds = 15,
}: {
  label: string;
  seconds: number;
  maxSeconds?: number;
}) {
  const percent = Math.min(100, (seconds / maxSeconds) * 100);
  const radius = 50;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);
  const color =
    seconds < maxSeconds * 0.33
      ? "#22c55e"
      : seconds < maxSeconds * 0.66
        ? "#f97316"
        : "#ef4444";
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          color: "#ffffff",
          fontFamily: POPPINS,
          fontSize: "8pt",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <svg width={140} height={80}>
        <path
          d={`M 20 70 A ${radius} ${radius} 0 0 1 120 70`}
          stroke="#4a4a4a"
          strokeWidth={10}
          fill="transparent"
          strokeLinecap="round"
        />
        <path
          d={`M 20 70 A ${radius} ${radius} 0 0 1 120 70`}
          stroke={color}
          strokeWidth={10}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
        <text
          x={70}
          y={65}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={16}
          fontWeight="bold"
          fontFamily="'Poppins', Arial, sans-serif"
        >
          {seconds.toFixed(1)}s
        </text>
      </svg>
    </div>
  );
}

function ResourceTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div style={{ textAlign: "center", fontFamily: POPPINS }}>
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 6,
          background: "#2a2a2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#38E1E1",
          fontFamily: POPPINS,
          fontSize: "10pt",
          fontWeight: 700,
          marginBottom: 6,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          color: "#ffffff",
          fontFamily: POPPINS,
          fontSize: "10pt",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: "#c2c2c2",
          fontFamily: POPPINS,
          fontSize: "8pt",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function LeistungPage({ audit }: Props) {
  const s = audit.sections.leistung;
  return (
    <PageLayout url={audit.url}>
      <SectionHeader
        title="Leistung"
        score={s.score}
        heading={s.heading}
        text={s.text}
      />

      <div style={{ marginTop: 10, fontFamily: POPPINS }}>
        <div
          style={{
            fontFamily: POPPINS,
            fontSize: "10pt",
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 4,
          }}
        >
          Website-Ladegeschwindigkeit
        </div>
        <div
          style={{
            fontFamily: POPPINS,
            fontSize: "8pt",
            color: "#d4d4d4",
            marginBottom: 10,
          }}
        >
          Ihre Seite wird in einer angemessenen Zeit geladen.
        </div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <SpeedGauge label="Serverantwort" seconds={s.serverResponseTime} />
          <SpeedGauge label="Alle Seiteninhalte geladen" seconds={s.contentLoadTime} />
          <SpeedGauge label="Alle Seitenskripte vollständig" seconds={s.scriptLoadTime} />
        </div>

        <div
          style={{
            fontFamily: POPPINS,
            fontSize: "10pt",
            fontWeight: 700,
            color: "#ffffff",
            marginTop: 18,
            marginBottom: 8,
          }}
        >
          Ressourcenaufteilung
        </div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <ResourceTile label="Anzahl der HTML-Seiten" value={s.resources.html} icon="HTML" />
          <ResourceTile label="Anzahl der JS-Ressourcen" value={s.resources.js} icon="JS" />
          <ResourceTile label="Anzahl der CSS-Ressourcen" value={s.resources.css} icon="CSS" />
          <ResourceTile label="Anzahl der Bilder" value={s.resources.img} icon="IMG" />
          <ResourceTile label="Andere Ressourcen" value={s.resources.other} icon="+" />
          <ResourceTile label="Gesamtzahl Objekte" value={s.resources.total} icon="#" />
        </div>

        <div style={{ marginTop: 20 }}>
          <CheckItem
            label="JavaScript Fehler"
            status={s.jsErrors}
            detail="Ihre Seite meldet JavaScript-Fehler beim Laden."
          />
          <CheckItem
            label="HTTP2-Nutzung"
            status={s.http2}
            detail="Wir empfehlen das HTTP/2+-Protokoll für deine Website zu aktivieren."
          />
          <CheckItem
            label="Bilder optimieren"
            status={s.imagesOptimized}
            detail="Alle Bilder auf Ihrer Seite scheinen optimiert zu sein."
          />
          <CheckItem
            label="Verkleinerung & Veraltetes HTML"
            status={s.minified}
            detail="All Ihre JavaScript- und CSS-Dateien scheinen minimiert zu sein."
          />
        </div>
      </div>
    </PageLayout>
  );
}
