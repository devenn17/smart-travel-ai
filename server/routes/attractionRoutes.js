import express from 'express';
import {
  getAttractions,
  getAttractionBySlugOrId,
  createAttraction,
  updateAttraction,
  deleteAttraction,
} from '../controllers/attractionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public attraction discovery / Protected admin creation
router
  .route('/')
  .get(getAttractions)
  .post(protect, createAttraction);

// Public single attraction lookup / Protected admin modification
router
  .route('/:idOrSlug')
  .get(getAttractionBySlugOrId)
  .put(protect, updateAttraction)
  .delete(protect, deleteAttraction);

export default router;
