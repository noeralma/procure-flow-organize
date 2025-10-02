import EditPermissionModel, { PermissionStatus, PermissionType } from '../models/EditPermission';
import UserModel from '../models/User';
import PengadaanModel from '../models/Pengadaan';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

// Permission request interface
export interface PermissionRequestData {
  userId: string;
  pengadaanId: string;
  permissionType: PermissionType;
  reason: string;
}

// Permission response interface
export interface PermissionResponseData {
  permissionId: string;
  adminId: string;
  status: PermissionStatus.APPROVED | PermissionStatus.REJECTED;
  response?: string;
}

class PermissionService {
  /**
   * Request permission to edit a form
   */
  async requestPermission(requestData: PermissionRequestData): Promise<object> {
    try {
      // Verify user exists
      const user = await UserModel.findOne({ id: requestData.userId });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify pengadaan exists
      const pengadaan = await PengadaanModel.findOne({ id: requestData.pengadaanId });
      if (!pengadaan) {
        throw new AppError('Pengadaan not found', 404);
      }

      // Check if there's already a pending request for this user and pengadaan
      const existingRequest = await EditPermissionModel.findOne({
        userId: requestData.userId,
        pengadaanId: requestData.pengadaanId,
        permissionType: requestData.permissionType,
        status: PermissionStatus.PENDING,
      });

      if (existingRequest) {
        throw new AppError('You already have a pending request for this form', 400);
      }

      // Check if user already has active permission
      const hasActivePermission = await EditPermissionModel.hasActivePermission(
        requestData.userId,
        requestData.pengadaanId,
        requestData.permissionType
      );

      if (hasActivePermission) {
        throw new AppError('You already have active permission for this form', 400);
      }

      // Create permission request
      const permission = new EditPermissionModel({
        userId: requestData.userId,
        pengadaanId: requestData.pengadaanId,
        permissionType: requestData.permissionType,
        reason: requestData.reason,
        status: PermissionStatus.PENDING,
      });

      await permission.save();

      logger.info(`Permission requested by user ${requestData.userId} for pengadaan ${requestData.pengadaanId}`);

      return permission.toResponse();
    } catch (error) {
      logger.error('Request permission error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to request permission', 500);
    }
  }

