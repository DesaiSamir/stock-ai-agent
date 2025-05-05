import { tradestationConfig } from "./config";
import axios from "axios";

export interface StreamData {
  Close: number;
  DownTicks: number;
  DownVolume: number;
  High: number;
  Low: number;
  Open: number;
  Status: number;
  TimeStamp: string;
  TotalTicks: number;
  TotalVolume: number;
  UnchangedTicks: number;
  UnchangedVolume: number;
  UpTicks: number;
  UpVolume: number;
  OpenInterest: number;
}

type StreamCallback = (data: StreamData) => void;
type StreamController = {
  enqueue: (data: Uint8Array) => void;
  error: (error: Error) => void;
};

class TradestationService {
  private streamCallbacks: Map<string, StreamCallback>;
  private streamControllers: Map<string, StreamController>;

  constructor() {
    this.streamCallbacks = new Map();
    this.streamControllers = new Map();
  }

  private parseStreamData(data: string): StreamData | null {
    try {
      return JSON.parse(data) as StreamData;
    } catch (error) {
      console.error("Failed to parse stream data:", error);
      return null;
    }
  }

  async getStream(url: string, headers: Headers, controller: StreamController) {
    try {
      const response = await axios.get(tradestationConfig.baseUrlSim + url, {
        headers: {
          Accept: "application/vnd.tradestation.streams+json",
          Authorization: headers.get("Authorization"),
        },
        responseType: "stream",
      });

      // Process the stream
      let buffer = "";
      const encoder = new TextEncoder();

      response.data.on("data", (chunk: Buffer) => {
        // Convert chunk to string and add to buffer
        buffer += chunk.toString();

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        // Process and send complete lines to client
        const validLines = lines
          .filter((line) => line.trim())
          .map((line) => {
            // Check for END marker
            if (line.trim() === "END") {
              // Restart the stream
              console.log("Stream ended, restarting...");
              this.getStream(url, headers, controller);
              return null;
            }
            try {
              return JSON.parse(line);
            } catch (e) {
              console.error("Failed to parse line:", line, e);
              return null;
            }
          })
          .filter((line) => line !== null);

        if (validLines.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(validLines)}\n\n`),
          );
        }
      });

      response.data.on("end", () => {
        // Process any remaining data
        if (buffer.trim()) {
          // Check for END marker in final buffer
          if (buffer.trim() === "END") {
            console.log("Stream ended in final buffer, restarting...");
            this.getStream(url, headers, controller);
            return;
          }
          try {
            const data = JSON.parse(buffer);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify([data])}\n\n`),
            );
          } catch (e) {
            console.error("Failed to parse final buffer:", buffer, e);
          }
        }
      });

      response.data.on("error", (error: Error) => {
        console.error("Stream error:", error);
        controller.error(error);
      });
    } catch (error) {
      console.error("Failed to setup stream:", error);
      controller.error(
        error instanceof Error ? error : new Error("Stream setup failed"),
      );
    }
  }

  async get(url: string, headers: Headers) {
    try {
      const response = await axios.get(tradestationConfig.baseUrlSim + url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: headers.get("Authorization"),
        },
      });

      // Parse the response if it's a string (streaming data)
      const responseData =
        typeof response.data === "string"
          ? this.parseStreamResponse(response.data)
          : response.data;

      return responseData;
    } catch (error) {
      if (
        error instanceof Error &&
        [
          "AUTH_NO_TOKEN",
          "AUTH_NO_REFRESH_TOKEN",
          "AUTH_REFRESH_FAILED",
        ].includes(error.message)
      ) {
        throw error;
      }
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("AUTH_INVALID");
      }
      console.error("TradeStation API request failed:", error);
      throw error;
    }
  }

  private parseStreamResponse(data: string): StreamData[] {
    // Split by newline and remove empty lines and 'END' marker
    const lines = data.split("\r\n").filter((line) => line && line !== "END");

    // Parse each line as JSON
    return lines
      .map((line) => {
        try {
          return JSON.parse(line) as StreamData;
        } catch (error) {
          console.error("Failed to parse line:", line, error);
          return null;
        }
      })
      .filter((item): item is StreamData => item !== null);
  }

  async post(url: string, data: unknown, headers: Headers) {
    try {
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.tradestation.streams+json",
          Authorization: headers.get("Authorization"),
        },
      });

      // Parse the response if it's a string (streaming data)
      const responseData =
        typeof response.data === "string"
          ? this.parseStreamResponse(response.data)
          : response.data;

      return responseData;
    } catch (error) {
      if (
        error instanceof Error &&
        [
          "AUTH_NO_TOKEN",
          "AUTH_NO_REFRESH_TOKEN",
          "AUTH_REFRESH_FAILED",
        ].includes(error.message)
      ) {
        throw error;
      }
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("AUTH_INVALID");
      }
      console.error("TradeStation API request failed:", error);
      throw error;
    }
  }
}

export const tradestationService = new TradestationService();
