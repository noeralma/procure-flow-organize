import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/environment';
import { connectDatabase } from '@/config/database';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/security';
import pengadaanRoutes from '@/routes/pengadaanRoutes';
import healthRoutes from '@/routes/healthRoutes';
import { logger } from '@/utils/logger';

class Server {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (config.nodeEnv !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      }));
    }

    // Custom request logger
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    // Health check
    this.app.use('/health', healthRoutes);

    // Import main API routes synchronously
    try {
      const apiRoutes = require('./routes/index').default;
      this.app.use(config.apiPrefix, apiRoutes);
    } catch (error) {
      logger.error('Failed to load API routes:', error);
    }

    // API routes (legacy - will be moved to index.ts)
    this.app.use(`${config.apiPrefix}/${config.apiVersion}/pengadaan`, pengadaanRoutes);

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'Procurement Flow API',
        version: config.apiVersion,
        status: 'running',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database (non-blocking in development)
      await connectDatabase();
      
      // Start server
      this.app.listen(this.port, () => {
        logger.info(`🚀 Server is running on port ${this.port}`);
        logger.info(`📊 Environment: ${config.nodeEnv}`);
        logger.info(`🌐 API Base URL: http://localhost:${this.port}${config.apiPrefix}/${config.apiVersion}`);
        logger.info(`🏥 Health Check: http://localhost:${this.port}/health`);
      });
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      if (config.nodeEnv === 'production') {
        process.exit(1);
      } else {
        logger.warn('⚠️  Server startup failed, but continuing in development mode');
      }
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new Server();
  server.start().catch((error) => {
    logger.error('❌ Server startup failed:', error);
    if (config.nodeEnv === 'production') {
      process.exit(1);
    } else {
      logger.warn('⚠️  Server startup failed, but continuing in development mode');
      // Keep the process alive in development
      setInterval(() => {}, 1000);
    }
  });
}

export default Server;
export { Server };