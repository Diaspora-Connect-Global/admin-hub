/**
 * Centralized logging for the admin hub.
 * Use logger.info(), logger.warn(), etc. or create a scoped logger with logger.child("Context").
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export type LogTransport = (level: LogLevel, message: string, meta?: Record<string, unknown>) => void;

export interface LoggerOptions {
  minLevel?: LogLevel;
  context?: string;
  transports?: LogTransport[];
}

const defaultMinLevel: LogLevel =
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.MODE === "development" || import.meta.env?.DEV))
    ? "debug"
    : "info";

function noop() {}

function formatMessage(level: LogLevel, context: string | undefined, message: string, meta?: Record<string, unknown>): string {
  const prefix = context ? `[${context}]` : "";
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `${prefix} ${message}${metaStr}`.trim();
}

function consoleTransport(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const full = meta ? `${message} ${JSON.stringify(meta)}` : message;
  switch (level) {
    case "debug":
      console.debug(full);
      break;
    case "info":
      console.info(full);
      break;
    case "warn":
      console.warn(full);
      break;
    case "error":
      console.error(full);
      break;
  }
}

function createLogger(options: LoggerOptions = {}): Logger {
  const minLevel = options.minLevel ?? defaultMinLevel;
  const context = options.context;
  const transports: LogTransport[] = options.transports ?? [consoleTransport];

  const shouldLog = (level: LogLevel) => LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];

  const log = (level: LogLevel) => (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog(level)) return;
    const formatted = formatMessage(level, context, message, meta);
    transports.forEach((t) => t(level, formatted, meta));
  };

  return {
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
    child: (childContext: string) =>
      createLogger({
        ...options,
        context: context ? `${context}:${childContext}` : childContext,
      }),
  };
}

export interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  child: (context: string) => Logger;
}

/** Default app logger. Use logger.child("Feature") for scoped logs. */
export const logger = createLogger();

export { createLogger };
