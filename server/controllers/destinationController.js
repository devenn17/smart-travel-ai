import mongoose from 'mongoose';
import Destination from '../models/Destination.js';
import Attraction from '../models/Attraction.js';

// Escape regex special characters to prevent regex injection attacks
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

/**
 * @desc    Fetch destinations with search, filters, sorting, and pagination
 * @route   GET /api/destinations
 * @access  Public
 */
export const getDestinations = async (req, res, next) => {
  try {
    const {
      search,
      category,
      interest,
      minBudget,
      maxBudget,
      featured,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    // 1. Text search across name, region, headline, description, tags
    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [
        { name: searchRegex },
        { region: searchRegex },
        { headline: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    // 2. Category filter
    if (category && typeof category === 'string' && category.trim() !== '' && category.toLowerCase() !== 'all') {
      const categories = category.split(',').map((c) => c.trim());
      if (categories.length === 1) {
        query.category = new RegExp(`^${escapeRegex(categories[0])}$`, 'i');
      } else {
        query.category = { $in: categories.map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i')) };
      }
    }

    // 3. Travel interest filter
    if (interest && typeof interest === 'string' && interest.trim() !== '' && interest.toLowerCase() !== 'all') {
      const interests = interest.split(',').map((i) => i.trim());
      query.$or = (query.$or || []).concat([
        { interests: { $in: interests.map((i) => new RegExp(escapeRegex(i), 'i')) } },
        { tags: { $in: interests.map((i) => new RegExp(escapeRegex(i), 'i')) } },
      ]);
    }

    // 4. Budget range filtering
    if (minBudget !== undefined || maxBudget !== undefined) {
      query.estimatedDailyBudget = {};
      if (minBudget !== undefined && !Number.isNaN(Number(minBudget))) {
        query.estimatedDailyBudget.$gte = Math.max(0, Number(minBudget));
      }
      if (maxBudget !== undefined && !Number.isNaN(Number(maxBudget))) {
        query.estimatedDailyBudget.$lte = Math.max(0, Number(maxBudget));
      }
    }

    // 5. Featured filter
    if (featured !== undefined) {
      query.featured = featured === 'true' || featured === true;
    }

    // 6. Sorting
    let sortOption = { popularity: -1, _id: -1 };
    switch (sort) {
      case 'budget-asc':
      case 'price-asc':
        sortOption = { estimatedDailyBudget: 1, popularity: -1 };
        break;
      case 'budget-desc':
      case 'price-desc':
        sortOption = { estimatedDailyBudget: -1, popularity: -1 };
        break;
      case 'name-asc':
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'name-desc':
        sortOption = { name: -1 };
        break;
      case 'popular':
      case 'popularity':
        sortOption = { popularity: -1, _id: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { popularity: -1, _id: -1 };
    }

    // 7. Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Execute queries concurrently
    const [total, destinations, budgetStats] = await Promise.all([
      Destination.countDocuments(query),
      Destination.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Destination.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            minBudget: { $min: '$estimatedDailyBudget' },
            maxBudget: { $max: '$estimatedDailyBudget' },
          },
        },
      ]),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;
    const hasMore = pageNum < totalPages;

    const availableCategories = ['Beach', 'Heritage', 'Mountains', 'Nature', 'Adventure', 'Spiritual'];
    const minCalculatedBudget = budgetStats[0]?.minBudget || 2000;
    const maxCalculatedBudget = budgetStats[0]?.maxBudget || 10000;

    res.status(200).json({
      success: true,
      data: destinations.map((d) => ({
        ...d,
        id: d._id.toString(),
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasMore,
      },
      facets: {
        categories: availableCategories,
        budgetBounds: {
          min: minCalculatedBudget,
          max: maxCalculatedBudget,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single destination by slug or ObjectId
 * @route   GET /api/destinations/:idOrSlug
 * @access  Public
 */
export const getDestinationBySlugOrId = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    if (!idOrSlug || typeof idOrSlug !== 'string' || idOrSlug.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A valid destination identifier or slug is required',
      });
    }

    const trimmed = idOrSlug.trim();
    let query;

    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      query = { _id: trimmed, isActive: true };
    } else {
      query = { slug: trimmed.toLowerCase(), isActive: true };
    }

    const destination = await Destination.findOne(query).populate({
      path: 'attractions',
      match: { isActive: true },
      options: { sort: { order: 1, name: 1 } },
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination not found for identifier: "${idOrSlug}"`,
      });
    }

    res.status(200).json({
      success: true,
      data: destination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attractions belonging to a destination
 * @route   GET /api/destinations/:idOrSlug/attractions
 * @access  Public
 */
export const getDestinationAttractions = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    const trimmed = idOrSlug.trim();
    let destQuery;

    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      destQuery = { _id: trimmed, isActive: true };
    } else {
      destQuery = { slug: trimmed.toLowerCase(), isActive: true };
    }

    const destination = await Destination.findOne(destQuery).select('_id name slug region country');

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination not found for identifier: "${idOrSlug}"`,
      });
    }

    const attractions = await Attraction.find({
      destination: destination._id,
      isActive: true,
    })
      .sort({ order: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: attractions.length,
      destination: {
        id: destination._id.toString(),
        name: destination.name,
        slug: destination.slug,
        region: destination.region,
      },
      data: attractions.map((a) => ({
        ...a,
        id: a._id.toString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new destination (Admin Protected)
 * @route   POST /api/destinations
 * @access  Private
 */
export const createDestination = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      region,
      country = 'India',
      headline,
      description,
      editorialStory,
      image,
      gallery = [],
      category,
      tags = [],
      interests = [],
      estimatedDailyBudget,
      budgetTier = 'Balanced',
      bestTime,
      idealDays = '3–4 days',
      averageDurationDays = 4,
      elevation,
      coordinates,
      fallbackColor = '#183D35',
      featured = false,
      popularity = 80,
    } = req.body;

    if (!name || !slug || !region || !description || !image || !category || estimatedDailyBudget === undefined || !bestTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, slug, region, description, image, category, estimatedDailyBudget, bestTime.',
      });
    }

    const normalizedSlug = slug.toLowerCase().trim();
    const existing = await Destination.findOne({ slug: normalizedSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A destination with slug "${normalizedSlug}" already exists.`,
      });
    }

    const destination = await Destination.create({
      name: name.trim(),
      slug: normalizedSlug,
      region: region.trim(),
      country: country.trim(),
      headline: headline?.trim(),
      description: description.trim(),
      editorialStory: editorialStory?.trim(),
      image: image.trim(),
      gallery,
      category,
      tags,
      interests,
      estimatedDailyBudget: Number(estimatedDailyBudget),
      budgetTier,
      bestTime: bestTime.trim(),
      idealDays: idealDays.trim(),
      averageDurationDays: Number(averageDurationDays),
      elevation: elevation?.trim(),
      coordinates,
      fallbackColor,
      featured: Boolean(featured),
      popularity: Number(popularity),
    });

    res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      data: destination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a destination (Admin Protected)
 * @route   PUT /api/destinations/:idOrSlug
 * @access  Private
 */
export const updateDestination = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const trimmed = idOrSlug.trim();

    let query;
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      query = { _id: trimmed };
    } else {
      query = { slug: trimmed.toLowerCase() };
    }

    const destination = await Destination.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination not found for identifier: "${idOrSlug}"`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Destination updated successfully',
      data: destination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a destination (Admin Protected)
 * @route   DELETE /api/destinations/:idOrSlug
 * @access  Private
 */
export const deleteDestination = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const trimmed = idOrSlug.trim();

    let query;
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      query = { _id: trimmed };
    } else {
      query = { slug: trimmed.toLowerCase() };
    }

    const destination = await Destination.findOne(query);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination not found for identifier: "${idOrSlug}"`,
      });
    }

    // Soft delete destination and its associated attractions
    destination.isActive = false;
    await destination.save();

    await Attraction.updateMany({ destination: destination._id }, { $set: { isActive: false } });

    res.status(200).json({
      success: true,
      message: `Destination "${destination.name}" and associated attractions have been deactivated.`,
    });
  } catch (error) {
    next(error);
  }
};
