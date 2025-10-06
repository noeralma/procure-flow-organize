import { authenticate, authorize } from '../../../src/middleware/auth';
import { UserRole } from '../../../src/models/User';
import { createTestUser, cleanupTestData, mockRequest, mockResponse, mockNext } from '../../helpers/testHelpers';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('auth middleware', () => {
    it('should authenticate user with valid token', async () => {
      const user = await createTestUser();
      const token = user.generateAuthToken();

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe((user._id as any).toString());
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext;

      await authenticate(req, res, next);

      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'InvalidFormat',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticate(req, res, next);

      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticate(req, res, next);

      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      const user = await createTestUser();
      const expiredToken = jwt.sign(
        { userId: (user._id as any).toString() },
        process.env['JWT_SECRET'] as string,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticate(req, res, next);

      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request for non-existent user', async () => {
      const fakeToken = jwt.sign(
        { userId: 'USR-9999' },
        process.env['JWT_SECRET'] as string,
        { expiresIn: '1h' }
      );

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${fakeToken}`,
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticate(req, res, next);

      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept token from x-auth-token header', async () => {
      const user = await createTestUser();
      const token = user.generateAuthToken();

      const req = mockRequest({
        headers: {
          'x-auth-token': token,
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe((user._id as any).toString());
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    it('should allow access for user with required role', async () => {
      const adminUser = await createTestUser({ role: UserRole.ADMIN });
      const token = adminUser.generateAuthToken();

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = mockNext;

      // First authenticate
      await authenticate(req, res, next);
      expect(req.user).toBeDefined();

      // Reset mocks for role check
      jest.clearAllMocks();

      // Then check role
      const roleMiddleware = authorize([UserRole.ADMIN]);
      await roleMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for user without required role', async () => {
      const regularUser = await createTestUser({ role: UserRole.USER });
      const token = regularUser.generateAuthToken();

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = mockNext;

      // First authenticate
      await authenticate(req, res, next);
      expect(req.user).toBeDefined();

      // Reset mocks for role check
      jest.clearAllMocks();

      // Then check role
      const roleMiddleware = authorize([UserRole.ADMIN]);
      await roleMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated user', async () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext;

      const roleMiddleware = authorize([UserRole.ADMIN]);
      await roleMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access for multiple roles', async () => {
      const adminUser = await createTestUser({ role: UserRole.ADMIN });
      const token = adminUser.generateAuthToken();

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = mockNext;

      // First authenticate
      await authenticate(req, res, next);
      expect(req.user).toBeDefined();

      // Reset mocks for role check
      jest.clearAllMocks();

      // Then check role (allowing both ADMIN and USER)
      const roleMiddleware = authorize([UserRole.ADMIN, UserRole.USER]);
      await roleMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user role not in allowed roles array', async () => {
      const regularUser = await createTestUser({ role: UserRole.USER });
      const token = regularUser.generateAuthToken();

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = mockNext;

      // First authenticate
      await authenticate(req, res, next);
      expect(req.user).toBeDefined();

      // Reset mocks for role check
      jest.clearAllMocks();

      // Then check role (allowing only ADMIN)
      const roleMiddleware = authorize([UserRole.ADMIN]);
      await roleMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work with auth and requireRole middleware together', async () => {
      const adminUser = await createTestUser({ role: UserRole.ADMIN });
      const token = adminUser.generateAuthToken();

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = mockNext;

      // Simulate middleware chain
      await authenticate(req, res, next);
      
      if (req.user) {
        jest.clearAllMocks();
        const roleMiddleware = authorize([UserRole.ADMIN]);
        await roleMiddleware(req, res, next);
      }

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe((adminUser._id as any).toString());
      expect(req.user.role).toBe(UserRole.ADMIN);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail role check if auth fails first', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      // Auth should fail first
      await authenticate(req, res, next);

      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();

      // Role middleware shouldn't even be called in real scenario
      // but if it were, it should also fail
      jest.clearAllMocks();
      const roleMiddleware = authorize([UserRole.ADMIN]);
      await roleMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});