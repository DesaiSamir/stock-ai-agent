"use client";

import React from "react";
import { Box } from "@mui/material";
import { AnalysisDashboard } from "@/components/features/analysis/AnalysisDashboard";

export default function AnalysisPage() {

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Box
        sx={{
          flexGrow: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <AnalysisDashboard />
      </Box>
    </Box>
  );
};
