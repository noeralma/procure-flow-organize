import { Router } from 'express';
import permissionController from '../controllers/permissionController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/errors';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/permissions/request
 * @desc    Request permission to edit a form
 * @access  Private
 */
router.post('/request', asyncHandler(permissionController.requestPermission));

/**
 * @route   GET /api/permissions/my-requests
 * @desc    Get current user's permission requests
 * @access  Private
 */
router.get('/my-requests', asyncHandler(permissionController.getUserPermissions));

/**
 * @route   GET /api/permissions/check/:pengadaanId
 * @desc    Check if user has permission to edit a specific pengadaan
 * @access  Private
 */
router.get('/check/:pengadaanId', asyncHandler(permissionController.checkEditPermission));

/**
 * @route   DELETE /api/permissions/:permissionId
 * @desc    Revoke/cancel a permission request
 * @access  Private
 */
router.delete('/:permissionId', asyncHandler(permissionController.revokePermission));

// Admin only routes
/**
 * @route   GET /api/permissions/pending
 * @desc    Get all pending permission requests (admin only)
 * @access  Private/Admin
 */
router.get('/pending', requireAdmin, asyncHandler(permissionController.getPendingRequests));

/**
 * @route   GET /api/permissions/stats
 * @desc    Get permission statistics (admin only)
 * @access  Private/Admin
 */
router.get('/stats', requireAdmin, asyncHandler(permissionController.getPermissionStats));

/**
 * @route   PUT /api/permissions/:permissionId/respond
 * @desc    Respond to permission request (admin only)
 * @access  Private/Admin
 */
router.put('/:permissionId/respond', requireAdmin, asyncHandler(permissionController.respondToRequest));

/**
 * @route   POST /api/permissions/bulk-respond
 * @desc    Bulk respond to permission requests (admin only)
 * @access  Private/Admin
 */
router.post('/bulk-respond', requireAdmin, asyncHandler(permissionController.bulkRespondToRequests));

/**
 * @route   DELETE /api/permissions/cleanup
 * @desc    Clean up expired permissions (admin only)
 * @access  Private/Admin
 */
router.delete('/cleanup', requireAdmin, asyncHandler(permissionController.cleanupExpiredPermissions));

export default router;