import { Router } from 'express';
import pengadaanController from '../controllers/pengadaanController';
import { validate, pengadaanSchemas, validateObjectId, validateCustomId } from '../utils/validation';
import { asyncHandler } from '../utils/errors';
import { authenticate, requireAdmin } from '../middleware/auth';
import { authRateLimiter } from '../middleware/security';

const router = Router();

/**
 * @route   GET /api/pengadaan
 * @desc    Get all pengadaan with pagination, filtering, and search
 * @access  Private (authenticated users)
 * @query   page, limit, search, status, kategori, sortBy, sortOrder, startDate, endDate, minNilai, maxNilai
 */
router.get(
  '/',
  authenticate,
  validate(pengadaanSchemas.query),
  asyncHandler(pengadaanController.getAllPengadaan)
);

/**
 * @route   GET /api/pengadaan/stats
 * @desc    Get pengadaan statistics
 * @access  Private (authenticated users)
 */
router.get(
  '/stats',
  authenticate,
  asyncHandler(pengadaanController.getPengadaanStats)
);

/**
 * @route   GET /api/pengadaan/search
 * @desc    Search pengadaan
 * @access  Private (authenticated users)
 * @query   q (search query), limit
 */
router.get(
  '/search',
  authenticate,
  asyncHandler(pengadaanController.searchPengadaan)
);

/**
 * @route   GET /api/pengadaan/export
 * @desc    Export pengadaan data
 * @access  Private (authenticated users)
 * @query   format, filters
 */
router.get(
  '/export',
  authenticate,
  validate(pengadaanSchemas.query),
  asyncHandler(pengadaanController.exportPengadaan)
);

/**
 * @route   GET /api/pengadaan/recent
 * @desc    Get recent pengadaan activity
 * @access  Private (authenticated users)
 */
router.get(
  '/recent',
  authenticate,
  asyncHandler(pengadaanController.getRecentActivity)
);

/**
 * @route   POST /api/pengadaan
 * @desc    Create new pengadaan
 * @access  Private (authenticated users can create their own forms)
 * @body    pengadaan data
 */
router.post(
  '/',
  authenticate,
  validate(pengadaanSchemas.create),
  asyncHandler(pengadaanController.createPengadaan)
);

/**
 * @route   POST /api/pengadaan/bulk
 * @desc    Bulk create pengadaan
 * @access  Private/Admin (admin only)
 * @body    array of pengadaan data
 */
router.post(
  '/bulk',
  authenticate,
  requireAdmin,
  authRateLimiter, // Extra rate limiting for bulk operations
  asyncHandler(pengadaanController.bulkCreatePengadaan)
);

/**
 * @route   GET /api/pengadaan/custom/:customId
 * @desc    Get pengadaan by custom ID
 * @access  Private (authenticated users)
 * @param   customId - Custom pengadaan ID
 */
router.get(
  '/custom/:customId',
  authenticate,
  validateCustomId('customId'),
  asyncHandler(pengadaanController.getPengadaanByCustomId)
);

/**
 * @route   GET /api/pengadaan/:id
 * @desc    Get pengadaan by MongoDB ObjectId
 * @access  Private (authenticated users)
 * @param   id - MongoDB ObjectId
 */
router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  asyncHandler(pengadaanController.getPengadaanById)
);

/**
 * @route   PUT /api/pengadaan/:id
 * @desc    Update pengadaan (full update)
 * @access  Private (users can edit their own forms if not submitted, admins can edit any)
 * @param   id - MongoDB ObjectId
 * @body    pengadaan data
 */
router.put(
  '/:id',
  authenticate,
  validateObjectId('id'),
  validate(pengadaanSchemas.update),
  asyncHandler(pengadaanController.updatePengadaan)
);

/**
 * @route   PATCH /api/pengadaan/:id
 * @desc    Update pengadaan (partial update)
 * @access  Private (users can edit their own forms if not submitted, admins can edit any)
 * @param   id - MongoDB ObjectId
 * @body    partial pengadaan data
 */
router.patch(
  '/:id',
  authenticate,
  validateObjectId('id'),
  validate(pengadaanSchemas.update),
  asyncHandler(pengadaanController.updatePengadaan)
);

/**
 * @route   DELETE /api/pengadaan/:id
 * @desc    Delete pengadaan
 * @access  Private/Admin (admin only)
 * @param   id - MongoDB ObjectId
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validateObjectId('id'),
  asyncHandler(pengadaanController.deletePengadaan)
);

/**
 * @route   PUT /api/pengadaan/bulk/update
 * @desc    Bulk update pengadaan
 * @access  Private/Admin (admin only)
 * @body    array of pengadaan updates
 */
router.put(
  '/bulk/update',
  authenticate,
  requireAdmin,
  authRateLimiter, // Extra rate limiting for bulk operations
  asyncHandler(pengadaanController.bulkUpdatePengadaan)
);

/**
 * @route   DELETE /api/pengadaan/bulk
 * @desc    Bulk delete pengadaan
 * @access  Private/Admin (admin only)
 * @body    array of pengadaan IDs
 */
router.delete(
  '/bulk',
  authenticate,
  requireAdmin,
  authRateLimiter, // Extra rate limiting for bulk operations
  asyncHandler(pengadaanController.bulkDeletePengadaan)
);

/**
 * Route-specific middleware for advanced permissions
 */

/**
 * Admin-only routes
 * These routes require admin permissions and additional security
 */
const adminRouter = Router();

