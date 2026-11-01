import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import multer from 'multer';
import { recordAuditLog } from '../models/AuditLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure target uploads folder exists in client public directory
const UPLOADS_DIR = path.resolve(__dirname, '../../client/public/uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = crypto.randomBytes(12).toString('hex');
    const safeFilename = `smarttravel_${Date.now()}_${uniqueId}${ext}`;
    cb(null, safeFilename);
  },
});

// File filter strictly permitting images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are permitted.'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * Handle image upload
 * @route POST /api/admin/upload
 */
export const handleImageUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file was uploaded.',
      });
    }

    const relativePath = `/uploads/${req.file.filename}`;

    await recordAuditLog({
      req,
      action: 'DESTINATION_UPDATE',
      targetType: 'Media',
      targetId: req.file.filename,
      targetName: req.file.originalname,
      summary: `Uploaded image asset "${req.file.originalname}" (${Math.round(req.file.size / 1024)} KB)`,
      metadata: { filename: req.file.filename, size: req.file.size, mimeType: req.file.mimetype },
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: {
        url: relativePath,
        filename: req.file.filename,
        originalName: req.file.originalname,
        sizeBytes: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
};
