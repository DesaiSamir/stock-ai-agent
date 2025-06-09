export interface MarketAnalysisResponse {
  analysis: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  suggestedActions: string[];
  reasoning: string;
  technicalFactors: {
    trend: "up" | "down" | "sideways";
    strength: number;
    keyLevels: {
      support: number[];
      resistance: number[];
    };
  };
  riskAssessment: {
    level: "low" | "medium" | "high";
    factors: string[];
  };
}

export interface MarketSentimentResponse {
  overall: "bullish" | "bearish" | "neutral";
  score: number;
  analysis: string;
  confidence: number;
  keyFactors: string[];
  marketImpact: {
    immediate: string;
    shortTerm: string;
    longTerm: string;
  };
}

export interface TradingStrategyResponse {
  symbol: string;
  strategy: {
    type: "day" | "swing" | "position";
    direction: "long" | "short";
    timeframe: string;
  };
  entry: {
    price: number;
    conditions: string[];
    timing: string;
  };
  exits: {
    stopLoss: number;
    target: number;
    trailingStop: number | null;
  };
  options: {
    strategy: string;
    strike: number;
    expiry: string;
    premium: number;
  } | null;
  riskManagement: {
    riskRewardRatio: number;
    positionSize: string;
    maxRiskPercent: number;
  };
  marketContext: {
    keyEvents: string[];
    technicalSetup: string;
    volumeProfile: string;
  };
  confidence: number;
  reasoning: string;
} 