import { Router } from "express";
import healthController from "../controllers/healthController";
import { asyncHandler } from "../utils/errors";
import { healthCheckBypass } from "../middleware/security";

const router = Router();

/**
 * Apply health check bypass middleware to all routes
 * This exempts health check routes from rate limiting and some security checks
 */
router.use(healthCheckBypass);

/**
 * @route   GET /health
 * @desc    Basic health check - returns simple status
 * @access  Public
 * @returns { status: 'ok' | 'error', timestamp: string }
 */
router.get("/", asyncHandler(healthController.healthCheck));

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with system information
 * @access  Public
 * @returns Comprehensive health status including database, memory, etc.
 */
router.get("/detailed", asyncHandler(healthController.detailedHealthCheck));

/**
 * @route   GET /health/ready
 * @desc    Readiness probe - checks if application is ready to serve traffic
 * @access  Public
 * @returns { ready: boolean, checks: object }
 */
router.get("/ready", asyncHandler(healthController.readinessCheck));

/**
 * @route   GET /health/live
 * @desc    Liveness probe - checks if application is alive
 * @access  Public
 * @returns { alive: boolean, uptime: number }
 */
router.get("/live", asyncHandler(healthController.livenessCheck));

/**
 * @route   GET /health/metrics
 * @desc    Application metrics and performance data
 * @access  Public
 * @returns System metrics including memory, CPU, response times
 */
router.get("/metrics", asyncHandler(healthController.getMetrics));

/**
 * @route   GET /health/version
 * @desc    Application version and build information
 * @access  Public
 * @returns Version, build time, git commit, etc.
 */
router.get("/version", asyncHandler(healthController.getVersion));

/**
 * @route   GET /health/database
 * @desc    Database connectivity check
 * @access  Public
 * @returns Database connection status and statistics
 */
router.get(
  "/database",
  asyncHandler(async (_req, res, _next) => {
    try {
      const { getDatabaseStatus } = await import("../config/database");
      const dbStatus = getDatabaseStatus();

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus.isConnected ? "connected" : "disconnected",
         readyState: dbStatus.readyState,
         host: dbStatus.host,
         name: dbStatus.name,
        },
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        timestamp: new Date().toISOString(),
        database: {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  })
);

/**
 * @route   GET /health/dependencies
 * @desc    External dependencies health check
 * @access  Public
 * @returns Status of external services and APIs
 */
router.get(
  "/dependencies",
  asyncHandler(async (_req, res, _next) => {
    const dependencies = {
      database: "unknown",
      redis: "not_configured",
      external_apis: "not_configured",
      file_storage: "not_configured",
    };

    try {
      // Check database
      const { getDatabaseStatus } = await import("../config/database");
      const dbStatus = getDatabaseStatus();
      dependencies.database = dbStatus.isConnected ? "healthy" : "unhealthy";
    } catch (error) {
      dependencies.database = "error";
    }

    // TODO: Add checks for other dependencies when implemented
    // - Redis cache
    // - External APIs
    // - File storage services
    // - Email services
    // - Logging services

    const allHealthy = Object.values(dependencies).every(
      (status) => status === "healthy" || status === "not_configured"
    );

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      timestamp: new Date().toISOString(),
      dependencies,
      overall_status: allHealthy ? "healthy" : "degraded",
    });
  })
);

/**
 * @route   GET /health/ping
 * @desc    Simple ping endpoint for load balancers
 * @access  Public
 * @returns 'pong'
 */
router.get(
  "/ping",
  asyncHandler(async (_req, res, _next) => {
    res.json({
      message: "pong",
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /health/uptime
 * @desc    Application uptime information
 * @access  Public
 * @returns Uptime in various formats
 */
router.get(
  "/uptime",
  asyncHandler(async (_req, res, _next) => {
    const uptimeSeconds = process.uptime();
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptimeDays = Math.floor(uptimeHours / 24);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptimeSeconds),
        minutes: uptimeMinutes,
        hours: uptimeHours,
        days: uptimeDays,
        human_readable: `${uptimeDays}d ${uptimeHours % 24}h ${
          uptimeMinutes % 60
        }m ${Math.floor(uptimeSeconds % 60)}s`,
        started_at: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
      },
    });
  })
);

/**
 * @route   GET /health/memory
 * @desc    Memory usage information
 * @access  Public
 * @returns Memory statistics
 */
router.get(
  "/memory",
  asyncHandler(async (_req, res, _next) => {
    const memoryUsage = process.memoryUsage();
    const formatBytes = (bytes: number) => {
      const sizes = ["Bytes", "KB", "MB", "GB"];
      if (bytes === 0) return "0 Bytes";
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return (
        Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
      );
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      memory: {
        rss: {
          bytes: memoryUsage.rss,
          formatted: formatBytes(memoryUsage.rss),
          description: "Resident Set Size - total memory allocated",
        },
        heapTotal: {
          bytes: memoryUsage.heapTotal,
          formatted: formatBytes(memoryUsage.heapTotal),
          description: "Total heap allocated",
        },
        heapUsed: {
          bytes: memoryUsage.heapUsed,
          formatted: formatBytes(memoryUsage.heapUsed),
          description: "Heap actually used",
        },
        external: {
          bytes: memoryUsage.external,
          formatted: formatBytes(memoryUsage.external),
          description: "External memory usage",
        },
        arrayBuffers: {
          bytes: memoryUsage.arrayBuffers,
          formatted: formatBytes(memoryUsage.arrayBuffers),
          description: "Memory allocated for ArrayBuffers",
        },
      },
    });
  })
);

/**
 * @route   GET /health/environment
 * @desc    Environment information (sanitized)
 * @access  Public
 * @returns Safe environment information
 */
router.get(
  "/environment",
  asyncHandler(async (_req, res, _next) => {
    const { config } = await import("../config/environment");

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        node_env: config.nodeEnv,
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        api_version: config.apiVersion,
        port: config.port,
        // Don't expose sensitive configuration
      },
    });
  })
);

/**
 * Error handling for health routes
 * Health routes should be resilient and always return a response
 */
router.use((error: any, req: any, res: any, _next: any) => {
  console.error("Health route error:", {
    path: req.path,
    method: req.method,
    error: error.message,
  });

  // Always return a response for health checks
  if (!res.headersSent) {
    res.status(503).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: "Health check failed",
      message: error.message,
      path: req.path,
    });
  }
});

export default router;

/**
 * Health Routes Documentation
 *
 * This router provides comprehensive health monitoring endpoints:
 *
 * **Basic Health Checks:**
 * - GET /health - Simple status check
 * - GET /health/ping - Load balancer ping
 * - GET /health/uptime - Application uptime
 *
 * **Detailed Monitoring:**
 * - GET /health/detailed - Comprehensive health status
 * - GET /health/metrics - Performance metrics
 * - GET /health/memory - Memory usage statistics
 *
 * **Kubernetes/Container Probes:**
 * - GET /health/ready - Readiness probe
 * - GET /health/live - Liveness probe
 *
 * **Dependency Checks:**
 * - GET /health/database - Database connectivity
 * - GET /health/dependencies - External services status
 *
 * **System Information:**
 * - GET /health/version - Application version info
 * - GET /health/environment - Environment details
 *
 * **Features:**
 * - No authentication required
 * - Exempt from rate limiting
 * - Always returns JSON responses
 * - Resilient error handling
 * - Suitable for monitoring tools
 * - Container orchestration ready
 */