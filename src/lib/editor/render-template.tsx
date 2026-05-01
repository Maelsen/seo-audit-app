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
import { ArrowBulletListBlockView } from "./blocks/ArrowBulletListBlockView";
import { ComparisonTableBlockView } from "./blocks/ComparisonTableBlockView";
import { PieChartBlockView } from "./blocks/PieChartBlockView";
import { FindingsTableBlockView } from "./blocks/FindingsTableBlockView";

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
      {/* Anchor: zwingt Chromium leere Pages nicht zu kollabieren */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "1px", height: "1px", opacity: 0 }}>&nbsp;</div>
      {sorted.map((block) => (
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
    case "arrowBulletList":
      return <ArrowBulletListBlockView block={block} audit={audit} />;
    case "comparisonTable":
      return <ComparisonTableBlockView block={block} audit={audit} />;
    case "pieChart":
      return <PieChartBlockView block={block} audit={audit} />;
    case "findingsTable":
      return <FindingsTableBlockView block={block} audit={audit} />;
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
