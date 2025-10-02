import { config } from '../config/environment';

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Color codes for console output
const COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[35m', // Magenta
  reset: '\x1b[0m',  // Reset
} as const;

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: unknown;
}

class Logger {
  private currentLevel: number;

  constructor(level: LogLevel = 'info') {
    this.currentLevel = LOG_LEVELS[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= this.currentLevel;
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    
    let formattedMessage = `[${timestamp}] ${levelUpper} ${message}`;
    
    if (meta !== undefined) {
      formattedMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return formattedMessage;
  }

  private colorize(level: LogLevel, message: string): string {
    if (config.nodeEnv === 'production') {
      return message; // No colors in production
    }
    
    const color = COLORS[level];
    return `${color}${message}${COLORS.reset}`;
  }

  private log(level: LogLevel, message: string, meta?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);
    const colorizedMessage = this.colorize(level, formattedMessage);

    // Write to appropriate stream
    if (level === 'error') {
      console.error(colorizedMessage);
    } else {
      console.log(colorizedMessage);
    }

    // In production, you might want to send logs to external service
    if (config.isProduction) {
      this.sendToExternalLogger({
        timestamp: new Date().toISOString(),
        level,
        message,
        meta,
      });
    }
  }

  private sendToExternalLogger(_entry: LogEntry): void {
    // Placeholder for external logging service integration
    // Examples: Winston with transports, Datadog, New Relic, etc.
    // For now, we'll just ensure the log is properly formatted
    if (config.isDevelopment) {
      // In development, we might want to store logs in a file
      // This is a placeholder for file logging implementation
    }
  }

  /**
   * Log error messages
   */
  error(message: string, meta?: unknown): void {
    this.log('error', message, meta);
  }

  /**
   * Log warning messages
   */
  warn(message: string, meta?: unknown): void {
    this.log('warn', message, meta);
  }

  /**
   * Log info messages
   */
  info(message: string, meta?: unknown): void {
    this.log('info', message, meta);
  }

  /**
   * Log debug messages
   */
  debug(message: string, meta?: unknown): void {
    this.log('debug', message, meta);
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = LOG_LEVELS[level];
    this.info(`Log level set to: ${level}`);
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    const entries = Object.entries(LOG_LEVELS);
    const currentEntry = entries.find(([, value]) => value === this.currentLevel);
    return (currentEntry?.[0] as LogLevel) ?? 'info';
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): Logger {
    const childLogger = new Logger(this.getLevel());
    
    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, meta?: unknown) => {
      const enrichedMeta = { ...context, ...(meta as object) };
      originalLog(level, message, enrichedMeta);
    };
    
    return childLogger;
  }
}

// Create and export singleton logger instance
export const logger = new Logger(config.logLevel);

// Export Logger class for testing or custom instances
export { Logger };
export type { LogLevel, LogEntry };