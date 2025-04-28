export const tradestationConfig = {
  clientId: process.env.TS_CLIENT_ID!,
  clientSecret: process.env.TS_CLIENT_SECRET!,
  baseUrlSim: process.env.TS_BASE_URL_SIM || 'https://sim-api.tradestation.com',
  baseUrlLive: process.env.TS_BASE_URL_LIVE || 'https://api.tradestation.com',
  apiCallback: '/tradestation/callback',
}; 