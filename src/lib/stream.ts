export type StreamEvent =
  | { type: "progress"; label: string; detail?: string }
  | { type: "warn"; label: string; detail?: string }
  | { type: "error"; message: string }
  | { type: "result"; data: unknown };

export type EmitFn = (event: StreamEvent) => void;

export function ndjsonResponse(
  run: (emit: EmitFn) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit: EmitFn = (event) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        await run(emit);
      } catch (err) {
        emit({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
