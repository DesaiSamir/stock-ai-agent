"use client";

import React from "react";
import { Box } from "@mui/material";
import { ChatPanel } from "@/components/features/chat";

export default function ChatPage() {

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <ChatPanel />
    </Box>
  );
};
