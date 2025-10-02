import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  createErrorResponse,
  isOperationalError,
  logError,
  handleMongoError,
  handleJWTError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { sendError, getRequestId } from '../utils/response';

/**
 * Global error handling middleware
 * This should be the last middleware in the chain
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = getRequestId(req);
  
  // Log the error
  logError(error, {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle different types of errors
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError') {
    appError = handleMongoError(error);
  } else if (error.name?.includes('JWT') || error.name?.includes('Token')) {
    appError = handleJWTError(error);
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    appError = new AppError('Invalid JSON format', 400);
  } else if (error.name === 'MulterError') {
    appError = handleMulterError(error as any);
  } else {
    // Unknown error - don't expose details in production
    const message = process.env['NODE_ENV'] === 'production' 
      ? 'Internal server error' 
      : error.message;
    
    appError = new AppError(message, 500, error.message, false);
  }

  // Create error response
  const errorResponse = createErrorResponse(
    appError,
    req.path,
    req.method,
    requestId
  );

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * Handle Multer (file upload) errors
 */
const handleMulterError = (error: any): AppError => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new AppError('File too large', 400, 'File size exceeds the allowed limit');
    case 'LIMIT_FILE_COUNT':
      return new AppError('Too many files', 400, 'Number of files exceeds the allowed limit');
    case 'LIMIT_UNEXPECTED_FILE':
      return new AppError('Unexpected file field', 400, 'Unexpected file field in the request');
    case 'LIMIT_FIELD_KEY':
      return new AppError('Field name too long', 400, 'Field name is too long');
    case 'LIMIT_FIELD_VALUE':
      return new AppError('Field value too long', 400, 'Field value is too long');
    case 'LIMIT_FIELD_COUNT':
      return new AppError('Too many fields', 400, 'Number of fields exceeds the allowed limit');
    case 'LIMIT_PART_COUNT':
      return new AppError('Too many parts', 400, 'Number of parts exceeds the allowed limit');
    default:
      return new AppError('File upload error', 400, error.message);
  }
};

/**
 * 404 Not Found handler
 * This should be placed before the error handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = getRequestId(req);
  
  logger.warn('Route not found:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId,
  });

  sendError(
    res,
    `Route ${req.method} ${req.path} not found`,
    404,
    undefined,
    requestId
  );
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 * Specifically for handling validation errors
 */
export const validationErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error.name === 'ValidationError') {
    const requestId = getRequestId(req);
    
    sendError(
      res,
      error.message,
      400,
      error.details,
      requestId
    );
    return;
  }
  
  _next(error);
};

/**
 * Rate limit error handler
 */
export const rateLimitErrorHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = getRequestId(req);
  
  logger.warn('Rate limit exceeded:', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    requestId,
  });

  sendError(
    res,
    'Too many requests, please try again later',
    429,
    undefined,
    requestId
  );
};

/**
 * CORS error handler
 */
export const corsErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.message && error.message.includes('CORS')) {
    const requestId = getRequestId(req);
    
    logger.warn('CORS error:', {
      origin: req.get('Origin'),
      method: req.method,
      path: req.path,
      requestId,
    });

    sendError(
      res,
      'CORS policy violation',
      403,
      'Origin not allowed by CORS policy',
      requestId
    );
    return;
  }
  
  next(error);
};

/**
 * Timeout error handler
 */
export const timeoutErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
    const requestId = getRequestId(req);
    
    logger.warn('Request timeout:', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      requestId,
    });

    sendError(
      res,
      'Request timeout',
      408,
      'The request took too long to process',
      requestId
    );
    return;
  }
  
  next(error);
};

/**
 * Database connection error handler
 */
export const dbErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    const requestId = getRequestId(req);
    
    logger.error('Database connection error:', {
      error: error.message,
      method: req.method,
      path: req.path,
      requestId,
    });

    sendError(
      res,
      'Database connection error',
      503,
      'Service temporarily unavailable',
      requestId
    );
    return;
  }
  
  next(error);
};

/**
 * Development error handler
 * Provides detailed error information in development mode
 */
export const developmentErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env['NODE_ENV'] !== 'development') {
    return next(error);
  }

  const requestId = getRequestId(req);
  
  // Send detailed error information in development
  res.status(500).json({
    success: false,
    message: error.message,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      requestId,
      timestamp: new Date().toISOString(),
      request: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        headers: req.headers,
        ip: req.ip,
      },
    },
  });
};

/**
 * Production error handler
 * Provides minimal error information in production
 */
export const productionErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env['NODE_ENV'] !== 'production') {
    return next(error);
  }

  const requestId = getRequestId(req);
  const isOperational = isOperationalError(error);
  
  // Only send operational errors to client in production
  if (isOperational && error instanceof AppError) {
    sendError(
      res,
      error.message,
      error.statusCode,
      undefined,
      requestId
    );
  } else {
    // Send generic error message for non-operational errors
    sendError(
      res,
      'Something went wrong',
      500,
      undefined,
      requestId
    );
  }
};

/**
 * Error middleware chain
 * Use this to apply all error handlers in the correct order
 */
export const errorMiddlewareChain = [
  validationErrorHandler,
  corsErrorHandler,
  timeoutErrorHandler,
  dbErrorHandler,
  developmentErrorHandler,
  productionErrorHandler,
  errorHandler,
];

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = (server: any) => {
  return (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    
    server.close((err: any) => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      logger.info('Server closed successfully');
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
};

/**
 * Setup process error handlers
 */
export const setupProcessErrorHandlers = (server?: any) => {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, _promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection:', {
      reason: reason?.message || reason,
      stack: reason?.stack,
    });
    
    if (server) {
      gracefulShutdown(server)('unhandledRejection');
    } else {
      process.exit(1);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    process.exit(1);
  });

  // Handle graceful shutdown signals
  if (server) {
    process.on('SIGTERM', gracefulShutdown(server));
    process.on('SIGINT', gracefulShutdown(server));
  }
};

export default errorHandler;