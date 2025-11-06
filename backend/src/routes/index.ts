import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { sendSuccess, sendNotFound } from '../utils/response';
import { asyncHandler } from '../utils/errors';

// Import route modules
import pengadaanRoutes from './pengadaanRoutes';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';

// Create main router
const router = Router();
// Module-level API base to avoid scoping issues in handlers
const apiBase = `${config.apiPrefix}/${config.apiVersion}`;

/**
 * API Root endpoint
 * @route   GET /api
 * @desc    API information and available endpoints
 * @access  Public
 */
  router.get(
  '/',
  asyncHandler(async (_req, res, _next) => {
    const apiInfo = {
      name: 'Procure Flow API',
      version: config.apiVersion,
      description: 'Backend API for Procurement Management System',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      endpoints: {
        health: {
          basic: '/health',
          detailed: '/health/detailed',
          ready: '/health/ready',
          live: '/health/live',
          metrics: '/health/metrics',
          version: '/health/version',
        },
        pengadaan: {
          base: `${apiBase}/pengadaan`,
          list: `GET ${apiBase}/pengadaan`,
          create: `POST ${apiBase}/pengadaan`,
          get: `GET ${apiBase}/pengadaan/:id`,
          update: `PUT ${apiBase}/pengadaan/:id`,
          delete: `DELETE ${apiBase}/pengadaan/:id`,
          search: `GET ${apiBase}/pengadaan/search`,
          stats: `GET ${apiBase}/pengadaan/stats`,
          export: `GET ${apiBase}/pengadaan/export`,
          bulk: `POST ${apiBase}/pengadaan/bulk`,
        },
        authentication: {
          base: `${apiBase}/auth`,
          register: `POST ${apiBase}/auth/register`,
          login: `POST ${apiBase}/auth/login`,
          logout: `POST ${apiBase}/auth/logout`,
          refresh: `POST ${apiBase}/auth/refresh`,
          profile: `GET ${apiBase}/auth/profile`,
          updateProfile: `PUT ${apiBase}/auth/profile`,
          changePassword: `PUT ${apiBase}/auth/change-password`,
          users: `GET ${apiBase}/auth/users`,
          updateUserRole: `PUT ${apiBase}/auth/users/:userId/role`,
          updateUserStatus: `PUT ${apiBase}/auth/users/:userId/status`,
          deleteUser: `DELETE ${apiBase}/auth/users/:userId`,
          createAdmin: `POST ${apiBase}/auth/create-admin`,
        },
      },
      documentation: {
        swagger: `${apiBase}/docs`,
        postman: `${apiBase}/postman`,
        openapi: `${apiBase}/openapi.json`,
      },
      support: {
        repository: 'https://github.com/your-org/procure-flow',
        issues: 'https://github.com/your-org/procure-flow/issues',
        documentation: 'https://docs.procure-flow.com',
      },
    };

    sendSuccess(res, apiInfo, 'API information retrieved successfully');
  })
);

/**
 * Mount route modules
 */

// Health check routes (no versioning, always available)
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Permissions module removed for simplification

// Pengadaan routes
router.use('/pengadaan', pengadaanRoutes);
// router.use('/permissions', permissionRoutes);
// router.use('/audit', auditRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/files', fileRoutes);
// router.use('/reports', reportRoutes);
// router.use('/settings', settingsRoutes);

/**
 * API Status endpoint
 * @route   GET /api/status
 * @desc    Quick API status check
 * @access  Public
 */
router.get(
  '/status',
  asyncHandler(async (_req, res, _next) => {
    const status = {
      api: 'operational',
      version: config.apiVersion,
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    sendSuccess(res, status, 'API status retrieved successfully');
  })
);

/**
 * API Documentation endpoints
 */

/**
 * @route   GET /api/docs
 * @desc    API documentation (Swagger UI)
 * @access  Public
 */
router.get(
  '/docs',
  asyncHandler(async (_req, res, _next) => {
    // TODO: Implement Swagger UI
    res.json({
      success: false,
      message: 'API documentation not yet implemented',
      alternatives: {
        postman: `${apiBase}/postman`,
        openapi: `${apiBase}/openapi.json`,
        endpoints: apiBase,
      },
    });
  })
);

/**
 * @route   GET /api/openapi.json
 * @desc    OpenAPI specification
 * @access  Public
 */
router.get(
  '/openapi.json',
  asyncHandler(async (_req, res, _next) => {
    // TODO: Generate OpenAPI specification
    const openApiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Procure Flow API',
        version: config.apiVersion,
        description: 'Backend API for Procurement Management System',
        contact: {
          name: 'API Support',
          email: 'support@procure-flow.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.port}/api/${config.apiVersion}`,
          description: 'Development server',
        },
      ],
      paths: {
        '/health': {
          get: {
            summary: 'Health check',
            description: 'Basic health check endpoint',
            responses: {
              '200': {
                description: 'API is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        // TODO: Add more endpoint specifications
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };

    res.json(openApiSpec);
  })
);

/**
 * @route   GET /api/postman
 * @desc    Postman collection
 * @access  Public
 */
router.get(
  '/postman',
  asyncHandler(async (_req, res, _next) => {
    // TODO: Generate Postman collection
    const postmanCollection = {
      info: {
        name: 'Procure Flow API',
        description: 'Backend API for Procurement Management System',
        version: config.apiVersion,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{jwt_token}}',
            type: 'string',
          },
        ],
      },
      variable: [
        {
          key: 'base_url',
          value: `http://localhost:${config.port}/api/${config.apiVersion}`,
          type: 'string',
        },
        {
          key: 'jwt_token',
          value: '',
          type: 'string',
        },
      ],
      item: [
        {
          name: 'Health',
          item: [
            {
              name: 'Basic Health Check',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{base_url}}/health',
                  host: ['{{base_url}}'],
                  path: ['health'],
                },
              },
            },
          ],
        },
        // TODO: Add more endpoint collections
      ],
    };

    res.json(postmanCollection);
  })
);

/**
 * Catch-all for undefined API routes
 * @route   * /api/*
 * @desc    Handle undefined API endpoints
 * @access  Public
 */
router.use(
  '*',
  asyncHandler(async (req, res, _next) => {
    sendNotFound(res, `API endpoint not found: ${req.method} ${req.originalUrl}`);
  })
);

/**
 * Error handling for API routes
 */
router.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
  console.error('API route error:', {
    path: _req.path,
    method: _req.method,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  next(error as Error);
});

export default router;
/**
 * Routes Index Documentation
 * 
 * This file serves as the main router for the API, organizing and mounting
 * all route modules in a structured way.
 * 
 * **Structure:**
 * - `/api` - API root with information
 * - `/api/health/*` - Health check endpoints
 * - `/api/pengadaan/*` - Pengadaan management
 * - `/api/status` - Quick status check
 * - `/api/docs` - API documentation
 * - `/api/openapi.json` - OpenAPI specification
 * - `/api/postman` - Postman collection
 * 
 * **Features:**
 * - Centralized route management
 * - API versioning support
 * - Comprehensive error handling
 * - Auto-generated documentation
 * - Development tools integration
 * - Structured endpoint organization
 * 
 * **Future Modules:**
 * - Authentication routes
 * - User management routes
 * - Role and permission routes
 * - Audit logging routes
 * - Notification routes
 * - File management routes
 * - Reporting routes
 * - Settings routes
 */
