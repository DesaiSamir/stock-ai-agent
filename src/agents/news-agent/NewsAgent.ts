import type { NewsItem, AgentConfig } from "../../types/agent";
import { EventEmitter } from "events";

interface NewsAgentConfig extends Omit<AgentConfig, "config"> {
  config: {
    newsSources: string[];
    updateInterval: number;
  };
}

export class NewsAgent extends EventEmitter {
  private config: NewsAgentConfig;
  private newsSources: string[];
  private updateInterval: number;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: NewsAgentConfig) {
    super();
    this.config = config;
    this.newsSources = config.config.newsSources;
    this.updateInterval = config.config.updateInterval;
  }

  async start(): Promise<void> {
    console.log("Starting News Agent...");
    this.config.status = "ACTIVE";
    this.config.lastUpdated = new Date();

    // Start the monitoring loop
    this.monitoringInterval = setInterval(
      () => this.monitorNews(),
      this.updateInterval,
    );

    // Initial monitoring
    await this.monitorNews();
  }

  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.config.status = "INACTIVE";
  }

  private async monitorNews(): Promise<void> {
    try {
      const newsUpdates = await Promise.all(
        this.newsSources.map((source) => this.fetchNewsFromSource(source)),
      );

      // Flatten and filter out null values
      const allNews = newsUpdates
        .flat()
        .filter((item): item is NewsItem => item !== null);

      // Emit updates for each news item
      allNews.forEach((item) => {
        this.emit("newsUpdate", item);
      });

      this.config.lastUpdated = new Date();
    } catch (error) {
      console.error("Error monitoring news:", error);
      this.config.status = "ERROR";
      this.emit("error", error);
    }
  }

  private async fetchNewsFromSource(source: string): Promise<NewsItem[]> {
    try {
      // TODO: Implement actual news fetching logic
      // This is a placeholder implementation
      console.log(`Fetching news from source: ${source}`);

      const mockNews: NewsItem = {
        title: `Sample news from ${source}`,
        description: "This is a placeholder news item",
        url: `https://${source}/news/1`,
        source: source,
        publishedAt: new Date().toISOString(),
        sentiment: Math.random() * 2 - 1, // Random sentiment between -1 and 1
      };

      return [mockNews];
    } catch (error) {
      console.error(`Error fetching news from ${source}:`, error);
      return [];
    }
  }

  async analyzeSentiment(article: NewsItem): Promise<number> {
    // TODO: Implement actual sentiment analysis
    // This is a placeholder implementation
    console.log("Analyzing sentiment for article:", article.title);
    return article.sentiment || 0;
  }

  getStatus(): AgentConfig {
    return this.config;
  }
}
