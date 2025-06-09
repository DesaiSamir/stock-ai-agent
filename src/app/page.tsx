"use client";

import React from "react";
import { AgentDashboard } from "@/components/features/agent-dashboard/AgentDashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <AgentDashboard />
    </main>
  );
}
