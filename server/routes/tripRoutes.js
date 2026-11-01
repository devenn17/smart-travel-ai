import express from 'express';
import {
  getMyTrips,
  createTrip,
  getTripById,
  generateTripItinerary,
  deleteTrip,
} from '../controllers/tripController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All trip routes are strictly protected with HttpOnly JWT auth
router.use(protect);

router.get('/', getMyTrips);
router.post('/', createTrip);
router.post('/generate', generateTripItinerary);

router.route('/:id')
  .get(getTripById)
  .delete(deleteTrip);

export default router;
