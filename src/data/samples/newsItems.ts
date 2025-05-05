import type { NewsItem } from "../../types/stock";

export const sampleNewsItems: NewsItem[] = [
  {
    id: "1",
    title: "Apple Announces New iPhone Launch Date",
    content: "Apple has announced the launch date for its latest iPhone...",
    source: "TechNews",
    url: "https://example.com/news/1",
    sentiment: "positive",
    publishedAt: new Date(),
    symbol: "AAPL",
  },
  {
    id: "2",
    title: "Apple Reports Strong Q4 Earnings",
    content: "Apple exceeded analyst expectations in Q4...",
    source: "MarketWatch",
    url: "https://example.com/news/2",
    sentiment: "positive",
    publishedAt: new Date(),
    symbol: "AAPL",
  },
];
