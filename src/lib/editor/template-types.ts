import type { Grade as AuditGrade } from "../types";

export type Mm = number;
export type HexColor = string;
export type FontFamily = "Poppins" | "Open Sans" | string;

export type Grade = AuditGrade;

export type Binding =
  | { kind: "static" }
  | { kind: "audit"; path: string }
  | { kind: "computed"; fn: "domain"; path: string };

export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type TextStyle = {
  fontFamily: FontFamily;
  fontSize: number;
  fontWeight: FontWeight;
  color: HexColor;
  lineHeight: number;
  letterSpacing?: number;
  textAlign: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase";
  textShadow?: string;
  fontStyle?: "normal" | "italic";
  padding?: { top: number; right: number; bottom: number; left: number };
  backgroundColor?: HexColor;
  borderRadius?: number;
};

export type Frame = {
  x: Mm;
  y: Mm;
  w: Mm;
  h: Mm;
  rotation?: number;
};

export type BlockBase = {
  id: string;
  frame: Frame;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
};

export type TextBlock = BlockBase & {
  type: "text";
  binding: Binding;
  staticText?: string;
  style: TextStyle;
};

export type ImageBlock = BlockBase & {
  type: "image";
  binding: Binding;
  staticSrc?: string;
  objectFit: "cover" | "contain";
  objectPosition?: "top" | "center" | "bottom";
  borderRadius?: number;
};

export type ScoreCircleBlock = BlockBase & {
  type: "scoreCircle";
  binding: Binding;
  size: number;
  strokeWidth: number;
  labelStyle: TextStyle;
};

export type ListBlockKind = "topRiskList" | "recommendationList" | "checkList";

export type ListItemStyle = {
  titleStyle: TextStyle;
  bodyStyle: TextStyle;
  indicatorColor?: HexColor;
};

export type PriorityPalette = {
  hoch: { label: string; color: HexColor };
  mittel: { label: string; color: HexColor };
  niedrig: { label: string; color: HexColor };
};

export type CheckStatusPalette = {
  ok: { symbol: string; color: HexColor };
  warning: { symbol: string; color: HexColor };
  fail: { symbol: string; color: HexColor };
  info: { symbol: string; color: HexColor };
};

export type StaticCheckItem = {
  title: string;
  detail?: string;
  detailPath?: string;
  statusPath: string;
};

export type ListBlock = BlockBase & {
  type: ListBlockKind;
  binding: Binding;
  staticItems?: StaticCheckItem[];
  itemGap: number;
  itemStyle: ListItemStyle;
  maxItems?: number;
  overflow: "clip" | "shrink" | "page-break";
  numbered?: boolean;
  dividerColor?: HexColor;
  priorityPalette?: PriorityPalette;
  statusPalette?: CheckStatusPalette;
};

export type TableColumn = {
  header: string;
  fieldPath: string;
  width?: Mm;
};

export type TableBlock = BlockBase & {
  type: "table";
  binding: Binding;
  columns: TableColumn[];
  headerStyle: TextStyle;
  cellStyle: TextStyle;
  rowDividerColor?: HexColor;
};

export type ShapeBlock = BlockBase & {
  type: "shape";
  shape: "rect" | "ellipse" | "line";
  fill?: HexColor;
  stroke?: HexColor;
  strokeWidth?: number;
  gradient?: { from: HexColor; to: HexColor; angle: number };
  borderRadius?: number;
  boxShadow?: string;
};

export type BrandDecorationKind = "signet" | "logo" | "footerBar" | "radialGlow";

export type BrandDecorationBlock = BlockBase & {
  type: "brandDecoration";
  kind: BrandDecorationKind;
};

export type BarChartItem = {
  label: string;
  fieldPath: string;
};

export type BarChartBlock = BlockBase & {
  type: "barChart";
  binding: Binding;
  items: BarChartItem[];
  maxValue?: number;
  barColor: HexColor;
  trackColor: HexColor;
  labelStyle: TextStyle;
  valueStyle: TextStyle;
  barHeight: number;
  gap: number;
};

export type GaugeBlock = BlockBase & {
  type: "gauge";
  binding: Binding;
  variant: "semi" | "full";
  minValue: number;
  maxValue: number;
  suffix?: string;
  thresholds: { value: number; color: HexColor }[];
  trackColor: HexColor;
  valueStyle: TextStyle;
  labelStyle: TextStyle;
  labelText?: string;
  strokeWidth: number;
};

export type StarRatingBlock = BlockBase & {
  type: "starRating";
  ratingBinding: Binding;
  countBinding: Binding;
  distributionBinding: Binding;
  starColor: HexColor;
  trackColor: HexColor;
  barColor: HexColor;
  labelStyle: TextStyle;
  barHeight: number;
  gap: number;
};

export type ResourceTileBlock = BlockBase & {
  type: "resourceTile";
  binding: Binding;
  label: string;
  icon: string;
  iconBg: HexColor;
  iconColor: HexColor;
  valueStyle: TextStyle;
  labelStyle: TextStyle;
};

export type SerpPreviewBlock = BlockBase & {
  type: "serpPreview";
  urlBinding: Binding;
  titleBinding: Binding;
  descriptionBinding: Binding;
};

export type LegacyPageKey =
  | "cover"
  | "overview"
  | "topRisks"
  | "recommendations"
  | "onPageSeo1"
  | "onPageSeo2"
  | "uxConversion"
  | "links1"
  | "links2"
  | "usability"
  | "leistung"
  | "social"
  | "lokalesSeo"
  | "thankYou";

export type LegacyPageBlock = BlockBase & {
  type: "legacyPage";
  pageKey: LegacyPageKey;
};

export type Block =
  | TextBlock
  | ImageBlock
  | ScoreCircleBlock
  | ListBlock
  | TableBlock
  | ShapeBlock
  | BrandDecorationBlock
  | BarChartBlock
  | GaugeBlock
  | StarRatingBlock
  | ResourceTileBlock
  | SerpPreviewBlock
  | LegacyPageBlock;

export type BlockType = Block["type"];

export type TemplatePage = {
  id: string;
  name: string;
  background: HexColor;
  width: Mm;
  height: Mm;
  blocks: Block[];
};

export type GradeSlot = {
  color: HexColor;
  imageSrc?: string;
};

export type GradePalette = Record<Grade, GradeSlot>;

export type PriorityAssetSlot = {
  label: string;
  color: HexColor;
  imageSrc?: string;
};

export type TemplatePriorityAssets = {
  hoch: PriorityAssetSlot;
  mittel: PriorityAssetSlot;
  niedrig: PriorityAssetSlot;
};

export type CheckStatusAssetSlot = {
  symbol: string;
  color: HexColor;
  imageSrc?: string;
};

export type TemplateStatusAssets = {
  ok: CheckStatusAssetSlot;
  warning: CheckStatusAssetSlot;
  fail: CheckStatusAssetSlot;
  info: CheckStatusAssetSlot;
};

export type TemplateAssets = {
  logo?: string;
  signet?: string;
  grades: GradePalette;
  priorities: TemplatePriorityAssets;
  statuses: TemplateStatusAssets;
};

export type Template = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: 1;
  pages: TemplatePage[];
  assets?: TemplateAssets;
};
