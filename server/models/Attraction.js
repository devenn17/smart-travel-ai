import mongoose from 'mongoose';

const attractionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Attraction name is required'],
      trim: true,
      maxlength: [120, 'Attraction name cannot exceed 120 characters'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: [true, 'Associated destination is required'],
      index: true,
    },
    destinationSlug: {
      type: String,
      required: [true, 'Destination slug is required for indexing'],
      lowercase: true,
      trim: true,
      index: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: ['Palace', 'Fort', 'Temple', 'Lake', 'Beach', 'Nature', 'Monument', 'Market', 'Museum', 'Viewpoint', 'Heritage'],
      index: true,
    },
    image: {
      type: String,
      required: [true, 'Attraction image URL is required'],
      trim: true,
    },
    gallery: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    coordinates: {
      formatted: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    estimatedPriceINR: {
      type: Number,
      default: 0,
      min: [0, 'Estimated entry price cannot be negative'],
    },
    priceNote: {
      type: String,
      trim: true,
      default: 'Estimated general entry',
    },
    estimatedDuration: {
      type: String,
      default: '2–3 hours',
      trim: true,
    },
    openingHours: {
      type: String,
      default: 'Open daily during daytime hours',
      trim: true,
    },
    bestTimeToVisit: {
      type: String,
      default: 'Morning or late afternoon',
      trim: true,
    },
    suitableInterests: {
      type: [String],
      default: [],
      index: true,
    },
    order: {
      type: Number,
      default: 0,
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
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Unique compound index so a destination cannot have two attractions with identical slug
attractionSchema.index({ destination: 1, slug: 1 }, { unique: true });

// Text search on attraction name and description
attractionSchema.index(
  {
    name: 'text',
    description: 'text',
    location: 'text',
  },
  {
    weights: {
      name: 10,
      location: 4,
      description: 1,
    },
    name: 'AttractionTextIndex',
  }
);

const Attraction = mongoose.models.Attraction || mongoose.model('Attraction', attractionSchema);

export default Attraction;
