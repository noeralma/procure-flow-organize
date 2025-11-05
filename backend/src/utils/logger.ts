type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];

// Determine log level without importing config to avoid circular deps
const envLevel = (process.env['LOG_LEVEL'] as LogLevel) || 'info';
const thresholdIndex = levels.indexOf(envLevel);

const format = (level: LogLevel, message: unknown, meta?: unknown) => {
  const timestamp = new Date().toISOString();
  const payload: Record<string, unknown> = {
    level,
    timestamp,
    message,
  };
  if (meta && typeof meta === 'object') {
    payload['meta'] = meta as Record<string, unknown>;
  } else if (meta !== undefined) {
    payload['meta'] = { value: meta };
  }
  return JSON.stringify(payload);
};

const shouldLog = (level: LogLevel) => levels.indexOf(level) <= thresholdIndex;

export const logger = {
  error(message: unknown, meta?: unknown): void {
    if (!shouldLog('error')) return;
    // eslint-disable-next-line no-console
    console.error(format('error', message, meta));
  },
  warn(message: unknown, meta?: unknown): void {
    if (!shouldLog('warn')) return;
    // eslint-disable-next-line no-console
    console.warn(format('warn', message, meta));
  },
  info(message: unknown, meta?: unknown): void {
    if (!shouldLog('info')) return;
    // eslint-disable-next-line no-console
    console.log(format('info', message, meta));
  },
  debug(message: unknown, meta?: unknown): void {
    if (!shouldLog('debug')) return;
    // eslint-disable-next-line no-console
    console.log(format('debug', message, meta));
  },
};

export default logger;