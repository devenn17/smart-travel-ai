import mongoose from 'mongoose';
import User from '../models/User.js';
import Destination from '../models/Destination.js';
import Attraction from '../models/Attraction.js';
import Trip from '../models/Trip.js';
import AuditLog, { recordAuditLog } from '../models/AuditLog.js';
import { getDbConnectionStatus, maskMongoUri } from '../config/db.js';

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// =========================================================================
// 1. DASHBOARD ANALYTICS & METRICS
// =========================================================================

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAdmins,
      totalDestinations,
      activeDestinations,
      totalAttractions,
      activeAttractions,
      totalTrips,
      recentUsers,
      recentTrips,
      recentAuditLogs,
      categoryStats,
      budgetStats,
      tripStatusStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      Destination.countDocuments(),
      Destination.countDocuments({ isActive: true }),
      Attraction.countDocuments(),
      Attraction.countDocuments({ isActive: true }),
      Trip.countDocuments(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role isActive createdAt')
        .lean(),
      Trip.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .lean(),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Destination.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Destination.aggregate([
        { $group: { _id: '$budgetTier', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Trip.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const dbStatus = getDbConnectionStatus();

    res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers, active: activeUsers, admins: totalAdmins },
        destinations: { total: totalDestinations, active: activeDestinations },
        attractions: { total: totalAttractions, active: activeAttractions },
        trips: { total: totalTrips },
      },
      distributions: {
        categories: categoryStats.map((c) => ({ category: c._id || 'Unassigned', count: c.count })),
        budgetTiers: budgetStats.map((b) => ({ tier: b._id || 'Standard', count: b.count })),
        tripStatuses: tripStatusStats.map((s) => ({ status: s._id || 'saved', count: s.count })),
      },
      activity: {
        recentUsers: recentUsers.map((u) => ({ ...u, id: u._id.toString() })),
        recentTrips: recentTrips.map((t) => ({ ...t, id: t._id.toString() })),
        recentAuditLogs: recentAuditLogs.map((l) => ({ ...l, id: l._id.toString() })),
      },
      system: {
        databaseConnected: dbStatus.isConnected,
        databaseState: dbStatus.status,
        serverUptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 2. DESTINATION CRUD & MANAGEMENT
// =========================================================================

export const getAdminDestinations = async (req, res, next) => {
  try {
    const { search, category, status, sort = 'popular', page = 1, limit = 15 } = req.query;

    const query = {};

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (category && category !== 'All') {
      query.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ name: regex }, { slug: regex }, { region: regex }, { headline: regex }];
    }

    let sortOption = { popularity: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'budget-asc') sortOption = { estimatedDailyBudget: 1 };
    if (sort === 'budget-desc') sortOption = { estimatedDailyBudget: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, destinations] = await Promise.all([
      Destination.countDocuments(query),
      Destination.find(query)
        .populate('attractions')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: destinations.map((d) => ({
        ...d,
        id: d._id.toString(),
        attractionsCount: d.attractions?.length || 0,
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

export const getAdminDestinationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dest = await Destination.findById(id).populate('attractions');
    if (!dest) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }
    res.status(200).json({ success: true, data: dest });
  } catch (error) {
    next(error);
  }
};

export const createAdminDestination = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      region,
      country = 'India',
      chapter = '01',
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
      elevation,
      coordinates,
      fallbackColor = '#183D35',
      featured = false,
      popularity = 80,
      isActive = true,
    } = req.body;

    if (!name || !slug || !region || !description || !image || !category || estimatedDailyBudget === undefined || !bestTime) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: name, slug, region, description, image, category, estimatedDailyBudget, bestTime.',
      });
    }

    const normalizedSlug = slug.toLowerCase().trim();
    const existing = await Destination.findOne({ slug: normalizedSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Destination slug "${normalizedSlug}" is already in use. Please specify a unique slug.`,
      });
    }

    const destination = await Destination.create({
      name: name.trim(),
      slug: normalizedSlug,
      region: region.trim(),
      country: country.trim(),
      chapter: chapter.trim(),
      headline: headline?.trim(),
      description: description.trim(),
      editorialStory: editorialStory?.trim(),
      image: image.trim(),
      gallery: Array.isArray(gallery) ? gallery : [],
      category,
      tags: Array.isArray(tags) ? tags : [],
      interests: Array.isArray(interests) ? interests : [],
      estimatedDailyBudget: Number(estimatedDailyBudget),
      budgetTier,
      bestTime: bestTime.trim(),
      idealDays: idealDays.trim(),
      elevation: elevation?.trim(),
      coordinates,
      fallbackColor,
      featured: Boolean(featured),
      popularity: Number(popularity) || 80,
      isActive: Boolean(isActive),
    });

    await recordAuditLog({
      req,
      action: 'DESTINATION_CREATE',
      targetType: 'Destination',
      targetId: destination._id,
      targetName: destination.name,
      summary: `Created destination "${destination.name}" (${destination.slug})`,
      metadata: { slug: destination.slug, category: destination.category, budget: destination.estimatedDailyBudget },
    });

    res.status(201).json({
      success: true,
      message: `Destination "${destination.name}" created successfully.`,
      data: destination,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminDestination = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dest = await Destination.findById(id);
    if (!dest) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    if (req.body.slug && req.body.slug.toLowerCase().trim() !== dest.slug) {
      const slugExists = await Destination.findOne({
        slug: req.body.slug.toLowerCase().trim(),
        _id: { $ne: dest._id },
      });
      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: `Slug "${req.body.slug}" is already taken by another destination.`,
        });
      }
    }

    const previousName = dest.name;
    Object.assign(dest, req.body);
    if (req.body.slug) dest.slug = req.body.slug.toLowerCase().trim();

    await dest.save();

    await recordAuditLog({
      req,
      action: 'DESTINATION_UPDATE',
      targetType: 'Destination',
      targetId: dest._id,
      targetName: dest.name,
      summary: `Updated destination "${previousName}" (ID: ${dest._id})`,
      metadata: { updatedFields: Object.keys(req.body) },
    });

    res.status(200).json({
      success: true,
      message: `Destination "${dest.name}" updated successfully.`,
      data: dest,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleDestinationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dest = await Destination.findById(id);
    if (!dest) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    dest.isActive = !dest.isActive;
    await dest.save();

    const actionText = dest.isActive ? 'published' : 'unpublished';

    await recordAuditLog({
      req,
      action: 'DESTINATION_PUBLISH',
      targetType: 'Destination',
      targetId: dest._id,
      targetName: dest.name,
      summary: `${actionText.toUpperCase()} destination "${dest.name}"`,
      metadata: { isActive: dest.isActive },
    });

    res.status(200).json({
      success: true,
      message: `Destination "${dest.name}" is now ${actionText}.`,
      data: { id: dest._id, isActive: dest.isActive },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminDestination = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dest = await Destination.findById(id);
    if (!dest) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    const destName = dest.name;
    const destId = dest._id;

    // Delete associated attractions to prevent orphans
    const deletedAttractions = await Attraction.deleteMany({ destination: destId });
    await Destination.findByIdAndDelete(destId);

    await recordAuditLog({
      req,
      action: 'DESTINATION_DELETE',
      targetType: 'Destination',
      targetId: destId,
      targetName: destName,
      summary: `Deleted destination "${destName}" and purged ${deletedAttractions.deletedCount} associated attractions.`,
      metadata: { deletedAttractionsCount: deletedAttractions.deletedCount },
    });

    res.status(200).json({
      success: true,
      message: `Destination "${destName}" and ${deletedAttractions.deletedCount} associated attractions deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 3. ATTRACTION CRUD & MANAGEMENT
// =========================================================================

export const getAdminAttractions = async (req, res, next) => {
  try {
    const { destination, category, status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (destination && destination !== 'All') {
      if (mongoose.Types.ObjectId.isValid(destination)) {
        query.destination = destination;
      } else {
        query.destinationSlug = destination.toLowerCase().trim();
      }
    }

    if (category && category !== 'All') {
      query.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ name: regex }, { headline: regex }, { location: regex }, { description: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, attractions] = await Promise.all([
      Attraction.countDocuments(query),
      Attraction.find(query)
        .populate('destination', 'name slug region')
        .sort({ destinationSlug: 1, order: 1, name: 1 })
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

export const getAdminAttractionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attraction = await Attraction.findById(id).populate('destination', 'name slug');
    if (!attraction) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }
    res.status(200).json({ success: true, data: attraction });
  } catch (error) {
    next(error);
  }
};

export const createAdminAttraction = async (req, res, next) => {
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
      isActive = true,
    } = req.body;

    if (!name || !slug || !destination || !description || !category || !image) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: name, slug, destination, description, category, image.',
      });
    }

    let destDoc;
    if (mongoose.Types.ObjectId.isValid(destination)) {
      destDoc = await Destination.findById(destination);
    } else {
      destDoc = await Destination.findOne({ slug: destination.toLowerCase().trim() });
    }

    if (!destDoc) {
      return res.status(400).json({
        success: false,
        message: 'Associated destination does not exist. Please select a valid destination.',
      });
    }

    const normalizedSlug = slug.toLowerCase().trim();
    const existing = await Attraction.findOne({ destination: destDoc._id, slug: normalizedSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An attraction with slug "${normalizedSlug}" already exists under ${destDoc.name}.`,
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
      gallery: Array.isArray(gallery) ? gallery : [],
      location: location?.trim(),
      coordinates,
      estimatedPriceINR: Number(estimatedPriceINR) || 0,
      priceNote: priceNote?.trim(),
      estimatedDuration: estimatedDuration.trim(),
      openingHours: openingHours?.trim(),
      bestTimeToVisit: bestTimeToVisit?.trim(),
      suitableInterests: Array.isArray(suitableInterests) ? suitableInterests : [],
      order: Number(order) || 0,
      isActive: Boolean(isActive),
    });

    await recordAuditLog({
      req,
      action: 'ATTRACTION_CREATE',
      targetType: 'Attraction',
      targetId: attraction._id,
      targetName: attraction.name,
      summary: `Created attraction "${attraction.name}" under ${destDoc.name}`,
      metadata: { destination: destDoc.name, category: attraction.category, price: attraction.estimatedPriceINR },
    });

    res.status(201).json({
      success: true,
      message: `Attraction "${attraction.name}" created successfully.`,
      data: attraction,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminAttraction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attraction = await Attraction.findById(id);
    if (!attraction) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }

    const previousName = attraction.name;

    // Check slug conflict within destination if changing slug
    if (req.body.slug && req.body.slug.toLowerCase().trim() !== attraction.slug) {
      const existing = await Attraction.findOne({
        destination: attraction.destination,
        slug: req.body.slug.toLowerCase().trim(),
        _id: { $ne: attraction._id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Slug "${req.body.slug}" already exists for an attraction in this destination.`,
        });
      }
    }

    Object.assign(attraction, req.body);
    if (req.body.slug) attraction.slug = req.body.slug.toLowerCase().trim();

    await attraction.save();

    await recordAuditLog({
      req,
      action: 'ATTRACTION_UPDATE',
      targetType: 'Attraction',
      targetId: attraction._id,
      targetName: attraction.name,
      summary: `Updated attraction "${previousName}" (ID: ${attraction._id})`,
      metadata: { updatedFields: Object.keys(req.body) },
    });

    res.status(200).json({
      success: true,
      message: `Attraction "${attraction.name}" updated successfully.`,
      data: attraction,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAttractionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attraction = await Attraction.findById(id);
    if (!attraction) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }

    attraction.isActive = !attraction.isActive;
    await attraction.save();

    const actionText = attraction.isActive ? 'published' : 'unpublished';

    await recordAuditLog({
      req,
      action: 'ATTRACTION_UPDATE',
      targetType: 'Attraction',
      targetId: attraction._id,
      targetName: attraction.name,
      summary: `Toggled attraction "${attraction.name}" status to ${actionText}`,
      metadata: { isActive: attraction.isActive },
    });

    res.status(200).json({
      success: true,
      message: `Attraction "${attraction.name}" is now ${actionText}.`,
      data: { id: attraction._id, isActive: attraction.isActive },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminAttraction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attraction = await Attraction.findById(id);
    if (!attraction) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }

    const attrName = attraction.name;
    const attrId = attraction._id;

    await Attraction.findByIdAndDelete(attrId);

    await recordAuditLog({
      req,
      action: 'ATTRACTION_DELETE',
      targetType: 'Attraction',
      targetId: attrId,
      targetName: attrName,
      summary: `Deleted attraction "${attrName}"`,
      metadata: { deletedId: attrId },
    });

    res.status(200).json({
      success: true,
      message: `Attraction "${attrName}" deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 4. USER DIRECTORY, ROLES & ACCOUNT SUSPENSION
// =========================================================================

export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 15 } = req.query;

    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'trips',
            localField: '_id',
            foreignField: 'userId',
            as: 'userTrips',
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            role: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            tripsCount: { $size: '$userTrips' },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: users.map((u) => ({
        ...u,
        id: u._id.toString(),
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

export const getAdminUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('name email role isActive createdAt updatedAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    const trips = await Trip.find({ userId: user._id }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        trips: trips.map((t) => ({ ...t, id: t._id.toString() })),
        tripsCount: trips.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Role must be either "admin" or "user".',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // 1. Self-demotion protection
    if (targetUser._id.equals(req.user._id) && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Security policy: Administrators cannot demote their own account.',
      });
    }

    // 2. Last-admin protection
    if (targetUser.role === 'admin' && role === 'user') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Security policy: Cannot demote the last active administrator.',
        });
      }
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await recordAuditLog({
      req,
      action: 'USER_ROLE_CHANGE',
      targetType: 'User',
      targetId: targetUser._id,
      targetName: targetUser.name,
      summary: `Changed role of user "${targetUser.email}" from ${oldRole} to ${role}`,
      metadata: { previousRole: oldRole, newRole: role },
    });

    res.status(200).json({
      success: true,
      message: `User "${targetUser.name}" role updated to ${role}.`,
      data: { id: targetUser._id, role: targetUser.role },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Self-suspension protection
    if (targetUser._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Security policy: You cannot deactivate your own administrative account.',
      });
    }

    // Last-admin suspension protection
    if (targetUser.role === 'admin' && targetUser.isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Security policy: Cannot deactivate the last active administrator.',
        });
      }
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    const actionText = targetUser.isActive ? 'activated' : 'deactivated';

    await recordAuditLog({
      req,
      action: 'USER_STATUS_CHANGE',
      targetType: 'User',
      targetId: targetUser._id,
      targetName: targetUser.name,
      summary: `Account for "${targetUser.email}" was ${actionText}`,
      metadata: { isActive: targetUser.isActive },
    });

    res.status(200).json({
      success: true,
      message: `User account "${targetUser.email}" is now ${actionText}.`,
      data: { id: targetUser._id, isActive: targetUser.isActive },
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 5. TRIP DIRECTORY & MANAGEMENT
// =========================================================================

export const getAdminTrips = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 15 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ destination: regex }, { travelStyle: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, trips] = await Promise.all([
      Trip.countDocuments(query),
      Trip.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: trips.map((t) => ({
        ...t,
        id: t._id.toString(),
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

export const getAdminTripById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findById(id).populate('userId', 'name email role createdAt');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

export const updateAdminTripStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'saved', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Permitted values: "draft", "saved", "completed".',
      });
    }

    const trip = await Trip.findById(id).populate('userId', 'name email');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const oldStatus = trip.status;
    trip.status = status;
    await trip.save();

    await recordAuditLog({
      req,
      action: 'TRIP_STATUS_CHANGE',
      targetType: 'Trip',
      targetId: trip._id,
      targetName: `Trip to ${trip.destination}`,
      summary: `Updated trip #${trip._id} status from ${oldStatus} to ${status}`,
      metadata: { userEmail: trip.userId?.email, destination: trip.destination, oldStatus, newStatus: status },
    });

    res.status(200).json({
      success: true,
      message: `Trip status updated to "${status}".`,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findById(id).populate('userId', 'name email');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const tripDest = trip.destination;
    const tripId = trip._id;

    await Trip.findByIdAndDelete(tripId);

    await recordAuditLog({
      req,
      action: 'TRIP_DELETE',
      targetType: 'Trip',
      targetId: tripId,
      targetName: `Trip to ${tripDest}`,
      summary: `Administratively deleted trip #${tripId} for destination "${tripDest}"`,
      metadata: { destination: tripDest, ownerEmail: trip.userId?.email },
    });

    res.status(200).json({
      success: true,
      message: `Trip to "${tripDest}" deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 6. AUDIT LOGS (IMMUTABLE VIEWER)
// =========================================================================

export const getAdminAuditLogs = async (req, res, next) => {
  try {
    const { action, targetType, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (action && action !== 'all') {
      query.action = action;
    }

    if (targetType && targetType !== 'all') {
      query.targetType = targetType;
    }

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ adminEmail: regex }, { targetName: regex }, { summary: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: logs.map((l) => ({ ...l, id: l._id.toString() })),
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

// =========================================================================
// 7. SYSTEM SETTINGS & HEALTH DIAGNOSTICS
// =========================================================================

export const getAdminSystemHealth = async (req, res, next) => {
  try {
    const dbStatus = getDbConnectionStatus();

    const [usersCount, destinationsCount, attractionsCount, tripsCount, auditLogsCount] =
      await Promise.all([
        User.countDocuments(),
        Destination.countDocuments(),
        Attraction.countDocuments(),
        Trip.countDocuments(),
        AuditLog.countDocuments(),
      ]);

    const memUsage = process.memoryUsage();

    res.status(200).json({
      success: true,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          rssMB: Math.round(memUsage.rss / 1024 / 1024),
        },
      },
      database: {
        connected: dbStatus.isConnected,
        status: dbStatus.status,
        stateCode: dbStatus.stateCode,
        host: mongoose.connection.host ? maskMongoUri(mongoose.connection.host) : 'MongoDB Atlas Cluster',
        name: mongoose.connection.name || 'smart_travel_planner',
        diagnosticReason: dbStatus.diagnosticReason,
        collections: {
          users: usersCount,
          destinations: destinationsCount,
          attractions: attractionsCount,
          trips: tripsCount,
          auditLogs: auditLogsCount,
        },
      },
      security: {
        jwtConfigured: Boolean(process.env.JWT_SECRET),
        corsOrigins: [process.env.CLIENT_URL || 'http://localhost:5173'],
        cookieHttpOnly: true,
        cookieSecure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      },
    });
  } catch (error) {
    next(error);
  }
};
