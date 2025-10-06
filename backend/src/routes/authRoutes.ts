import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/errors';

const router = Router();

// Public routes (no authentication required)
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', asyncHandler(authController.register));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', asyncHandler(authController.login));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', asyncHandler(authController.refreshToken));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(authController.logout));

// Protected routes (authentication required)
/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, asyncHandler(authController.getProfile));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticate, asyncHandler(authController.updateProfile));

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, asyncHandler(authController.changePassword));

// Admin only routes
/**
 * @route   GET /api/auth/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/users', authenticate, requireAdmin, asyncHandler(authController.getAllUsers));

/**
 * @route   PUT /api/auth/users/:userId/role
 * @desc    Update user role (admin only)
 * @access  Private/Admin
 */
router.put('/users/:userId/role', authenticate, requireAdmin, asyncHandler(authController.updateUserRole));

/**
 * @route   PUT /api/auth/users/:userId/status
 * @desc    Update user status (admin only)
 * @access  Private/Admin
 */
router.put('/users/:userId/status', authenticate, requireAdmin, asyncHandler(authController.updateUserStatus));

/**
 * @route   DELETE /api/auth/users/:userId
 * @desc    Delete user (admin only)
 * @access  Private/Admin
 */
router.delete('/users/:userId', authenticate, requireAdmin, asyncHandler(authController.deleteUser));

/**
 * @route   POST /api/auth/create-admin
 * @desc    Create admin user (admin only)
 * @access  Private/Admin
 */
router.post('/create-admin', authenticate, requireAdmin, asyncHandler(authController.createAdmin));

export default router;