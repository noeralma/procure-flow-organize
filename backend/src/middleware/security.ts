import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { config } from '../config/environment';
import { RateLimitError } from '../utils/errors';
import { getRequestId } from '../utils/response';

/**
 * Request ID middleware
 * Adds a unique ID to each request for tracking
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = uuidv4();
  (req as any).id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * Request logging middleware
 * Logs incoming requests with relevant information
 */
export const requestLogger = (req: any, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = getRequestId(req);
  
  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      ip: req.ip,
    });
  });
  
  next();
};

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    meta: {
      timestamp: new Date().toISOString(),
      retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, _res: Response) => {
    const requestId = getRequestId(req);
    
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      requestId,
    });
    
    throw new RateLimitError('Too many requests, please try again later');
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    meta: {
      timestamp: new Date().toISOString(),
      retryAfter: 15 * 60, // 15 minutes in seconds
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req: Request, _res: Response) => {
    const requestId = getRequestId(req);
    
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      requestId,
    });
    
    throw new RateLimitError('Too many authentication attempts');
  },
});

/**
 * Speed limiting middleware
 * Slows down requests when rate limit is approached
 */
export const speedLimiter: any = slowDown({
  windowMs: config.rateLimitWindowMs,
  delayAfter: Math.floor(config.rateLimitMaxRequests * 0.8), // Start slowing down at 80% of limit
  delayMs: () => 500, // Add 500ms delay per request (updated for v2 compatibility)
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  skip: (req: Request) => {
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Security headers middleware
 * Adds various security headers to responses
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy (adjust as needed)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
  );
  
  // HSTS (only in production with HTTPS)
  if (process.env['NODE_ENV'] === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

/**
 * Input sanitization middleware
 * Sanitizes request data to prevent injection attacks
 */
export const sanitizeInput = (req: any, _res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .trim()
        .replace(/[<>"'&]/g, '') // Remove potentially dangerous HTML characters
        .replace(/\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex/gi, ''); // Remove MongoDB operators
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

/**
 * Request size limiting middleware
 * Prevents large payload attacks
 */
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction): void => {
  const maxSize = config.maxFileSize;
  const contentLength = parseInt(req.get('content-length') || '0', 10);
  
  if (contentLength > maxSize) {
    logger.warn('Request size exceeds limit', {
      contentLength,
      maxSize,
      ip: req.ip,
      path: req.path,
      method: req.method,
      requestId: getRequestId(req),
    });
    
    res.status(413).json({
      success: false,
      message: 'Request entity too large',
      meta: {
        timestamp: new Date().toISOString(),
        maxSize,
        receivedSize: contentLength,
      },
    });
    return;
  }
  
  next();
};

/**
 * IP whitelist middleware
 * Restricts access to specific IP addresses (for admin endpoints)
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip;
    const requestId = getRequestId(req);
    
    if (!clientIP || !allowedIPs.includes(clientIP)) {
      logger.warn('IP not in whitelist', {
        clientIP,
        allowedIPs,
        path: req.path,
        method: req.method,
        requestId,
      });
      
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    next();
  };
};

/**
 * User agent validation middleware
 * Blocks requests from suspicious user agents
 */
export const validateUserAgent = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.get('User-Agent');
  const requestId = getRequestId(req);
  
  // Block requests without user agent
  if (!userAgent) {
    logger.warn('Request without user agent blocked', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      requestId,
    });
    
    res.status(400).json({
      success: false,
      message: 'User agent is required',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  
  // Block known malicious user agents
  const maliciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
  ];
  
  const isMalicious = maliciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isMalicious) {
    logger.warn('Malicious user agent detected', {
      userAgent,
      ip: req.ip,
      path: req.path,
      method: req.method,
      requestId,
    });
    
    res.status(403).json({
      success: false,
      message: 'Access denied',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  
  next();
};

/**
 * Request timeout middleware
 * Prevents long-running requests from consuming resources
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = getRequestId(req);
    
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          timeout: timeoutMs,
          path: req.path,
          method: req.method,
          ip: req.ip,
          requestId,
        });
        
        res.status(408).json({
          success: false,
          message: 'Request timeout',
          meta: {
            timestamp: new Date().toISOString(),
            timeout: timeoutMs,
          },
        });
      }
    }, timeoutMs);
    
    res.on('finish', () => {
      clearTimeout(timeout);
    });
    
    res.on('close', () => {
      clearTimeout(timeout);
    });
    
    next();
  };
};

/**
 * CORS configuration middleware
 * Handles Cross-Origin Resource Sharing
 */
export const corsConfig = (req: Request, res: Response, next: NextFunction): void => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin.join(', '));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

/**
 * API versioning middleware
 * Handles API version routing
 */
export const apiVersioning = (req: any, res: Response, next: NextFunction): void => {
  const version = req.headers['api-version'] || req.query.version || config.apiVersion;
  req.apiVersion = version;
  res.setHeader('API-Version', version);
  next();
};

/**
 * Health check bypass middleware
 * Allows health checks to bypass certain security measures
 */
export const healthCheckBypass = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.path === '/health' || req.path === '/api/health') {
    (req as any).isHealthCheck = true;
  }
  next();
};

/**
 * Security middleware chain
 * Combines all security middlewares in the correct order
 */
export const securityMiddlewareChain = [
  requestId,
  healthCheckBypass,
  corsConfig,
  securityHeaders,
  validateUserAgent,
  requestSizeLimit,
  sanitizeInput,
  requestTimeout(),
  speedLimiter,
  rateLimiter,
  requestLogger,
  apiVersioning,
];

export default {
  requestId,
  requestLogger,
  rateLimiter,
  authRateLimiter,
  speedLimiter,
  securityHeaders,
  sanitizeInput,
  requestSizeLimit,
  ipWhitelist,
  validateUserAgent,
  requestTimeout,
  corsConfig,
  apiVersioning,
  healthCheckBypass,
  securityMiddlewareChain,
} as const;