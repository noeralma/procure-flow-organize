import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * Standard API response interface
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Success response helper
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  pagination?: PaginationMeta,
  requestId?: string
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta: requestId ? {
      timestamp: new Date().toISOString(),
      requestId,
      version: process.env['API_VERSION'] || '1.0.0',
    } : {
      timestamp: new Date().toISOString(),
      version: process.env['API_VERSION'] || '1.0.0',
    },
  };

  if (pagination) {
    response.meta!.pagination = pagination;
  }

  // Log successful responses in development
  if (process.env['NODE_ENV'] === 'development') {
    logger.debug('API Success Response:', {
      statusCode,
      message,
      requestId,
      dataType: typeof data,
      hasData: !!data,
    });
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response helper
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  details?: string,
  requestId?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    meta: requestId ? {
      timestamp: new Date().toISOString(),
      requestId,
      version: process.env['API_VERSION'] || '1.0.0',
    } : {
      timestamp: new Date().toISOString(),
      version: process.env['API_VERSION'] || '1.0.0',
    },
  };

  // Add details in development mode
  if (details && process.env['NODE_ENV'] === 'development') {
    response.data = { details };
  }

  // Log error responses
  logger.warn('API Error Response:', {
    statusCode,
    message,
    details,
    requestId,
  });

  return res.status(statusCode).json(response);
};

/**
 * Created response helper (201)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully',
  requestId?: string
): Response => {
  return sendSuccess(res, data, message, 201, undefined, requestId);
};

/**
 * No content response helper (204)
 */
export const sendNoContent = (
  res: Response,
  message: string = 'No content',
  requestId?: string
): Response => {
  // For 204 responses, we typically don't send a body
  // But we'll log the action
  logger.debug('API No Content Response:', {
    message,
    requestId,
  });

  return res.status(204).send();
};

/**
 * Bad request response helper (400)
 */
export const sendBadRequest = (
  res: Response,
  message: string = 'Bad request',
  details?: string,
  requestId?: string
): Response => {
  return sendError(res, message, 400, details, requestId);
};

/**
 * Unauthorized response helper (401)
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized',
  requestId?: string
): Response => {
  return sendError(res, message, 401, undefined, requestId);
};

/**
 * Forbidden response helper (403)
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden',
  requestId?: string
): Response => {
  return sendError(res, message, 403, undefined, requestId);
};

/**
 * Not found response helper (404)
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found',
  requestId?: string
): Response => {
  return sendError(res, message, 404, undefined, requestId);
};

/**
 * Conflict response helper (409)
 */
export const sendConflict = (
  res: Response,
  message: string = 'Resource conflict',
  details?: string,
  requestId?: string
): Response => {
  return sendError(res, message, 409, details, requestId);
};

/**
 * Too many requests response helper (429)
 */
export const sendTooManyRequests = (
  res: Response,
  message: string = 'Too many requests',
  requestId?: string
): Response => {
  return sendError(res, message, 429, undefined, requestId);
};

/**
 * Internal server error response helper (500)
 */
export const sendInternalError = (
  res: Response,
  message: string = 'Internal server error',
  details?: string,
  requestId?: string
): Response => {
  return sendError(res, message, 500, details, requestId);
};

/**
 * Service unavailable response helper (503)
 */
export const sendServiceUnavailable = (
  res: Response,
  message: string = 'Service unavailable',
  requestId?: string
): Response => {
  return sendError(res, message, 503, undefined, requestId);
};

/**
 * Paginated response helper
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Data retrieved successfully',
  requestId?: string
): Response => {
  const pagination = createPaginationMeta(page, limit, total);
  return sendSuccess(res, data, message, 200, pagination, requestId);
};

/**
 * Health check response helper
 */
export const sendHealthCheck = (
  res: Response,
  status: 'healthy' | 'unhealthy' = 'healthy',
  checks?: Record<string, unknown>,
  requestId?: string
): Response => {
  const statusCode = status === 'healthy' ? 200 : 503;
  const data = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env['API_VERSION'] || '1.0.0',
    environment: process.env['NODE_ENV'] || 'development',
    ...checks,
  };

  return sendSuccess(
    res,
    data,
    `Service is ${status}`,
    statusCode,
    undefined,
    requestId
  );
};

