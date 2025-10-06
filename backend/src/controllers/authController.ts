import { Request, Response, NextFunction } from 'express';
import authService, { RegisterData, LoginData, PasswordChangeData, ProfileUpdateData } from '../services/authService';
import { UserRole, UserStatus } from '../models/User';
import { AppError } from '../utils/errors';
import { sendSuccess as successResponse } from '../utils/response';
import { commonSchemas } from '../utils/validation';

// Helper functions for validation
const validateRequired = (fields: Record<string, unknown>) => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new AppError(`${key} is required`, 400);
    }
  }
};

const validateEmail = (email: string) => {
  const result = commonSchemas.email.safeParse(email);
  if (!result.success) {
    throw new AppError('Invalid email format', 400);
  }
};

const validatePassword = (password: string) => {
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }
  
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
    throw new AppError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)', 400);
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

class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('Register endpoint called with data:', req.body);
      
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        department,
        position,
        phoneNumber,
        role,
      } = req.body;

      // Validation
      validateRequired({ username, email, password, firstName, lastName });
      validateEmail(email);
      validatePassword(password);

      if (username.length < 3) {
        throw new AppError('Username must be at least 3 characters long', 400);
      }

      const registerData: RegisterData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: department?.trim(),
        position: position?.trim(),
        phoneNumber: phoneNumber?.trim(),
        role,
      };

      console.log('Calling authService.register...');
      const result = await authService.register(registerData);

      console.log('Registration successful:', result);
      successResponse(res, result, 'User registered successfully', 201);
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, password } = req.body;

      // Validation
      validateRequired({ identifier, password });

      const loginData: LoginData = {
        identifier: identifier.trim(),
        password,
      };

      const result = await authService.login(loginData);

      successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const profile = await authService.getProfile(req.user.id);

      successResponse(res, { user: profile }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const {
        firstName,
        lastName,
        department,
        position,
        phoneNumber,
        profilePicture,
      } = req.body;

      const updateData: ProfileUpdateData = {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        department: department?.trim(),
        position: position?.trim(),
        phoneNumber: phoneNumber?.trim(),
        profilePicture: profilePicture?.trim(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof ProfileUpdateData] === undefined) {
          delete updateData[key as keyof ProfileUpdateData];
        }
      });

      const updatedProfile = await authService.updateProfile(req.user.id, updateData);

      successResponse(res, updatedProfile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { currentPassword, newPassword } = req.body;

      // Validation
      validateRequired({ currentPassword, newPassword });
      validatePassword(newPassword);

      const passwordData: PasswordChangeData = {
        currentPassword,
        newPassword,
      };

      await authService.changePassword(req.user.id, passwordData);

      successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;
      const search = req.query['search'] as string;

      const result = await authService.getAllUsers(page, limit, search);

      successResponse(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      const { userId } = req.params;
      if (!userId) {
        throw new AppError('User ID is required', 400);
      }
      
      const { role } = req.body;

      // Validation
      validateRequired({ role });

      if (!Object.values(UserRole).includes(role)) {
        throw new AppError('Invalid role value', 400);
      }

      // Prevent admin from changing their own role
      if (userId === req.user.id) {
        throw new AppError('Cannot change your own role', 400);
      }

      const updatedUser = await authService.updateUserRole(userId, role);

      successResponse(res, updatedUser, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      const { userId } = req.params;
      if (!userId) {
        throw new AppError('User ID is required', 400);
      }
      
      const { status } = req.body;

      // Validation
      validateRequired({ status });

      if (!Object.values(UserStatus).includes(status)) {
        throw new AppError('Invalid status value', 400);
      }

      // Prevent admin from changing their own status
      if (userId === req.user.id) {
        throw new AppError('Cannot change your own status', 400);
      }

      const updatedUser = await authService.updateUserStatus(userId, status);

      successResponse(res, updatedUser, 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      const { userId } = req.params;
      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        throw new AppError('Cannot delete your own account', 400);
      }

      await authService.deleteUser(userId);

      successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create admin user (system function - should be protected)
   */
  async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // This endpoint should be protected by environment variable or special token
      const adminSecret = req.headers['x-admin-secret'];
      if (adminSecret !== process.env['ADMIN_SECRET']) {
        throw new AppError('Unauthorized admin creation', 401);
      }

      const {
        username,
        email,
        password,
        firstName,
        lastName,
        department,
        position,
        phoneNumber,
      } = req.body;

      // Validation
      validateRequired({ username, email, password, firstName, lastName });
      validateEmail(email);
      validatePassword(password);

      const registerData: RegisterData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: department?.trim(),
        position: position?.trim(),
        phoneNumber: phoneNumber?.trim(),
      };

      const result = await authService.createAdmin(registerData);

      successResponse(res, result, 'Admin user created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a JWT-based system, logout is typically handled client-side
      // by removing the token. However, we can log the logout event.
      
      if (req.user) {
        // You could implement token blacklisting here if needed
        // For now, we'll just return a success response
      }

      successResponse(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token (if implementing refresh token logic)
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      // Verify refresh token and get user data
      const decoded = await authService.verifyRefreshToken(refreshToken);
      
      // Get fresh user data and generate new tokens
      const result = await authService.refreshToken(decoded.userId);
      
      successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();