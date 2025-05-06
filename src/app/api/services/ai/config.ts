export const aiConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4.1-nano", // or gpt-3.5-turbo for lower cost
  baseUrl: "https://api.openai.com/v1",
  maxTokens: 2000,
  temperature: 0.7,
} as const;

export type AIConfig = typeof aiConfig; 