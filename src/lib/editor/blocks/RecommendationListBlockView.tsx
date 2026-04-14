import type { ReactElement } from "react";
import type { AuditData, Recommendation } from "../../types";
import { resolveBinding } from "../resolve-binding";
import type { ListBlock } from "../template-types";
import { frameStyle } from "../frame-style";
import { useTemplateAssets } from "../asset-context";
import { resolveShrink, scaleStyle } from "./list-helpers";

type Props = { block: ListBlock; audit: AuditData };

export function RecommendationListBlockView({
  block,
  audit,
}: Props): ReactElement {
  const assets = useTemplateAssets();
  const raw =
    block.binding.kind === "audit" ? resolveBinding(audit, block.binding) : [];
  const recs: Recommendation[] = Array.isArray(raw)
    ? (raw as Recommendation[])
    : [];
  const palette = {
    hoch: block.priorityPalette?.hoch ?? assets.priorities.hoch,
    mittel: block.priorityPalette?.mittel ?? assets.priorities.mittel,
    niedrig: block.priorityPalette?.niedrig ?? assets.priorities.niedrig,
  };
  const { scale, displayCount, overflowCount } = resolveShrink(
    block,
    recs.length,
  );
  const visible = recs.slice(0, displayCount);
  const dividerColor = block.dividerColor ?? "#2a2a2a";

  return (
    <div
      data-block-id={block.id}
      data-block-type="recommendationList"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {visible.map((rec) => {
        const prio = palette[rec.priority];
        const prioImage =
          "imageSrc" in prio ? (prio as { imageSrc?: string }).imageSrc : undefined;
        return (
          <div
            key={rec.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: `${3 * scale}mm`,
              padding: `${block.itemGap * scale}mm 0`,
              borderBottom: `1px solid ${dividerColor}`,
            }}
          >
            <div
              style={{
                ...scaleStyle(block.itemStyle.titleStyle, scale),
                flex: 1,
              }}
            >
              {rec.title}
            </div>
            {prioImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={prioImage}
                alt={prio.label}
                style={{
                  height: `${8 * scale}mm`,
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  ...scaleStyle(block.itemStyle.bodyStyle, scale),
                  background: prio.color,
                  color: "#ffffff",
                  padding: `${1 * scale}mm ${3 * scale}mm`,
                  borderRadius: `${1 * scale}mm`,
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                }}
              >
                {prio.label}
              </div>
            )}
          </div>
        );
      })}
      {overflowCount > 0 && (
        <div
          style={{
            ...scaleStyle(block.itemStyle.bodyStyle, scale),
            opacity: 0.6,
            fontStyle: "italic",
            paddingTop: `${2 * scale}mm`,
          }}
        >
          +{overflowCount} weitere Empfehlungen
        </div>
      )}
    </div>
  );
}
