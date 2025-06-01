import axios from "axios";
import { aiConfig } from "./config";
import { NewsItem } from "@/types/agent";
import {
  MARKET_ANALYSIS_PROMPT,
  MARKET_SENTIMENT_PROMPT,
  NEWS_ANALYSIS_PROMPT,
  TRADING_STRATEGY_PROMPT,
  CHART_ANALYSIS_PROMPT,
} from "./prompts";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "developer";
  content: string;
}

export interface AIAnalysisRequest {
  messages: ChatMessage[];
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

export class AIService {
  public async makeOpenAIRequest(
    messages: ChatMessage[],
    options: Partial<{
      temperature: number;
      maxTokens: number;
    }> = {},
    retryCount = 0
  ): Promise<string> {
    if (!aiConfig.openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const response = await axios.post(
        `${aiConfig.baseUrl}/chat/completions`,
        {
          model: aiConfig.model,
          messages,
          temperature: options.temperature ?? aiConfig.temperature,
          max_tokens: options.maxTokens ?? aiConfig.maxTokens,
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
        const errorMessage =
          error.response.data?.error?.message || error.message;

        // Handle rate limiting
        if (status === 429) {
          const retryAfter = parseInt(
            error.response.headers["retry-after"] || "5"
          );

          if (retryCount < 3) {
            // Max 3 retries
            console.warn(
              `Rate limited by OpenAI API. Retrying after ${retryAfter} seconds...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, retryAfter * 1000)
            );
            return this.makeOpenAIRequest(messages, options, retryCount + 1);
          }

          throw new Error(
            `OpenAI API rate limit exceeded. Please try again after ${retryAfter} seconds.`
          );
        }

        // Handle other specific error cases
        switch (status) {
          case 401:
            throw new Error("OpenAI API key is invalid");
          case 403:
            throw new Error(
              "OpenAI API key does not have permission for this request"
            );
          case 404:
            throw new Error("The requested OpenAI model was not found");
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

  async analyzeMarket(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
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

    // Parse the AI response into a structured format
    try {
      const analysis = this.parseAnalysis(analysisText);
      return analysis;
    } catch (error) {
      console.error("Failed to parse AI analysis:", error);
      return {
        analysis: analysisText,
        sentiment: "neutral",
        confidence: 0.5,
        suggestedActions: [],
        reasoning: "Failed to parse structured analysis",
      };
    }
  }

  private parseAnalysis(analysisText: string): AIAnalysisResponse {
    // Try to extract structured data from the AI response
    // This is a simple implementation - you might want to make this more sophisticated
    const sentiment = analysisText.toLowerCase().includes("bullish")
      ? "bullish"
      : analysisText.toLowerCase().includes("bearish")
        ? "bearish"
        : "neutral";

    const confidence = 0.7; // You might want to implement more sophisticated confidence scoring

    const suggestedActions = analysisText
      .split("\n")
      .filter((line) => line.startsWith("- ") || line.startsWith("* "))
      .map((line) => line.replace(/^[- *] /, ""));

    return {
      analysis: analysisText,
      sentiment,
      confidence,
      suggestedActions,
      reasoning: analysisText,
    };
  }

  async generateTradingStrategy(
    symbol: string,
    timeframe: string,
    riskTolerance: "low" | "medium" | "high",
    marketData: [],
    quoteData: []
  ): Promise<string> {
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

    return this.makeOpenAIRequest(messages);
  }

  async analyzeSentiment(texts: string[]): Promise<{
    overall: "bullish" | "bearish" | "neutral";
    score: number;
    analysis: string;
  }> {
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

    // Simple sentiment scoring - you might want to make this more sophisticated
    const sentiment = response.toLowerCase().includes("bullish")
      ? "bullish"
      : response.toLowerCase().includes("bearish")
        ? "bearish"
        : "neutral";

    const score =
      sentiment === "neutral" ? 0.5 : sentiment === "bullish" ? 0.8 : 0.2;

    return {
      overall: sentiment,
      score,
      analysis: response,
    };
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
    marketContext?: {
      currentPrice: number;
      volume: number;
      previousClose: number;
      sector?: string;
      relatedSymbols?: string[];
    }
  ): Promise<{
    sentiment: "bullish" | "bearish" | "neutral";
    confidence: number;
    predictedImpact: {
      priceDirection: "up" | "down" | "stable";
      magnitudePercent: number;
      timeframe: "immediate" | "short-term" | "long-term";
    };
    keyEvents: string[];
    reasoning: string;
  }> {
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
      temperature: 0.2, // Lower temperature for more focused analysis
      maxTokens: 1000,
    });

    // Parse the analysis into structured format
    try {
      // Extract sentiment
      const sentimentMatch = analysisText.match(
        /SENTIMENT:\s*(bullish|bearish|neutral)/i
      );
      const sentiment =
        (sentimentMatch?.[1].toLowerCase() as
          | "bullish"
          | "bearish"
          | "neutral") || "neutral";

      // Extract confidence
      const confidenceMatch = analysisText.match(/CONFIDENCE:\s*(\d*\.?\d+)/i);
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

      // Extract price impact prediction
      const impactMatch = analysisText.match(
        /PRICE IMPACT:\s*(up|down|stable)\s+(\d*\.?\d+)%/i
      );
      const predictedImpact = {
        priceDirection:
          (impactMatch?.[1].toLowerCase() as "up" | "down" | "stable") ||
          "stable",
        magnitudePercent: impactMatch ? parseFloat(impactMatch[2]) : 0,
        timeframe: (analysisText
          .match(/TIMEFRAME:\s*(immediate|short-term|long-term)/i)?.[1]
          .toLowerCase() || "short-term") as
          | "immediate"
          | "short-term"
          | "long-term",
      };

      // Extract key events
      const keyEvents = analysisText
        .split("\n")
        .filter((line) => line.startsWith("- "))
        .map((line) => line.replace(/^- /, ""));

      return {
        sentiment,
        confidence,
        predictedImpact,
        keyEvents,
        reasoning: analysisText,
      };
    } catch (error) {
      console.error("Failed to parse news impact analysis:", error);
      return {
        sentiment: "neutral",
        confidence: 0.5,
        predictedImpact: {
          priceDirection: "stable",
          magnitudePercent: 0,
          timeframe: "short-term",
        },
        keyEvents: [],
        reasoning: analysisText,
      };
    }
  }

  async analyzeChart(symbol: string, bars: object[]): Promise<{
    action: "BUY" | "SELL" | "NEUTRAL";
    confidence: number;
    reasoning: string;
    entry?: number;
    stop?: number;
    target?: number;
    optionsPlay?: string;
    riskReward?: number;
    probabilityOfProfit?: number;
    rawResponse?: string;
  }> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: CHART_ANALYSIS_PROMPT,
      },
      {
        role: "user",
        content: `Analyze the following chart for ${symbol}:\n${JSON.stringify(bars)}`,
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
