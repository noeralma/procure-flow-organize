import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config/environment';
import { getRequestId } from '../utils/response';
import UserModel, { UserRole, UserStatus } from '../models/User';

/**
 * Extended Request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    iat?: number | undefined;
    exp?: number | undefined;
  };
  token?: string;
}

/**
 * JWT payload interface
 */
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  iat?: number;
  exp?: number;
}

/**
 * Extract token from request headers
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for token in cookies (if using cookie-based auth)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // Check for token in query parameters (not recommended for production)
  if (req.query['token'] && typeof req.query['token'] === 'string') {
    return req.query['token'];
  }
  
  return null;
};

/**
 * Verify JWT token and return payload
 */
const verifyToken = (token: string): Promise<JWTPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwtSecret, (err, decoded) => {
      if (err) {
        reject(new AuthenticationError('Invalid or expired token'));
      } else {
        resolve(decoded as JWTPayload);
      }
    });
  });
};

/**
 * Authentication middleware
 * Verifies JWT token and adds user information to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const token = extractToken(req);
    
    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        requestId,
      });
      
      throw new AuthenticationError('Access token is required');
    }
    
    // Verify token
    const decoded = await verifyToken(token);
    
    // Get user from database to verify they still exist and are active
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError('Account is not active');
    }

    // Check if password was changed after token was issued
    // Note: passwordChangedAt field is not implemented in current User model
    // This check is commented out until the field is added to the schema
    /*
    if (decoded.iat && user.passwordChangedAt) {
      const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < passwordChangedTimestamp) {
        throw new AuthenticationError('Token is invalid due to recent password change');
      }
    }
    */
    
    // Add user information to request
    req.user = {
      id: (user._id as any).toString(),
      email: user.email,
      role: user.role,
      status: user.status,
      iat: decoded.iat || undefined,
      exp: decoded.exp || undefined,
    };
    req.token = token;
    
    logger.debug('User authenticated successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      requestId,
    });
    
    next();
  } catch (error) {
    const requestId = getRequestId(req);
    
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method,
      ip: req.ip,
      requestId,
    });
    
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else if (error instanceof jwt.NotBeforeError) {
      next(new AuthenticationError('Token not active'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication middleware
 * Adds user information if token is present, but doesn't require it
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = await verifyToken(token);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        status: decoded.status,
        iat: decoded.iat,
        exp: decoded.exp,
      };
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Authorization middleware factory
 * Checks if user has required roles
 */
export const authorize = (
  roles?: UserRole[]
) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const requestId = getRequestId(req);
    
    if (!req.user) {
      logger.warn('Authorization failed: User not authenticated', {
        path: req.path,
        method: req.method,
        requestId,
      });
      
      throw new AuthenticationError('Authentication required');
    }
    
    const { role } = req.user;
    
    // Check roles
    if (roles && roles.length > 0) {
      if (!roles.includes(role)) {
        logger.warn('Authorization failed: Insufficient role', {
          userId: req.user.id,
          userRole: role,
          requiredRoles: roles,
          path: req.path,
          method: req.method,
          requestId,
        });
        
        throw new AuthorizationError('Insufficient permissions');
      }
    }
    
    logger.debug('User authorized successfully', {
      userId: req.user.id,
      role,
      requestId,
    });
    
    next();
  };
};

/**
 * Resource ownership middleware
 * Checks if user owns the requested resource
 */
export const checkOwnership = (
  resourceIdParam: string = 'id',
  userIdField: string = 'userId'
) => {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestId = getRequestId(req);
      
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;
      
      // This would typically involve a database query to check ownership
      // For now, we'll assume the resource has a userId field
      // In a real implementation, you'd query the database here
      
      logger.debug('Checking resource ownership', {
        userId,
        resourceId,
        resourceIdParam,
        userIdField,
        requestId,
      });
      
      // Skip ownership check for admin users
      if (req.user.role === 'admin') {
        logger.debug('Admin user bypassing ownership check', {
          userId,
          role: req.user.role,
          requestId,
        });
        return next();
      }
      
      // TODO: Implement actual ownership check with database query
      // For now, we'll allow all authenticated users
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting by user
 */
export const userRateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const requestId = getRequestId(req);
    
    if (!req.user) {
      return next();
    }
    
    const userId = req.user.id;
    const now = Date.now();
    const userLimit = userRequests.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize user limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      logger.warn('User rate limit exceeded', {
        userId,
        count: userLimit.count,
        maxRequests,
        requestId,
      });
      
      throw new AuthorizationError('Rate limit exceeded');
    }
    
    userLimit.count++;
    next();
  };
};

/**
 * API key authentication middleware
 * For service-to-service communication
 */
export const authenticateApiKey = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const requestId = getRequestId(req);
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    logger.warn('API key authentication failed: No API key provided', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      requestId,
    });
    
    throw new AuthenticationError('API key is required');
  }
  
  // TODO: Implement API key validation
  // This would typically involve checking against a database of valid API keys
  const validApiKeys = process.env['VALID_API_KEYS']?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('API key authentication failed: Invalid API key', {
      apiKey: apiKey.substring(0, 8) + '...', // Log only first 8 characters
      path: req.path,
      method: req.method,
      ip: req.ip,
      requestId,
    });
    
    throw new AuthenticationError('Invalid API key');
  }
  
  logger.debug('API key authentication successful', {
    apiKey: apiKey.substring(0, 8) + '...',
    requestId,
  });
  
  next();
};

/**
 * Generate JWT token
 */
export const generateToken = (
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresIn: string = config.jwtExpiresIn
): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn } as jwt.SignOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn } as jwt.SignOptions);
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): Promise<JWTPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwtRefreshSecret, (err: any, decoded: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as JWTPayload);
      }
    });
  });
};

/**
 * Logout middleware
 * Invalidates the current token (would require token blacklisting in production)
 */
export const logout = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const requestId = getRequestId(req);
  
  if (req.user) {
    logger.info('User logged out', {
      userId: req.user.id,
      email: req.user.email,
      requestId,
    });
  }
  
  // TODO: Implement token blacklisting
  // In a production environment, you'd want to add the token to a blacklist
  
  // Clear cookies if using cookie-based auth
  res.clearCookie('token');
  
  next();
};

/**
 * Common role constants
 */
export const ROLES = {
  ADMIN: UserRole.ADMIN,
  USER: UserRole.USER,
} as const;

export const requireAdmin = authorize([UserRole.ADMIN]);
export const requireUser = authorize([UserRole.USER, UserRole.ADMIN]);

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  checkOwnership,
  userRateLimit,
  authenticateApiKey,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  logout,
  ROLES,
  requireAdmin,
  requireUser,
};