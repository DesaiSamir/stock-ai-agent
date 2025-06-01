import React from "react";
import { Box, Typography, Chip, IconButton, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { AgentCard } from "./AgentCard";
import { TradesCardProps } from "@/types/agent-dashboard";
import { useAgentMonitoringStore } from "@/store/agent-monitoring";

export const TradesCard: React.FC<TradesCardProps> = ({ recentTrades }) => {
  const { clearTrades } = useAgentMonitoringStore();
  return (
    <AgentCard
      title="Recent Trades"
      headerColor="#9c27b0"
      clearActionTitle="Clear Trades"
      onClearAction={clearTrades}
    >
      {recentTrades.map((trade, index) => {
        const reasoning = (trade as unknown as { reasoning?: string })
          .reasoning;
        const optionsPlay = (trade as unknown as { optionsPlay?: string })
          .optionsPlay;
        return (
          <Box
            key={index}
            sx={{
              p: 1,
              mb: 0.5,
              borderRadius: 1,
              bgcolor: "background.paper",
              boxShadow: 1,
              "&:last-child": { mb: 0 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {trade.symbol}
                </Typography>
                {reasoning && (
                  <Tooltip title={reasoning} arrow>
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {optionsPlay && (
                  <Tooltip title={optionsPlay} arrow>
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                      <LightbulbOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Chip
                label={trade.action}
                color={trade.action === "BUY" ? "success" : "error"}
                size="small"
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Shares
                </Typography>
                <Typography variant="body2">{trade.quantity}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="body2">
                  ${trade.price.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="body2">
                  ${(trade.price * trade.quantity).toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="body2">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Source
                </Typography>
                <Typography variant="body2">{trade.source}</Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </AgentCard>
  );
};
