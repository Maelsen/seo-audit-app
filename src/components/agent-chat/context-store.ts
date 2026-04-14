"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ChatContext } from "./types";

let current: ChatContext = { location: "global" };
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): ChatContext {
  return current;
}

const SERVER_SNAPSHOT: ChatContext = { location: "global" };
function getServerSnapshot(): ChatContext {
  return SERVER_SNAPSHOT;
}

export function setAgentContext(ctx: ChatContext) {
  current = ctx;
  for (const l of listeners) l();
}

export function resetAgentContext() {
  setAgentContext({ location: "global" });
}

export function useAgentContext(): ChatContext {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useProvideAgentContext(ctx: ChatContext) {
  const { location, templateId, selectedBlockId, selectedPageId, auditId } = ctx;
  useEffect(() => {
    setAgentContext({ location, templateId, selectedBlockId, selectedPageId, auditId });
    return () => {
      resetAgentContext();
    };
  }, [location, templateId, selectedBlockId, selectedPageId, auditId]);
}
