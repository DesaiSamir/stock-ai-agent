export interface StreamData {
  Timestamp: string;
  Open: string;
  High: string;
  Low: string;
  Close: string;
  Volume: string;
  Interval: string;
  'UnchangedTicks (Deprecated)': string;
  'UnchangedVolume (Deprecated)': string;
}

export interface BarData {
  TimeStamp: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  Interval: string;
  'UnchangedTicks (Deprecated)': string;
  'UnchangedVolume (Deprecated)': string;
} 