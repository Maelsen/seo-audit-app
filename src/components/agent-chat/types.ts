import type { ChatContext, StoredMessage, AppliedChange } from "@/lib/agent/chat-types";

export type { ChatContext, StoredMessage, AppliedChange };

export type StreamEvent =
  | { type: "progress"; label: string; detail?: string }
  | { type: "warn"; label: string; detail?: string }
  | { type: "error"; message: string }
  | { type: "result"; data: { sessionId: string; iterations: number; appliedChanges: AppliedChange[] } };

export type ToolCallView = {
  id: string;
  name: string;
  input: unknown;
  result?: { content: string; isError: boolean };
};

export type MessageView = {
  role: "user" | "assistant";
  timestamp: string;
  texts: string[];
  toolCalls: ToolCallView[];
  toolResultsFor: Record<string, { content: string; isError: boolean }>;
  images: string[];
};
