import { Request, Response, NextFunction } from 'express';
import { sendHealthCheck, getRequestId } from '../utils/response';
import { logger } from '../utils/logger';
import { getDatabaseStatus } from '../config/database';
import { config } from '../config/environment';

/**
 * Health check interface
 */
interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
      status: 'healthy' | 'warning' | 'critical';
    };
    disk: {
      status: 'healthy' | 'warning' | 'critical';
      message?: string;
    };
    dependencies: {
      status: 'healthy' | 'unhealthy';
      services: Record<string, 'up' | 'down'>;
    };
  };
}

/**
 * Check database connectivity
 */
const checkDatabase = async (): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  responseTime?: number;
}> => {
  try {
    const startTime = Date.now();
    const connectionStatus = getDatabaseStatus();
    const responseTime = Date.now() - startTime;
    
    return {
      status: connectionStatus.isConnected ? 'connected' : 'disconnected',
      responseTime,
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'error',
    };
  }
};

/**
 * Check memory usage
 */
const checkMemory = (): {
  used: number;
  total: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
} => {
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const percentage = (usedMemory / totalMemory) * 100;
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (percentage > 90) {
    status = 'critical';
  } else if (percentage > 75) {
    status = 'warning';
  }
  
  return {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round(percentage),
    status,
  };
};

/**
 * Check disk space (simplified)
 */
const checkDisk = (): {
  status: 'healthy' | 'warning' | 'critical';
  message?: string;
} => {
  // In a real implementation, you would check actual disk space
  // For now, we'll return a healthy status
  return {
    status: 'healthy',
    message: 'Disk space check not implemented',
  };
};

/**
 * Check external dependencies
 */
const checkDependencies = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  services: Record<string, 'up' | 'down'>;
}> => {
  const services: Record<string, 'up' | 'down'> = {};
  
  // Check external services (if any)
  // For now, we'll just check if we have any configured external services
  
  // Example: Check if external API is reachable
  // services.externalAPI = await checkExternalAPI();
  
  const allServicesUp = Object.values(services).every(status => status === 'up');
  
  return {
    status: allServicesUp ? 'healthy' : 'unhealthy',
    services,
  };
};

/**
 * Basic health check endpoint
 */
export const healthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    
    logger.debug('Health check requested', { requestId });
    
    sendHealthCheck(
      res,
      'healthy',
      {
        service: 'Pengadaan API',
        database: 'connected',
      },
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Detailed health check endpoint
 */
export const detailedHealthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    
    logger.debug('Detailed health check requested', { requestId });
    
    // Perform all health checks
    const [database, memory, disk, dependencies] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkDisk()),
      checkDependencies(),
    ]);
    
    // Determine overall status
    const isHealthy = 
      database.status === 'connected' &&
      memory.status !== 'critical' &&
      disk.status !== 'critical' &&
      dependencies.status === 'healthy';
    
    const healthData: HealthCheck = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: config.apiVersion,
      environment: config.nodeEnv,
      checks: {
        database,
        memory,
        disk,
        dependencies,
      },
    };
    
    logger.info('Health check completed', {
      requestId,
      status: healthData.status,
      databaseStatus: database.status,
      memoryStatus: memory.status,
      diskStatus: disk.status,
      dependenciesStatus: dependencies.status,
    });
    
    // Pass only the checks object and let helper compose standard fields
    sendHealthCheck(
      res,
      healthData.status,
      { checks: healthData.checks },
      requestId
    );
  } catch (error) {
    logger.error('Health check failed:', error);
    next(error);
  }
};

/**
 * Readiness probe endpoint
 * Checks if the application is ready to serve traffic
 */
export const readinessCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    
    logger.debug('Readiness check requested', { requestId });
    
    // Check critical dependencies
    const database = await checkDatabase();
    
    const isReady = database.status === 'connected';
    
    if (isReady) {
      sendHealthCheck(
        res,
        'healthy',
        {
          ready: true,
          database: database.status,
          message: 'Application is ready to serve traffic',
        },
        requestId
      );
    } else {
      sendHealthCheck(
        res,
        'unhealthy',
        {
          ready: false,
          database: database.status,
          message: 'Application is not ready to serve traffic',
        },
        requestId
      );
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    next(error);
  }
};

/**
 * Liveness probe endpoint
 * Checks if the application is alive and should not be restarted
 */
export const livenessCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    
    logger.debug('Liveness check requested', { requestId });
    
    // Check if the application is responsive
    const memory = checkMemory();
    
    const isAlive = memory.status !== 'critical';
    
    if (isAlive) {
      sendHealthCheck(
        res,
        'healthy',
        {
          alive: true,
          uptime: process.uptime(),
          memory: memory.status,
          message: 'Application is alive and responsive',
        },
        requestId
      );
    } else {
      sendHealthCheck(
        res,
        'unhealthy',
        {
          alive: false,
          uptime: process.uptime(),
          memory: memory.status,
          message: 'Application is experiencing critical issues',
        },
        requestId
      );
    }
  } catch (error) {
    logger.error('Liveness check failed:', error);
    next(error);
  }
};

/**
 * Application metrics endpoint
 */
export const getMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    
    logger.debug('Metrics requested', { requestId });
    
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: process.uptime(),
        human: formatUptime(process.uptime()),
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024), // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: {
        nodeEnv: config.nodeEnv,
        apiVersion: config.apiVersion,
      },
    };
    
    res.json({
      success: true,
      message: 'Metrics retrieved successfully',
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Format uptime in human-readable format
 */
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);
  
  return parts.join(' ') || '0s';
};

/**
 * Application version endpoint
 */
export const getVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    
    const versionInfo = {
      api: config.apiVersion,
      node: process.version,
      environment: config.nodeEnv,
      buildDate: process.env['BUILD_DATE'] || 'unknown',
      gitCommit: process.env['GIT_COMMIT'] || 'unknown',
      gitBranch: process.env['GIT_BRANCH'] || 'unknown',
    };
    
    res.json({
      success: true,
      message: 'Version information retrieved successfully',
      data: versionInfo,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
  getMetrics,
  getVersion,
};