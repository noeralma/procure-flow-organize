import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Set test environment variables before any imports
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-jwt-secret-key-for-testing-only';
process.env['JWT_REFRESH_SECRET'] = 'test-jwt-refresh-secret-key-for-testing-only';
process.env['JWT_EXPIRES_IN'] = '1h';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['MONGODB_TEST_URI'] = 'mongodb://localhost:27017/procapp-test';
process.env['PORT'] = '3001';
process.env['CORS_ORIGIN'] = 'http://localhost:3000';
process.env['RATE_LIMIT_WINDOW_MS'] = '900000';
process.env['RATE_LIMIT_MAX_REQUESTS'] = '100';
process.env['MAX_FILE_SIZE'] = '5242880';
process.env['UPLOAD_PATH'] = 'uploads';
process.env['LOG_LEVEL'] = 'error';
process.env['API_VERSION'] = 'v1';
process.env['API_PREFIX'] = '/api';

let mongoServer: MongoMemoryServer;

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidObjectId(): R;
    }
  }
}

// Custom Jest matcher for ObjectId validation
expect.extend({
  toBeValidObjectId(received: any) {
    const pass = mongoose.Types.ObjectId.isValid(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },
});

// Setup MongoDB Memory Server
beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    // Ensure tests that reference MONGODB_TEST_URI pick up the in-memory URI
    process.env['MONGODB_TEST_URI'] = mongoUri;
    
    await mongoose.connect(mongoUri);
    console.log('🧪 Connected to in-memory MongoDB for testing');
  } catch (error) {
    console.error('Failed to connect to in-memory MongoDB:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('🧹 Disconnected from in-memory MongoDB');
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
});

// Clear all collections before each test
beforeEach(async () => {
  // Clear all collections before each test
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    try {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        if (collection) {
          await collection.deleteMany({});
        }
      }
    } catch (error) {
      console.warn('Warning: Could not clear collections before test:', error);
    }
  }
});

// Mock console methods to reduce noise during testing
const originalConsole = { ...console };
beforeAll(() => {
  // Don't mock console.log for debugging
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

export {};