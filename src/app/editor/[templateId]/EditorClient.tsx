"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { AuditData } from "@/lib/types";
import type {
  Binding,
  Block,
  Frame,
  Grade,
  Template,
  TemplateAssets,
  TemplatePage,
  TextBlock,
  TextStyle,
} from "@/lib/editor/template-types";
import { TemplateRenderer } from "@/lib/editor/render-template";
import { withAssetDefaults } from "@/lib/editor/asset-defaults";
import {
  BINDING_CATALOG,
  bindingsForValueTypes,
  type BindingValueType,
} from "@/lib/editor/binding-catalog";
import { decomposePageBlocks } from "@/lib/editor/page-builders";
import { useProvideAgentContext } from "@/components/agent-chat/context-store";

const GRADE_ORDER: Grade[] = [
  "A+", "A", "A-",
  "B+", "B", "B-",
  "C+", "C", "C-",
  "D+", "D", "D-",
  "F",
];

const HISTORY_MAX = 50;
const MIN_FRAME_MM = 2;

type HandleKey = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type DragState =
  | { kind: "idle" }
  | {
      kind: "move";
      blockId: string;
      startX: number;
      startY: number;
      startFrame: Frame;
      snapshot: Template;
      hasMoved: boolean;
    }
  | {
      kind: "resize";
      blockId: string;
      handle: HandleKey;
      startX: number;
      startY: number;
      startFrame: Frame;
      snapshot: Template;
      hasMoved: boolean;
    };

type Props = {
  initialTemplate: Template;
  audit: AuditData;
};

