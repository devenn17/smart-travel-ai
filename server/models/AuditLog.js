import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    adminName: {
      type: String,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ['Destination', 'Attraction', 'User', 'Trip', 'Settings', 'System', 'Media'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      trim: true,
      index: true,
    },
    targetName: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      required: [true, 'Audit log summary is required'],
      trim: true,
      maxlength: 1000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      trim: true,
      default: '127.0.0.1',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });

auditLogSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

/**
 * Safe helper to record an audit log entry with automatic sanitization
 */
export const recordAuditLog = async ({
  req,
  action,
  targetType,
  targetId,
  targetName,
  summary,
  metadata = {},
}) => {
  try {
    if (!req.user) return null;

    // Sanitize metadata to never include sensitive credentials or tokens
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.passwordHash;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.cookie;
    delete sanitizedMetadata.authorization;

    const logEntry = await AuditLog.create({
      action,
      adminId: req.user._id,
      adminEmail: req.user.email,
      adminName: req.user.name,
      targetType,
      targetId: targetId ? targetId.toString() : undefined,
      targetName,
      summary,
      metadata: sanitizedMetadata,
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
    });

    return logEntry;
  } catch (err) {
    console.warn('[AuditLog] Failed to record audit log entry:', err.message);
    return null;
  }
};
