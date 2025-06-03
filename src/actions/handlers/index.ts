import { handlers as analyzeMarketHandlers } from './analyze-market';
import { handlers as executeTradeHandlers } from './execute-trade';
import { handlers as marketDataHandlers } from './market-data';
 
export const handlers = [
  ...analyzeMarketHandlers,
  ...executeTradeHandlers,
  ...marketDataHandlers,
]; 