export function EditorClient({ initialTemplate, audit }: Props) {
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const historyRef = useRef<Template[]>([]);
  const futureRef = useRef<Template[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>({ kind: "idle" });

  const currentPage: TemplatePage | undefined = template.pages[pageIndex];
  const selectedBlock: Block | null = useMemo(() => {
    if (!selectedBlockId || !currentPage) return null;
    return currentPage.blocks.find((b) => b.id === selectedBlockId) ?? null;
  }, [selectedBlockId, currentPage]);

  useProvideAgentContext({
    location: "editor",
    templateId: template.id,
    selectedPageId: currentPage?.id,
    selectedBlockId: selectedBlockId ?? undefined,
  });

  useEffect(() => {
    async function reloadTemplate() {
      try {
        const res = await fetch(`/api/templates/${template.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.template) {
          setTemplate(data.template);
          historyRef.current = [];
          futureRef.current = [];
        }
      } catch {}
    }
    window.addEventListener("agent-applied-changes", reloadTemplate);
    return () => {
      window.removeEventListener("agent-applied-changes", reloadTemplate);
    };
  }, [template.id]);

  const updateTemplate = useCallback(
    (updater: (t: Template) => Template, options?: { skipHistory?: boolean }) => {
      setTemplate((prev) => {
        if (!options?.skipHistory) {
          historyRef.current.push(prev);
          if (historyRef.current.length > HISTORY_MAX) historyRef.current.shift();
          futureRef.current = [];
        }
        return updater(prev);
      });
      setSaveState("idle");
    },
    [],
  );

  const updateBlock = useCallback(
    (blockId: string, updater: (b: Block) => Block, options?: { skipHistory?: boolean }) => {
      updateTemplate(
        (t) => ({
          ...t,
          pages: t.pages.map((p, idx) =>
            idx === pageIndex
              ? {
                  ...p,
                  blocks: p.blocks.map((b) => (b.id === blockId ? updater(b) : b)),
                }
              : p,
          ),
        }),
        options,
      );
    },
    [pageIndex, updateTemplate],
  );

  const setBlockFrame = useCallback(
    (blockId: string, frame: Frame, options?: { skipHistory?: boolean }) => {
      updateBlock(blockId, (b) => ({ ...b, frame }), options);
    },
    [updateBlock],
  );

  const deleteBlock = useCallback(
    (blockId: string) => {
      updateTemplate((t) => ({
        ...t,
        pages: t.pages.map((p, idx) =>
          idx === pageIndex
            ? { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }
            : p,
        ),
      }));
      setSelectedBlockId(null);
    },
    [pageIndex, updateTemplate],
  );

  const updateAssets = useCallback(
    (updater: (a: TemplateAssets) => TemplateAssets) => {
      updateTemplate((t) => ({
        ...t,
        assets: updater(withAssetDefaults(t.assets)),
      }));
    },
    [updateTemplate],
  );

  const duplicateBlock = useCallback(
    (blockId: string) => {
      if (!currentPage) return;
      const source = currentPage.blocks.find((b) => b.id === blockId);
      if (!source) return;
      const copy: Block = {
        ...source,
        id: `${source.id}-copy-${Date.now().toString(36)}`,
        frame: { ...source.frame, x: source.frame.x + 5, y: source.frame.y + 5 },
      };
      updateTemplate((t) => ({
        ...t,
        pages: t.pages.map((p, idx) =>
          idx === pageIndex ? { ...p, blocks: [...p.blocks, copy] } : p,
        ),
      }));
      setSelectedBlockId(copy.id);
    },
    [currentPage, pageIndex, updateTemplate],
  );

  const addBlock = useCallback(
    (block: Block) => {
      updateTemplate((t) => ({
        ...t,
        pages: t.pages.map((p, idx) =>
          idx === pageIndex ? { ...p, blocks: [...p.blocks, block] } : p,
        ),
      }));
      setSelectedBlockId(block.id);
    },
    [pageIndex, updateTemplate],
  );

  const addImageFromFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") return;
        const id = `img-${Date.now().toString(36)}`;
        const block: Block = {
          id,
          type: "image",
          zIndex: 10,
          frame: { x: 40, y: 60, w: 60, h: 40 },
          binding: { kind: "static" },
          staticSrc: reader.result,
          objectFit: "contain",
        } as Block;
        addBlock(block);
      };
      reader.readAsDataURL(file);
    },
    [addBlock],
  );

  const decomposePage = useCallback(() => {
    if (!selectedBlock || selectedBlock.type !== "legacyPage") return;
    const pageKey = selectedBlock.pageKey;
    const newBlocks = decomposePageBlocks(pageKey);
    if (newBlocks.length === 0) return;
    updateTemplate((t) => ({
      ...t,
      pages: t.pages.map((p, idx) =>
        idx === pageIndex
          ? { ...p, blocks: newBlocks }
          : p,
      ),
    }));
    setSelectedBlockId(null);
  }, [selectedBlock, pageIndex, updateTemplate]);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setTemplate((curr) => {
      futureRef.current.push(curr);
      return prev;
    });
    setSaveState("idle");
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    setTemplate((curr) => {
      historyRef.current.push(curr);
      return next;
    });
    setSaveState("idle");
  }, []);

  const save = useCallback(async () => {
    setSaveState("saving");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          pages: template.pages,
          assets: template.assets,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      setErrorMsg(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    }
  }, [template]);

  const openPreview = useCallback(async () => {
    setSaveState("saving");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          pages: template.pages,
          assets: template.assets,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      setErrorMsg(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
      return;
    }
    const url = `/api/generate-pdf?auditId=${encodeURIComponent(audit.id)}&engine=template&templateId=${encodeURIComponent(template.id)}&format=html`;
    window.open(url, "_blank");
  }, [audit.id, template]);

  const getMmPerPx = useCallback((): { x: number; y: number } | null => {
    const el = canvasRef.current;
    if (!el || !currentPage) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: currentPage.width / rect.width,
      y: currentPage.height / rect.height,
    };
  }, [currentPage]);

  const beginMove = useCallback(
    (e: ReactPointerEvent, block: Block) => {
      if (block.locked) return;
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setSelectedBlockId(block.id);
      dragRef.current = {
        kind: "move",
        blockId: block.id,
        startX: e.clientX,
        startY: e.clientY,
        startFrame: block.frame,
        snapshot: template,
        hasMoved: false,
      };
    },
    [template],
  );

  const beginResize = useCallback(
    (e: ReactPointerEvent, block: Block, handle: HandleKey) => {
      if (block.locked) return;
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setSelectedBlockId(block.id);
      dragRef.current = {
        kind: "resize",
        blockId: block.id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startFrame: block.frame,
        snapshot: template,
        hasMoved: false,
      };
    },
    [template],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (drag.kind === "idle") return;
      const mmPerPx = getMmPerPx();
      if (!mmPerPx) return;
      const dxMm = (e.clientX - drag.startX) * mmPerPx.x;
      const dyMm = (e.clientY - drag.startY) * mmPerPx.y;
      const start = drag.startFrame;

      if (drag.kind === "move") {
        drag.hasMoved = true;
        setBlockFrame(
          drag.blockId,
          { ...start, x: start.x + dxMm, y: start.y + dyMm },
          { skipHistory: true },
        );
        return;
      }

      let { x, y, w, h } = start;
      const edges = edgesForHandle(drag.handle);
      if (edges.left) {
        x = start.x + dxMm;
        w = start.w - dxMm;
      }
      if (edges.right) {
        w = start.w + dxMm;
      }
      if (edges.top) {
        y = start.y + dyMm;
        h = start.h - dyMm;
      }
      if (edges.bottom) {
        h = start.h + dyMm;
      }
      if (w < MIN_FRAME_MM) {
        if (edges.left) x -= MIN_FRAME_MM - w;
        w = MIN_FRAME_MM;
      }
      if (h < MIN_FRAME_MM) {
        if (edges.top) y -= MIN_FRAME_MM - h;
        h = MIN_FRAME_MM;
      }
      drag.hasMoved = true;
      setBlockFrame(
        drag.blockId,
        { ...start, x, y, w, h },
        { skipHistory: true },
      );
    },
    [getMmPerPx, setBlockFrame],
  );

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = { kind: "idle" };
    if (drag.kind !== "idle" && drag.hasMoved) {
      historyRef.current.push(drag.snapshot);
      if (historyRef.current.length > HISTORY_MAX) historyRef.current.shift();
      futureRef.current = [];
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === "Escape") {
        setSelectedBlockId(null);
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
        return;
      }
      if (mod && e.key.toLowerCase() === "d" && selectedBlockId) {
        e.preventDefault();
        duplicateBlock(selectedBlockId);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBlockId) {
        e.preventDefault();
        deleteBlock(selectedBlockId);
        return;
      }
      if (selectedBlock && !selectedBlock.locked) {
        const step = e.shiftKey ? 5 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === "ArrowLeft") dx = -step;
        else if (e.key === "ArrowRight") dx = step;
        else if (e.key === "ArrowUp") dy = -step;
        else if (e.key === "ArrowDown") dy = step;
        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          setBlockFrame(selectedBlock.id, {
            ...selectedBlock.frame,
            x: selectedBlock.frame.x + dx,
            y: selectedBlock.frame.y + dy,
          });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedBlockId, selectedBlock, undo, redo, save, duplicateBlock, deleteBlock, setBlockFrame]);

  if (!currentPage) {
    return <div style={{ padding: 40 }}>Template hat keine Seiten</div>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "48px 1fr",
        gridTemplateColumns: "200px 1fr 320px",
        gridTemplateAreas: '"topbar topbar topbar" "pages canvas inspector"',
        width: "100vw",
        height: "100vh",
        background: "#0e0e0e",
        color: "#e5e5e5",
        fontFamily: "'Inter', 'Poppins', Arial, sans-serif",
        fontSize: 13,
      }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <TopBar
        templateName={template.name}
        onRename={(name) => updateTemplate((t) => ({ ...t, name }))}
        onSave={save}
        onPreview={openPreview}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyRef.current.length > 0}
        canRedo={futureRef.current.length > 0}
        saveState={saveState}
        errorMsg={errorMsg}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      <PagesSidebar
        pages={template.pages}
        currentIndex={pageIndex}
        onSelect={setPageIndex}
      />

      <CanvasArea
        page={currentPage}
        audit={audit}
        template={template}
        zoom={zoom}
        canvasRef={canvasRef}
        selectedBlockId={selectedBlockId}
        onSelect={setSelectedBlockId}
        onBeginMove={beginMove}
        onBeginResize={beginResize}
      />

      <Inspector
        block={selectedBlock}
        assets={withAssetDefaults(template.assets)}
        onUpdateBlock={(updater) =>
          selectedBlock ? updateBlock(selectedBlock.id, updater) : undefined
        }
        onUpdateAssets={updateAssets}
        onDelete={() => selectedBlock && deleteBlock(selectedBlock.id)}
        onDuplicate={() => selectedBlock && duplicateBlock(selectedBlock.id)}
        onDecomposePage={decomposePage}
        onAddImageFromFile={addImageFromFile}
        onAddBlock={addBlock}
      />
    </div>
  );
}

function edgesForHandle(h: HandleKey): {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
} {
  return {
    top: h === "nw" || h === "n" || h === "ne",
    right: h === "ne" || h === "e" || h === "se",
    bottom: h === "sw" || h === "s" || h === "se",
    left: h === "nw" || h === "w" || h === "sw",
  };
}

type TopBarProps = {
  templateName: string;
  onRename: (name: string) => void;
  onSave: () => void;
  onPreview: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  errorMsg: string | null;
  zoom: number;
  onZoomChange: (z: number) => void;
};

function TopBar({
  templateName,
  onRename,
  onSave,
  onPreview,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  saveState,
  errorMsg,
  zoom,
  onZoomChange,
}: TopBarProps) {
  const saveLabel =
    saveState === "saving"
      ? "Speichern..."
      : saveState === "saved"
        ? "Gespeichert"
        : saveState === "error"
          ? "Fehler"
          : "Speichern";
  return (
    <div
      style={{
        gridArea: "topbar",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 16px",
        borderBottom: "1px solid #222",
        background: "#141414",
      }}
    >
      <Link
        href="/editor"
        style={{
          color: "#38E1E1",
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Templates
      </Link>
      <span style={{ color: "#444" }}>/</span>
      <input
        value={templateName}
        onChange={(e) => onRename(e.target.value)}
        style={{
          background: "transparent",
          border: "1px solid transparent",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          padding: "4px 8px",
          borderRadius: 4,
          outline: "none",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#333")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
      />
      <div style={{ flex: 1 }} />
      <button onClick={onUndo} disabled={!canUndo} style={topBarBtn(canUndo)}>
        Undo
      </button>
      <button onClick={onRedo} disabled={!canRedo} style={topBarBtn(canRedo)}>
        Redo
      </button>
      <ZoomControl zoom={zoom} onChange={onZoomChange} />
      <button onClick={onPreview} style={topBarBtn(true)}>
        Preview PDF
      </button>
      <button
        onClick={onSave}
        style={{
          ...topBarBtn(true),
          background: saveState === "error" ? "#3a1414" : "#1a3838",
          borderColor: saveState === "error" ? "#e14a4a" : "#38E1E1",
          color: saveState === "error" ? "#ff8a8a" : "#38E1E1",
        }}
        title={errorMsg ?? undefined}
      >
        {saveLabel}
      </button>
    </div>
  );
}

function topBarBtn(enabled: boolean): CSSProperties {
  return {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: enabled ? "#d4d4d4" : "#555",
    padding: "6px 12px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "inherit",
  };
}

function ZoomControl({
  zoom,
  onChange,
}: {
  zoom: number;
  onChange: (z: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button onClick={() => onChange(Math.max(0.25, zoom - 0.1))} style={topBarBtn(true)}>
        -
      </button>
      <span style={{ minWidth: 48, textAlign: "center", fontSize: 12 }}>
        {Math.round(zoom * 100)}%
      </span>
      <button onClick={() => onChange(Math.min(3, zoom + 0.1))} style={topBarBtn(true)}>
        +
      </button>
    </div>
  );
}

function PagesSidebar({
  pages,
  currentIndex,
  onSelect,
}: {
  pages: TemplatePage[];
  currentIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      style={{
        gridArea: "pages",
        background: "#141414",
        borderRight: "1px solid #222",
        padding: 12,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "#666",
          marginBottom: 8,
        }}
      >
        Seiten
      </div>
      {pages.map((page, i) => (
        <button
          key={page.id}
          data-page-index={i}
          onClick={() => onSelect(i)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            background: i === currentIndex ? "#1f2f2f" : "#1a1a1a",
            border: `1px solid ${i === currentIndex ? "#38E1E1" : "#2a2a2a"}`,
            color: i === currentIndex ? "#38E1E1" : "#d4d4d4",
            padding: "8px 10px",
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "inherit",
            cursor: "pointer",
            marginBottom: 6,
          }}
        >
          {i + 1}. {page.name}
        </button>
      ))}
    </div>
  );
}

type CanvasAreaProps = {
  page: TemplatePage;
  template: Template;
  audit: AuditData;
  zoom: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  selectedBlockId: string | null;
  onSelect: (id: string | null) => void;
  onBeginMove: (e: ReactPointerEvent, block: Block) => void;
  onBeginResize: (e: ReactPointerEvent, block: Block, handle: HandleKey) => void;
};

function CanvasArea({
  page,
  template,
  audit,
  zoom,
  canvasRef,
  selectedBlockId,
  onSelect,
  onBeginMove,
  onBeginResize,
}: CanvasAreaProps) {
  const singlePageTemplate: Template = useMemo(
    () => ({ ...template, pages: [page] }),
    [template, page],
  );

  return (
    <div
      style={{
        gridArea: "canvas",
        overflow: "auto",
        background: "#0e0e0e",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 40,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          ref={canvasRef}
          style={{
            position: "relative",
            width: `${page.width}mm`,
            height: `${page.height}mm`,
            background: page.background,
            overflow: "hidden",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelect(null);
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <TemplateRenderer template={singlePageTemplate} audit={audit} />
          </div>

          {[...page.blocks]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((block) => (
              <BlockOverlay
                key={block.id}
                block={block}
                selected={block.id === selectedBlockId}
                onSelect={() => onSelect(block.id)}
                onBeginMove={(e) => onBeginMove(e, block)}
                onBeginResize={(e, h) => onBeginResize(e, block, h)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function BlockOverlay({
  block,
  selected,
  onSelect,
  onBeginMove,
  onBeginResize,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onBeginMove: (e: ReactPointerEvent) => void;
  onBeginResize: (e: ReactPointerEvent, h: HandleKey) => void;
}) {
  const base: CSSProperties = {
    position: "absolute",
    left: `${block.frame.x}mm`,
    top: `${block.frame.y}mm`,
    width: `${block.frame.w}mm`,
    height: `${block.frame.h}mm`,
    zIndex: selected ? 10_000 : 100 + block.zIndex,
    boxSizing: "border-box",
    border: selected ? "1.5px solid #38E1E1" : "1px dashed rgba(255,255,255,0.08)",
    background: "transparent",
    cursor: block.locked ? "not-allowed" : "move",
  };
  return (
    <div
      style={base}
      onPointerDown={(e) => {
        onSelect();
        onBeginMove(e);
      }}
      onClick={(e) => e.stopPropagation()}
      title={block.id}
      data-overlay-block-id={block.id}
      data-overlay-block-type={block.type}
    >
      {selected && !block.locked && <ResizeHandles onBegin={onBeginResize} />}
    </div>
  );
}

const HANDLES: { key: HandleKey; style: CSSProperties }[] = [
  { key: "nw", style: { top: -4, left: -4, cursor: "nwse-resize" } },
  { key: "n", style: { top: -4, left: "50%", marginLeft: -4, cursor: "ns-resize" } },
  { key: "ne", style: { top: -4, right: -4, cursor: "nesw-resize" } },
  { key: "e", style: { top: "50%", right: -4, marginTop: -4, cursor: "ew-resize" } },
  { key: "se", style: { bottom: -4, right: -4, cursor: "nwse-resize" } },
  { key: "s", style: { bottom: -4, left: "50%", marginLeft: -4, cursor: "ns-resize" } },
  { key: "sw", style: { bottom: -4, left: -4, cursor: "nesw-resize" } },
  { key: "w", style: { top: "50%", left: -4, marginTop: -4, cursor: "ew-resize" } },
];

function ResizeHandles({
  onBegin,
}: {
  onBegin: (e: ReactPointerEvent, h: HandleKey) => void;
}) {
  return (
    <>
      {HANDLES.map(({ key, style }) => (
        <div
          key={key}
          onPointerDown={(e) => onBegin(e, key)}
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            background: "#38E1E1",
            border: "1px solid #0e0e0e",
            ...style,
          }}
        />
      ))}
    </>
  );
}

function Inspector({
  block,
  assets,
  onUpdateBlock,
  onUpdateAssets,
  onDelete,
  onDuplicate,
  onDecomposePage,
  onAddImageFromFile,
  onAddBlock,
}: {
  block: Block | null;
  assets: TemplateAssets;
  onUpdateBlock: (updater: (b: Block) => Block) => void;
  onUpdateAssets: (updater: (a: TemplateAssets) => TemplateAssets) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDecomposePage: () => void;
  onAddImageFromFile: (file: File) => void;
  onAddBlock: (block: Block) => void;
}) {
  const addImageRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"block" | "brand">("block");
  return (
    <div
      style={{
        gridArea: "inspector",
        background: "#141414",
        borderLeft: "1px solid #222",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #222",
          background: "#0e0e0e",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <InspectorTab
          active={tab === "block"}
          onClick={() => setTab("block")}
          label="Block"
        />
        <InspectorTab
          active={tab === "brand"}
          onClick={() => setTab("brand")}
          label="Brand Kit"
        />
      </div>
      <div style={{ padding: 16 }}>
      {tab === "brand" && (
        <BrandKitPanel assets={assets} onUpdate={onUpdateAssets} />
      )}
      {tab === "block" && !block && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: "#666", fontSize: 12 }}>
            Wähle einen Block im Canvas oder füge ein neues Element hinzu.
          </div>
          <Section title="Element hinzufügen">
            <button
              type="button"
              onClick={() => addImageRef.current?.click()}
              style={{ ...topBarBtn(true), width: "100%", textAlign: "center" }}
            >
              Bild hochladen
            </button>
            <input
              ref={addImageRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAddImageFromFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => {
                const id = `txt-${Date.now().toString(36)}`;
                onAddBlock({
                  id,
                  type: "text",
                  zIndex: 10,
                  frame: { x: 40, y: 60, w: 80, h: 10 },
                  binding: { kind: "static" },
                  staticText: "Neuer Text",
                  style: {
                    fontFamily: "Poppins",
                    fontSize: 10,
                    fontWeight: 400,
                    color: "#ffffff",
                    lineHeight: 1.4,
                    textAlign: "left",
                  },
                } as Block);
              }}
              style={{ ...topBarBtn(true), width: "100%", textAlign: "center" }}
            >
              Text hinzufügen
            </button>
            <button
              type="button"
              onClick={() => {
                const id = `shp-${Date.now().toString(36)}`;
                onAddBlock({
                  id,
                  type: "shape",
                  zIndex: 2,
                  frame: { x: 40, y: 60, w: 40, h: 20 },
                  shape: "rect",
                  fill: "#2a2a2a",
                } as Block);
              }}
              style={{ ...topBarBtn(true), width: "100%", textAlign: "center" }}
            >
              Form hinzufügen
            </button>
          </Section>
        </div>
      )}
      {tab === "block" && block && block.type === "legacyPage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 11, color: "#888" }}>
            Legacy-Seite · <code style={{ color: "#38E1E1" }}>{block.pageKey}</code>
          </div>
          <div
            style={{
              padding: 12,
              background: "#1a2a2a",
              border: "1px solid #2a4a4a",
              borderRadius: 6,
              fontSize: 12,
              color: "#c2c2c2",
              lineHeight: 1.6,
            }}
          >
            Diese Seite wird als Ganzes gerendert (1:1 identisch mit dem SEO-Audit PDF).
            Du kannst Bilder, Texte oder Shapes über die Seite legen — wechsle dazu rechts oben auf den Tab "Hinzufügen".

            Erst dekomponieren wenn du die einzelnen Original-Elemente verschieben willst. Achtung: das Layout weicht dann leicht vom Original ab.
          </div>
          <button
            onClick={onDecomposePage}
            style={{
              background: "#1a3838",
              border: "1.5px solid #38E1E1",
              color: "#38E1E1",
              padding: "12px 16px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Seite in Elemente aufteilen
          </button>
          <div style={{ fontSize: 10, color: "#666", lineHeight: 1.5 }}>
            Nach dem Aufteilen kannst du jedes Element einzeln verschieben, skalieren und stylen.
            Du kannst mit Undo (Cmd+Z) wieder zur Legacy-Ansicht zurückkehren.
          </div>
        </div>
      )}
      {tab === "block" && block && block.type !== "legacyPage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 11, color: "#888" }}>
            {block.type} · <code style={{ color: "#38E1E1" }}>{block.id}</code>
          </div>

          <Section title="Position & Größe (mm)">
            <FrameEditor
              frame={block.frame}
              onChange={(frame) => onUpdateBlock((b) => ({ ...b, frame }))}
            />
          </Section>

          <Section title="Layer">
            <LabeledInput
              label="z-Index"
              value={block.zIndex}
              onChange={(n) => onUpdateBlock((b) => ({ ...b, zIndex: n }))}
              integer
            />
          </Section>

          {block.type === "text" && (
            <>
              <Section title="Text">
                <StaticTextEditor
                  block={block}
                  onChange={(patch) =>
                    onUpdateBlock((b) =>
                      b.type === "text" ? { ...b, ...patch } : b,
                    )
                  }
                />
              </Section>
              <Section title="Typografie">
                <TextStyleEditor
                  style={block.style}
                  onChange={(style) =>
                    onUpdateBlock((b) =>
                      b.type === "text" ? { ...b, style } : b,
                    )
                  }
                />
              </Section>
            </>
          )}

          {(block.type === "text" ||
            block.type === "image" ||
            block.type === "scoreCircle" ||
            block.type === "topRiskList" ||
            block.type === "recommendationList" ||
            block.type === "checkList" ||
            block.type === "table") && (
            <Section title="Binding">
              <BindingEditor
                block={block}
                onChange={(binding) =>
                  onUpdateBlock((b) => {
                    if (
                      b.type === "text" ||
                      b.type === "image" ||
                      b.type === "scoreCircle" ||
                      b.type === "topRiskList" ||
                      b.type === "recommendationList" ||
                      b.type === "checkList" ||
                      b.type === "table"
                    ) {
                      return { ...b, binding };
                    }
                    return b;
                  })
                }
              />
            </Section>
          )}

          {block.type === "image" && (
            <Section title="Bild">
              <ImageEditor
                block={block}
                onChange={(patch) =>
                  onUpdateBlock((b) =>
                    b.type === "image" ? { ...b, ...patch } : b,
                  )
                }
              />
            </Section>
          )}

          {(block.type === "topRiskList" ||
            block.type === "recommendationList" ||
            block.type === "checkList") && (
            <ListSubElementEditor
              block={block}
              onUpdateBlock={onUpdateBlock}
            />
          )}

          {block.type === "table" && (
            <Section title="Tabelle">
              <TableEditor
                block={block}
                onChange={(patch) =>
                  onUpdateBlock((b) =>
                    b.type === "table" ? { ...b, ...patch } : b,
                  )
                }
              />
            </Section>
          )}

          {block.type === "shape" && (
            <Section title="Shape">
              <ShapeEditor
                block={block}
                onChange={(patch) =>
                  onUpdateBlock((b) =>
                    b.type === "shape" ? { ...b, ...patch } : b,
                  )
                }
              />
            </Section>
          )}

          {block.type === "scoreCircle" && (
            <Section title="Score-Kreis">
              <ScoreCircleEditor
                block={block}
                onChange={(patch) =>
                  onUpdateBlock((b) =>
                    b.type === "scoreCircle" ? { ...b, ...patch } : b,
                  )
                }
              />
            </Section>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={onDuplicate} style={topBarBtn(true)}>
              Duplizieren
            </button>
            <button
              onClick={onDelete}
              style={{
                ...topBarBtn(true),
                color: "#ff8a8a",
                borderColor: "#5a2020",
              }}
            >
              Löschen
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function InspectorTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "12px 0",
        background: active ? "#141414" : "transparent",
        border: "none",
        borderBottom: active ? "2px solid #38E1E1" : "2px solid transparent",
        color: active ? "#38E1E1" : "#888",
        fontSize: 11,
        fontFamily: "inherit",
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}

function BrandKitPanel({
  assets,
  onUpdate,
}: {
  assets: TemplateAssets;
  onUpdate: (updater: (a: TemplateAssets) => TemplateAssets) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 11, color: "#c2c2c2", lineHeight: 1.4 }}>
        Brand Kit gilt für das ganze Template. Änderungen hier wirken sich auf
        alle Seiten aus.
      </div>

      <Section title="Logo & Signet">
        <BrandImageSlot
          label="Logo"
          src={assets.logo}
          onChange={(src) => onUpdate((a) => ({ ...a, logo: src }))}
        />
        <BrandImageSlot
          label="Signet"
          src={assets.signet}
          onChange={(src) => onUpdate((a) => ({ ...a, signet: src }))}
        />
      </Section>

      <Section title="Noten-Farben">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
          }}
        >
          {GRADE_ORDER.map((g) => (
            <GradeSlotEditor
              key={g}
              grade={g}
              slot={assets.grades[g]}
              onChange={(next) =>
                onUpdate((a) => ({
                  ...a,
                  grades: { ...a.grades, [g]: next },
                }))
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Prioritäts-Badges">
        {(["hoch", "mittel", "niedrig"] as const).map((key) => (
          <PriorityAssetEditor
            key={key}
            slotKey={key}
            slot={assets.priorities[key]}
            onChange={(next) =>
              onUpdate((a) => ({
                ...a,
                priorities: { ...a.priorities, [key]: next },
              }))
            }
          />
        ))}
      </Section>

      <Section title="Check-Status">
        {(["ok", "warning", "fail", "info"] as const).map((key) => (
          <StatusAssetEditor
            key={key}
            slotKey={key}
            slot={assets.statuses[key]}
            onChange={(next) =>
              onUpdate((a) => ({
                ...a,
                statuses: { ...a.statuses, [key]: next },
              }))
            }
          />
        ))}
      </Section>
    </div>
  );
}

function PriorityAssetEditor({
  slotKey,
  slot,
  onChange,
}: {
  slotKey: string;
  slot: TemplateAssets["priorities"]["hoch"];
  onChange: (next: TemplateAssets["priorities"]["hoch"]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange({ ...slot, imageSrc: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 6,
        background: "#1a1a1a",
        border: "1px solid #222",
        borderRadius: 4,
      }}
    >
      <div style={{ fontSize: 10, color: "#888" }}>{slotKey}</div>
      {slot.imageSrc ? (
        <div
          style={{
            height: 40,
            background: "#0e0e0e",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slot.imageSrc}
            alt={slotKey}
            style={{ maxHeight: 36, maxWidth: "100%" }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="color"
            value={slot.color}
            onChange={(e) => onChange({ ...slot, color: e.target.value })}
            style={{
              width: 32,
              height: 28,
              border: "1px solid #2a2a2a",
              background: "#1a1a1a",
              borderRadius: 3,
              padding: 0,
              flex: "0 0 32px",
            }}
          />
          <input
            type="text"
            value={slot.label}
            onChange={(e) => onChange({ ...slot, label: e.target.value })}
            placeholder="Label"
            style={inputStyle}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ ...topBarBtn(true), fontSize: 10, flex: 1 }}
        >
          {slot.imageSrc ? "Bild tauschen" : "Bild hoch"}
        </button>
        {slot.imageSrc && (
          <button
            type="button"
            onClick={() =>
              onChange({ label: slot.label, color: slot.color })
            }
            style={{
              ...topBarBtn(true),
              fontSize: 10,
              color: "#ff8a8a",
              borderColor: "#5a2020",
            }}
          >
            x
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function StatusAssetEditor({
  slotKey,
  slot,
  onChange,
}: {
  slotKey: string;
  slot: TemplateAssets["statuses"]["ok"];
  onChange: (next: TemplateAssets["statuses"]["ok"]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange({ ...slot, imageSrc: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 6,
        background: "#1a1a1a",
        border: "1px solid #222",
        borderRadius: 4,
      }}
    >
      <div style={{ fontSize: 10, color: "#888" }}>{slotKey}</div>
      {slot.imageSrc ? (
        <div
          style={{
            height: 40,
            background: "#0e0e0e",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slot.imageSrc}
            alt={slotKey}
            style={{ maxHeight: 36, maxWidth: "100%" }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="color"
            value={slot.color}
            onChange={(e) => onChange({ ...slot, color: e.target.value })}
            style={{
              width: 32,
              height: 28,
              border: "1px solid #2a2a2a",
              background: "#1a1a1a",
              borderRadius: 3,
              padding: 0,
              flex: "0 0 32px",
            }}
          />
          <input
            type="text"
            value={slot.symbol}
            onChange={(e) => onChange({ ...slot, symbol: e.target.value })}
            placeholder="Symbol"
            maxLength={4}
            style={{ ...inputStyle, width: 60, flex: "0 0 60px" }}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ ...topBarBtn(true), fontSize: 10, flex: 1 }}
        >
          {slot.imageSrc ? "Bild tauschen" : "Bild hoch"}
        </button>
        {slot.imageSrc && (
          <button
            type="button"
            onClick={() =>
              onChange({ symbol: slot.symbol, color: slot.color })
            }
            style={{
              ...topBarBtn(true),
              fontSize: 10,
              color: "#ff8a8a",
              borderColor: "#5a2020",
            }}
          >
            x
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function BrandImageSlot({
  label,
  src,
  onChange,
}: {
  label: string;
  src: string | undefined;
  onChange: (src: string | undefined) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: 8,
        background: "#1a1a1a",
        border: "1px solid #222",
        borderRadius: 4,
      }}
    >
      <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
      <div
        style={{
          height: 48,
          background: "#0e0e0e",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={label}
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        ) : (
          <span style={{ color: "#555", fontSize: 10 }}>(default)</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ ...topBarBtn(true), flex: 1, fontSize: 10 }}
        >
          {src ? "Tauschen" : "Hochladen"}
        </button>
        {src && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            style={{
              ...topBarBtn(true),
              fontSize: 10,
              color: "#ff8a8a",
              borderColor: "#5a2020",
            }}
          >
            x
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function GradeSlotEditor({
  grade,
  slot,
  onChange,
}: {
  grade: Grade;
  slot: TemplateAssets["grades"][Grade];
  onChange: (next: TemplateAssets["grades"][Grade]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        onChange({ ...slot, imageSrc: result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 6,
        background: "#1a1a1a",
        border: "1px solid #222",
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#888",
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        {grade}
      </div>
      {slot.imageSrc ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 40,
            background: "#0e0e0e",
            borderRadius: 3,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slot.imageSrc}
            alt={grade}
            style={{ maxWidth: "100%", maxHeight: 40 }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 4 }}>
          <input
            type="color"
            value={slot.color}
            onChange={(e) => onChange({ ...slot, color: e.target.value })}
            style={{
              width: 28,
              height: 28,
              border: "1px solid #2a2a2a",
              background: "#1a1a1a",
              borderRadius: 3,
              padding: 0,
              flex: "0 0 28px",
            }}
          />
          <input
            type="text"
            value={slot.color}
            onChange={(e) => onChange({ ...slot, color: e.target.value })}
            style={{ ...inputStyle, padding: "3px 5px", fontSize: 10 }}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            ...topBarBtn(true),
            padding: "4px 6px",
            fontSize: 10,
            flex: 1,
          }}
        >
          {slot.imageSrc ? "Bild tauschen" : "Bild hoch"}
        </button>
        {slot.imageSrc && (
          <button
            type="button"
            onClick={() => onChange({ color: slot.color })}
            style={{
              ...topBarBtn(true),
              padding: "4px 6px",
              fontSize: 10,
              color: "#ff8a8a",
              borderColor: "#5a2020",
            }}
          >
            x
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "#888",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function FrameEditor({
  frame,
  onChange,
}: {
  frame: Frame;
  onChange: (f: Frame) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      <LabeledInput label="X" value={frame.x} onChange={(x) => onChange({ ...frame, x })} />
      <LabeledInput label="Y" value={frame.y} onChange={(y) => onChange({ ...frame, y })} />
      <LabeledInput label="W" value={frame.w} onChange={(w) => onChange({ ...frame, w })} />
      <LabeledInput label="H" value={frame.h} onChange={(h) => onChange({ ...frame, h })} />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  integer,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  integer?: boolean;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, color: "#888" }}>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        step={integer ? 1 : 0.5}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isNaN(v)) return;
          onChange(integer ? Math.round(v) : v);
        }}
        style={inputStyle}
      />
    </label>
  );
}

const inputStyle: CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  color: "#fff",
  padding: "5px 8px",
  borderRadius: 3,
  fontSize: 12,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

function StaticTextEditor({
  block,
  onChange,
}: {
  block: TextBlock;
  onChange: (patch: Partial<TextBlock>) => void;
}) {
  const isStatic = block.binding.kind === "static";
  return (
    <textarea
      value={block.staticText ?? ""}
      onChange={(e) => onChange({ staticText: e.target.value })}
      disabled={!isStatic}
      placeholder={isStatic ? "Statischer Text..." : "Wird durch Binding befüllt"}
      rows={3}
      style={{
        ...inputStyle,
        resize: "vertical",
        fontFamily: "inherit",
        opacity: isStatic ? 1 : 0.5,
      }}
    />
  );
}

function TextStyleEditor({
  style,
  onChange,
}: {
  style: TextStyle;
  onChange: (s: TextStyle) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10, color: "#888" }}>Font</span>
        <select
          value={style.fontFamily}
          onChange={(e) => onChange({ ...style, fontFamily: e.target.value })}
          style={inputStyle}
        >
          <option value="Poppins">Poppins</option>
          <option value="Open Sans">Open Sans</option>
        </select>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <LabeledInput
          label="Size (pt)"
          value={style.fontSize}
          onChange={(n) => onChange({ ...style, fontSize: n })}
        />
        <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 10, color: "#888" }}>Weight</span>
          <select
            value={style.fontWeight}
            onChange={(e) =>
              onChange({ ...style, fontWeight: Number(e.target.value) as TextStyle["fontWeight"] })
            }
            style={inputStyle}
          >
            {[300, 400, 500, 600, 700, 800, 900].map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10, color: "#888" }}>Farbe</span>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="color"
            value={style.color}
            onChange={(e) => onChange({ ...style, color: e.target.value })}
            style={{
              width: 36,
              height: 28,
              border: "1px solid #2a2a2a",
              background: "#1a1a1a",
              borderRadius: 3,
              padding: 0,
            }}
          />
          <input
            type="text"
            value={style.color}
            onChange={(e) => onChange({ ...style, color: e.target.value })}
            style={inputStyle}
          />
        </div>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <LabeledInput
          label="Line Height"
          value={style.lineHeight}
          onChange={(n) => onChange({ ...style, lineHeight: n })}
        />
        <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 10, color: "#888" }}>Align</span>
          <select
            value={style.textAlign}
            onChange={(e) =>
              onChange({ ...style, textAlign: e.target.value as TextStyle["textAlign"] })
            }
            style={inputStyle}
          >
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
            <option value="justify">justify</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function BindingEditor({
  block,
  onChange,
}: {
  block: Block;
  onChange: (binding: Binding) => void;
}) {
  const isList =
    block.type === "topRiskList" ||
    block.type === "recommendationList" ||
    block.type === "checkList" ||
    block.type === "table";
  if (
    block.type !== "text" &&
    block.type !== "image" &&
    block.type !== "scoreCircle" &&
    !isList
  ) {
    return null;
  }
  const allowedTypes: BindingValueType[] =
    block.type === "text"
      ? ["string", "number", "grade"]
      : block.type === "scoreCircle"
        ? ["grade"]
        : block.type === "image"
          ? ["image"]
          : ["array"];
  const catalog = bindingsForValueTypes(allowedTypes);

  const current = block.binding;
  const currentPath = current.kind === "audit" ? current.path : "__static";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <select
        value={currentPath}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__static") {
            onChange({ kind: "static" });
          } else {
            onChange({ kind: "audit", path: v });
          }
        }}
        style={inputStyle}
      >
        {(block.type === "text" ||
          block.type === "image" ||
          block.type === "scoreCircle") && (
          <option value="__static">(statisch)</option>
        )}
        {catalog.map((b) => (
          <option key={b.path} value={b.path}>
            {b.label}
          </option>
        ))}
      </select>
      <div style={{ fontSize: 10, color: "#666" }}>
        {BINDING_CATALOG.find((b) => b.path === currentPath)?.label ?? "Statischer Wert"}
      </div>
    </div>
  );
}

function ShapeEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "shape" }>;
  onChange: (patch: Partial<Extract<Block, { type: "shape" }>>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10, color: "#888" }}>Form</span>
        <select
          value={block.shape}
          onChange={(e) =>
            onChange({ shape: e.target.value as "rect" | "ellipse" | "line" })
          }
          style={inputStyle}
        >
          <option value="rect">Rechteck</option>
          <option value="ellipse">Ellipse</option>
          <option value="line">Linie</option>
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10, color: "#888" }}>Fill</span>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="color"
            value={block.fill ?? "#000000"}
            onChange={(e) => onChange({ fill: e.target.value })}
            style={{
              width: 36,
              height: 28,
              border: "1px solid #2a2a2a",
              background: "#1a1a1a",
              borderRadius: 3,
              padding: 0,
            }}
          />
          <input
            type="text"
            value={block.fill ?? ""}
            onChange={(e) => onChange({ fill: e.target.value })}
            placeholder="#hex"
            style={inputStyle}
          />
        </div>
      </label>
    </div>
  );
}

function ScoreCircleEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "scoreCircle" }>;
  onChange: (patch: Partial<Extract<Block, { type: "scoreCircle" }>>) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      <LabeledInput
        label="Size (mm)"
        value={block.size}
        onChange={(n) => onChange({ size: n })}
      />
      <LabeledInput
        label="Stroke (mm)"
        value={block.strokeWidth}
        onChange={(n) => onChange({ strokeWidth: n })}
      />
    </div>
  );
}

function ImageEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "image" }>;
  onChange: (patch: Partial<Extract<Block, { type: "image" }>>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isStatic = block.binding.kind === "static";
  const hasSrc = !!block.staticSrc;

  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange({ staticSrc: reader.result, binding: { kind: "static" } });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {isStatic && hasSrc && (
        <div
          style={{
            height: 80,
            background: "#0e0e0e",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            border: "1px solid #222",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.staticSrc}
            alt="Vorschau"
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ ...topBarBtn(true), flex: 1, fontSize: 11 }}
        >
          {hasSrc ? "Bild tauschen" : "Bild hochladen"}
        </button>
        {isStatic && hasSrc && (
          <button
            type="button"
            onClick={() => onChange({ staticSrc: undefined })}
            style={{
              ...topBarBtn(true),
              fontSize: 11,
              color: "#ff8a8a",
              borderColor: "#5a2020",
            }}
          >
            Entfernen
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 10, color: "#888" }}>Object Fit</span>
          <select
            value={block.objectFit}
            onChange={(e) =>
              onChange({ objectFit: e.target.value as "cover" | "contain" })
            }
            style={inputStyle}
          >
            <option value="cover">cover</option>
            <option value="contain">contain</option>
          </select>
        </label>
        <LabeledInput
          label="Radius (mm)"
          value={block.borderRadius ?? 0}
          onChange={(n) => onChange({ borderRadius: n > 0 ? n : undefined })}
        />
      </div>
    </div>
  );
}

type ListKind = "topRiskList" | "recommendationList" | "checkList";
type EditableListBlock = Extract<Block, { type: ListKind }>;

function ListSubElementEditor({
  block,
  onUpdateBlock,
}: {
  block: EditableListBlock;
  onUpdateBlock: (updater: (b: Block) => Block) => void;
}) {
  const [subTab, setSubTab] = useState<"layout" | "title" | "body" | "badge">(
    "layout",
  );
  const hasBadge =
    block.type === "recommendationList" || block.type === "checkList";

  const updateList = (patch: Partial<EditableListBlock>) =>
    onUpdateBlock((b) => {
      if (
        b.type === "topRiskList" ||
        b.type === "recommendationList" ||
        b.type === "checkList"
      ) {
        return { ...b, ...patch } as Block;
      }
      return b;
    });
  const updateTitleStyle = (style: TextStyle) =>
    onUpdateBlock((b) => {
      if (
        b.type === "topRiskList" ||
        b.type === "recommendationList" ||
        b.type === "checkList"
      ) {
        return { ...b, itemStyle: { ...b.itemStyle, titleStyle: style } };
      }
      return b;
    });
  const updateBodyStyle = (style: TextStyle) =>
    onUpdateBlock((b) => {
      if (
        b.type === "topRiskList" ||
        b.type === "recommendationList" ||
        b.type === "checkList"
      ) {
        return { ...b, itemStyle: { ...b.itemStyle, bodyStyle: style } };
      }
      return b;
    });

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: "#0e0e0e",
          borderRadius: 4,
          marginBottom: 8,
        }}
      >
        <SubTab
          active={subTab === "layout"}
          onClick={() => setSubTab("layout")}
          label="Layout"
        />
        <SubTab
          active={subTab === "title"}
          onClick={() => setSubTab("title")}
          label="Titel"
        />
        <SubTab
          active={subTab === "body"}
          onClick={() => setSubTab("body")}
          label="Body"
        />
        {hasBadge && (
          <SubTab
            active={subTab === "badge"}
            onClick={() => setSubTab("badge")}
            label="Badge"
          />
        )}
      </div>
      {subTab === "layout" && <ListEditor block={block} onChange={updateList} />}
      {subTab === "title" && (
        <TextStyleEditor
          style={block.itemStyle.titleStyle}
          onChange={updateTitleStyle}
        />
      )}
      {subTab === "body" && (
        <TextStyleEditor
          style={block.itemStyle.bodyStyle}
          onChange={updateBodyStyle}
        />
      )}
      {subTab === "badge" && hasBadge && (
        <div
          style={{
            fontSize: 11,
            color: "#c2c2c2",
            lineHeight: 1.5,
            padding: 8,
            background: "#0e0e0e",
            borderRadius: 4,
            border: "1px solid #222",
          }}
        >
          Badge-Farben, Labels und Bilder werden im{" "}
          <strong style={{ color: "#38E1E1" }}>Brand Kit</strong> Tab für das
          gesamte Template verwaltet. So bleibt das Design konsistent, wenn beim
          nächsten Audit andere Prioritäten auftreten.
        </div>
      )}
    </div>
  );
}

function SubTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "6px 0",
        background: active ? "#1a1a1a" : "transparent",
        border: "1px solid",
        borderColor: active ? "#38E1E1" : "#222",
        color: active ? "#38E1E1" : "#888",
        fontSize: 10,
        fontFamily: "inherit",
        cursor: "pointer",
        borderRadius: 3,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}

function ListEditor({
  block,
  onChange,
}: {
  block: EditableListBlock;
  onChange: (patch: Partial<EditableListBlock>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <LabeledInput
          label="Gap (mm)"
          value={block.itemGap}
          onChange={(n) => onChange({ itemGap: n })}
        />
        <LabeledInput
          label="Max Items"
          value={block.maxItems ?? 0}
          onChange={(n) =>
            onChange({ maxItems: n > 0 ? Math.round(n) : undefined })
          }
          integer
        />
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10, color: "#888" }}>Overflow</span>
        <select
          value={block.overflow}
          onChange={(e) =>
            onChange({
              overflow: e.target.value as "clip" | "shrink" | "page-break",
            })
          }
          style={inputStyle}
        >
          <option value="clip">clip (+N weitere)</option>
          <option value="shrink">shrink (skaliert)</option>
          <option value="page-break">page-break</option>
        </select>
      </label>
      {block.type === "topRiskList" && (
        <label
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}
        >
          <input
            type="checkbox"
            checked={block.numbered !== false}
            onChange={(e) => onChange({ numbered: e.target.checked })}
          />
          <span style={{ color: "#c2c2c2" }}>Nummeriert</span>
        </label>
      )}
    </div>
  );
}

type EditableTableBlock = Extract<Block, { type: "table" }>;

function TableEditor({
  block,
  onChange,
}: {
  block: EditableTableBlock;
  onChange: (patch: Partial<EditableTableBlock>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 10, color: "#888" }}>Spalten</div>
      {block.columns.map((col, idx) => (
        <div
          key={idx}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 36px 24px",
            gap: 4,
          }}
        >
          <input
            value={col.header}
            placeholder="Header"
            onChange={(e) => {
              const next = block.columns.slice();
              next[idx] = { ...col, header: e.target.value };
              onChange({ columns: next });
            }}
            style={inputStyle}
          />
          <input
            value={col.fieldPath}
            placeholder="fieldPath"
            onChange={(e) => {
              const next = block.columns.slice();
              next[idx] = { ...col, fieldPath: e.target.value };
              onChange({ columns: next });
            }}
            style={inputStyle}
          />
          <input
            type="number"
            value={col.width ?? ""}
            placeholder="mm"
            onChange={(e) => {
              const next = block.columns.slice();
              next[idx] = {
                ...col,
                width: e.target.value ? Number(e.target.value) : undefined,
              };
              onChange({ columns: next });
            }}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => {
              const next = block.columns.filter((_, i) => i !== idx);
              onChange({ columns: next });
            }}
            style={{
              ...topBarBtn(true),
              padding: 0,
              color: "#ff8a8a",
              borderColor: "#5a2020",
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            columns: [
              ...block.columns,
              { header: "Neu", fieldPath: "" },
            ],
          })
        }
        style={topBarBtn(true)}
      >
        + Spalte
      </button>
    </div>
  );
}
