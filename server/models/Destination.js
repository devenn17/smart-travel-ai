import mongoose from 'mongoose';

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
      maxlength: [100, 'Destination name cannot exceed 100 characters'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    region: {
      type: String,
      required: [true, 'Region / State is required'],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    chapter: {
      type: String,
      default: '01',
      trim: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: 1000,
    },
    editorialStory: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    image: {
      type: String,
      required: [true, 'Hero image URL is required'],
      trim: true,
    },
    gallery: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Beach', 'Heritage', 'Mountains', 'Nature', 'Adventure', 'Spiritual'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    estimatedDailyBudget: {
      type: Number,
      required: [true, 'Estimated daily budget in INR is required'],
      min: [0, 'Budget must be a positive number'],
      index: true,
    },
    budgetTier: {
      type: String,
      enum: ['Budget', 'Budget & Balanced', 'Balanced', 'Balanced & Luxury', 'Luxury & Balanced', 'Luxury'],
      default: 'Balanced',
    },
    bestTime: {
      type: String,
      required: [true, 'Best time to visit is required'],
      trim: true,
    },
    idealDays: {
      type: String,
      default: '3–4 days',
      trim: true,
    },
    averageDurationDays: {
      type: Number,
      default: 4,
      min: 1,
      max: 30,
    },
    elevation: {
      type: String,
      trim: true,
    },
    coordinates: {
      formatted: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    fallbackColor: {
      type: String,
      default: '#183D35',
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    popularity: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual field for attractions belonging to this destination
destinationSchema.virtual('attractions', {
  ref: 'Attraction',
  localField: '_id',
  foreignField: 'destination',
});

// Compound index for category, budget, and featured queries
destinationSchema.index({ category: 1, estimatedDailyBudget: 1, featured: -1 });

// Text index for fast multi-field keyword searching
destinationSchema.index(
  {
    name: 'text',
    region: 'text',
    headline: 'text',
    description: 'text',
    tags: 'text',
  },
  {
    weights: {
      name: 10,
      region: 5,
      headline: 3,
      tags: 3,
      description: 1,
    },
    name: 'DestinationTextIndex',
  }
);

const Destination = mongoose.models.Destination || mongoose.model('Destination', destinationSchema);

export default Destination;
