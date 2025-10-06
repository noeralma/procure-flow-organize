import UserModel, { UserRole, UserStatus } from '../models/User';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { generateRefreshToken } from '../middleware/auth';

// Registration data interface
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  role?: UserRole;
}

// Login data interface
export interface LoginData {
  identifier: string; // email or username
  password: string;
}

// Auth response interface
export interface AuthResponse {
  user: object;
  token: string;
  refreshToken: string;
}

// Password change interface
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

// Profile update interface
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({
        $or: [
          { email: userData.email.toLowerCase() },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        if (existingUser.email === userData.email.toLowerCase()) {
          throw new AppError('Email already registered', 409);
        }
        if (existingUser.username === userData.username) {
          throw new AppError('Username already taken', 409);
        }
      }

      // Determine role (allow override in test environment for integration tests)
      const assignedRole = (process.env['NODE_ENV'] === 'test' && userData.role)
        ? userData.role
        : UserRole.USER;

      // Create new user
      const user = new UserModel({
        username: userData.username,
        email: userData.email.toLowerCase(),
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        department: userData.department,
        position: userData.position,
        phoneNumber: userData.phoneNumber,
        role: assignedRole, // Default role USER; overridden in tests if provided
        status: UserStatus.ACTIVE,
      });

      await user.save();

      // Generate auth token
      const token = user.generateAuthToken();

      // Generate refresh token
      const refreshTokenPayload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        status: user.status,
      };
      
      const refreshToken = generateRefreshToken(refreshTokenPayload);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`New user registered: ${user.email}`);

      return {
        user: user.toResponse(),
        token,
        refreshToken,
      };
    } catch (error) {
      // Use console.log to ensure visibility in test runs where console.error may be mocked
      console.log('Registration error (debug):', error);
      logger.error('Registration error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      // Let non-AppError errors propagate so the global error handler can classify them
      throw error as Error;
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      // Find user by credentials
      const user = await UserModel.findByCredentials(
        loginData.identifier,
        loginData.password
      );

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError('Account is not active', 401);
      }

      // Generate auth token
      const token = user.generateAuthToken();

      // Generate refresh token
      const refreshTokenPayload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        status: user.status,
      };
      
      const refreshToken = generateRefreshToken(refreshTokenPayload);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${user.email}`);

      return {
        user: user.toResponse(),
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Login failed', 500);
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(refreshToken: string): Promise<{ userId: string; email: string; role: UserRole; status: UserStatus }> {
    try {
      const { verifyRefreshToken } = await import('../middleware/auth');
      const decoded = await verifyRefreshToken(refreshToken);
      
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        status: decoded.status,
      };
    } catch (error) {
      logger.error('Refresh token verification error:', error);
      throw new AppError('Invalid refresh token', 401);
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(userId: string): Promise<AuthResponse> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError('Account is not active', 401);
      }

      // Generate new auth token
      const token = user.generateAuthToken();

      // Generate new refresh token
      const refreshTokenPayload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        status: user.status,
      };
      
      const refreshToken = generateRefreshToken(refreshTokenPayload);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        user: user.toResponse(),
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Token refresh failed', 500);
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<object> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user.toResponse();
    } catch (error) {
      logger.error('Get profile error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get profile', 500);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: ProfileUpdateData): Promise<object> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update allowed fields
      if (updateData.firstName) user.firstName = updateData.firstName;
      if (updateData.lastName) user.lastName = updateData.lastName;
      if (updateData.department) user.department = updateData.department;
      if (updateData.position) user.position = updateData.position;
      if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;
      if (updateData.profilePicture) user.profilePicture = updateData.profilePicture;

      await user.save();

      logger.info(`Profile updated for user: ${user.email}`);

      return user.toResponse();
    } catch (error) {
      logger.error('Update profile error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update profile', 500);
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, passwordData: PasswordChangeData): Promise<void> {
    try {
      const user = await UserModel.findOne({ id: userId }).select('+password');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Update password
      user.password = passwordData.newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Change password error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to change password', 500);
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(page: number = 1, limit: number = 10, search?: string): Promise<{
    users: object[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      let query = {};

      // Add search functionality
      if (search) {
        query = {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
          ],
        };
      }

      const [users, total] = await Promise.all([
        UserModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        UserModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users: users.map((user) => user.toResponse()),
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Get all users error:', error);
      throw new AppError('Failed to get users', 500);
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: UserRole): Promise<object> {
    try {
      const user = await UserModel.findOne({ id: userId });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      user.role = role;
      await user.save();

      logger.info(`Role updated for user ${user.email} to ${role}`);

      return user.toResponse();
    } catch (error) {
      logger.error('Update user role error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update user role', 500);
    }
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId: string, status: UserStatus): Promise<object> {
    try {
      const user = await UserModel.findOne({ id: userId });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      user.status = status;
      await user.save();

      logger.info(`Status updated for user ${user.email} to ${status}`);

      return user.toResponse();
    } catch (error) {
      logger.error('Update user status error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update user status', 500);
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await UserModel.findOne({ id: userId });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      await UserModel.deleteOne({ id: userId });

      logger.info(`User deleted: ${user.email}`);
    } catch (error) {
      logger.error('Delete user error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete user', 500);
    }
  }

  /**
   * Create admin user (system function)
   */
  async createAdmin(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({
        $or: [
          { email: userData.email.toLowerCase() },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        throw new AppError('User already exists', 409);
      }

      // Create admin user
      const user = new UserModel({
        ...userData,
        email: userData.email.toLowerCase(),
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      await user.save();

      // Generate auth token
      const token = user.generateAuthToken();

      // Generate refresh token
      const refreshTokenPayload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        status: user.status,
      };
      
      const refreshToken = generateRefreshToken(refreshTokenPayload);

      logger.info(`Admin user created: ${user.email}`);

      return {
        user: user.toResponse(),
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('Create admin error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create admin', 500);
    }
  }
}

export default new AuthService();