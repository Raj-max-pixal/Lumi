"use client";

import { useState } from "react";
import AuthPanel, { LumiViewer } from "@/components/AuthPanel";
import ProfileScreen from "@/components/ProfileScreen";
import { useLumiMode } from "@/components/LumiModeContext";

export default function ProfilePage() {
  const { isFocusMode } = useLumiMode();
  const [viewer, setViewer] = useState<LumiViewer | null>(null);

  return (
    <div className="space-y-6">
      <AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} />
      <ProfileScreen viewer={viewer} isFocusMode={isFocusMode} />
    </div>
  );
}
