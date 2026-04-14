"use client";

import {
  useState,
  useRef,
  type ReactElement,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from "react";

type Props = {
  disabled: boolean;
  onSend: (text: string, images: string[]) => void;
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MessageInput({ disabled, onSend }: Props): ReactElement {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function submit() {
    if (disabled) return;
    if (text.trim().length === 0 && images.length === 0) return;
    onSend(text, images);
    setText("");
    setImages([]);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  async function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith("image/")) {
        const file = it.getAsFile();
        if (file) {
          const url = await fileToDataUrl(file);
          setImages((prev) => [...prev, url]);
        }
      }
    }
  }

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      if (f.type.startsWith("image/")) {
        urls.push(await fileToDataUrl(f));
      }
    }
    if (urls.length) setImages((prev) => [...prev, ...urls]);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div
      style={{
        borderTop: "1px solid #2a2a2a",
        padding: 10,
        background: "#0d0d0d",
      }}
    >
      {images.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                style={{
                  width: 48,
                  height: 48,
                  objectFit: "cover",
                  borderRadius: 4,
                  border: "1px solid #2a2a2a",
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setImages((prev) => prev.filter((_, idx) => idx !== i))
                }
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  fontSize: 10,
                  cursor: "pointer",
                  lineHeight: "16px",
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={disabled ? "Agent arbeitet..." : "Nachricht (Enter senden, Shift+Enter neue Zeile)"}
        rows={3}
        style={{
          width: "100%",
          background: "#1a1a1a",
          color: "#e5e7eb",
          border: "1px solid #2a2a2a",
          borderRadius: 4,
          padding: 8,
          fontSize: 13,
          fontFamily: "inherit",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          style={{
            background: "#1a1a1a",
            color: "#9ca3af",
            border: "1px solid #2a2a2a",
            borderRadius: 4,
            padding: "6px 10px",
            fontSize: 12,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          📎 Bild
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={disabled || (text.trim().length === 0 && images.length === 0)}
          style={{
            marginLeft: "auto",
            background: disabled ? "#2a2a2a" : "#38E1E1",
            color: disabled ? "#6b7280" : "#0d0d0d",
            border: "none",
            borderRadius: 4,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: "bold",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          Senden
        </button>
      </div>
    </div>
  );
}
