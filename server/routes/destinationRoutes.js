import express from 'express';
import {
  getDestinations,
  getDestinationBySlugOrId,
  getDestinationAttractions,
  createDestination,
  updateDestination,
  deleteDestination,
} from '../controllers/destinationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public destination discovery / Protected admin creation
router
  .route('/')
  .get(getDestinations)
  .post(protect, createDestination);

// Public single destination lookup / Protected admin modification
router
  .route('/:idOrSlug')
  .get(getDestinationBySlugOrId)
  .put(protect, updateDestination)
  .delete(protect, deleteDestination);

// Public attractions belonging to destination
router.route('/:idOrSlug/attractions').get(getDestinationAttractions);

export default router;
