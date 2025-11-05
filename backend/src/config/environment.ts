import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/procure-flow'),
  MONGODB_TEST_URI: z.string().default('mongodb://localhost:27017/procure-flow-test'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'), // 5MB
  UPLOAD_PATH: z.string().default('uploads'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('/api'),
});

// Validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

const env = parseResult.data;

// Export configuration object
export const config = {
  // Server
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  
  // Database
  mongodbUri: env.NODE_ENV === 'test' ? env.MONGODB_TEST_URI : env.MONGODB_URI,
  
  // JWT
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  
  // CORS
  corsOrigin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  
  // Rate limiting
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  
  // File upload
  maxFileSize: env.MAX_FILE_SIZE,
  uploadPath: env.UPLOAD_PATH,
  
  // Logging
  logLevel: env.LOG_LEVEL,
  
  // API
  apiVersion: env.API_VERSION,
  apiPrefix: env.API_PREFIX,
  
  // Derived values
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

// Type for configuration
export type Config = typeof config;
// Validate required secrets in production
if (config.isProduction) {
  const requiredSecrets = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'MONGODB_URI',
  ];
  
  const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
  
  if (missingSecrets.length > 0) {
    console.error('❌ Missing required environment variables in production:');
    console.error(missingSecrets.join(', '));
    process.exit(1);
  }
}

// Log successful configuration load (only after logger is available)
if (process.env['NODE_ENV'] !== 'test') {
  // Use setTimeout to ensure logger is initialized after this module
  setTimeout(() => {
    void (async () => {
      try {
        const { logger } = await import('../utils/logger');
        logger.info('✅ Environment configuration loaded successfully');
        logger.info(`📊 Environment: ${config.nodeEnv}`);
        logger.info(`🚀 Port: ${config.port}`);
        logger.info(`🗄️  Database: ${config.mongodbUri.replace(/\/\/.*@/, '//*****@')}`);
      } catch {
        console.log('✅ Environment configuration loaded successfully');
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`🚀 Port: ${config.port}`);
      }
    })();
  }, 0);
}
