import express from 'express';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getAdminDestinations,
  getAdminDestinationById,
  createAdminDestination,
  updateAdminDestination,
  toggleDestinationStatus,
  deleteAdminDestination,
  getAdminAttractions,
  getAdminAttractionById,
  createAdminAttraction,
  updateAdminAttraction,
  toggleAttractionStatus,
  deleteAdminAttraction,
  getAdminUsers,
  getAdminUserById,
  updateUserRole,
  toggleUserStatus,
  getAdminTrips,
  getAdminTripById,
  updateAdminTripStatus,
  deleteAdminTrip,
  getAdminAuditLogs,
  getAdminSystemHealth,
} from '../controllers/adminController.js';
import { uploadMiddleware, handleImageUpload } from '../controllers/uploadController.js';

const router = express.Router();

// Strict security: require valid JWT AND admin role for EVERY endpoint under /api/admin
router.use(protect);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Destinations CRUD
router.route('/destinations')
  .get(getAdminDestinations)
  .post(createAdminDestination);

router.route('/destinations/:id')
  .get(getAdminDestinationById)
  .put(updateAdminDestination)
  .delete(deleteAdminDestination);

router.patch('/destinations/:id/toggle-status', toggleDestinationStatus);

// Attractions CRUD
router.route('/attractions')
  .get(getAdminAttractions)
  .post(createAdminAttraction);

router.route('/attractions/:id')
  .get(getAdminAttractionById)
  .put(updateAdminAttraction)
  .delete(deleteAdminAttraction);

router.patch('/attractions/:id/toggle-status', toggleAttractionStatus);

// Users Directory, Roles & Status
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', toggleUserStatus);

// Trips Directory & Actions
router.get('/trips', getAdminTrips);
router.route('/trips/:id')
  .get(getAdminTripById)
  .delete(deleteAdminTrip);
router.patch('/trips/:id/status', updateAdminTripStatus);

// Audit Logs (Immutable)
router.get('/audit-logs', getAdminAuditLogs);

// System Health & Diagnostics
router.get('/settings/health', getAdminSystemHealth);

// Media Upload
router.post('/upload', (req, res, next) => {
  uploadMiddleware.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed. Ensure image is under 5MB and format is JPEG, PNG, or WebP.',
      });
    }
    next();
  });
}, handleImageUpload);

export default router;
