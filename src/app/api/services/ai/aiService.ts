import axios from "axios";
import { aiConfig } from "./config";
import { NewsItem } from "@/types/agent";
import { logger } from "@/utils/logger";
import {
  MARKET_ANALYSIS_PROMPT,
  MARKET_SENTIMENT_PROMPT,
  NEWS_ANALYSIS_PROMPT,
  TRADING_STRATEGY_PROMPT,
  CHART_ANALYSIS_PROMPT,
} from "./prompts";
import { ChartAnalysisRequest, ChartAnalysisResponse } from "@/types/chart-analysis";
import { MarketAnalysisResponse, MarketSentimentResponse, TradingStrategyResponse } from "@/types/market-analysis";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "developer";
  content: string;
}

interface ToolResult {
  name: string;
  result: unknown;
}

export interface AIAnalysisRequest {
  messages: ChatMessage[];
  toolResults?: ToolResult[];
  bars?: unknown; // Replace with your specific market data type
  quoteData?: unknown;
  newsAnalysis?: unknown;
  symbol?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIAnalysisResponse {
  analysis: string;
  sentiment?: "bullish" | "bearish" | "neutral";
  confidence?: number;
  suggestedActions?: string[];
  reasoning?: string;
}

interface NewsAnalysisResponse {
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  predictedImpact: {
    priceDirection: "up" | "down" | "stable";
    magnitudePercent: number;
    timeframe: "immediate" | "short-term" | "long-term";
  };
  keyEvents: string[];
  reasoning: string;
}

interface NewsAnalysisContext {
  currentPrice: number;
  volume: number;
  previousClose: number;
  sector?: string;
  relatedSymbols?: string[];
}

export class AIService {
  public async makeOpenAIRequest(
    messages: ChatMessage[],
    options: Partial<{
      temperature: number;
      maxTokens: number;
      toolResults?: ToolResult[];
    }> = {}
  ): Promise<string> {
    if (!aiConfig.openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      // If we have tool results, add them to the messages
      const messagesWithTools = [...messages];
      if (options.toolResults?.length) {
        messagesWithTools.push({
          role: "system",
          content: `Previous tool results:\n${JSON.stringify(options.toolResults, null, 2)}\n\nPlease analyze these results and respond in the required JSON format.`
        });
      }

      const response = await axios.post(
        `${aiConfig.baseUrl}/chat/completions`,
        {
          model: aiConfig.model,
          messages: messagesWithTools,
          temperature: options.temperature ?? aiConfig.temperature,
          max_tokens: options.maxTokens ?? aiConfig.maxTokens,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${aiConfig.openaiApiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.error?.message || error.message;

        // Handle specific error cases
        switch (status) {
          case 401:
            throw new Error("OpenAI API key is invalid");
          case 403:
            throw new Error("OpenAI API key does not have permission for this request");
          case 404:
            throw new Error("The requested OpenAI model was not found");
          case 429:
            throw new Error("OpenAI API rate limit exceeded. Please try again later.");
          case 500:
            throw new Error("OpenAI service internal error");
          default:
            throw new Error(`OpenAI API error: ${errorMessage}`);
        }
      }

      console.error("OpenAI API request failed:", error);
      throw error;
    }
  }

  async analyzeMarket(request: AIAnalysisRequest): Promise<MarketAnalysisResponse> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: MARKET_ANALYSIS_PROMPT,
      },
      {
        role: 'user',
        content: `Analyze the current market conditions for ${request.symbol} based on the provided data:
        QuoteData: ${JSON.stringify(request.quoteData)}
        MarketData: ${JSON.stringify(request.bars)}
        NewsAnalysis: ${JSON.stringify(request.newsAnalysis)}`,
      },
    ];

    const analysisText = await this.makeOpenAIRequest(messages, {
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });

