import Trip from '../models/Trip.js';
import Destination from '../models/Destination.js';
import Attraction from '../models/Attraction.js';
import { getDbConnectionStatus } from '../config/db.js';
import {
  generateItineraryWithGemini,
  GeminiConfigurationError,
  GeminiGenerationError,
} from '../services/geminiService.js';
import { normalizeStringArray } from '../utils/normalize.js';

const escapeRegex = (str) => (str ? str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : '');

// @desc    Get all trips belonging to the authenticated user
// @route   GET /api/trips
// @access  Private
export const getMyTrips = async (req, res, next) => {
  try {
    const dbStatus = getDbConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(200).json({
        success: true,
        count: 0,
        trips: [],
        note: 'Database offline. Operating in in-memory mode.',
      });
    }

    // Strictly scoped to req.user._id
    const trips = await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip by ID (Strictly user-scoped or admin authorized)
// @route   GET /api/trips/:id
// @access  Private
export const getTripById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id).populate('destinationId', 'name image gallery headline region category');
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found in the travel atlas.',
      });
    }

    // Privacy & Security Check: User can only access their own trip unless admin
    const isOwner = trip.userId && trip.userId.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Security protocol: You do not have permission to view another explorer’s itinerary.',
      });
    }

    return res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate a real, day-by-day travel itinerary with Gemini AI and save to MongoDB
