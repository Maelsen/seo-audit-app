import type Anthropic from "@anthropic-ai/sdk";

export type ChatContext = {
  location?: "editor" | "audit" | "global";
  templateId?: string;
  selectedBlockId?: string;
  selectedPageId?: string;
  auditId?: string;
};

export type AppliedChange = {
  timestamp: string;
  tool: "write_file" | "apply_patch" | "delete_file";
  path: string;
  backupPath: string | null;
  action: "modified" | "created" | "deleted";
};

export type StoredMessage = {
  role: "user" | "assistant";
  content: Anthropic.Messages.ContentBlockParam[];
  timestamp: string;
};

export type ChatSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredMessage[];
  appliedChanges: AppliedChange[];
};
