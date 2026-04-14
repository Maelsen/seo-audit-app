import type { ReactElement } from "react";
import type { AuditData, CheckStatus, FindingCheck } from "../../types";
import { resolveBinding, resolvePath, applyTextTemplate } from "../resolve-binding";
import type { ListBlock } from "../template-types";
import { frameStyle } from "../frame-style";
import { useTemplateAssets } from "../asset-context";
import { resolveShrink, scaleStyle } from "./list-helpers";

type Props = { block: ListBlock; audit: AuditData };

export function CheckListBlockView({ block, audit }: Props): ReactElement {
  const assets = useTemplateAssets();
  let checks: FindingCheck[];
  if (block.staticItems && block.staticItems.length > 0) {
    checks = block.staticItems.map((item) => {
      let detail: string | undefined;
      if (item.detailPath) {
        const v = resolvePath(audit, item.detailPath);
        detail = v != null ? String(v) : undefined;
      } else if (item.detail) {
        detail = applyTextTemplate(item.detail, audit);
      }
      return {
        label: item.title,
        detail,
        status: ((resolvePath(audit, item.statusPath) as CheckStatus) ?? "info"),
      };
    });
  } else {
    const raw =
      block.binding.kind === "audit" ? resolveBinding(audit, block.binding) : [];
    checks = Array.isArray(raw) ? (raw as FindingCheck[]) : [];
  }
  const palette = {
    ok: block.statusPalette?.ok ?? assets.statuses.ok,
    warning: block.statusPalette?.warning ?? assets.statuses.warning,
    fail: block.statusPalette?.fail ?? assets.statuses.fail,
    info: block.statusPalette?.info ?? assets.statuses.info,
  };
  const { scale, displayCount, overflowCount } = resolveShrink(
    block,
    checks.length,
  );
  const visible = checks.slice(0, displayCount);

  return (
    <div
      data-block-id={block.id}
      data-block-type="checkList"
      style={{
        ...frameStyle(block.frame),
        display: "flex",
        flexDirection: "column",
        gap: `${block.itemGap * scale}mm`,
        overflow: "hidden",
      }}
    >
      {visible.map((check, idx) => {
        const icon = palette[check.status] ?? palette.info;
        const iconImage =
          "imageSrc" in icon ? (icon as { imageSrc?: string }).imageSrc : undefined;
        return (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: `${3 * scale}mm`,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={scaleStyle(block.itemStyle.titleStyle, scale)}>
                {check.label}
              </div>
              {check.detail && (
                <div
                  style={{
                    ...scaleStyle(block.itemStyle.bodyStyle, scale),
                    marginTop: `${0.8 * scale}mm`,
                  }}
                >
                  {check.detail}
                </div>
              )}
            </div>
            {iconImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={iconImage}
                alt={check.status}
                style={{
                  height: `${block.itemStyle.titleStyle.fontSize * 0.38 * scale}mm`,
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  ...scaleStyle(block.itemStyle.titleStyle, scale),
                  color: icon.color,
                  minWidth: `${6 * scale}mm`,
                  textAlign: "right",
                  lineHeight: 1,
                }}
              >
                {icon.symbol}
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
          }}
        >
          +{overflowCount} weitere
        </div>
      )}
    </div>
  );
}
