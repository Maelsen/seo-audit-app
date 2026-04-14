import type { ReactElement } from "react";
import type { AuditData } from "../../types";
import type { LegacyPageBlock } from "../template-types";
import {
  getBrandLogo,
  getBrandSignet,
  setBrandAssets,
} from "@/components/pdf-template/brand-state";
import { CoverPage } from "@/components/pdf-template/pages/Cover";
import { OverviewPage } from "@/components/pdf-template/pages/Overview";
import { TopRisksPage } from "@/components/pdf-template/pages/TopRisks";
import { RecommendationsPage } from "@/components/pdf-template/pages/Recommendations";
import {
  OnPageSeoPage1,
  OnPageSeoPage2,
} from "@/components/pdf-template/pages/OnPageSeo";
import { UxConversionPage } from "@/components/pdf-template/pages/UxConversion";
import { LinksPage1, LinksPage2 } from "@/components/pdf-template/pages/Links";
import { UsabilityPage } from "@/components/pdf-template/pages/Usability";
import { LeistungPage } from "@/components/pdf-template/pages/Leistung";
import { SocialPage } from "@/components/pdf-template/pages/Social";
import { LokalesSeoPage } from "@/components/pdf-template/pages/LokalesSeo";
import { ThankYouPage } from "@/components/pdf-template/pages/ThankYou";

type Props = { block: LegacyPageBlock; audit: AuditData };

function ensureBrandFallback(): void {
  if (!getBrandLogo() && !getBrandSignet()) {
    setBrandAssets(
      "/assets/ArtisticAvenue-Logo.png",
      "/assets/ArtisticAvenue-Signet.png",
    );
  }
}

export function LegacyPageBlockView({ block, audit }: Props): ReactElement | null {
  ensureBrandFallback();
  const cover = audit.screenshots?.cover;
  const mobile = audit.screenshots?.mobile;
  const tablet = audit.screenshots?.tablet;

  switch (block.pageKey) {
    case "cover":
      return <CoverPage url={audit.url} screenshotDataUrl={cover} />;
    case "overview":
      return <OverviewPage audit={audit} />;
    case "topRisks":
      return <TopRisksPage audit={audit} />;
    case "recommendations":
      return <RecommendationsPage audit={audit} />;
    case "onPageSeo1":
      return <OnPageSeoPage1 audit={audit} />;
    case "onPageSeo2":
      return <OnPageSeoPage2 audit={audit} />;
    case "uxConversion":
      return <UxConversionPage audit={audit} />;
    case "links1":
      return <LinksPage1 audit={audit} />;
    case "links2":
      return <LinksPage2 audit={audit} />;
    case "usability":
      return (
        <UsabilityPage
          audit={audit}
          mobileScreenshot={mobile}
          tabletScreenshot={tablet}
        />
      );
    case "leistung":
      return <LeistungPage audit={audit} />;
    case "social":
      return <SocialPage audit={audit} />;
    case "lokalesSeo":
      return <LokalesSeoPage audit={audit} />;
    case "thankYou":
      return <ThankYouPage />;
    default:
      return null;
  }
}
