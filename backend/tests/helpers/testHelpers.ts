import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import UserModel, { UserRole, UserStatus } from '../../src/models/User';
import PengadaanModel from '../../src/models/Pengadaan';
import { generateToken } from '../../src/middleware/auth';

/**
 * Test user data factory
 */
export const createTestUser = async (overrides: Partial<any> = {}) => {
  // Only create user if we have an active MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB not connected - cannot create test user');
  }

  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    ...overrides,
  };

  const user = new UserModel(userData);
  await user.save();
  return user;
};

/**
 * Create test admin user
 */
export const createTestAdmin = async (overrides: Partial<any> = {}) => {
  return createTestUser({
    username: 'testadmin',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    ...overrides,
  });
};

/**
 * Generate auth token for testing
 */
export const generateTestToken = (userId: string, email: string, role: UserRole = UserRole.USER, status: UserStatus = UserStatus.ACTIVE) => {
  return generateToken({ userId, email, role, status });
};

/**
 * Create authenticated request helper
 */
export const authenticatedRequest = (app: Express, token: string) => {
  return request(app).set('Authorization', `Bearer ${token}`);
};

/**
 * Test pengadaan data factory
 */
export const createTestPengadaan = async (overrides: Partial<any> = {}) => {
  const pengadaanData = {
    nama: 'Test Pengadaan',
    deskripsi: 'Test description',
    kategori: 'barang',
    estimasiBudget: 1000000,
    tanggalMulai: new Date(),
    tanggalSelesai: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'draft',
    vendor: 'Test Vendor',
    namaPaket: 'Test Package',
    ...overrides,
  };

  const pengadaan = new PengadaanModel(pengadaanData);
  await pengadaan.save();
  return pengadaan;
};

/**
 * Clean up test data
 */
export const cleanupTestData = async () => {
  // Only clean up if we have an active MongoDB connection
  if (mongoose.connection.readyState === 1) {
    await UserModel.deleteMany({});
    await PengadaanModel.deleteMany({});
  }
};

/**
 * Wait for async operations
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock request object
 */
export const mockRequest = (overrides: any = {}): any => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides,
  };
};

/**
 * Mock response object
 */
export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock next function
 */
export const mockNext = jest.fn();

/**
 * Test data validation helper
 */
export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toContain('validation');
  
  if (field) {
    expect(response.body.details).toContain(field);
  }
};

/**
 * Test authentication error helper
 */
export const expectAuthenticationError = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toMatch(/authentication|token|unauthorized/i);
};

/**
 * Test authorization error helper
 */
export const expectAuthorizationError = (response: any) => {
  expect(response.status).toBe(403);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toMatch(/authorization|access|forbidden/i);
};

export default {
  createTestUser,
  createTestAdmin,
  generateTestToken,
  authenticatedRequest,
  createTestPengadaan,
  cleanupTestData,
  waitFor,
  mockRequest,
  mockResponse,
  mockNext,
  expectValidationError,
  expectAuthenticationError,
  expectAuthorizationError,
};