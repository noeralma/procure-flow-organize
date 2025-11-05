import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/response';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = getRequestId(req);
  logger.info('HTTP request received', {
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip,
    requestId,
  });
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP request completed', {
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      requestId,
    });
  });
  next();
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});