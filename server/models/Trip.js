import mongoose from 'mongoose';

const activitySlotSchema = new mongoose.Schema(
  {
    time: { type: String, default: '' },
    activity: { type: String, required: [true, 'Activity name is required'] },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    estimatedCost: { type: Number, default: 0, min: 0 },
    attractionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attraction' },
    attractionSlug: { type: String, default: '' },
  },
  { _id: false }
);

const dailyMealsSchema = new mongoose.Schema(
  {
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    dinner: { type: String, default: '' },
  },
  { _id: false }
);

const itineraryDaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true, min: 1 },
    title: { type: String, required: [true, 'Day title is required'] },
    theme: { type: String, default: '' },
    morning: { type: activitySlotSchema, default: () => ({ activity: 'Morning Exploration' }) },
    afternoon: { type: activitySlotSchema, default: () => ({ activity: 'Afternoon Discovery' }) },
    evening: { type: activitySlotSchema, default: () => ({ activity: 'Evening Leisure & Sunset' }) },
    meals: { type: dailyMealsSchema, default: () => ({}) },
    dailyEstimatedCost: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const budgetBreakdownSchema = new mongoose.Schema(
  {
    accommodation: { type: Number, default: 0, min: 0 },
    activities: { type: Number, default: 0, min: 0 },
    food: { type: Number, default: 0, min: 0 },
    transport: { type: Number, default: 0, min: 0 },
    miscellaneous: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trip must belong to an authenticated user'],
      index: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
      maxlength: 100,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      index: true,
    },
    startDate: {
      type: String,
      trim: true,
    },
    endDate: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      default: 4,
      min: 1,
      max: 30,
    },
    travelers: {
      type: Number,
      default: 2,
      min: 1,
      max: 50,
    },
    travelGroup: {
      type: String,
      default: 'Couple',
      trim: true,
    },
    budget: {
      type: Number,
      default: 30000,
      min: 0,
    },
    travelStyle: {
      type: String,
      default: 'Balanced',
      trim: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    estimatedTotalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    budgetBreakdown: {
      type: budgetBreakdownSchema,
      default: () => ({}),
    },
    itinerary: {
      type: [itineraryDaySchema],
      default: [],
    },
    practicalTips: {
      type: [String],
      default: [],
    },
    aiGenerated: {
      type: Boolean,
      default: true,
    },
    aiModelUsed: {
      type: String,
      default: 'gemini',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['draft', 'saved', 'completed'],
      default: 'saved',
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

export default Trip;
