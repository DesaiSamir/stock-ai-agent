"use client";

import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import type { TradingSignal, NewsItem, AgentStatus } from "../../types/stock";
import { ClientOnlyDate } from "../ClientOnlyDate";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
      style={{ height: "100%", overflow: "auto" }}
    >
      {value === index && <Box sx={{ p: 2, height: "100%" }}>{children}</Box>}
    </div>
  );
}

interface AgentTabsProps {
  tradingSignals: TradingSignal[];
  newsItems: NewsItem[];
  agentStatus: AgentStatus[];
}

export const AgentTabs: React.FC<AgentTabsProps> = ({
  tradingSignals,
  newsItems,
  agentStatus,
}) => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Tabs
        value={value}
        onChange={handleChange}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider", minHeight: 40 }}
      >
        <Tab label="News Agent" sx={{ minHeight: 40 }} />
        <Tab label="Trading Agent" sx={{ minHeight: 40 }} />
        <Tab label="Analysis Agent" sx={{ minHeight: 40 }} />
      </Tabs>

      <TabPanel value={value} index={0}>
        <Box sx={{ height: "100%" }}>
          {newsItems.map((item) => (
            <Box key={item.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle2">{item.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {item.source} -{" "}
                <ClientOnlyDate
                  date={item.publishedAt}
                  formatOptions={{
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric",
                    hour12: true,
                  }}
                />
              </Typography>
            </Box>
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={value} index={1}>
        <Box sx={{ height: "100%" }}>
          {tradingSignals.map((signal, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle2">
                {signal.symbol} - {signal.type} @ ${signal.price}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Confidence: {signal.confidence}% - {signal.reason}
              </Typography>
            </Box>
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={value} index={2}>
        <Box sx={{ height: "100%" }}>
          {agentStatus.map((agent) => (
            <Box key={agent.name} sx={{ mb: 2 }}>
              <Typography variant="subtitle2">
                {agent.name} - {agent.status}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last Updated:{" "}
                <ClientOnlyDate
                  date={agent.lastUpdate}
                  formatOptions={{
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric",
                    hour12: true,
                  }}
                />
              </Typography>
            </Box>
          ))}
        </Box>
      </TabPanel>
    </Box>
  );
};
