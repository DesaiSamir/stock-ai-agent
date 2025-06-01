import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
} from "@mui/material";
import { ReactMarkdownRenderer } from "@/components/ui/markdown/ReactMarkdownRenderer";
import { useMarketDataStore } from "@/store/market-data";

interface TradingStrategyCardProps {
  symbol: string;
}

type TimeFrame = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M";
type RiskTolerance = "low" | "medium" | "high";

export const TradingStrategyCard: React.FC<TradingStrategyCardProps> = ({
  symbol,
}) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>("1h");
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("medium");
  const [strategy, setStrategy] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getBarData, getQuote } = useMarketDataStore();

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value as TimeFrame);
  };

  const handleRiskToleranceChange = (event: SelectChangeEvent) => {
    setRiskTolerance(event.target.value as RiskTolerance);
  };

  const generateStrategy = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/trading-strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol,
          timeframe,
          riskTolerance,
          marketData: getBarData(symbol)?.slice(-30) || [],
          quoteData: getQuote(symbol),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate trading strategy");
      }

      const data = await response.json();
      setStrategy(data.strategy);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatStrategyContent = () => {
    if (!strategy) return "";

    const timeframeDisplay = {
      "1m": "1 Min",
      "5m": "5 Min",
      "15m": "15 Min",
      "1h": "1 Hour",
      "4h": "4 Hour",
      "1d": "Daily",
      "1w": "Weekly",
      "1M": "Monthly",
    }[timeframe];

    return [
      `### Trading Strategy (${timeframeDisplay}, ${riskTolerance} risk)`,
      "",
      strategy,
    ].join("\n");
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CardContent
        sx={{
          flex: "none",
          pb: 1,
          pt: 2,
          px: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h5" gutterBottom>
              Trading Strategy Generator
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Generate AI-powered trading strategy for {symbol}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 2,
            mt: 2,
            flexWrap: "wrap",
          }}
        >
          <FormControl sx={{ minWidth: 140, flex: 1, height: 40 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={handleTimeframeChange}
              sx={{ height: 40, display: "flex", alignItems: "center" }}
              inputProps={{
                sx: {
                  height: 40,
                  padding: "0 14px",
                  display: "flex",
                  alignItems: "center",
                },
              }}
            >
              <MenuItem value="1m">1 Minute</MenuItem>
              <MenuItem value="5m">5 Minutes</MenuItem>
              <MenuItem value="15m">15 Minutes</MenuItem>
              <MenuItem value="1h">1 Hour</MenuItem>
              <MenuItem value="4h">4 Hours</MenuItem>
              <MenuItem value="1d">1 Day</MenuItem>
              <MenuItem value="1w">1 Week</MenuItem>
              <MenuItem value="1M">1 Month</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 140, flex: 1, height: 40 }}>
            <InputLabel>Risk Tolerance</InputLabel>
            <Select
              value={riskTolerance}
              label="Risk Tolerance"
              onChange={handleRiskToleranceChange}
              sx={{ height: 40, display: "flex", alignItems: "center" }}
              inputProps={{
                sx: {
                  height: 40,
                  padding: "0 14px",
                  display: "flex",
                  alignItems: "center",
                },
              }}
            >
              <MenuItem value="low">Low Risk</MenuItem>
              <MenuItem value="medium">Medium Risk</MenuItem>
              <MenuItem value="high">High Risk</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={generateStrategy}
            disabled={loading}
            sx={{ minWidth: 180, height: 40 }}
            fullWidth={false}
          >
            {loading ? <CircularProgress size={24} /> : "Generate Strategy"}
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </CardContent>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          px: 3.25,
          py: 2,
          bgcolor: "background.default",
        }}
      >
        {strategy && (
          <ReactMarkdownRenderer
            content={formatStrategyContent()}
            role="assistant"
          />
        )}
      </Box>
    </Card>
  );
};