// Apply authentication and admin authorization to all admin routes
adminRouter.use(authenticate);
adminRouter.use(requireAdmin);
adminRouter.use(authRateLimiter);

/**
 * @route   POST /api/pengadaan/admin/import
 * @desc    Import pengadaan data from file
 * @access  Admin only
 * @body    File upload with pengadaan data
 */
adminRouter.post(
  '/import',
  // TODO: Add file upload middleware
  asyncHandler(async (_req, res, _next) => {
    // TODO: Implement import functionality
    res.json({
      success: false,
      message: 'Import functionality not implemented yet',
    });
  })
);

/**
 * @route   POST /api/pengadaan/admin/backup
 * @desc    Create backup of all pengadaan data
 * @access  Admin only
 */
adminRouter.post(
  '/backup',
  asyncHandler(async (_req, res, _next) => {
    // TODO: Implement backup functionality
    res.json({
      success: false,
      message: 'Backup functionality not implemented yet',
    });
  })
);

/**
 * @route   POST /api/pengadaan/admin/restore
 * @desc    Restore pengadaan data from backup
 * @access  Admin only
 * @body    Backup file
 */
adminRouter.post(
  '/restore',
  asyncHandler(async (_req, res, _next) => {
    // TODO: Implement restore functionality
    res.json({
      success: false,
      message: 'Restore functionality not implemented yet',
    });
  })
);

/**
 * @route   DELETE /api/pengadaan/admin/purge
 * @desc    Purge all pengadaan data (dangerous operation)
 * @access  Admin only
 * @body    { confirm: 'PURGE_ALL_DATA' }
 */
adminRouter.delete(
  '/purge',
  asyncHandler(async (_req, res, _next) => {
    const { confirm } = _req.body;
    
    if (confirm !== 'PURGE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Send { "confirm": "PURGE_ALL_DATA" } to proceed.',
      });
    }

    // TODO: Implement data purge functionality
    res.status(501).json({
      success: false,
      message: 'Data purge functionality not yet implemented',
    });
  })
);

// Mount admin routes
router.use('/admin', adminRouter);

/**
 * Public routes (no authentication required)
 * These might be useful for public dashboards or statistics
 */
const publicRouter = Router();

/**
 * @route   GET /api/pengadaan/public/stats
 * @desc    Get public pengadaan statistics (anonymized)
 * @access  Public
 */
publicRouter.get(
  '/stats',
  asyncHandler(async (_req, res, _next) => {
    // TODO: Implement public stats endpoint
    res.status(501).json({
      success: false,
      message: 'Public stats endpoint not yet implemented',
      data: {
        totalPengadaan: 0,
        categories: [],
        recentActivity: []
      }
    });
  })
);

/**
 * @route   GET /api/pengadaan/public/categories
 * @desc    Get available pengadaan categories
 * @access  Public
 */
publicRouter.get(
  '/categories',
  asyncHandler(async (_req, res, _next) => {
    // TODO: Implement categories endpoint
    res.status(501).json({
      success: false,
      message: 'Categories endpoint not yet implemented',
      data: []
    });
  })
);

/**
 * @route   GET /api/pengadaan/public/statuses
 * @desc    Get available pengadaan statuses
 * @access  Public
 */
publicRouter.get(
  '/statuses',
  asyncHandler(async (_req, res, _next) => {
    // TODO: Implement statuses endpoint
    res.status(501).json({
      success: false,
      message: 'Statuses endpoint not yet implemented',
      data: []
    });
  })
);

// Mount public routes
router.use('/public', publicRouter);

/**
 * Error handling for this router
 */
router.use((error: any, _req: any, _res: any, next: any) => {
  // Log the error for debugging
  console.error('Pengadaan route error:', error);
  
  // Pass to global error handler
  next(error);
});

export default router;

/**
 * Route documentation
 * 
 * This router provides comprehensive CRUD operations for Pengadaan entities:
 * 
 * 1. **Basic CRUD Operations:**
 *    - GET /api/pengadaan - List all pengadaan with filtering
 *    - GET /api/pengadaan/:id - Get specific pengadaan
 *    - POST /api/pengadaan - Create new pengadaan
 *    - PUT/PATCH /api/pengadaan/:id - Update pengadaan
 *    - DELETE /api/pengadaan/:id - Delete pengadaan
 * 
 * 2. **Advanced Operations:**
 *    - GET /api/pengadaan/search - Search functionality
 *    - GET /api/pengadaan/stats - Statistics and analytics
 *    - GET /api/pengadaan/export - Data export
 *    - POST /api/pengadaan/bulk - Bulk operations
 * 
 * 3. **Admin Operations:**
 *    - POST /api/pengadaan/admin/import - Data import
 *    - POST /api/pengadaan/admin/backup - Create backup
 *    - POST /api/pengadaan/admin/restore - Restore from backup
 *    - DELETE /api/pengadaan/admin/purge - Purge all data
 * 
 * 4. **Public Operations:**
 *    - GET /api/pengadaan/public/stats - Public statistics
 *    - GET /api/pengadaan/public/categories - Available categories
 *    - GET /api/pengadaan/public/statuses - Available statuses
 * 
 * **Security Features:**
 * - Authentication required for all private routes
 * - Role-based access control (RBAC)
 * - Permission-based authorization
 * - Rate limiting for sensitive operations
 * - Input validation and sanitization
 * - Request logging and monitoring
 * 
 * **Performance Features:**
 * - Pagination for large datasets
 * - Efficient filtering and sorting
 * - Caching headers for appropriate responses
 * - Bulk operations for administrative tasks
 */