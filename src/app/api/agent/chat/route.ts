import { NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { ndjsonResponse } from "@/lib/stream";
import { runChatTurn } from "@/lib/agent/chat-orchestrator";
import type { ChatContext } from "@/lib/agent/chat-types";

export const maxDuration = 300;

type RequestBody = {
  sessionId: string;
  context?: ChatContext;
  content: Anthropic.Messages.ContentBlockParam[];
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<RequestBody>;
  return ndjsonResponse(async (emit) => {
    if (!body.sessionId) throw new Error("sessionId fehlt");
    if (!Array.isArray(body.content) || body.content.length === 0)
      throw new Error("content darf nicht leer sein");
    await runChatTurn(
      {
        sessionId: body.sessionId,
        context: body.context ?? {},
        userContent: body.content,
      },
      emit,
    );
  });
}
