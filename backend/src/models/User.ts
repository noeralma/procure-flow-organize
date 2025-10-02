import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// User roles enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// User status enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// User interface
export interface IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  profilePicture?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User document interface (includes Mongoose methods)
export interface IUserDocument extends Omit<IUser, 'id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  toResponse(): object;
}

// User model interface (includes static methods)
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByUsername(username: string): Promise<IUserDocument | null>;
  findByCredentials(identifier: string, password: string): Promise<IUserDocument | null>;
}

// User Schema
const userSchema = new Schema<IUserDocument>(
  {
    id: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: Object.values(UserRole),
        message: 'Invalid role value',
      },
      default: UserRole.USER,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: Object.values(UserStatus),
        message: 'Invalid status value',
      },
      default: UserStatus.ACTIVE,
    },
    lastLogin: {
      type: Date,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    position: {
      type: String,
      trim: true,
      maxlength: [100, 'Position cannot exceed 100 characters'],
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret._id;
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: any) => {
        delete ret._id;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Custom ID generator for User
const generateUserId = async (): Promise<string> => {
  const count = await UserModel.countDocuments();
  return `USR-${String(count + 1).padStart(4, '0')}`;
};

// Indexes
userSchema.index({ id: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password and generate ID
userSchema.pre('save', async function (next) {
  const user = this as IUserDocument;

  // Generate custom ID if not provided
  if (!user.id) {
    user.id = await generateUserId();
  }

  // Hash password if it's modified
  if (user.isModified('password')) {
    const saltRounds = 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }

  next();
});

// Instance method to compare password
userSchema.methods['comparePassword'] = async function (candidatePassword: string): Promise<boolean> {
  const user = this as IUserDocument;
  return bcrypt.compare(candidatePassword, user.password);
};

// Instance method to generate auth token
userSchema.methods['generateAuthToken'] = function (): string {
  const user = this as IUserDocument;
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  
  const secret = process.env['JWT_SECRET'] || 'fallback-secret-key';
  const expiresIn = process.env['JWT_EXPIRES_IN'] || '7d';
  
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

// Instance method to return user response (without sensitive data)
userSchema.methods['toResponse'] = function (): object {
  const user = this as IUserDocument;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    lastLogin: user.lastLogin,
    profilePicture: user.profilePicture,
    department: user.department,
    position: user.position,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Static method to find user by email
userSchema.statics['findByEmail'] = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by username
userSchema.statics['findByUsername'] = function (username: string) {
  return this.findOne({ username });
};

// Static method to find user by credentials (email or username)
userSchema.statics['findByCredentials'] = async function (identifier: string, password: string) {
  const user = await this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select('+password');

  if (!user) {
    return null;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return null;
  }

  return user;
};

// Create and export the model
const UserModel: IUserModel = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default UserModel;
export { generateUserId };