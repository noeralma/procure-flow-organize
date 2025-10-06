import { Request, Response, NextFunction } from 'express';
import permissionService, { PermissionRequestData, PermissionResponseData } from '../services/permissionService';
import { PermissionType, PermissionStatus } from '../models/EditPermission';
import { UserRole } from '../models/User';
import { AppError } from '../utils/errors';
import { sendSuccess as successResponse } from '../utils/response';

// Helper function for validation
const validateRequired = (fields: Record<string, unknown>) => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new AppError(`${key} is required`, 400);
    }
  }
};

// Extended Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

class PermissionController {
  /**
   * Request permission to edit a form
   */
  async requestPermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { pengadaanId, permissionType, reason } = req.body;

      // Validation
      validateRequired({ pengadaanId, reason });

      if (permissionType && !Object.values(PermissionType).includes(permissionType)) {
        throw new AppError('Invalid permission type', 400);
      }

      const requestData: PermissionRequestData = {
        userId: req.user.id,
        pengadaanId: pengadaanId.trim(),
        permissionType: permissionType || PermissionType.EDIT_FORM,
        reason: reason.trim(),
      };

      const permission = await permissionService.requestPermission(requestData);

      successResponse(res, permission, 'Permission request submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's permission requests
   */
  async getUserPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;

      const result = await permissionService.getUserPermissions(req.user.id, page, limit);

      successResponse(res, result, 'User permissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all pending permission requests (admin only)
   */
  async getPendingRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;

      const result = await permissionService.getPendingRequests(page, limit);

      successResponse(res, result, 'Pending requests retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Respond to permission request (admin only)
   */
  async respondToRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      const { permissionId } = req.params;
      if (!permissionId) {
        throw new AppError('Permission ID is required', 400);
      }
      
      const { status, response } = req.body;

      // Validation - removing validateRequired call since it doesn't exist
      if (!status) {
        throw new AppError('Status is required', 400);
      }

      if (![PermissionStatus.APPROVED, PermissionStatus.REJECTED].includes(status)) {
        throw new AppError('Invalid status. Must be approved or rejected.', 400);
      }

      if (status === PermissionStatus.REJECTED && !response) {
        throw new AppError('Response is required when rejecting a request', 400);
      }

      const responseData: PermissionResponseData = {
        permissionId,
        adminId: req.user.id,
        status,
        response: response?.trim(),
      };

      const permission = await permissionService.respondToRequest(responseData);

      successResponse(res, permission, `Permission request ${status.toLowerCase()} successfully`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user has permission to edit a specific form
   */
  async checkEditPermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { pengadaanId } = req.params;
      if (!pengadaanId) {
        throw new AppError('Pengadaan ID is required', 400);
      }

      // Admin always has permission
      if (req.user.role === UserRole.ADMIN) {
        successResponse(res, { hasPermission: true, isAdmin: true }, 'Permission check completed');
        return;
      }

      const hasPermission = await permissionService.hasEditPermission(req.user.id, pengadaanId);

      successResponse(res, { hasPermission, isAdmin: false }, 'Permission check completed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permission details by ID
   */
  async getPermissionById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { permissionId } = req.params;
      if (!permissionId) {
        throw new AppError('Permission ID is required', 400);
      }

      const permission = await permissionService.getPermissionById(permissionId);

      // Users can only view their own permissions, admins can view all
      const permissionUserId = (permission as { userId?: unknown }).userId;
      const permissionUserIdStr = String(permissionUserId);
      if (req.user.role !== UserRole.ADMIN && permissionUserIdStr !== req.user.id) {
        throw new AppError('Access denied. You can only view your own permissions.', 403);
      }

      successResponse(res, permission, 'Permission details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all permissions for a specific pengadaan (admin only)
   */
  async getPengadaanPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      const { pengadaanId } = req.params;
      if (!pengadaanId) {
        throw new AppError('Pengadaan ID is required', 400);
      }
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;

      const result = await permissionService.getPengadaanPermissions(pengadaanId, page, limit);

      successResponse(res, result, 'Pengadaan permissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke active permission (admin only)
   */
  async revokePermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      const { permissionId } = req.params;
      if (!permissionId) {
        throw new AppError('Permission ID is required', 400);
      }
      const { reason } = req.body;

      // Validation
      validateRequired({ reason });

      const permission = await permissionService.revokePermission(
        permissionId,
        req.user.id,
        reason.trim()
      );

      successResponse(res, permission, 'Permission revoked successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permission statistics (admin only)
   */
  async getPermissionStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      // This could be expanded to include more detailed statistics
      const stats = {
        message: 'Permission statistics endpoint - to be implemented with specific metrics',
        timestamp: new Date().toISOString(),
      };

      successResponse(res, stats, 'Permission statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk approve/reject permissions (admin only)
   */
  async bulkRespondToRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      const { permissionIds, status, response } = req.body;

      // Validation
      validateRequired({ permissionIds, status });

      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        throw new AppError('Permission IDs must be a non-empty array', 400);
      }

      if (![PermissionStatus.APPROVED, PermissionStatus.REJECTED].includes(status)) {
        throw new AppError('Invalid status. Must be approved or rejected.', 400);
      }

      if (status === PermissionStatus.REJECTED && !response) {
        throw new AppError('Response is required when rejecting requests', 400);
      }

      const results = [];
      const errors = [];

      // Process each permission request
      for (const permissionId of permissionIds) {
        try {
          const responseData: PermissionResponseData = {
            permissionId,
            adminId: req.user.id,
            status,
            response: response?.trim(),
          };

          const permission = await permissionService.respondToRequest(responseData);
          results.push(permission);
        } catch (error) {
          errors.push({
            permissionId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const responseData = {
        successful: results.length,
        failed: errors.length,
        results,
        errors,
      };

      successResponse(res, responseData, `Bulk operation completed: ${results.length} successful, ${errors.length} failed`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clean up expired permissions (admin only)
   */
  async cleanupExpiredPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      const cleanedCount = await permissionService.cleanupExpiredPermissions();

      successResponse(res, { cleanedCount }, `Cleaned up ${cleanedCount} expired permissions`);
    } catch (error) {
      next(error);
    }
  }
}

export default new PermissionController();