// @route   POST /api/trips/generate
// @access  Private
export const generateTripItinerary = async (req, res, next) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      duration,
      travelers = 2,
      travelGroup = 'Couple',
      budget = 40000,
      travelStyle = 'Balanced',
      interests = ['Culture and heritage', 'Nature'],
    } = req.body;

    // 1. Validate required fields
    if (!destination || !destination.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a destination for your journey.',
      });
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 30) {
      return res.status(400).json({
        success: false,
        message: 'Trip duration must be between 1 and 30 days.',
      });
    }

    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid travel budget greater than ₹0.',
      });
    }

    const travelersNum = parseInt(travelers, 10);
    if (isNaN(travelersNum) || travelersNum < 1 || travelersNum > 50) {
      return res.status(400).json({
        success: false,
        message: 'Number of travelers must be at least 1.',
      });
    }

    const normalizedInterests = normalizeStringArray(interests);
    const cleanInterests = normalizedInterests.length > 0
      ? normalizedInterests
      : ['Culture and heritage', 'Nature'];

    const startTime = Date.now();
    const trimmedDest = destination.trim();
    console.log(`[TripController] Itinerary synthesis initiated for "${trimmedDest}" (Duration: ${durationNum} days, Travelers: ${travelersNum}, Budget: ₹${budgetNum}, Style: ${travelStyle}) by User: ${req.user._id}`);

    // Prevent duplicate simultaneous or repeated submissions within a 15-second window
    const recentDuplicate = await Trip.findOne({
      userId: req.user._id,
      destination: trimmedDest,
      duration: durationNum,
      createdAt: { $gte: new Date(Date.now() - 15000) },
    });
    if (recentDuplicate) {
      console.log(`[TripController] Duplicate submission detected for User ${req.user._id} to "${trimmedDest}". Returning existing Trip ID: ${recentDuplicate._id}.`);
      return res.status(200).json({
        success: true,
        message: 'Your personalized itinerary was already crafted.',
        trip: recentDuplicate,
        duplicatePrevented: true,
      });
    }

    // 2. Retrieve destination details from MongoDB Atlas if available
    const destinationDoc = await Destination.findOne({
      $or: [
        { name: new RegExp(`^${escapeRegex(trimmedDest)}$`, 'i') },
        { slug: trimmedDest.toLowerCase() },
      ],
      isActive: true,
    });

    // 3. Retrieve verified attractions from MongoDB Atlas
    let verifiedAttractions = [];
    if (destinationDoc) {
      verifiedAttractions = await Attraction.find({
        destination: destinationDoc._id,
        isActive: true,
      }).select('name slug category estimatedPriceINR estimatedPrice estimatedDuration location description');
    } else {
      verifiedAttractions = await Attraction.find({
        $or: [
          { destinationSlug: trimmedDest.toLowerCase() },
          { location: new RegExp(escapeRegex(trimmedDest), 'i') },
        ],
        isActive: true,
      }).select('name slug category estimatedPriceINR estimatedPrice estimatedDuration location description');
    }

    // 4. Call Gemini AI to generate grounded day-by-day itinerary
    let generatedItinerary;
    try {
      generatedItinerary = await generateItineraryWithGemini({
        destination: trimmedDest,
        destinationInfo: destinationDoc,
        verifiedAttractions,
        startDate,
        endDate,
        duration: durationNum,
        travelers: travelersNum,
        travelGroup,
        budget: budgetNum,
        travelStyle,
        interests: cleanInterests,
      });
    } catch (aiErr) {
      const statusCode = aiErr.statusCode || 500;
      const code = aiErr.code || (statusCode === 503 ? 'GEMINI_PROVIDER_OVERLOADED' : statusCode === 429 ? 'GEMINI_QUOTA_EXCEEDED' : statusCode === 504 ? 'GEMINI_TIMEOUT' : 'GEMINI_GENERATION_FAILED');
      const elapsed = Date.now() - startTime;
      console.error(`[TripController] Itinerary synthesis failed after ${elapsed}ms (HTTP ${statusCode}, Code: ${code}):`, aiErr.message);
      return res.status(statusCode).json({
        success: false,
        code,
        message: aiErr.message || 'Failed to synthesize travel itinerary.',
      });
    }

    // 5. Persist the generated trip and itinerary in MongoDB
    const trip = await Trip.create({
      userId: req.user._id,
      destination: trimmedDest,
      title: generatedItinerary.title || `${trimmedDest} Expedition (${durationNum} Days)`,
      destinationId: destinationDoc ? destinationDoc._id : undefined,
      startDate: startDate || '',
      endDate: endDate || '',
      duration: durationNum,
      travelers: travelersNum,
      travelGroup,
      budget: budgetNum,
      travelStyle,
      interests: cleanInterests,
      summary: generatedItinerary.summary,
      estimatedTotalCost: generatedItinerary.estimatedTotalCost,
      budgetBreakdown: generatedItinerary.budgetBreakdown,
      itinerary: generatedItinerary.days,
      practicalTips: generatedItinerary.practicalTips,
      aiGenerated: true,
      aiModelUsed: generatedItinerary.aiModelUsed || 'gemini',
      status: 'saved',
    });

    const elapsed = Date.now() - startTime;
    console.log(`[TripController] Itinerary synthesized and persisted in MongoDB (${elapsed}ms): Trip ID: ${trip._id}, Model: ${trip.aiModelUsed}. Returning HTTP 201.`);

    return res.status(201).json({
      success: true,
      message: 'Your personalized itinerary has been crafted and recorded in your travel atlas.',
      trip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user trip
// @route   DELETE /api/trips/:id
// @access  Private
export const deleteTrip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found.',
      });
    }

    // Ownership or admin check
    if (!trip.userId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only remove your own trips.',
      });
    }

    await Trip.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Expedition removed from your personal atlas.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a basic trip (legacy backward compatibility)
// @route   POST /api/trips
// @access  Private
export const createTrip = async (req, res, next) => {
  try {
    const { destination, duration, budget, travelStyle, notes } = req.body;

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: 'Destination name is required to save a trip.',
      });
    }

    const trip = await Trip.create({
      userId: req.user._id,
      destination,
      duration: duration || 4,
      budget: budget || 30000,
      travelStyle: travelStyle || 'Heritage',
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Trip saved to your personal atlas.',
      trip,
    });
  } catch (error) {
    next(error);
  }
};
