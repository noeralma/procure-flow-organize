export default async function globalSetup() {
  // Set test environment
  process.env['NODE_ENV'] = 'test';
  
  // Set required environment variables for testing
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
  
  console.log('🧪 Test environment initialized');
}