import { logger } from './logger';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (details) {
      this.details = details;
    }

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    details?: string
  ) {
    super(message, 400, details);
    if (field) {
      this.field = field;
    }
    this.value = value;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: string) {
    super(message, 401, details);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: string) {
    super(message, 403, details);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: string) {
    super(`${resource} not found`, 404, details);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: string) {
    super(message, 409, details);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: string) {
    super(message, 429, details);
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: string) {
    super(message, 500, details);
  }
}

/**
 * External service error class
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message: string = 'External service error',
    statusCode: number = 502,
    details?: string
  ) {
    super(message, statusCode, details);
    this.service = service;
  }
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    details?: string;
    field?: string;
    value?: unknown;
    timestamp: string;
    path?: string;
    method?: string;
    requestId?: string;
  };
}

/**
 * Create standardized error response
 */
export const createErrorResponse = (
  error: AppError | Error,
  path?: string,
  method?: string,
  requestId?: string
): ErrorResponse => {
  const isAppError = error instanceof AppError;
  
  const response: ErrorResponse = {
    error: {
      message: error.message,
      statusCode: isAppError ? error.statusCode : 500,
      timestamp: new Date().toISOString(),
    },
  };

  // Add optional fields
  if (isAppError && error.details) {
    response.error.details = error.details;
  }

  if (error instanceof ValidationError) {
    if (error.field) {
      response.error.field = error.field;
    }
    response.error.value = error.value;
  }

  if (path) {
    response.error.path = path;
  }

  if (method) {
    response.error.method = method;
  }

  if (requestId) {
    response.error.requestId = requestId;
  }

  return response;
};

/**
 * Handle async errors in route handlers
 */
export const asyncHandler = (
  fn: (req: any, res: any, next: any) => Promise<any>
) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Check if error is operational (safe to expose to client)
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Log error with appropriate level
 */
export const logError = (error: Error, context?: Record<string, unknown>): void => {
  const isOperational = isOperationalError(error);
  const logLevel = isOperational ? 'warn' : 'error';
  
  const logData: any = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    isOperational,
    ...context,
  };

  if (error instanceof AppError) {
    logData.statusCode = error.statusCode;
    logData.details = error.details;
  }

  logger[logLevel]('Error occurred:', logData);
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (reason: any, promise: Promise<any>): void => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
  });
  
  // In production, you might want to gracefully shutdown
  if (process.env['NODE_ENV'] === 'production') {
    process.exit(1);
  }
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (error: Error): void => {
  logger.error('Uncaught Exception:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
  });
  
  // Always exit on uncaught exceptions
  process.exit(1);
};

/**
 * MongoDB error handler
 */
export const handleMongoError = (error: any): AppError => {
  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    const value = field ? error.keyValue?.[field] : undefined;
    return new ConflictError(
      `${field} '${value}' already exists`,
      `Duplicate value for field: ${field}`
    );
  }

  // Validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    return new ValidationError(
      'Validation failed',
      undefined,
      undefined,
      errors.join(', ')
    );
  }

  // Cast error
  if (error.name === 'CastError') {
    return new ValidationError(
      `Invalid ${error.path}: ${error.value}`,
      error.path,
      error.value
    );
  }

  // Default to database error
  return new DatabaseError(
    'Database operation failed',
    error.message
  );
};

/**
 * JWT error handler
 */
export const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active');
  }

  return new AuthenticationError('Authentication failed');
};

/**
 * Error type guards
 */
export const isValidationError = (error: any): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isAuthenticationError = (error: any): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

export const isAuthorizationError = (error: any): error is AuthorizationError => {
  return error instanceof AuthorizationError;
};

export const isNotFoundError = (error: any): error is NotFoundError => {
  return error instanceof NotFoundError;
};

export const isConflictError = (error: any): error is ConflictError => {
  return error instanceof ConflictError;
};

export const isDatabaseError = (error: any): error is DatabaseError => {
  return error instanceof DatabaseError;
};

export const isExternalServiceError = (error: any): error is ExternalServiceError => {
  return error instanceof ExternalServiceError;
};