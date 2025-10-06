import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/response';

/**
 * Security event types
 */
export enum SecurityEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_RATE_LIMIT = 'auth_rate_limit',
  INVALID_TOKEN = 'invalid_token',
  EXPIRED_TOKEN = 'expired_token',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  INJECTION_ATTEMPT = 'injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PASSWORD_CHANGE = 'password_change',
  ACCOUNT_LOCKED = 'account_locked',
}

/**
 * Security event interface
 */
interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ip: string;
  userAgent?: string;
  path: string;
  method: string;
  requestId: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Log security event
 */
export const logSecurityEvent = (
  req: Request,
  type: SecurityEventType,
  details?: Record<string, unknown>,
  userId?: string,
  email?: string
): void => {
  const ua = req.get('User-Agent');

  const event: SecurityEvent = {
    type,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    path: req.path,
    method: req.method,
    requestId: getRequestId(req),
    timestamp: new Date(),
    ...(userId ? { userId } : {}),
    ...(email ? { email } : {}),
    ...(ua ? { userAgent: ua } : {}),
    ...(details ? { details } : {}),
  };

  // Log with appropriate level based on event type
  const criticalEvents = [
    SecurityEventType.INJECTION_ATTEMPT,
    SecurityEventType.XSS_ATTEMPT,
    SecurityEventType.ACCOUNT_LOCKED,
  ];

  const warningEvents = [
    SecurityEventType.AUTH_FAILURE,
    SecurityEventType.AUTH_RATE_LIMIT,
    SecurityEventType.INVALID_TOKEN,
    SecurityEventType.EXPIRED_TOKEN,
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecurityEventType.UNAUTHORIZED_ACCESS,
  ];

  if (criticalEvents.includes(type)) {
    logger.error('🚨 Critical security event', event);
  } else if (warningEvents.includes(type)) {
    logger.warn('⚠️ Security warning', event);
  } else {
    logger.info('🔒 Security event', event);
  }
};

/**
 * Middleware to detect suspicious requests
 */
export const suspiciousRequestDetector = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const suspiciousPatterns = [
    // SQL injection patterns
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    // Path traversal
    /\.\.\//g,
    /\.\.\\/g,
    // Command injection
    /[;&|`$()]/g,
  ];

  const checkForSuspiciousContent = (obj: unknown): boolean => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(obj));
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkForSuspiciousContent);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkForSuspiciousContent);
    }
    
    return false;
  };

  // Check request body, query, and params
  const suspicious = 
    checkForSuspiciousContent(req.body) ||
    checkForSuspiciousContent(req.query) ||
    checkForSuspiciousContent(req.params);

  if (suspicious) {
    logSecurityEvent(req, SecurityEventType.SUSPICIOUS_REQUEST, {
      body: req.body,
      query: req.query,
      params: req.params,
    });
  }

  next();
};

/**
 * Middleware to log failed authentication attempts
 */
export const authFailureLogger = (
  req: Request,
  error: Error,
  details?: Record<string, unknown>
): void => {
  logSecurityEvent(req, SecurityEventType.AUTH_FAILURE, {
    error: error.message,
    ...details,
  });
};

/**
 * Middleware to log successful authentication
 */
export const authSuccessLogger = (
  req: Request,
  userId: string,
  email: string,
  details?: Record<string, unknown>
): void => {
  logSecurityEvent(req, SecurityEventType.AUTH_SUCCESS, details, userId, email);
};

/**
 * Rate limit event logger
 */
export const rateLimitLogger = (
  req: Request,
  type: 'general' | 'auth' = 'general'
): void => {
  const eventType = type === 'auth' 
    ? SecurityEventType.AUTH_RATE_LIMIT 
    : SecurityEventType.RATE_LIMIT_EXCEEDED;
    
  logSecurityEvent(req, eventType, { limitType: type });
};

export default {
  logSecurityEvent,
  suspiciousRequestDetector,
  authFailureLogger,
  authSuccessLogger,
  rateLimitLogger,
  SecurityEventType,
};