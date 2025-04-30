"use client";

import React, { useState } from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import {
  TrendingUp,
  Article,
  ShowChart,
  Analytics,
  Menu,
  ChevronLeft,
  BarChart,
} from "@mui/icons-material";

interface AgentToolbarProps {
  onSelectAgent?: (
    agent: "chart" | "dynamic-chart" | "news" | "trading" | "analysis"
  ) => void;
  activeAgent?: "chart" | "dynamic-chart" | "news" | "trading" | "analysis";
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
          icon={<ShowChart />}
          label="Chart View"
          onClick={() => onSelectAgent?.("chart")}
          isActive={activeAgent === "chart"}
          isExpanded={isExpanded}
        />
        <ToolbarItem
          icon={<BarChart />}
          label="Dynamic Chart"
          onClick={() => onSelectAgent?.("dynamic-chart")}
          isActive={activeAgent === "dynamic-chart"}
          isExpanded={isExpanded}
        />
        <ToolbarItem
          icon={<Article />}
          label="News Agent"
          onClick={() => onSelectAgent?.("news")}
          isActive={activeAgent === "news"}
          isExpanded={isExpanded}
        />
        <ToolbarItem
          icon={<TrendingUp />}
          label="Trading Agent"
          onClick={() => onSelectAgent?.("trading")}
          isActive={activeAgent === "trading"}
          isExpanded={isExpanded}
        />
        <ToolbarItem
          icon={<Analytics />}
          label="Analysis Agent"
          onClick={() => onSelectAgent?.("analysis")}
          isActive={activeAgent === "analysis"}
          isExpanded={isExpanded}
        />
      </Box>
    </Box>
  );
};
