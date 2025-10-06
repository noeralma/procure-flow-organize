import request from 'supertest';
import express from 'express';
import authController from '../../../src/controllers/authController';
import authRoutes from '../../../src/routes/authRoutes';
import { generateRefreshToken } from '../../../src/middleware/auth';
import { createTestUser, cleanupTestData, mockRequest, mockResponse, mockNext } from '../../helpers/testHelpers';
import { errorHandler } from '../../../src/middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
// Add error handling middleware
app.use(errorHandler);

describe('Auth Controller', () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
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
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email format');
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Password must be at least');
    });

    it('should return 409 for duplicate email', async () => {
      const email = 'test@example.com';
      await createTestUser({ email });

      const userData = {
        username: 'testuser2',
        email,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered');
    });

    it('should return 409 for duplicate username', async () => {
      const username = 'testuser';
      await createTestUser({ username });

      const userData = {
        username,
        email: 'test2@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already taken');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with email successfully', async () => {
      const email = 'test@example.com';
      const password = 'TestPass123!';
      await createTestUser({ email, password });

      const response = await request(app)
        .post('/auth/login')
        .send({ identifier: email, password })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should login with username successfully', async () => {
      const username = 'testuser';
      const password = 'TestPass123!';
      await createTestUser({ username, password });

      const response = await request(app)
        .post('/auth/login')
        .send({ identifier: username, password })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.username).toBe(username);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'TestPass123!';
      await createTestUser({ email, password });

      const response = await request(app)
        .post('/auth/login')
        .send({ identifier: email, password: 'wrongpassword' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ identifier: 'nonexistent@example.com', password: 'TestPass123!' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ identifier: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('password is required');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const user = await createTestUser();
      const refreshToken = generateRefreshToken({
        userId: (user._id as any).toString(),
        email: user.email,
        role: user.role,
        status: user.status,
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Refresh token is required');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await createTestUser();
      const token = user.generateAuthToken();

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('GET /auth/profile', () => {
    it('should get user profile successfully', async () => {
      const user = await createTestUser();
      const token = user.generateAuthToken();

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe((user._id as any).toString());
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
    });
  });

  describe('Controller Functions Direct Testing', () => {
    describe('register function', () => {
      it('should handle registration with valid data', async () => {
        const req = mockRequest({
          body: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
          },
        });
        const res = mockResponse();
        const next = mockNext;

        await authController.register(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'User registered successfully',
            data: expect.objectContaining({
              user: expect.any(Object),
              token: expect.any(String),
              refreshToken: expect.any(String),
            }),
          })
        );
      });

      it('should handle validation errors', async () => {
        const req = mockRequest({
          body: {
            username: 'testuser',
            email: 'invalid-email',
            password: 'weak',
          },
        });
        const res = mockResponse();
        const next = jest.fn();

        await authController.register(req, res, next);

        // Since validation errors are passed to next(), check that next was called with an error
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('login function', () => {
      it('should handle successful login', async () => {
        await createTestUser({
          email: 'test@example.com',
          password: 'TestPass123!',
        });

        const req = mockRequest({
          body: {
            identifier: 'test@example.com',
            password: 'TestPass123!',
          },
        });
        const res = mockResponse();
        const next = mockNext;

        await authController.login(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Login successful',
            data: expect.objectContaining({
              user: expect.any(Object),
              token: expect.any(String),
              refreshToken: expect.any(String),
            }),
          })
        );
      });

      it('should handle invalid credentials', async () => {
        const req = mockRequest({
          body: {
            identifier: 'nonexistent@example.com',
            password: 'TestPass123!',
          },
        });
        const res = mockResponse();
        const next = jest.fn();

        await authController.login(req, res, next);

        // Since authentication errors are passed to next(), check that next was called with an error
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });
});