import React from "react";
import { NewsItem } from "../../types/stock";
import { Card } from "../core/Card";
import { Alert } from "../core/Alert";

interface NewsFeedProps {
  items: NewsItem[];
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ items }) => {
  const getSentimentSeverity = (sentiment: number | string | undefined) => {
    const numericSentiment = typeof sentiment === 'string' ? parseFloat(sentiment) : sentiment || 0;
    if (numericSentiment > 0.5) return "success";
    if (numericSentiment < -0.5) return "error";
    return "info";
  };

  return (
    <Card title="Latest News">
      <div className="space-y-4">
        {items.map((item) => (
          <Alert
            key={item.id}
            severity={getSentimentSeverity(item.sentiment)}
            title={item.title}
          >
            <div className="text-sm">
              <p>{item.content.substring(0, 200)}...</p>
              <div className="mt-2 text-xs text-gray-500">
                Source: {item.source} | {item.publishedAt.toLocaleString()}
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </Card>
  );
};
