import { PageLayout } from "../PageLayout";
import { SectionHeader } from "../SectionHeader";
import { CheckItem } from "../CheckItem";
import type { AuditData } from "@/lib/types";

const POPPINS = "'Poppins', Arial, sans-serif";

type Props = {
  audit: AuditData;
};

function PageSpeedGauge({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const color =
    value >= 90 ? "#22c55e" : value >= 50 ? "#f97316" : "#ef4444";
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - value / 100);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 100, height: 100 }}>
        <svg width={100} height={100}>
          <circle
            cx={50}
            cy={50}
            r={40}
            stroke="#4a4a4a"
            strokeWidth={8}
            fill="transparent"
          />
          <circle
            cx={50}
            cy={50}
            r={40}
            stroke={color}
            strokeWidth={8}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize={22}
            fontWeight="bold"
            fontFamily="'Poppins', Arial, sans-serif"
          >
            {value}
          </text>
        </svg>
      </div>
      <div
        style={{
          color: "#ffffff",
          fontFamily: POPPINS,
          fontSize: "10pt",
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function UsabilityPage({
  audit,
  mobileScreenshot,
  tabletScreenshot,
}: Props & { mobileScreenshot?: string; tabletScreenshot?: string }) {
  const s = audit.sections.usability;
  return (
    <PageLayout url={audit.url}>
      <SectionHeader
        title="Usability"
        score={s.score}
        heading={s.heading}
        text={s.text}
      />

      <div style={{ marginTop: 14, fontFamily: POPPINS }}>
        <div
          style={{
            fontFamily: POPPINS,
            fontSize: "10pt",
            color: "#ffffff",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Geräte-Rendering
        </div>
        <div
          style={{
            fontFamily: POPPINS,
            fontSize: "8pt",
            color: "#d4d4d4",
            marginBottom: 8,
          }}
        >
          Dieser Check zeigt visuell, wie Ihre Seite auf verschiedenen
          Geräten gerendert wird.
        </div>
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "flex-end",
            marginBottom: 24,
          }}
        >
          {mobileScreenshot && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mobileScreenshot}
              alt="Mobile"
              style={{
                width: 130,
                height: 230,
                objectFit: "cover",
                objectPosition: "top",
                border: "4px solid #2a2a2a",
                borderRadius: 12,
              }}
            />
          )}
          {tabletScreenshot && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={tabletScreenshot}
              alt="Tablet"
              style={{
                width: 180,
                height: 230,
                objectFit: "cover",
                objectPosition: "top",
                border: "4px solid #2a2a2a",
                borderRadius: 8,
              }}
            />
          )}
        </div>

        <CheckItem
          label="Core Web Vitals von Google"
          status={s.coreWebVitals}
          detail="Core Web Vitals sind von Google erstellte UI-Metriken, die das Seitenerlebnis messen und als Ranking-Faktor immer wichtiger werden."
        />
        <CheckItem
          label="Verwendung von mobilen Ansichtsfeldern"
          status={s.viewport}
          detail="Ihre Seite gibt einen Viewport an, der der Größe des Geräts entspricht."
        />
        <CheckItem
          label="Googles PageSpeed Insights > Mobil & Desktop"
          status={s.pageSpeedStatus}
          detail="Google gibt an, wie Ihre Seite bei der PageSpeed Insights-Bewertung abschneidet."
        />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 30,
            marginTop: 20,
          }}
        >
          <PageSpeedGauge value={s.mobilePageSpeed} label="Mobil" />
          <PageSpeedGauge value={s.desktopPageSpeed} label="Desktop" />
        </div>
      </div>
    </PageLayout>
  );
}
