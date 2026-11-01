import mongoose from 'mongoose';
import Attraction from '../models/Attraction.js';
import Destination from '../models/Destination.js';

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

/**
 * @desc    Get all attractions with optional filtering
 * @route   GET /api/attractions
 * @access  Public
 */
export const getAttractions = async (req, res, next) => {
  try {
    const { destination, category, search, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    // 1. Destination filter (can be ObjectId or slug)
    if (destination && typeof destination === 'string' && destination.trim() !== '') {
      const trimmedDest = destination.trim();
      if (mongoose.Types.ObjectId.isValid(trimmedDest)) {
        query.destination = trimmedDest;
      } else {
        query.destinationSlug = trimmedDest.toLowerCase();
      }
    }

    // 2. Category filter
    if (category && typeof category === 'string' && category.trim() !== '' && category.toLowerCase() !== 'all') {
      query.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    // 3. Keyword search
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { name: searchRegex },
        { headline: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { suitableInterests: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, attractions] = await Promise.all([
      Attraction.countDocuments(query),
      Attraction.find(query)
        .populate('destination', 'name slug region country')
        .sort({ order: 1, name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: attractions.map((a) => ({
        ...a,
        id: a._id.toString(),
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attraction details by slug or ObjectId
 * @route   GET /api/attractions/:idOrSlug
 * @access  Public
 */
export const getAttractionBySlugOrId = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    if (!idOrSlug || typeof idOrSlug !== 'string' || idOrSlug.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A valid attraction identifier or slug is required',
      });
    }

    const trimmed = idOrSlug.trim();
    let query;

    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      query = { _id: trimmed, isActive: true };
    } else {
      query = { slug: trimmed.toLowerCase(), isActive: true };
    }

    const attraction = await Attraction.findOne(query).populate(
      'destination',
      'name slug region country heroImage estimatedDailyBudget bestTime'
    );

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: `Attraction not found for identifier: "${idOrSlug}"`,
      });
    }

    res.status(200).json({
      success: true,
      data: attraction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new attraction (Admin Protected)
 * @route   POST /api/attractions
 * @access  Private
 */
export const createAttraction = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      destination,
      headline,
      description,
      category,
      image,
      gallery = [],
      location,
      coordinates,
      estimatedPriceINR = 0,
      priceNote,
      estimatedDuration = '2–3 hours',
      openingHours,
      bestTimeToVisit,
      suitableInterests = [],
      order = 0,
    } = req.body;

    if (!name || !slug || !destination || !description || !category || !image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, slug, destination (ID or slug), description, category, image.',
      });
    }

    // Resolve destination
    let destDoc;
    if (mongoose.Types.ObjectId.isValid(destination)) {
      destDoc = await Destination.findById(destination);
    } else {
      destDoc = await Destination.findOne({ slug: destination.toLowerCase().trim() });
    }

    if (!destDoc) {
      return res.status(404).json({
        success: false,
        message: `Associated destination "${destination}" does not exist.`,
      });
    }

    const normalizedSlug = slug.toLowerCase().trim();
    const existing = await Attraction.findOne({ destination: destDoc._id, slug: normalizedSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An attraction with slug "${normalizedSlug}" already exists for this destination.`,
      });
    }

    const attraction = await Attraction.create({
      name: name.trim(),
      slug: normalizedSlug,
      destination: destDoc._id,
      destinationSlug: destDoc.slug,
      headline: headline?.trim(),
      description: description.trim(),
      category,
      image: image.trim(),
      gallery,
      location: location?.trim(),
      coordinates,
      estimatedPriceINR: Number(estimatedPriceINR) || 0,
      priceNote: priceNote?.trim(),
      estimatedDuration: estimatedDuration.trim(),
      openingHours: openingHours?.trim(),
      bestTimeToVisit: bestTimeToVisit?.trim(),
      suitableInterests,
      order: Number(order) || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Attraction created successfully',
      data: attraction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an attraction (Admin Protected)
 * @route   PUT /api/attractions/:idOrSlug
 * @access  Private
 */
export const updateAttraction = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const trimmed = idOrSlug.trim();

    let query;
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      query = { _id: trimmed };
    } else {
      query = { slug: trimmed.toLowerCase() };
    }

    const attraction = await Attraction.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: `Attraction not found for identifier: "${idOrSlug}"`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attraction updated successfully',
      data: attraction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an attraction (Admin Protected)
 * @route   DELETE /api/attractions/:idOrSlug
 * @access  Private
 */
export const deleteAttraction = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const trimmed = idOrSlug.trim();

    let query;
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      query = { _id: trimmed };
    } else {
      query = { slug: trimmed.toLowerCase() };
    }

    const attraction = await Attraction.findOneAndUpdate(
      query,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: `Attraction not found for identifier: "${idOrSlug}"`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Attraction "${attraction.name}" deactivated successfully`,
    });
  } catch (error) {
    next(error);
  }
};
