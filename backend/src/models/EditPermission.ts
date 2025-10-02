import mongoose, { Schema, Document, Model } from 'mongoose';

// Permission status enum
export enum PermissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// Permission type enum
export enum PermissionType {
  EDIT_FORM = 'edit_form',
  DELETE_FORM = 'delete_form'
}

// Edit Permission interface
export interface IEditPermission {
  id: string;
  userId: string;
  adminId?: string;
  pengadaanId: string;
  permissionType: PermissionType;
  status: PermissionStatus;
  reason: string;
  adminResponse?: string;
  requestedAt: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Edit Permission document interface
export interface IEditPermissionDocument extends Omit<IEditPermission, 'id'>, Document {
  toResponse(): object;
  isExpired(): boolean;
  approve(adminId: string, response?: string): Promise<IEditPermissionDocument>;
  reject(adminId: string, response: string): Promise<IEditPermissionDocument>;
}

// Edit Permission model interface
export interface IEditPermissionModel extends Model<IEditPermissionDocument> {
  findByUserId(userId: string): Promise<IEditPermissionDocument[]>;
  findByPengadaanId(pengadaanId: string): Promise<IEditPermissionDocument[]>;
  findPendingRequests(): Promise<IEditPermissionDocument[]>;
  hasActivePermission(userId: string, pengadaanId: string, permissionType: PermissionType): Promise<boolean>;
}

// Edit Permission Schema
const editPermissionSchema = new Schema<IEditPermissionDocument>(
  {
    id: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    adminId: {
      type: String,
      ref: 'User',
    },
    pengadaanId: {
      type: String,
      required: [true, 'Pengadaan ID is required'],
      ref: 'Pengadaan',
    },
    permissionType: {
      type: String,
      required: [true, 'Permission type is required'],
      enum: {
        values: Object.values(PermissionType),
        message: 'Invalid permission type',
      },
      default: PermissionType.EDIT_FORM,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: Object.values(PermissionStatus),
        message: 'Invalid status value',
      },
      default: PermissionStatus.PENDING,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin response cannot exceed 500 characters'],
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

// Custom ID generator for EditPermission
const generatePermissionId = async (): Promise<string> => {
  const count = await EditPermissionModel.countDocuments();
  return `PERM-${String(count + 1).padStart(4, '0')}`;
};

// Indexes
editPermissionSchema.index({ id: 1 }, { unique: true });
editPermissionSchema.index({ userId: 1 });
editPermissionSchema.index({ pengadaanId: 1 });
editPermissionSchema.index({ status: 1 });
editPermissionSchema.index({ permissionType: 1 });
editPermissionSchema.index({ requestedAt: -1 });
editPermissionSchema.index({ expiresAt: 1 });

// Compound indexes
editPermissionSchema.index({ userId: 1, pengadaanId: 1, permissionType: 1 });
editPermissionSchema.index({ status: 1, requestedAt: -1 });

// Pre-save middleware to generate ID and set expiration
editPermissionSchema.pre('save', async function (next) {
  const permission = this as IEditPermissionDocument;

  // Generate custom ID if not provided
  if (!permission.id) {
    permission.id = await generatePermissionId();
  }

  // Set expiration date for approved permissions (24 hours from approval)
  if (permission.status === PermissionStatus.APPROVED && !permission.expiresAt) {
    permission.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }

  next();
});

// Instance method to check if permission is expired
editPermissionSchema.methods['isExpired'] = function (): boolean {
  const permission = this as IEditPermissionDocument;
  return permission.expiresAt ? new Date() > permission.expiresAt : false;
};

// Instance method to approve permission
editPermissionSchema.methods['approve'] = async function (adminId: string, response?: string): Promise<IEditPermissionDocument> {
  const permission = this as IEditPermissionDocument;
  
  permission.status = PermissionStatus.APPROVED;
  permission.adminId = adminId;
  if (response !== undefined) {
    permission.adminResponse = response;
  }
  permission.respondedAt = new Date();
  permission.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  return permission.save();
};

// Instance method to reject permission
editPermissionSchema.methods['reject'] = async function (adminId: string, response: string): Promise<IEditPermissionDocument> {
  const permission = this as IEditPermissionDocument;
  
  permission.status = PermissionStatus.REJECTED;
  permission.adminId = adminId;
  permission.adminResponse = response;
  permission.respondedAt = new Date();
  
  return permission.save();
};

// Instance method to return permission response
editPermissionSchema.methods['toResponse'] = function (): object {
  const permission = this as IEditPermissionDocument;
  return {
    id: permission.id,
    userId: permission.userId,
    adminId: permission.adminId,
    pengadaanId: permission.pengadaanId,
    permissionType: permission.permissionType,
    status: permission.status,
    reason: permission.reason,
    adminResponse: permission.adminResponse,
    requestedAt: permission.requestedAt,
    respondedAt: permission.respondedAt,
    expiresAt: permission.expiresAt,
    isExpired: permission['isExpired'](),
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
  };
};

// Static method to find permissions by user ID
editPermissionSchema.statics['findByUserId'] = function (userId: string) {
  return this.find({ userId }).sort({ requestedAt: -1 });
};

// Static method to find permissions by pengadaan ID
editPermissionSchema.statics['findByPengadaanId'] = function (pengadaanId: string) {
  return this.find({ pengadaanId }).sort({ requestedAt: -1 });
};

// Static method to find pending requests
editPermissionSchema.statics['findPendingRequests'] = function () {
  return this.find({ status: PermissionStatus.PENDING }).sort({ requestedAt: -1 });
};

// Static method to check if user has active permission for a specific form
editPermissionSchema.statics['hasActivePermission'] = async function (
  userId: string, 
  pengadaanId: string, 
  permissionType: PermissionType
): Promise<boolean> {
  const permission = await this.findOne({
    userId,
    pengadaanId,
    permissionType,
    status: PermissionStatus.APPROVED,
    expiresAt: { $gt: new Date() }
  });

  return !!permission;
};

// Create and export the model
const EditPermissionModel: IEditPermissionModel = mongoose.model<IEditPermissionDocument, IEditPermissionModel>(
  'EditPermission', 
  editPermissionSchema
);

export default EditPermissionModel;
export { generatePermissionId };