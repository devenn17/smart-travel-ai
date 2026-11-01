import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Calendar,
  Users,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateTripItinerary } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PlanTrip() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Helper: Today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Helper: Default End Date (e.g. +4 days from today)
  const getDefaultEndDate = (startDateStr, days = 4) => {
    const d = startDateStr ? new Date(startDateStr) : new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Initial values from query params or route state
  const paramDestination = searchParams.get('destination') || location.state?.destination || '';
  const paramDuration = searchParams.get('duration') || location.state?.duration || '4';
  const paramBudget = searchParams.get('budget') || location.state?.budget || '45000';
  const paramInterest = searchParams.get('interest') || location.state?.interest || 'Culture and heritage';

  // Form states
  const [destination, setDestination] = useState(paramDestination);
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getDefaultEndDate(getTodayString(), parseInt(paramDuration, 10) || 4));
  const [travelers, setTravelers] = useState(2);
  const [travelGroup, setTravelGroup] = useState('Couple');
  const [budget, setBudget] = useState(paramBudget);
  const [travelStyle, setTravelStyle] = useState('Balanced');

  // Multi-select interests
  const availableInterests = [
    'Nature',
    'Beaches',
    'Adventure',
    'Culture and heritage',
    'Food',
    'Shopping',
    'Spiritual experiences',
    'Relaxation',
    'Nightlife',
  ];

  // Map incoming param to interest list if applicable
  const getInitialInterests = () => {
    if (paramInterest) {
      const match = availableInterests.find(
        (i) => i.toLowerCase().includes(paramInterest.toLowerCase()) || paramInterest.toLowerCase().includes(i.toLowerCase())
      );
      if (match) return [match];
    }
    return ['Culture and heritage', 'Nature'];
  };

  const [selectedInterests, setSelectedInterests] = useState(getInitialInterests);

  // Validation and generation states
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  // Sync when searchParams change
  useEffect(() => {
    if (paramDestination) setDestination(paramDestination);
    if (paramBudget) setBudget(paramBudget);
  }, [paramDestination, paramBudget]);

  // Calculate duration between start date and end date
  const calculatedDurationDays = () => {
    if (!startDate || !endDate) return 4;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(30, diffDays || 4));
  };

  const calculatedDurationText = () => {
    const days = calculatedDurationDays();
    if (days === 1) return '1 day / 1 night';
    return `${days} days (${days - 1} nights)`;
  };

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
    if (errors.interests) {
      setErrors((prev) => ({ ...prev, interests: null }));
    }
  };

  const formatINR = (val) => {
    const num = Number(val);
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const validateForm = () => {
    const newErrors = {};
    const todayStr = getTodayString();

    // Destination
    if (!destination || !destination.trim()) {
      newErrors.destination = 'Please specify a destination for your journey.';
    }

    // Start date
    if (!startDate) {
      newErrors.startDate = 'Start date is required.';
    } else if (startDate < todayStr) {
      newErrors.startDate = 'Start date cannot be prior to today.';
    }

    // End date
    if (!endDate) {
      newErrors.endDate = 'End date is required.';
    } else if (startDate && endDate < startDate) {
      newErrors.endDate = 'End date cannot be earlier than your start date.';
    }

    // Travelers
    if (!travelers || Number(travelers) < 1) {
      newErrors.travelers = 'Number of travelers must be at least 1.';
    }

    // Budget
    if (!budget || Number(budget) <= 0) {
      newErrors.budget = 'Please enter a valid budget greater than ₹0.';
    }

    // Interests
    if (selectedInterests.length === 0) {
      newErrors.interests = 'Please select at least one travel interest.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isGenerating) return; // Prevent duplicate simultaneous generation requests
    setGenerationError(null);

    if (!validateForm()) {
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    // Require authentication to compose & persist itineraries
    if (!isAuthenticated || !user) {
      navigate('/login', {
        state: {
          from: location,
          message: 'Please sign in to compose and preserve your custom AI itinerary in your personal atlas.',
        },
      });
      return;
    }

    try {
      setIsGenerating(true);
      window.scrollTo({ top: 120, behavior: 'smooth' });

      const payload = {
        destination: destination.trim(),
        startDate,
        endDate,
        duration: calculatedDurationDays(),
        travelers: Number(travelers) || 2,
        travelGroup,
        budget: Number(budget) || 40000,
        travelStyle,
        interests: selectedInterests,
      };

      const res = await generateTripItinerary(payload);

      if (res && res.success && res.trip) {
        const newTripId = res.trip.id || res.trip._id;
        navigate(`/trips/${newTripId}`);
      } else {
        setGenerationError(
          res?.message || 'Itinerary generation did not return a valid expedition record.'
        );
      }
    } catch (err) {
      console.error('[PlanTrip] Generation error:', err);
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const serverMsg = err.response?.data?.message;

      let userFacingMsg = serverMsg;
      if (code === 'GEMINI_PROVIDER_OVERLOADED' || status === 503) {
        userFacingMsg =
          serverMsg ||
          'The AI travel synthesizer is currently experiencing high demand from travelers worldwide. Your trip preferences are safely preserved below — please click "Retry Generation" in a moment.';
      } else if (code === 'GEMINI_QUOTA_EXCEEDED' || status === 429) {
        userFacingMsg =
          serverMsg ||
          'Generation quota limit was temporarily reached. Your trip preferences are safely preserved — please wait a moment and click "Retry Generation".';
      } else if (code === 'GEMINI_TIMEOUT' || status === 504) {
        userFacingMsg =
          serverMsg ||
          'Itinerary synthesis took longer than expected. Your trip preferences are preserved — please click "Retry Generation" to try again.';
      } else if (code === 'GEMINI_NOT_CONFIGURED') {
        userFacingMsg =
          serverMsg ||
          'Gemini AI API key is not configured on the server. Please add GEMINI_API_KEY to your .env file.';
      } else if (!userFacingMsg) {
        userFacingMsg =
          'Unable to complete dynamic itinerary generation at this time. Please verify your settings and retry.';
      }

      setGenerationError(userFacingMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-20 selection:bg-gold/20 selection:text-ink">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="py-10 max-w-2xl"
        >
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-cartographic text-gold-dark mb-2">
            <Compass className="w-3.5 h-3.5 text-gold animate-ambient-drift" />
            <span>JOURNEY CONSULTATION &bull; DYNAMIC ITINERARY GENERATOR</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif text-ink tracking-tight mb-3">
            Let's compose your journey.
          </h1>
          <p className="text-base text-charcoal leading-relaxed font-normal">
            Tell us about your ideal travel rhythm. Gemini AI will cross-reference regional landmarks, authentic culinary encounters, and your budget to shape an unrepeatable expedition.
          </p>
        </motion.div>

        {/* Dynamic AI Generation Loading Dossier */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-10 p-8 sm:p-12 bg-forest text-ivory rounded-3xl shadow-elevated border border-gold/40 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-cartography opacity-20 pointer-events-none" />

              <div className="relative z-10 max-w-lg mx-auto space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-gold/20 border border-gold/40 text-gold mx-auto flex items-center justify-center animate-spin shadow-soft">
                  <Compass className="w-8 h-8 text-gold" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-cartographic uppercase text-gold block">
                    SYNTHESIZING WITH GEMINI AI &bull; GROUNDED IN ATLAS
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif text-white">
                    Composing your journey to {destination}...
                  </h3>
                  <p className="text-xs sm:text-sm text-ivory/80 leading-relaxed font-normal">
                    Weaving verified monuments, scheduling morning-to-evening rhythm, and balancing your {formatINR(budget)} budget for {travelers} guests.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-dark/80 border border-border-dark text-xs text-gold-light font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
                  <span>Optimizing daily schedule, meals & regional transit</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Notification Banner with Retry */}
        <AnimatePresence>
          {generationError && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mb-10 p-6 sm:p-8 bg-parchment-light border border-red-300 rounded-3xl shadow-soft text-ink"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-red-700 block font-semibold">
                      ITINERARY SYNTHESIS ADVISORY
                    </span>
                    <h3 className="text-xl font-serif text-ink mt-0.5">
                      Unable to Complete Generation
                    </h3>
                    <p className="text-xs sm:text-sm text-charcoal mt-1 leading-relaxed">
                      {generationError}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleSubmit()}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-loose-editorial hover:bg-forest-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 text-gold ${isGenerating ? 'animate-spin' : ''}`} />
                      <span>{isGenerating ? 'Composing...' : 'Retry Generation'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setGenerationError(null)}
                      className="text-xs font-mono text-charcoal hover:text-ink px-3 py-1 disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Travel Planning Form Workspace */}
        <form onSubmit={handleSubmit} className="bg-parchment-light border border-border-parchment rounded-3xl p-6 sm:p-10 shadow-parchment space-y-10">
          
          {/* Chapter 01: Where to? */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border-parchment pb-3">
              <span className="text-xs font-mono font-bold text-gold-dark">01</span>
              <h2 className="text-lg font-serif text-ink tracking-tight">Where to?</h2>
            </div>

            <div>
              <label htmlFor="destination-input" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-2">
                Destination or Region <span className="text-rose-600">*</span>
              </label>
              <input
                id="destination-input"
                type="text"
                value={destination}
                disabled={isGenerating}
                onChange={(e) => {
                  setDestination(e.target.value);
                  if (errors.destination) setErrors((prev) => ({ ...prev, destination: null }));
                }}
                placeholder="e.g. Udaipur, Kerala, Manali, Jaipur, Goa, Varanasi, Hampi..."
                className={`w-full px-4 py-3 bg-ivory border ${
                  errors.destination ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border-parchment'
                } rounded-xl text-sm text-ink placeholder:text-charcoal/50 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors disabled:opacity-50`}
              />
              {errors.destination && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.destination}</span>
                </p>
              )}
            </div>
          </div>

          {/* Chapter 02: When will you go? */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border-parchment pb-3">
              <span className="text-xs font-mono font-bold text-gold-dark">02</span>
              <h2 className="text-lg font-serif text-ink tracking-tight">When will you go?</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="start-date" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-2">
                  Start Date <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    min={getTodayString()}
                    disabled={isGenerating}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: null }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-ivory border ${
                      errors.startDate ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border-parchment'
                    } rounded-xl text-sm text-ink focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors disabled:opacity-50`}
                  />
                </div>
                {errors.startDate && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.startDate}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="end-date" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-2">
                  End Date <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    min={startDate || getTodayString()}
                    disabled={isGenerating}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-ivory border ${
                      errors.endDate ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border-parchment'
                    } rounded-xl text-sm text-ink focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors disabled:opacity-50`}
                  />
                </div>
                {errors.endDate && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.endDate}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Calculated duration badge */}
            <div className="flex items-center gap-2 pt-1 text-xs text-charcoal font-mono">
              <Clock className="w-3.5 h-3.5 text-gold-dark" />
              <span>Calculated expedition rhythm:</span>
              <span className="font-semibold text-forest underline decoration-gold/60 underline-offset-4">
                {calculatedDurationText()}
              </span>
            </div>
          </div>

          {/* Chapter 03: Who is exploring? */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border-parchment pb-3">
              <span className="text-xs font-mono font-bold text-gold-dark">03</span>
              <h2 className="text-lg font-serif text-ink tracking-tight">Who is exploring?</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="travelers-count" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-2">
                  Number of Travelers <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="travelers-count"
                    type="number"
                    min="1"
                    max="50"
                    value={travelers}
                    disabled={isGenerating}
                    onChange={(e) => {
                      setTravelers(e.target.value);
                      if (errors.travelers) setErrors((prev) => ({ ...prev, travelers: null }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-ivory border ${
                      errors.travelers ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border-parchment'
                    } rounded-xl text-sm text-ink focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors disabled:opacity-50`}
                  />
                </div>
                {errors.travelers && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.travelers}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-2">
                  Travel Group Dynamic
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Solo', 'Couple', 'Family', 'Friends'].map((group) => (
                    <button
                      key={group}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setTravelGroup(group)}
                      className={`py-2.5 text-xs font-medium rounded-xl border transition-all ${
                        travelGroup === group
                          ? 'bg-forest text-ivory border-forest font-semibold shadow-sm'
                          : 'bg-ivory border-border-parchment text-charcoal hover:border-gold'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chapter 04: Travel Interests */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border-parchment pb-3">
              <span className="text-xs font-mono font-bold text-gold-dark">04</span>
              <h2 className="text-lg font-serif text-ink tracking-tight">Curated Passions & Interests</h2>
            </div>

            <div>
              <p className="text-xs text-charcoal mb-3">
                Select one or more themes to shape daily activity suggestions and destination experiences.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {availableInterests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-xs transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-forest text-ivory border-forest shadow-sm font-semibold'
                          : 'bg-ivory border-border-parchment text-charcoal hover:border-gold'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-gold" /> : null}
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </div>
              {errors.interests && (
                <p className="mt-2 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.interests}</span>
                </p>
              )}
            </div>
          </div>

          {/* Chapter 05: Budget & Travel Style */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border-parchment pb-3">
              <span className="text-xs font-mono font-bold text-gold-dark">05</span>
              <h2 className="text-lg font-serif text-ink tracking-tight">Budget & Travel Philosophy</h2>
            </div>

            <div>
              <label htmlFor="budget-input" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-2">
                Total Budget (INR) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="budget-input"
                  type="number"
                  min="1000"
                  step="1000"
                  value={budget}
                  disabled={isGenerating}
                  onChange={(e) => {
                    setBudget(e.target.value);
                    if (errors.budget) setErrors((prev) => ({ ...prev, budget: null }));
                  }}
                  className={`w-full pl-10 pr-4 py-3 bg-ivory border ${
                    errors.budget ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border-parchment'
                  } rounded-xl text-base font-serif text-ink focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors disabled:opacity-50`}
                />
              </div>
              {errors.budget && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.budget}</span>
                </p>
              )}

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-[10px] font-mono uppercase text-charcoal/60 mr-1">Quick Select:</span>
                {[25000, 45000, 75000, 120000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      setBudget(amt.toString());
                      if (errors.budget) setErrors((prev) => ({ ...prev, budget: null }));
                    }}
                    className="px-2.5 py-1 rounded-md bg-ivory border border-border-parchment hover:border-gold hover:text-ink text-charcoal font-mono text-[11px] transition-colors"
                  >
                    {formatINR(amt)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Travel Style Selector */}
          <div className="space-y-4 pt-2">
            <label className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-1">
              Travel Philosophy & Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'Budget', desc: 'Authentic homestays, scenic trains, and heritage street flavors' },
                { name: 'Balanced', desc: 'Boutique heritage havelis, private transfers, and relaxed dining' },
                { name: 'Luxury', desc: 'Palace suites, private culinary masters, and bespoke concierge' }
              ].map((style) => (
                <button
                  key={style.name}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setTravelStyle(style.name)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    travelStyle === style.name
                      ? 'bg-forest text-ivory border-forest shadow-sm'
                      : 'bg-ivory border-border-parchment text-charcoal hover:border-gold'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${travelStyle === style.name ? 'text-white' : 'text-ink'}`}>
                      {style.name}
                    </span>
                    {travelStyle === style.name && <Check className="w-4 h-4 text-gold" />}
                  </div>
                  <p className={`text-xs leading-relaxed font-normal ${travelStyle === style.name ? 'text-ivory/80' : 'text-charcoal'}`}>
                    {style.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t border-border-parchment flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-charcoal">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Grounded in Atlas Landmarks &bull; Dynamic Itinerary Generation</span>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-forest hover:bg-forest-light text-ivory font-semibold text-xs uppercase tracking-loose-editorial shadow-soft active:scale-[0.98] transition-all group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <span>Composing Itinerary...</span>
                </>
              ) : (
                <>
                  <span>Compose My Travel Plan</span>
                  <ArrowRight className="w-4 h-4 text-gold transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
