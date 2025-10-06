import UserModel, { UserRole, UserStatus } from '../../../src/models/User';
import { createTestUser, cleanupTestData } from '../../helpers/testHelpers';

describe('User Model', () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = new UserModel(userData);
      const savedUser = await user.save();

      expect(savedUser.id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.role).toBe(UserRole.USER);
      expect(savedUser.status).toBe(UserStatus.ACTIVE);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
    });

    it('should generate a unique ID for each user', async () => {
      const user1 = await createTestUser({ username: 'user1', email: 'user1@example.com' });
      const user2 = await createTestUser({ username: 'user2', email: 'user2@example.com' });

      expect(user1.id).toBeDefined();
      expect(user2.id).toBeDefined();
      expect(user1.id).not.toBe(user2.id);
      expect(user1.id).toMatch(/^[0-9a-fA-F]{24}$/); // MongoDB ObjectId format
      expect(user2.id).toMatch(/^[0-9a-fA-F]{24}$/); // MongoDB ObjectId format
    });

    it('should hash password before saving', async () => {
      const password = 'TestPass123!';
      const user = new UserModel({
        username: 'testuser',
        email: 'test@example.com',
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      await user.save();
      expect(user.password).not.toBe(password);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('Validation', () => {
    it('should require username', async () => {
      const user = new UserModel({
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      await expect(user.save()).rejects.toThrow(/username.*required/i);
    });

    it('should require email', async () => {
      const user = new UserModel({
        username: 'testuser',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      await expect(user.save()).rejects.toThrow(/email.*required/i);
    });

    it('should validate email format', async () => {
      const user = new UserModel({
        username: 'testuser',
        email: 'invalid-email',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      await expect(user.save()).rejects.toThrow(/valid email/i);
    });

    it('should validate password strength', async () => {
      const user = new UserModel({
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      });

      await expect(user.save()).rejects.toThrow(/password/i);
    });

    it('should validate username format', async () => {
      const user = new UserModel({
        username: 'invalid username!',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      await expect(user.save()).rejects.toThrow(/username/i);
    });

    it('should enforce unique email', async () => {
      await createTestUser({ email: 'test@example.com' });

      const duplicateUser = new UserModel({
        username: 'testuser2',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should enforce unique username', async () => {
      await createTestUser({ username: 'testuser' });

      const duplicateUser = new UserModel({
        username: 'testuser',
        email: 'test2@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });
  });

  describe('Instance Methods', () => {
    it('should compare password correctly', async () => {
      const password = 'TestPass123!';
      const user = await createTestUser({ password });

      const isMatch = await user.comparePassword(password);
      expect(isMatch).toBe(true);

      const isWrongMatch = await user.comparePassword('wrongpassword');
      expect(isWrongMatch).toBe(false);
    });

    it('should generate auth token', async () => {
      const user = await createTestUser();
      const token = user.generateAuthToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should return user response without sensitive data', async () => {
      const user = await createTestUser();
      const response = user.toResponse();

      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('username');
      expect(response).toHaveProperty('email');
      expect(response).toHaveProperty('firstName');
      expect(response).toHaveProperty('lastName');
      expect(response).toHaveProperty('role');
      expect(response).toHaveProperty('status');
      expect(response).not.toHaveProperty('password');
      expect(response).not.toHaveProperty('_id');
    });
  });

  describe('Static Methods', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      await createTestUser({ email });

      const foundUser = await UserModel.findByEmail(email);
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(email);

      const notFound = await UserModel.findByEmail('notfound@example.com');
      expect(notFound).toBeNull();
    });

    it('should find user by username', async () => {
      const username = 'testuser';
      await createTestUser({ username });

      const foundUser = await UserModel.findByUsername(username);
      expect(foundUser).toBeDefined();
      expect(foundUser?.username).toBe(username);

      const notFound = await UserModel.findByUsername('notfound');
      expect(notFound).toBeNull();
    });

    it('should find user by credentials with email', async () => {
      const email = 'test@example.com';
      const password = 'TestPass123!';
      await createTestUser({ email, password });

      const foundUser = await UserModel.findByCredentials(email, password);
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(email);

      const notFound = await UserModel.findByCredentials(email, 'wrongpassword');
      expect(notFound).toBeNull();
    });

    it('should find user by credentials with username', async () => {
      const username = 'testuser';
      const password = 'TestPass123!';
      await createTestUser({ username, password });

      const foundUser = await UserModel.findByCredentials(username, password);
      expect(foundUser).toBeDefined();
      expect(foundUser?.username).toBe(username);

      const notFound = await UserModel.findByCredentials(username, 'wrongpassword');
      expect(notFound).toBeNull();
    });
  });

  describe('JSON Serialization', () => {
    it('should exclude password from JSON output', async () => {
      const user = await createTestUser();
      const json = user.toJSON();

      expect(json).not.toHaveProperty('password');
      expect(json).not.toHaveProperty('_id');
      expect(json).toHaveProperty('id');
    });

    it('should exclude password from object output', async () => {
      const user = await createTestUser();
      const obj = user.toObject();

      expect(obj).not.toHaveProperty('password');
      expect(obj).not.toHaveProperty('_id');
      expect(obj).toHaveProperty('id');
    });
  });
});