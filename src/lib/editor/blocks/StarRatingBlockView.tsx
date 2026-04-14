import type { ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding } from "../resolve-binding";
import type { StarRatingBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: StarRatingBlock; audit: AuditData };

type DistEntry = { stars: number; count: number };

export function StarRatingBlockView({ block, audit }: Props): ReactElement {
  const rating =
    block.ratingBinding.kind === "audit"
      ? Number(resolveBinding(audit, block.ratingBinding) ?? 0)
      : 0;
  const count =
    block.countBinding.kind === "audit"
      ? Number(resolveBinding(audit, block.countBinding) ?? 0)
      : 0;
  const dist = (
    block.distributionBinding.kind === "audit"
      ? resolveBinding(audit, block.distributionBinding)
      : []
  ) as DistEntry[] | undefined;
  const safeDist = Array.isArray(dist) ? dist : [];
  const max = safeDist.reduce((acc, d) => Math.max(acc, d.count), 0) || 1;
  const filled = Math.round(rating);

  return (
    <div
      data-block-id={block.id}
      data-block-type="starRating"
      style={{ ...frameStyle(block.frame), overflow: "hidden" }}
    >
      <div
        style={{
          ...textStyleToCss(block.labelStyle),
          color: block.starColor,
          marginBottom: "1.5mm",
        }}
      >
        {"★".repeat(filled)}
        {"☆".repeat(Math.max(0, 5 - filled))}
        <span
          style={{
            ...textStyleToCss(block.labelStyle),
            marginLeft: "2mm",
          }}
        >
          {rating.toFixed(1)} ({count})
        </span>
      </div>
      {[5, 4, 3, 2, 1].map((stars) => {
        const entry = safeDist.find((d) => d.stars === stars);
        const value = entry?.count ?? 0;
        const pct = (value / max) * 100;
        return (
          <div
            key={stars}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              marginBottom: `${block.gap}mm`,
            }}
          >
            <div
              style={{ ...textStyleToCss(block.labelStyle), width: "4mm" }}
            >
              {stars}
            </div>
            <div
              style={{
                flex: 1,
                height: `${block.barHeight}mm`,
                background: block.trackColor,
                borderRadius: `${block.barHeight / 2}mm`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: block.barColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
