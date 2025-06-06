export const ActionTypes = {
  // Market Analysis Actions
  START_MARKET_ANALYSIS: 'START_MARKET_ANALYSIS',
  ANALYZE_MARKET: 'ANALYZE_MARKET',
  PERFORM_TECHNICAL_ANALYSIS: 'PERFORM_TECHNICAL_ANALYSIS',
  ANALYZE_NEWS: 'ANALYZE_NEWS',

  // Trade Execution Actions
  START_TRADE_EXECUTION: 'START_TRADE_EXECUTION',
  EXECUTE_TRADE: 'EXECUTE_TRADE',
  ASSESS_RISK: 'ASSESS_RISK',
  PLACE_TRADE: 'PLACE_TRADE',

  // Portfolio Management Actions
  VIEW_PORTFOLIO: 'VIEW_PORTFOLIO',
  UPDATE_PORTFOLIO: 'UPDATE_PORTFOLIO',
  GET_PERFORMANCE: 'GET_PERFORMANCE',

  // Market Data Actions
  GET_MARKET_DATA: 'GET_MARKET_DATA',
  GET_HISTORICAL_DATA: 'GET_HISTORICAL_DATA',
  GET_REAL_TIME_QUOTES: 'GET_REAL_TIME_QUOTES',

  // Risk Management Actions
  CALCULATE_POSITION_SIZE: 'CALCULATE_POSITION_SIZE',
  SET_STOP_LOSS: 'SET_STOP_LOSS',
  SET_TAKE_PROFIT: 'SET_TAKE_PROFIT',

  // News and Events Actions
  GET_NEWS: 'GET_NEWS',
  GET_EARNINGS: 'GET_EARNINGS',
  GET_EVENTS: 'GET_EVENTS'
} as const; 