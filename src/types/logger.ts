export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | DOMException
  | { [key: string]: LogValue }
  | LogValue[];

export type LogContext = Readonly<Record<string, LogValue>>;

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  context?: LogContext;
}

export interface LoggerConfig {
  minLevel: LogLevel;
}
