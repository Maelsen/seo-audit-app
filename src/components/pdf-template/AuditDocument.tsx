import { CoverPage } from "./pages/Cover";
import { OverviewPage } from "./pages/Overview";
import { TopRisksPage } from "./pages/TopRisks";
import { RecommendationsPage } from "./pages/Recommendations";
import { OnPageSeoPage1, OnPageSeoPage2 } from "./pages/OnPageSeo";
import { UxConversionPage } from "./pages/UxConversion";
import { LinksPage1, LinksPage2 } from "./pages/Links";
import { UsabilityPage } from "./pages/Usability";
import { LeistungPage } from "./pages/Leistung";
import { SocialPage } from "./pages/Social";
import { LokalesSeoPage } from "./pages/LokalesSeo";
import { ThankYouPage } from "./pages/ThankYou";
import type { AuditData } from "@/lib/types";

type Props = {
  audit: AuditData;
  coverScreenshotDataUrl?: string;
  mobileScreenshotDataUrl?: string;
  tabletScreenshotDataUrl?: string;
};

export function AuditDocument({
  audit,
  coverScreenshotDataUrl,
  mobileScreenshotDataUrl,
  tabletScreenshotDataUrl,
}: Props) {
  return (
    <div>
      <CoverPage url={audit.url} screenshotDataUrl={coverScreenshotDataUrl} />
      <OverviewPage audit={audit} />
      <TopRisksPage audit={audit} />
      <RecommendationsPage audit={audit} />
      <OnPageSeoPage1 audit={audit} />
      <OnPageSeoPage2 audit={audit} />
      <UxConversionPage audit={audit} />
      <LinksPage1 audit={audit} />
      <LinksPage2 audit={audit} />
      <UsabilityPage
        audit={audit}
        mobileScreenshot={mobileScreenshotDataUrl}
        tabletScreenshot={tabletScreenshotDataUrl}
      />
      <LeistungPage audit={audit} />
      <SocialPage audit={audit} />
      <LokalesSeoPage audit={audit} />
      <ThankYouPage />
    </div>
  );
}
