import type { CheckStatus } from "@/lib/types";

const POPPINS = "'Poppins', Arial, sans-serif";

type Props = {
  label: string;
  status: CheckStatus;
  detail?: string;
  children?: React.ReactNode;
};

export function CheckItem({ label, status, detail, children }: Props) {
  const icon = statusIcon(status);
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: POPPINS,
              fontSize: "10pt",
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: 3,
            }}
          >
            {label}
          </div>
          {detail && (
            <div
              style={{
                fontFamily: POPPINS,
                fontSize: "8pt",
                color: "#c2c2c2",
                lineHeight: 1.5,
              }}
            >
              {detail}
            </div>
          )}
          {children && (
            <div
              style={{
                marginTop: 4,
                fontFamily: POPPINS,
                fontSize: "8pt",
                color: "#c2c2c2",
              }}
            >
              {children}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: "14pt",
            lineHeight: 1,
            color: icon.color,
            minWidth: 18,
            textAlign: "right",
          }}
        >
          {icon.symbol}
        </div>
      </div>
    </div>
  );
}

function statusIcon(status: CheckStatus) {
  switch (status) {
    case "ok":
      return { symbol: "✓", color: "#22c55e" };
    case "fail":
      return { symbol: "✕", color: "#ef4444" };
    case "warning":
      return { symbol: "!", color: "#f97316" };
    case "info":
    default:
      return { symbol: "i", color: "#38E1E1" };
  }
}
