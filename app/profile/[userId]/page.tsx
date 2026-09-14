"use client";

import { useEffect, useState } from "react";
import AuthPanel, { LumiViewer } from "@/components/AuthPanel";
import ProfileScreen from "@/components/ProfileScreen";
import { useLumiMode } from "@/components/LumiModeContext";

export default function UserProfilePage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { isFocusMode } = useLumiMode();
  const [viewer, setViewer] = useState<LumiViewer | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((value) => setResolvedUserId(value.userId));
  }, [params]);

  return (
    <div className="space-y-6">
      <AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} />
      <ProfileScreen viewer={viewer} profileUserId={resolvedUserId} isFocusMode={isFocusMode} />
    </div>
  );
}
