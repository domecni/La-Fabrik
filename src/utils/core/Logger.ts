import type {
  LogContext,
  LogEntry,
  LogLevel,
  LoggerConfig,
} from "@/types/logger/logger";
import { isDebugEnabled } from "@/utils/debug/isDebugEnabled";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: "color: #94a3b8; font-weight: 600;",
  info: "color: #60a5fa; font-weight: 600;",
  warn: "color: #f59e0b; font-weight: 600;",
  error: "color: #f87171; font-weight: 600;",
};

const SCOPE_STYLE = "color: #e5e7eb; font-weight: 600;";
const MESSAGE_STYLE = "color: inherit;";

class Logger {
  private readonly config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  debug(scope: string, message: string, context?: LogContext): void {
    this.log("debug", scope, message, context);
  }

  info(scope: string, message: string, context?: LogContext): void {
    this.log("info", scope, message, context);
  }

  warn(scope: string, message: string, context?: LogContext): void {
    this.log("warn", scope, message, context);
  }

  error(scope: string, message: string, context?: LogContext): void {
    this.log("error", scope, message, context);
  }

  private log(
    level: LogLevel,
    scope: string,
    message: string,
    context?: LogContext,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      scope,
      message,
      ...(context ? { context } : {}),
    };

    const formattedMessage = `%c[${LEVEL_LABELS[level]}]%c [${scope}]%c ${message}`;
    const args = [
      formattedMessage,
      LEVEL_STYLES[level],
      SCOPE_STYLE,
      MESSAGE_STYLE,
      entry,
    ] as const;

    switch (level) {
      case "debug":
        console.debug(...args);
        return;
      case "info":
        console.info(...args);
        return;
      case "warn":
        console.warn(...args);
        return;
      case "error":
        console.error(...args);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.config.minLevel];
  }
}

function resolveMinLevel(): LogLevel {
  if (typeof window === "undefined") {
    return "info";
  }

  return isDebugEnabled() ? "debug" : "info";
}

export const logger = new Logger({
  minLevel: resolveMinLevel(),
});
