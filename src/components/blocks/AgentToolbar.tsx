"use client";

import React, { useState } from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import {
  TrendingUp,
  Analytics,
  Menu,
  ChevronLeft,
  BarChart,
  Dashboard,
  Chat,
} from "@mui/icons-material";
import type { AgentTabKey } from "@/constants/sidebar";
import { useRouter } from "next/navigation";

interface AgentToolbarProps {
  onSelectAgent?: (agent: AgentTabKey) => void;
  activeAgent?: AgentTabKey;
}

interface ToolbarItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  isExpanded: boolean;
}

const ToolbarItem: React.FC<ToolbarItemProps> = ({
  icon,
  label,
  onClick,
  isActive,
  isExpanded,
}) => (
  <Tooltip title={!isExpanded ? label : ""} placement="right">
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        py: 1,
        px: isExpanded ? 2 : 1,
        width: "100%",
        "&:hover": {
          bgcolor: "action.hover",
        },
        ...(isActive && {
          color: "primary.main",
          bgcolor: "action.selected",
        }),
      }}
    >
      {icon}
      {isExpanded && (
        <Typography
          sx={{
            ml: 2,
            whiteSpace: "nowrap",
            fontSize: "0.875rem",
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  </Tooltip>
);

export const AgentToolbar: React.FC<AgentToolbarProps> = ({
  onSelectAgent,
  activeAgent,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleAgentSelect = (agent: AgentTabKey, path?: string) => {
    onSelectAgent?.(agent);
    if (path) {
      router.push(path);
    }
  };

  return (
    <Box
      sx={{
        width: isExpanded ? 200 : 56,
        transition: "width 0.2s ease-in-out",
        backgroundColor: "background.paper",
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Toggle Button */}
      <ToolbarItem
        icon={isExpanded ? <ChevronLeft /> : <Menu />}
        label="Toggle Menu"
        onClick={() => setIsExpanded(!isExpanded)}
        isExpanded={isExpanded}
      />

      <Box sx={{ mt: 2 }}>
        <ToolbarItem
          icon={<Dashboard />}
          label="Agent Dashboard"
          onClick={() => handleAgentSelect("dashboard", "/")}
          isActive={activeAgent === "dashboard"}
          isExpanded={isExpanded}
        />
        <ToolbarItem
          icon={<BarChart />}
          label="Dynamic Chart"
          onClick={() => handleAgentSelect("dynamic-chart", "/chart")}
          isActive={activeAgent === "dynamic-chart"}
          isExpanded={isExpanded}
        />
        <ToolbarItem
          icon={<Chat />}
          label="Chat Agent"
          onClick={() => handleAgentSelect("chat", "/chat")}
          isActive={activeAgent === "chat"}
          isExpanded={isExpanded}
        />
        <ToolbarItem
          icon={<TrendingUp />}
          label="Trading Agent"
          onClick={() => handleAgentSelect("trading", "/trading")}
          isActive={activeAgent === "trading"}
          isExpanded={isExpanded}
        />
        <ToolbarItem
          icon={<Analytics />}
          label="Analysis Agent"
          onClick={() => handleAgentSelect("analysis", "/analysis")}
          isActive={activeAgent === "analysis"}
          isExpanded={isExpanded}
        />
      </Box>
    </Box>
  );
};