  /**
   * Get user's permission requests
   */
  async getUserPermissions(userId: string, page: number = 1, limit: number = 10): Promise<{
    permissions: object[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [permissions, total] = await Promise.all([
        EditPermissionModel.find({ userId })
          .sort({ requestedAt: -1 })
          .skip(skip)
          .limit(limit),
        EditPermissionModel.countDocuments({ userId }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        permissions: permissions.map(permission => permission.toResponse()),
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Get user permissions error:', error);
      throw new AppError('Failed to get permissions', 500);
    }
  }

  /**
   * Get all pending permission requests (admin only)
   */
  async getPendingRequests(page: number = 1, limit: number = 10): Promise<{
    requests: object[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        EditPermissionModel.find({ status: PermissionStatus.PENDING })
          .sort({ requestedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'firstName lastName email username')
          .populate('pengadaanId', 'nama id'),
        EditPermissionModel.countDocuments({ status: PermissionStatus.PENDING }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        requests: requests.map(request => ({
          ...request.toResponse(),
          user: request.userId,
          pengadaan: request.pengadaanId,
        })),
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Get pending requests error:', error);
      throw new AppError('Failed to get pending requests', 500);
    }
  }

  /**
   * Respond to permission request (admin only)
   */
  async respondToRequest(responseData: PermissionResponseData): Promise<object> {
    try {
      // Verify admin exists
      const admin = await UserModel.findOne({ id: responseData.adminId });
      if (!admin) {
        throw new AppError('Admin not found', 404);
      }

      // Find permission request
      const permission = await EditPermissionModel.findOne({ id: responseData.permissionId });
      if (!permission) {
        throw new AppError('Permission request not found', 404);
      }

      // Check if request is still pending
      if (permission.status !== PermissionStatus.PENDING) {
        throw new AppError('Permission request has already been processed', 400);
      }

      // Update permission based on response
      if (responseData.status === PermissionStatus.APPROVED) {
        await permission.approve(responseData.adminId, responseData.response);
        logger.info(`Permission approved by admin ${responseData.adminId} for request ${responseData.permissionId}`);
      } else {
        await permission.reject(responseData.adminId, responseData.response || 'Request rejected');
        logger.info(`Permission rejected by admin ${responseData.adminId} for request ${responseData.permissionId}`);
      }

      return permission.toResponse();
    } catch (error) {
      logger.error('Respond to request error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to respond to request', 500);
    }
  }

  /**
   * Check if user has permission to edit a specific form
   */
  async hasEditPermission(userId: string, pengadaanId: string): Promise<boolean> {
    try {
      return await EditPermissionModel.hasActivePermission(
        userId,
        pengadaanId,
        PermissionType.EDIT_FORM
      );
    } catch (error) {
      logger.error('Check edit permission error:', error);
      return false;
    }
  }

  /**
   * Get permission details
   */
  async getPermissionById(permissionId: string): Promise<object> {
    try {
      const permission = await EditPermissionModel.findOne({ id: permissionId })
        .populate('userId', 'firstName lastName email username')
        .populate('adminId', 'firstName lastName email username')
        .populate('pengadaanId', 'nama id');

      if (!permission) {
        throw new AppError('Permission not found', 404);
      }

      return {
        ...permission.toResponse(),
        user: permission.userId,
        admin: permission.adminId,
        pengadaan: permission.pengadaanId,
      };
    } catch (error) {
      logger.error('Get permission by ID error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get permission', 500);
    }
  }

  /**
   * Get all permissions for a specific pengadaan (admin only)
   */
  async getPengadaanPermissions(pengadaanId: string, page: number = 1, limit: number = 10): Promise<{
    permissions: object[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [permissions, total] = await Promise.all([
        EditPermissionModel.find({ pengadaanId })
          .sort({ requestedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'firstName lastName email username')
          .populate('adminId', 'firstName lastName email username'),
        EditPermissionModel.countDocuments({ pengadaanId }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        permissions: permissions.map(permission => ({
          ...permission.toResponse(),
          user: permission.userId,
          admin: permission.adminId,
        })),
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Get pengadaan permissions error:', error);
      throw new AppError('Failed to get pengadaan permissions', 500);
    }
  }

  /**
   * Revoke active permission (admin only)
   */
  async revokePermission(permissionId: string, adminId: string, reason: string): Promise<object> {
    try {
      // Verify admin exists
      const admin = await UserModel.findOne({ id: adminId });
      if (!admin) {
        throw new AppError('Admin not found', 404);
      }

      // Find permission
      const permission = await EditPermissionModel.findOne({ id: permissionId });
      if (!permission) {
        throw new AppError('Permission not found', 404);
      }

      // Check if permission is active
      if (permission.status !== PermissionStatus.APPROVED || permission.isExpired()) {
        throw new AppError('Permission is not active', 400);
      }

      // Revoke permission by setting it to expired
      permission.status = PermissionStatus.EXPIRED;
      permission.adminResponse = `Revoked by admin: ${reason}`;
      permission.expiresAt = new Date(); // Set to current time to expire immediately

      await permission.save();

      logger.info(`Permission revoked by admin ${adminId} for request ${permissionId}`);

      return permission.toResponse();
    } catch (error) {
      logger.error('Revoke permission error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to revoke permission', 500);
    }
  }

  /**
   * Clean up expired permissions (system function)
   */
  async cleanupExpiredPermissions(): Promise<number> {
    try {
      const result = await EditPermissionModel.updateMany(
        {
          status: PermissionStatus.APPROVED,
          expiresAt: { $lt: new Date() }
        },
        {
          $set: { status: PermissionStatus.EXPIRED }
        }
      );

      logger.info(`Cleaned up ${result.modifiedCount} expired permissions`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('Cleanup expired permissions error:', error);
      throw new AppError('Failed to cleanup expired permissions', 500);
    }
  }
}

export default new PermissionService();