    try {
      const analysis = JSON.parse(analysisText) as MarketAnalysisResponse;
      
      // Validate the response structure
      if (!analysis.sentiment || !analysis.confidence || !analysis.technicalFactors) {
        throw new Error('Invalid response structure from AI');
      }

      return analysis;
    } catch (error) {
      logger.error({
        message: 'Failed to parse market analysis response',
        error: new Error(error instanceof Error ? error.message : 'Unknown error'),
        response: analysisText
      });

      // Provide a fallback response
      return {
        analysis: analysisText,
        sentiment: "neutral",
        confidence: 0.5,
        suggestedActions: [],
        reasoning: "Failed to parse market analysis",
        technicalFactors: {
          trend: "sideways",
          strength: 0.5,
          keyLevels: {
            support: [],
            resistance: []
          }
        },
        riskAssessment: {
          level: "medium",
          factors: ["Analysis failed"]
        }
      };
    }
  }

  async generateTradingStrategy(
    symbol: string,
    timeframe: string,
    riskTolerance: "low" | "medium" | "high",
    marketData: [],
    quoteData: []
  ): Promise<TradingStrategyResponse> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: TRADING_STRATEGY_PROMPT,
      },
      {
        role: "user",
        content: `Please generate a trading strategy for the following data:
        RiskTolerance: ${riskTolerance}
        Timeframe: ${timeframe}
        Symbol: ${symbol}
        QuoteData: ${JSON.stringify(quoteData)}
        MarketData: ${JSON.stringify(marketData)}`,
      },
    ];

    const response = await this.makeOpenAIRequest(messages);

    try {
      const strategy = JSON.parse(response) as TradingStrategyResponse;
      
      // Validate the response structure
      if (!strategy.symbol || !strategy.strategy || !strategy.entry || !strategy.exits) {
        throw new Error('Invalid response structure from AI');
      }

      return strategy;
    } catch (error) {
      logger.error({
        message: 'Failed to parse trading strategy response',
        error: new Error(error instanceof Error ? error.message : 'Unknown error'),
        response
      });

      // Provide a fallback response
      return {
        symbol,
        strategy: {
          type: "day",
          direction: "long",
          timeframe
        },
        entry: {
          price: 0,
          conditions: ["Failed to generate strategy"],
          timing: "N/A"
        },
        exits: {
          stopLoss: 0,
          target: 0,
          trailingStop: null
        },
        options: null,
        riskManagement: {
          riskRewardRatio: 0,
          positionSize: "0%",
          maxRiskPercent: 0
        },
        marketContext: {
          keyEvents: [],
          technicalSetup: "Failed to analyze",
          volumeProfile: "N/A"
        },
        confidence: 0,
        reasoning: "Failed to generate trading strategy"
      };
    }
  }

  async analyzeSentiment(texts: string[]): Promise<MarketSentimentResponse> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: MARKET_SENTIMENT_PROMPT,
      },
      {
        role: "user",
        content: `Please analyze the sentiment in these market-related texts: ${JSON.stringify(texts)}`,
      },
    ];

    const response = await this.makeOpenAIRequest(messages);

    try {
      const sentiment = JSON.parse(response) as MarketSentimentResponse;
      
      // Validate the response structure
      if (!sentiment.overall || !sentiment.score || !sentiment.marketImpact) {
        throw new Error('Invalid response structure from AI');
      }

      return sentiment;
    } catch (error) {
      logger.error({
        message: 'Failed to parse sentiment analysis response',
        error: new Error(error instanceof Error ? error.message : 'Unknown error'),
        response
      });

      // Provide a fallback response
      return {
        overall: "neutral",
        score: 0.5,
        analysis: "Failed to analyze sentiment",
        confidence: 0.5,
        keyFactors: [],
        marketImpact: {
          immediate: "Unknown",
          shortTerm: "Unknown",
          longTerm: "Unknown"
        }
      };
    }
  }

  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    message: string;
    timestamp: string;
  }> {
    try {
      // Make a simple request to test the connection
      const messages: ChatMessage[] = [
        {
          role: "developer",
          content: 'Simple health check. Please respond with "OK".',
        },
      ];

      await this.makeOpenAIRequest(messages, {
        temperature: 0.1,
        maxTokens: 5,
      });

      return {
        status: "healthy",
        message: "OpenAI service is responding normally",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      let message = "OpenAI service is unavailable";

      if (error instanceof Error) {
        if (error.message === "OpenAI API key not configured") {
          message = "OpenAI API key is not configured";
        } else {
          message = `OpenAI service error: ${error.message}`;
        }
      }

      return {
        status: "unhealthy",
        message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async analyzeNewsImpact(
    news: NewsItem[],
    marketContext?: NewsAnalysisContext
  ): Promise<NewsAnalysisResponse> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: NEWS_ANALYSIS_PROMPT,
      },
      {
        role: "user",
        content: `Analyze these news articles for market impact:
          ${news
            .map(
              (n) => `
          Title: ${n.title}
          Source: ${n.source}
          Content: ${n.description}
          Published: ${n.publishedAt}
          ---`
            )
            .join("\n")}

          Market Context:
          ${JSON.stringify(marketContext, null, 2)}`,
      },
    ];

    const analysisText = await this.makeOpenAIRequest(messages, {
      temperature: 0.2,
      maxTokens: 1000,
    });

    try {
      // Parse the JSON response
      const analysis = JSON.parse(analysisText) as NewsAnalysisResponse;

      // Validate the response structure
      if (!analysis.sentiment || !analysis.confidence || !analysis.predictedImpact || !analysis.keyEvents) {
        throw new Error('Invalid response structure from AI');
      }

      return analysis;
    } catch (error) {
      console.error("Failed to parse news analysis response:", error);

      // Provide a fallback response
      return {
        sentiment: "neutral",
        confidence: 0.5,
        predictedImpact: {
          priceDirection: "stable",
          magnitudePercent: 0,
          timeframe: "short-term"
        },
        keyEvents: [],
        reasoning: "Failed to analyze news due to parsing error"
      };
    }
  }

  async analyzeChart(request: ChartAnalysisRequest): Promise<ChartAnalysisResponse> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: CHART_ANALYSIS_PROMPT,
      },
      {
        role: "user",
        content: `Analyze the following chart for ${request.symbol}:\nTimeframe: ${request.timeframe}\n TradeType: ${request.tradeType}\n${JSON.stringify(request.bars)}\n\nTechnical Analysis: ${JSON.stringify(request.technicalAnalysis)}\n\nNews Analysis: ${JSON.stringify(request.newsAnalysis)}\n\nMarket Data: ${JSON.stringify(request.marketData)}`,
      },
    ];

    const response = await this.makeOpenAIRequest(messages, {
      temperature: 0.2,
      maxTokens: 500,
    });

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(response);
      return {
        action: parsed.action,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        entry: parsed.entry,
        stop: parsed.stop,
        target: parsed.target,
        optionsPlay: parsed.optionsPlay,
        riskReward: parsed.riskReward,
        probabilityOfProfit: parsed.probabilityOfProfit,
        rawResponse: response,
      };
    } catch {
      // Fallback: extract fields from text (basic regex or leave as undefined)
      const action = response.includes("BUY") ? "BUY" : response.includes("SELL") ? "SELL" : "NEUTRAL";
      const confidenceMatch = response.match(/confidence[":\s]*([0-9.]+)/i);
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;
      const reasoningMatch = response.match(/reasoning[":\s]*([^\n"]+)/i);
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : response;
      const entryMatch = response.match(/entry[":\s]*([0-9.]+)/i);
      const stopMatch = response.match(/stop[":\s]*([0-9.]+)/i);
      const targetMatch = response.match(/target[":\s]*([0-9.]+)/i);
      const optionsPlayMatch = response.match(/optionsPlay[":\s]*([^\n"]+)/i);
      const riskRewardMatch = response.match(/riskReward[":\s]*([0-9.]+)/i);
      const probabilityMatch = response.match(/probabilityOfProfit[":\s]*([0-9.]+)/i);
      return {
        action,
        confidence,
        reasoning,
        entry: entryMatch ? parseFloat(entryMatch[1]) : undefined,
        stop: stopMatch ? parseFloat(stopMatch[1]) : undefined,
        target: targetMatch ? parseFloat(targetMatch[1]) : undefined,
        optionsPlay: optionsPlayMatch ? optionsPlayMatch[1].trim() : undefined,
        riskReward: riskRewardMatch ? parseFloat(riskRewardMatch[1]) : undefined,
        probabilityOfProfit: probabilityMatch ? parseFloat(probabilityMatch[1]) : undefined,
        rawResponse: response,
      };
    }
  }
}

export const aiService = new AIService();
