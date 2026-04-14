import type { ReactElement } from "react";
import type { AuditData } from "../../types";
import { resolveBinding, applyTextTemplate } from "../resolve-binding";
import type { TextBlock } from "../template-types";
import { frameStyle, textStyleToCss } from "../frame-style";

type Props = { block: TextBlock; audit: AuditData };

export function TextBlockView({ block, audit }: Props): ReactElement {
  let text: string;
  if (block.binding.kind === "static") {
    text = applyTextTemplate(block.staticText ?? "", audit);
  } else {
    const raw = resolveBinding(audit, block.binding);
    text = raw == null ? block.staticText ?? "" : String(raw);
  }
  return (
    <div
      data-block-id={block.id}
      data-block-type="text"
      style={{
        ...frameStyle(block.frame),
        ...textStyleToCss(block.style),
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {text}
    </div>
  );
}
