import { getAvailableTools } from '@/tools';

function getToolsPrompt(): string {
  const tools = getAvailableTools();
  const toolDescriptions = tools.map(tool => {
    return `${tool.type}: ${tool.description}
Schema: ${JSON.stringify(tool.payloadSchema, null, 2)}`;
  }).join('\n\n');

  return `You have access to the following tools:

${toolDescriptions}

To use a tool, format your response like this:
{
  "tool": "TOOL_TYPE",
  "payload": {
    // payload matching the tool's schema
  }
}`;
}

export function getSystemPrompt(): string {
  return `You are an AI trading assistant with expertise in technical analysis, risk management, and market data analysis.

${getToolsPrompt()}

Your capabilities include:
1. Analyzing market data and technical indicators
2. Identifying trading opportunities based on technical patterns
3. Assessing risk and providing position sizing recommendations
4. Monitoring news and sentiment for trading signals
5. Providing real-time market insights and alerts

Guidelines:
1. Always validate data before making recommendations
2. Consider multiple timeframes in your analysis
3. Explain your reasoning clearly
4. Be conservative in risk assessment
5. Highlight both opportunities and risks
6. Use proper position sizing based on risk parameters
7. Monitor and adapt to changing market conditions

When responding:
1. Be clear and concise
2. Provide specific actionable insights
3. Include relevant technical indicators
4. Explain your analysis methodology
5. Highlight key risk factors
6. Give clear entry/exit points when applicable
7. Include confidence levels in your recommendations

Remember:
- Past performance doesn't guarantee future results
- Always consider risk management first
- Be transparent about limitations and uncertainties
- Update recommendations based on new information
- Consider market context and conditions

ALWAYS respond in this JSON format:
{
  "type": "tool_request" | "analysis" | "final_response",
  "reply": "Your explanation or analysis here",
  "needsMoreData": boolean (only for type="analysis", must be true if you need to gather more data),
  "toolCalls": [  // only for type="tool_request"
    {
      "name": "TOOL_NAME",
      "payload": {
        // payload matching the tool's schema
      }
    }
  ]
}

Example responses:

1. When you need to use a tool:
{
  "type": "tool_request",
  "reply": "I'll analyze the market data for this stock",
  "toolCalls": [
    {
      "name": "MARKET_DATA",
      "payload": {
        "symbol": "AAPL",
        "timeframe": "1d",
        "limit": 100
      }
    }
  ]
}

2. When you're analyzing and need more data:
{
  "type": "analysis",
  "reply": "I've analyzed the price trends, but I need to check the volume patterns.",
  "needsMoreData": true,
  "toolCalls": [
    {
      "name": "TECHNICAL_ANALYSIS",
      "payload": {
        "symbol": "AAPL",
        "timeframe": "1d",
        "indicators": ["volume"]
      }
    }
  ]
}

3. When you have completed your analysis or have a response:
{
  "type": "final_response",
  "reply": "Based on my analysis of AAPL:\n1. Price Trend: Currently bullish...\n2. Technical Indicators: RSI at 65..."
}

Important:
- Use "tool_request" when you need to gather data
- Use "analysis" with needsMoreData=true ONLY when you need to perform additional analysis
- Use "final_response" when you have completed your analysis or are providing a complete answer
- Never use "analysis" with needsMoreData=false - use "final_response" instead
`;
}

export function getMarketAnalysisPrompt(symbol: string): string {
  return `Analyze the market data for ${symbol} and provide:

1. Technical Analysis
- Current trend and strength
- Key support/resistance levels
- Important technical indicators
- Pattern recognition
- Volume analysis

2. Trading Signals
- Entry/exit opportunities
- Stop loss levels
- Position sizing recommendations
- Risk/reward ratio

3. Risk Assessment
- Market volatility
- Liquidity considerations
- Potential risks
- Position sizing guidelines

4. Recommendations
- Trading strategy
- Risk management approach
- Entry/exit points
- Position management guidelines

Please use the available tools to gather and analyze the necessary data.`;
}

export function getRiskAssessmentPrompt(symbol: string): string {
  return `Perform a comprehensive risk assessment for ${symbol} considering:

1. Market Risk
- Historical volatility
- Current market conditions
- Liquidity analysis
- Correlation with broader market

2. Position Risk
- Position sizing recommendations
- Stop loss placement
- Risk/reward scenarios
- Maximum drawdown analysis

3. Technical Risk Factors
- Trend strength/weakness
- Support/resistance levels
- Technical indicator warnings
- Pattern completion/failure risks

4. Money Management
- Position sizing guidelines
- Risk per trade calculation
- Portfolio exposure recommendations
- Stop loss management

Please use the available tools to gather the necessary risk metrics and provide a detailed assessment.`;
}

export function getNewsAnalysisPrompt(symbol: string): string {
  return `Analyze recent news and sentiment for ${symbol} considering:

1. News Impact
- Major announcements
- Market sentiment
- Trading volume impact
- Price action correlation

2. Sentiment Analysis
- Overall market sentiment
- Social media sentiment
- Analyst recommendations
- Institutional activity

3. Technical Correlation
- News impact on price
- Volume reaction to news
- Pattern formations
- Support/resistance tests

4. Trading Implications
- Entry/exit opportunities
- Risk adjustment needs
- Position sizing impact
- Strategy modifications

Please use the available tools to gather and analyze news data and provide actionable insights.`;
}

export function getTechnicalAnalysisPrompt(symbol: string): string {
  return `Perform a detailed technical analysis for ${symbol} including:

1. Trend Analysis
- Primary trend direction
- Trend strength
- Multiple timeframe analysis
- Key trend levels

2. Technical Indicators
- Moving averages
- Momentum indicators
- Volume analysis
- Pattern recognition

3. Support/Resistance
- Key price levels
- Breakout/breakdown points
- Price targets
- Stop loss levels

4. Trading Signals
- Entry/exit points
- Signal strength
- Confirmation factors
- Risk parameters

Please use the available tools to calculate and analyze technical indicators and provide detailed insights.`;
}

export function getPositionSizingPrompt(symbol: string): string {
  return `Calculate optimal position sizing for ${symbol} considering:

1. Risk Parameters
- Account risk percentage
- Trade risk percentage
- Stop loss distance
- Entry price levels

2. Market Conditions
- Current volatility
- Liquidity conditions
- Spread considerations
- Trading volume

3. Technical Factors
- Trend strength
- Support/resistance proximity
- Pattern reliability
- Indicator confirmation

4. Money Management
- Position size calculation
- Risk/reward ratio
- Multiple position scenarios
- Scaling guidelines

Please use the available tools to analyze risk metrics and provide position sizing recommendations.`;
} 