import mongoose from 'mongoose';
import { config } from './environment';
import { logger } from '../utils/logger';

// MongoDB connection options
const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
};

// Connection state tracking
let isConnected = false;

/**
 * Connect to MongoDB database with fallback options
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    if (isConnected) {
      logger.info('📊 Database already connected');
      return;
    }

    logger.info('🔄 Connecting to MongoDB...');
    
    // Try primary MongoDB URI first
    try {
      await mongoose.connect(config.mongodbUri, mongooseOptions);
      isConnected = true;
      logger.info('✅ Database connected successfully to primary URI');
    } catch (primaryError) {
      logger.warn('⚠️  Primary MongoDB URI failed, trying local fallback...');
      
      // Try local MongoDB as fallback
      const localUri = process.env['MONGODB_LOCAL_URI'] || 'mongodb://localhost:27017/procure-flow';
      try {
        await mongoose.connect(localUri, mongooseOptions);
        isConnected = true;
        logger.info('✅ Database connected successfully to local MongoDB');
      } catch (localError) {
        logger.error('❌ Both primary and local MongoDB connections failed');
        logger.warn('⚠️  Continuing without database connection for development');
        isConnected = false;
        
        // Don't throw error in development mode, just warn
        if (config.nodeEnv === 'production') {
          throw new Error(`Database connection failed: ${primaryError instanceof Error ? primaryError.message : 'Unknown error'}`);
        }
        return;
      }
    }
    
    // Log connection details (without sensitive info)
    const connection = mongoose.connection;
    logger.info(`📍 Connected to: ${connection.host}:${connection.port}/${connection.name}`);
    
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    logger.warn('⚠️  Continuing without database connection for development');
    isConnected = false;
    
    // Don't throw error in development mode, just warn
    if (config.nodeEnv === 'production') {
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

/**
 * Disconnect from MongoDB database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (!isConnected) {
      logger.info('Database already disconnected');
      return;
    }

    await mongoose.disconnect();
    isConnected = false;
    logger.info('✅ MongoDB disconnected successfully');
    
  } catch (error) {
    logger.error('❌ MongoDB disconnection error:', error);
    throw new Error(`Database disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get database connection status
 */
export const getDatabaseStatus = (): {
  isConnected: boolean;
  readyState: number;
  host?: string;
  name?: string;
} => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
};

/**
 * Clear database (for testing purposes)
 */
export const clearDatabase = async (): Promise<void> => {
  if (!config.isTest) {
    throw new Error('Database clearing is only allowed in test environment');
  }

  try {
    const collections = await mongoose.connection.db?.collections();
    
    if (collections) {
      await Promise.all(
        collections.map(collection => collection.deleteMany({}))
      );
    }
    
    logger.info('✅ Test database cleared successfully');
  } catch (error) {
    logger.error('❌ Error clearing test database:', error);
    throw error;
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  logger.info('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
  logger.error('❌ Mongoose connection error:', error);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  logger.info('🔌 Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await disconnectDatabase();
    logger.info('🛑 Database connection closed due to application termination');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Rejection at:', promise);
  logger.error('🚨 Reason:', reason);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('🚨 Uncaught Exception:', error);
  // Close server & exit process
  process.exit(1);
});

export default {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  clearDatabase,
};