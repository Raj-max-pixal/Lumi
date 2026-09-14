"use client";

import { createContext, ReactNode, useContext } from "react";

type LumiModeContextValue = {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  activeView: LumiView;
  setActiveView: (view: LumiView) => void;
};

export type LumiView = "feed" | "explore" | "clips" | "following" | "chat" | "live" | "ai-lab";

const LumiModeContext = createContext<LumiModeContextValue | null>(null);

export function LumiModeProvider({
  children,
  value
}: {
  children: ReactNode;
  value: LumiModeContextValue;
}) {
  return <LumiModeContext.Provider value={value}>{children}</LumiModeContext.Provider>;
}

export function useLumiMode() {
  const context = useContext(LumiModeContext);

  if (!context) {
    throw new Error("useLumiMode must be used inside LumiModeProvider.");
  }

  return context;
}
