"use client";

import { useParams } from "next/navigation";
import HackathonProjectDetails from "@/components/HackathonProjectDetails";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  return <HackathonProjectDetails projectId={params.projectId} />;
}
