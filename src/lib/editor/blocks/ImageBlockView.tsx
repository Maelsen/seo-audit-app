import type { ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding } from "../resolve-binding";
import type { ImageBlock } from "../template-types";
import { frameStyle } from "../frame-style";

type Props = { block: ImageBlock; audit: AuditData };

export function ImageBlockView({ block, audit }: Props): ReactElement {
  const staticSrc = block.staticSrc;
  const boundSrc =
    block.binding.kind === "audit"
      ? (resolveBinding(audit, block.binding) as string | undefined)
      : undefined;
  const src = staticSrc || boundSrc;

  const box = {
    ...frameStyle(block.frame),
    zIndex: block.zIndex,
    background: src ? undefined : "#2a2a2a",
    overflow: "hidden",
    borderRadius:
      block.borderRadius != null ? `${block.borderRadius}mm` : undefined,
  };

  if (!src) {
    return (
      <div
        data-block-id={block.id}
        data-block-type="image-empty"
        style={{
          ...box,
          background: "#2a2a2a",
          border: "1px dashed #38E1E1",
        }}
      />
    );
  }

  return (
    <div data-block-id={block.id} data-block-type="image" style={box}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: block.objectFit,
          objectPosition: block.objectPosition,
          display: "block",
        }}
      />
    </div>
  );
}
