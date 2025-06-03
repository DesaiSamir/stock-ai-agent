interface LogPayload {
  message?: string;
  error?: Error;
  toolType?: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public info(payload: LogPayload): void {
    console.info(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      ...payload
    }, null, 2));
  }

  public error(payload: LogPayload): void {
    console.log(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      ...payload,
      error: payload.error ? {
        message: payload.error.message,
        stack: payload.error.stack
      } : undefined
    }, null, 2));
  }

  public warn(payload: LogPayload): void {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      ...payload
    }, null, 2));
  }

  public debug(payload: LogPayload): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        level: 'DEBUG',
        timestamp: new Date().toISOString(),
        ...payload
      }, null, 2));
    }
  }
}

export const logger = Logger.getInstance(); 