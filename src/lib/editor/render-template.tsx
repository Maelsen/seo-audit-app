import type { ReactElement } from "react";
import type { AuditData } from "../types";
import type {
  Block,
  Template,
  TemplatePage,
} from "./template-types";
import { frameStyle } from "./frame-style";
import { setTemplateAssets } from "./asset-context";
import { TextBlockView } from "./blocks/TextBlockView";
import { ShapeBlockView } from "./blocks/ShapeBlockView";
import { ImageBlockView } from "./blocks/ImageBlockView";
import { ScoreCircleBlockView } from "./blocks/ScoreCircleBlockView";
import { BrandDecorationBlockView } from "./blocks/BrandDecorationBlockView";
import { TopRiskListBlockView } from "./blocks/TopRiskListBlockView";
import { RecommendationListBlockView } from "./blocks/RecommendationListBlockView";
import { CheckListBlockView } from "./blocks/CheckListBlockView";
import { TableBlockView } from "./blocks/TableBlockView";
import { BarChartBlockView } from "./blocks/BarChartBlockView";
import { GaugeBlockView } from "./blocks/GaugeBlockView";
import { StarRatingBlockView } from "./blocks/StarRatingBlockView";
import { ResourceTileBlockView } from "./blocks/ResourceTileBlockView";
import { SerpPreviewBlockView } from "./blocks/SerpPreviewBlockView";
import { LegacyPageBlockView } from "./blocks/LegacyPageBlockView";

type Props = {
  template: Template;
  audit: AuditData;
};

export function TemplateRenderer({ template, audit }: Props): ReactElement {
  setTemplateAssets(template.assets);
  return (
    <>
      {template.pages.map((page) => (
        <PageView key={page.id} page={page} audit={audit} />
      ))}
    </>
  );
}

type PageProps = { page: TemplatePage; audit: AuditData };

function PageView({ page, audit }: PageProps): ReactElement {
  const sorted = [...page.blocks]
    .filter((b) => b.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  const legacy = sorted.find((b) => b.type === "legacyPage");
  const others = sorted.filter((b) => b.type !== "legacyPage");

  if (legacy && others.length === 0) {
    return <BlockRenderer block={legacy} audit={audit} />;
  }

  return (
    <section
      className="audit-page"
      style={{
        width: `${page.width}mm`,
        height: `${page.height}mm`,
        background: page.background,
        position: "relative",
        overflow: "hidden",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      {legacy && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: legacy.zIndex,
          }}
        >
          <BlockRenderer block={legacy} audit={audit} />
        </div>
      )}
      {others.map((block) => (
        <BlockRenderer key={block.id} block={block} audit={audit} />
      ))}
    </section>
  );
}

type BlockProps = { block: Block; audit: AuditData };

export function BlockRenderer({ block, audit }: BlockProps): ReactElement | null {
  switch (block.type) {
    case "text":
      return <TextBlockView block={block} audit={audit} />;
    case "shape":
      return <ShapeBlockView block={block} />;
    case "image":
      return <ImageBlockView block={block} audit={audit} />;
    case "scoreCircle":
      return <ScoreCircleBlockView block={block} audit={audit} />;
    case "brandDecoration":
      return <BrandDecorationBlockView block={block} />;
    case "topRiskList":
      return <TopRiskListBlockView block={block} audit={audit} />;
    case "recommendationList":
      return <RecommendationListBlockView block={block} audit={audit} />;
    case "checkList":
      return <CheckListBlockView block={block} audit={audit} />;
    case "table":
      return <TableBlockView block={block} audit={audit} />;
    case "barChart":
      return <BarChartBlockView block={block} audit={audit} />;
    case "gauge":
      return <GaugeBlockView block={block} audit={audit} />;
    case "starRating":
      return <StarRatingBlockView block={block} audit={audit} />;
    case "resourceTile":
      return <ResourceTileBlockView block={block} audit={audit} />;
    case "serpPreview":
      return <SerpPreviewBlockView block={block} audit={audit} />;
    case "legacyPage":
      return <LegacyPageBlockView block={block} audit={audit} />;
    default:
      return <PlaceholderView block={block} />;
  }
}

function PlaceholderView({ block }: { block: Block }): ReactElement {
  return (
    <div
      data-block-id={block.id}
      data-block-type={block.type}
      style={{
        ...frameStyle(block.frame),
        border: "1px dashed #38E1E1",
        color: "#38E1E1",
        fontSize: "8pt",
        padding: "2mm",
        fontFamily: "'Poppins', Arial, sans-serif",
      }}
    >
      {block.type} (TODO)
    </div>
  );
}
