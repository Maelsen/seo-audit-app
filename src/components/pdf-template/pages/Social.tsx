import { PageLayout } from "../PageLayout";
import { SectionHeader } from "../SectionHeader";
import { CheckItem } from "../CheckItem";
import type { AuditData } from "@/lib/types";

type Props = {
  audit: AuditData;
};

export function SocialPage({ audit }: Props) {
  const s = audit.sections.social;
  return (
    <PageLayout url={audit.url}>
      <SectionHeader
        title="Soziale Ergebnisse"
        score={s.score}
        heading={s.heading}
        text={s.text}
      />
      <div style={{ marginTop: 20 }}>
        {s.checks.map((c, idx) => (
          <CheckItem
            key={idx}
            label={c.label}
            status={c.status}
            detail={c.detail}
          />
        ))}
      </div>
    </PageLayout>
  );
}