/**
 * File download response helper
 */
export const sendFile = (
  res: Response,
  filePath: string,
  fileName?: string,
  mimeType?: string
): void => {
  if (fileName) {
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  }

  if (mimeType) {
    res.setHeader('Content-Type', mimeType);
  }

  res.sendFile(filePath, (err) => {
    if (err) {
      logger.error('File download error:', {
        filePath,
        fileName,
        error: err.message,
      });
      
      if (!res.headersSent) {
        sendNotFound(res, 'File not found');
      }
    } else {
      logger.debug('File downloaded successfully:', {
        filePath,
        fileName,
      });
    }
  });
};

/**
 * Stream response helper
 */
export const sendStream = (
  res: Response,
  stream: NodeJS.ReadableStream,
  mimeType?: string,
  fileName?: string
): void => {
  if (mimeType) {
    res.setHeader('Content-Type', mimeType);
  }

  if (fileName) {
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  }

  stream.pipe(res);

  stream.on('error', (err) => {
    logger.error('Stream error:', err);
    if (!res.headersSent) {
      sendInternalError(res, 'Stream error');
    }
  });

  stream.on('end', () => {
    logger.debug('Stream completed successfully');
  });
};

/**
 * Redirect response helper
 */
export const sendRedirect = (
  res: Response,
  url: string,
  permanent: boolean = false
): Response => {
  const statusCode = permanent ? 301 : 302;
  
  logger.debug('API Redirect Response:', {
    url,
    statusCode,
    permanent,
  });

  res.redirect(statusCode, url);
  return res;
};

/**
 * Cache response helper
 */
export const sendCached = <T>(
  res: Response,
  data: T,
  maxAge: number = 3600, // 1 hour default
  message: string = 'Success',
  requestId?: string
): Response => {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
  res.setHeader('ETag', `"${Buffer.from(JSON.stringify(data)).toString('base64')}"`);
  
  return sendSuccess(res, data, message, 200, undefined, requestId);
};

/**
 * Response timing helper
 */
export const addResponseTime = (startTime: number) => {
  return (res: Response) => {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    logger.debug('Response time:', {
      duration: `${duration}ms`,
      path: res.req?.path,
      method: res.req?.method,
    });
  };
};

/**
 * CORS helper
 */
export const setCorsHeaders = (
  res: Response,
  origin?: string,
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: string[] = ['Content-Type', 'Authorization', 'X-Requested-With']
): void => {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', headers.join(', '));
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

/**
 * Security headers helper
 */
export const setSecurityHeaders = (res: Response): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
};

/**
 * API versioning helper
 */
export const setApiVersion = (res: Response, version: string = '1.0.0'): void => {
  res.setHeader('API-Version', version);
};

/**
 * Request ID helper
 */
export interface RequestWithId extends Request {
  id?: string;
  requestId?: string;
}

export const getRequestId = (req: RequestWithId): string => {
  return req.id || (req.headers['x-request-id'] as string | undefined) || 'unknown';
};

/**
 * Response middleware factory
 */
export const responseMiddleware = (req: RequestWithId, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = getRequestId(req);
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Add response time on finish
  res.on('finish', addResponseTime(startTime));
  
  // Set common headers
  setApiVersion(res);
  setSecurityHeaders(res);
  
  next();
};

/**
 * Export all response helpers
 */
export const responses = {
  success: sendSuccess,
  error: sendError,
  created: sendCreated,
  noContent: sendNoContent,
  badRequest: sendBadRequest,
  unauthorized: sendUnauthorized,
  forbidden: sendForbidden,
  notFound: sendNotFound,
  conflict: sendConflict,
  tooManyRequests: sendTooManyRequests,
  internalError: sendInternalError,
  serviceUnavailable: sendServiceUnavailable,
  paginated: sendPaginated,
  healthCheck: sendHealthCheck,
  file: sendFile,
  stream: sendStream,
  redirect: sendRedirect,
  cached: sendCached,
};