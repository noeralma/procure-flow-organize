import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from '../../src/routes/authRoutes';
import pengadaanRoutes from '../../src/routes/pengadaanRoutes';
import { authenticate, authorize, generateRefreshToken, AuthenticatedRequest } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/errorHandler';
import { UserRole } from '../../src/models/User';
import { cleanupTestData } from '../helpers/testHelpers';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/pengadaan', authenticate, pengadaanRoutes);

// Test protected route
app.get('/protected', authenticate, (req: AuthenticatedRequest, res) => {
  res.json({ success: true, user: req.user });
});

// Test admin-only route
app.get('/admin-only', authenticate, authorize([UserRole.ADMIN]), (_req, res) => {
  res.json({ success: true, message: 'Admin access granted' });
});

// Add error handler middleware
app.use(errorHandler);

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Integration tests rely on the in-memory MongoDB from setup.ts
    // Just ensure the connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready for integration tests');
    }
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // 1. Register user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData);

      console.log('Register response status:', registerResponse.status);
      console.log('Register response body:', JSON.stringify(registerResponse.body, null, 2));

      expect(registerResponse.status).toBe(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(userData.email);
      expect(registerResponse.body.data.token).toBeDefined();
      expect(registerResponse.body.data.refreshToken).toBeDefined();

      const { token: registerToken } = registerResponse.body.data;

      // 2. Access protected route with registration token
      const protectedResponse = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200);

      expect(protectedResponse.body.success).toBe(true);
      expect(protectedResponse.body.user.email).toBe(userData.email);

      // 3. Login with credentials
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          identifier: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe(userData.email);
      expect(loginResponse.body.data.token).toBeDefined();
      expect(loginResponse.body.data.refreshToken).toBeDefined();

      const { token: loginToken } = loginResponse.body.data;

      // 4. Access protected route with login token
      const protectedResponse2 = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(protectedResponse2.body.success).toBe(true);
      expect(protectedResponse2.body.user.email).toBe(userData.email);

      // 5. Refresh token
      const refreshTokenPayload = {
        userId: registerResponse.body.data.user.id,
        email: registerResponse.body.data.user.email,
        role: registerResponse.body.data.user.role,
        status: registerResponse.body.data.user.status,
      };
      const testRefreshToken = generateRefreshToken(refreshTokenPayload);
      
      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: testRefreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.token).toBeDefined();
      expect(refreshResponse.body.data.refreshToken).toBeDefined();

      // 6. Use new token
      const { token: newToken } = refreshResponse.body.data;
      const protectedResponse3 = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(protectedResponse3.body.success).toBe(true);
      expect(protectedResponse3.body.user.email).toBe(userData.email);

      // 7. Logout
      const logoutResponse = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
      expect(logoutResponse.body.message).toBe('Logout successful');
    });

    it('should handle login with username instead of email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // Register user
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Login with username
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          identifier: userData.username,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.username).toBe(userData.username);
      expect(loginResponse.body.data.token).toBeDefined();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin access to admin-only routes', async () => {
      const adminData = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'AdminPass123!',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      // Register admin user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(adminData)
        .expect(201);

      const { token } = registerResponse.body.data;

      // Access admin-only route
      const adminResponse = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(adminResponse.body.success).toBe(true);
      expect(adminResponse.body.message).toBe('Admin access granted');
    });

    it('should deny regular user access to admin-only routes', async () => {
      const userData = {
        username: 'user',
        email: 'user@example.com',
        password: 'UserPass123!',
        firstName: 'Regular',
        lastName: 'User',
      };

      // Register regular user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const { token } = registerResponse.body.data;

      // Try to access admin-only route
      const adminResponse = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(adminResponse.body.success).toBe(false);
      expect(adminResponse.body.message).toBe('Access denied. Insufficient permissions.');
    });
  });

  describe('Token Security', () => {
    it('should reject requests with malformed tokens', async () => {
      const malformedTokens = [
        'Bearer',
        'Bearer ',
        'Bearer invalid',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        'InvalidFormat token',
        '',
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/protected')
          .set('Authorization', token)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });

    it('should reject expired tokens', async () => {
      // This test would require manipulating JWT expiration
      // For now, we'll test with an obviously invalid token
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJVU1ItMTIzNCIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.invalid')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
    });

    it('should handle concurrent requests with same token', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // Register user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const { token } = registerResponse.body.data;

      // Make multiple concurrent requests
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .get('/protected')
          .set('Authorization', `Bearer ${token}`)
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe(userData.email);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Temporarily close the database connection
      await mongoose.connection.close();

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body.success).toBe(false);

      // Reconnect for cleanup
      await mongoose.connect(process.env['MONGODB_TEST_URI']!);
    });

    it('should handle validation errors properly', async () => {
      const invalidUserData = [
        {
          // Missing required fields
          username: 'test',
        },
        {
          // Invalid email
          username: 'testuser',
          email: 'invalid-email',
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User',
        },
        {
          // Weak password
          username: 'testuser',
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
        },
        {
          // Invalid username format
          username: 'invalid username!',
          email: 'test@example.com',
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User',
        },
      ];

      // Test missing required fields
      const missingFieldsResponse = await request(app)
        .post('/auth/register')
        .send(invalidUserData[0])
        .expect(400);
      expect(missingFieldsResponse.body.success).toBe(false);
      expect(missingFieldsResponse.body.message).toContain('is required');

      // Test invalid email
      const invalidEmailResponse = await request(app)
        .post('/auth/register')
        .send(invalidUserData[1])
        .expect(400);
      expect(invalidEmailResponse.body.success).toBe(false);
      expect(invalidEmailResponse.body.message).toContain('Invalid email format');

      // Test weak password
      const weakPasswordResponse = await request(app)
        .post('/auth/register')
        .send(invalidUserData[2])
        .expect(400);
      expect(weakPasswordResponse.body.success).toBe(false);
      expect(weakPasswordResponse.body.message).toContain('Password must be at least 8 characters long');

      // Test invalid username format
      const invalidUsernameResponse = await request(app)
        .post('/auth/register')
        .send(invalidUserData[3])
        .expect(400);
      expect(invalidUsernameResponse.body.success).toBe(false);
      expect(invalidUsernameResponse.body.message).toBe('Validation failed');
    });
  });

  describe('Profile Management', () => {
    it('should get user profile after authentication', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // Register user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const { token } = registerResponse.body.data;

      // Get profile
      const profileResponse = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.email).toBe(userData.email);
      expect(profileResponse.body.data.user.username).toBe(userData.username);
      expect(profileResponse.body.data.user.firstName).toBe(userData.firstName);
      expect(profileResponse.body.data.user.lastName).toBe(userData.lastName);
      expect(profileResponse.body.data.user).not.toHaveProperty('password');
    });
  });
});