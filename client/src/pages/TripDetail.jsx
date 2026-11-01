import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Calendar,
  Users,
  IndianRupee,
  MapPin,
  Clock,
  Sparkles,
  ArrowLeft,
  Share2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Utensils,
  Sun,
  Sunset,
  Moon,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTripById, deleteUserTrip } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchTrip = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTripById(id);
        if (isMounted && data && data.trip) {
          setTrip(data.trip);
        } else if (isMounted) {
          setError('Itinerary record could not be located.');
        }
      } catch (err) {
        if (isMounted) {
          console.error('[TripDetail] Fetch error:', err);
          setError(
            err.response?.data?.message ||
              'Unable to retrieve this itinerary. It may belong to another explorer or have been archived.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchTrip();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteUserTrip(id);
      navigate('/my-trips');
    } catch (err) {
      console.error('[TripDetail] Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete expedition.');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory pt-28 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-forest/10 border border-forest/20 text-forest mx-auto flex items-center justify-center animate-spin">
            <Compass className="w-8 h-8 text-gold" />
          </div>
          <span className="text-[11px] font-mono tracking-cartographic uppercase text-gold-dark block">
            RETRIEVING ITINERARY DOSSIER...
          </span>
          <p className="text-sm text-charcoal font-normal">
            Opening your personal cartographic records from the travel archive.
          </p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-ivory pt-28 pb-20">
        <div className="max-w-xl mx-auto px-4 text-center space-y-6">
          <div className="p-8 bg-parchment-light border border-border-parchment rounded-3xl shadow-parchment space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-serif text-ink">Itinerary Unavailable</h2>
            <p className="text-xs sm:text-sm text-charcoal leading-relaxed">{error}</p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/my-trips"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-loose-editorial hover:bg-forest-light transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-gold" />
                <span>Return to My Atlas</span>
              </Link>
              <Link
                to="/plan-trip"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ivory border border-border-parchment text-charcoal text-xs font-semibold uppercase tracking-loose-editorial hover:border-gold hover:text-ink transition-colors"
              >
                <span>Plan a New Journey</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const days = Array.isArray(trip.itinerary) ? trip.itinerary : [];
  const currentDayData = days.find((d) => d.dayNumber === activeDay) || days[0];

  const breakdown = trip.budgetBreakdown || {
    accommodation: Math.round((trip.budget || 40000) * 0.4),
    activities: Math.round((trip.budget || 40000) * 0.2),
    food: Math.round((trip.budget || 40000) * 0.22),
    transport: Math.round((trip.budget || 40000) * 0.12),
    miscellaneous: Math.max(1000, (trip.budget || 40000) * 0.06),
  };

  const totalCalculated =
    trip.estimatedTotalCost ||
    Object.values(breakdown).reduce((a, b) => a + Number(b || 0), 0);

  const budgetDelta = (trip.budget || 0) - totalCalculated;
  const isUnderBudget = budgetDelta >= 0;

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-20 selection:bg-gold/20 selection:text-ink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-xs font-mono text-charcoal">
            <Link to="/my-trips" className="hover:text-forest transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 text-gold" />
              <span>My Atlas</span>
            </Link>
            <span>/</span>
            <span className="text-gold-dark uppercase tracking-wider font-semibold">
              {trip.destination}
            </span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border-parchment bg-parchment-light hover:border-gold text-xs font-mono text-charcoal hover:text-ink transition-colors"
              title="Copy link to itinerary"
            >
              <Share2 className="w-3.5 h-3.5 text-gold" />
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border-parchment bg-parchment-light hover:border-gold text-xs font-mono text-charcoal hover:text-ink transition-colors"
              title="Print itinerary"
            >
              <Printer className="w-3.5 h-3.5 text-forest" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {deleteConfirm ? (
              <div className="inline-flex items-center gap-1.5 bg-red-50 p-1 rounded-full border border-red-200">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-red-700 transition"
                >
                  {deleting ? 'Removing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-2 py-1 text-[11px] font-mono text-charcoal hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="p-2 rounded-full border border-border-parchment hover:border-red-400 hover:text-red-700 text-charcoal/70 transition-colors"
                title="Remove Expedition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Hero Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="p-6 sm:p-10 rounded-3xl bg-forest text-ivory border border-gold/30 shadow-elevated relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-cartography opacity-15 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-[10px] font-mono tracking-cartographic uppercase text-gold">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>DYNAMIC GEMINI AI EXPEDITION DOSSIER &bull; VERIFIED ATLAS</span>
              </div>

              <span className="text-xs font-mono text-ivory/70">
                Created: {new Date(trip.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-serif text-white tracking-tight leading-tight">
                {trip.summary ? trip.destination + ' — ' + (days[0]?.theme || 'Curated Itinerary') : `Journey to ${trip.destination}`}
              </h1>
              {trip.summary && (
                <p className="text-sm sm:text-base text-ivory/90 leading-relaxed font-normal max-w-3xl">
                  {trip.summary}
                </p>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-forest-light/30 border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gold block">Duration</span>
                <span className="text-base sm:text-lg font-serif text-white font-medium">
                  {trip.duration} Days ({Math.max(1, trip.duration - 1)} Nights)
                </span>
                <span className="text-[10px] text-ivory/60 block mt-0.5">
                  {trip.startDate ? `${trip.startDate} to ${trip.endDate}` : 'Flexible departure'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-forest-light/30 border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gold block">Travelers</span>
                <span className="text-base sm:text-lg font-serif text-white font-medium">
                  {trip.travelers} Guests ({trip.travelGroup || 'Couple'})
                </span>
                <span className="text-[10px] text-ivory/60 block mt-0.5">
                  Style: {trip.travelStyle || 'Balanced'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-forest-light/30 border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gold block">Target Budget</span>
                <span className="text-base sm:text-lg font-serif text-white font-medium">
                  {formatINR(trip.budget)}
                </span>
                <span className="text-[10px] text-ivory/60 block mt-0.5">
                  Allocated budget limit
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-forest-light/30 border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gold block">Estimated Cost</span>
                <span className="text-base sm:text-lg font-serif text-gold-light font-medium">
                  {formatINR(totalCalculated)}
                </span>
                <span className={`text-[10px] block mt-0.5 font-medium ${isUnderBudget ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {isUnderBudget ? `₹${budgetDelta.toLocaleString('en-IN')} buffer remaining` : `₹${Math.abs(budgetDelta).toLocaleString('en-IN')} over target`}
                </span>
              </div>
            </div>

            {/* Selected Interests tags */}
            {trip.interests && trip.interests.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-mono text-ivory/60 uppercase">Interests:</span>
                {trip.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2.5 py-0.5 rounded-full bg-forest-dark/80 text-[11px] font-medium text-gold-light border border-gold/20"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Day Navigation Tabs */}
        {days.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {days.map((day) => {
              const isSelected = day.dayNumber === activeDay;
              return (
                <button
                  key={day.dayNumber}
                  onClick={() => setActiveDay(day.dayNumber)}
                  className={`px-5 py-3 rounded-2xl font-serif text-sm transition-all whitespace-nowrap flex items-center gap-2.5 border ${
                    isSelected
                      ? 'bg-forest text-ivory border-forest shadow-md'
                      : 'bg-parchment-light text-charcoal border-border-parchment hover:border-gold hover:text-ink'
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-gold text-ink font-bold' : 'bg-parchment text-charcoal/70'
                    }`}
                  >
                    Day 0{day.dayNumber}
                  </span>
                  <span>{day.title || `Day ${day.dayNumber}`}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Day Timeline Section */}
        {currentDayData && (
          <motion.div
            key={currentDayData.dayNumber}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Day Title & Theme Banner */}
            <div className="p-6 rounded-2xl bg-parchment-light border border-border-parchment shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-cartographic text-gold-dark block mb-1">
                  DAY 0{currentDayData.dayNumber} SCHEDULE &bull; {currentDayData.theme || 'Exploration'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-ink">
                  {currentDayData.title}
                </h2>
                {currentDayData.notes && (
                  <p className="text-xs sm:text-sm text-charcoal mt-1.5 flex items-start gap-1.5">
                    <Info className="w-4 h-4 text-gold-dark shrink-0 mt-0.5" />
                    <span>{currentDayData.notes}</span>
                  </p>
                )}
              </div>

              <div className="text-right sm:text-right shrink-0">
                <span className="text-[10px] font-mono text-charcoal uppercase block">Est. Daily Spend</span>
                <span className="text-xl font-serif text-forest font-semibold">
                  {formatINR(currentDayData.dailyEstimatedCost || 0)}
                </span>
              </div>
            </div>

            {/* Chronological Slots: Morning, Afternoon, Evening */}
            <div className="space-y-4">
              {/* Morning Slot */}
              {currentDayData.morning && (
                <div className="p-6 rounded-2xl bg-parchment-light border border-border-parchment shadow-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal block">
                          Morning Activity
                        </span>
                        <span className="text-xs font-mono text-gold-dark font-semibold">
                          {currentDayData.morning.time || '09:00 AM - 12:00 PM'}
                        </span>
                      </div>
                    </div>

                    {currentDayData.morning.estimatedCost > 0 && (
                      <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-forest/5 text-forest border border-forest/10">
                        {formatINR(currentDayData.morning.estimatedCost)}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-serif text-ink font-medium">
                      {currentDayData.morning.activity}
                    </h3>
                    {currentDayData.morning.location && (
                      <p className="text-xs text-forest font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gold" />
                        <span>{currentDayData.morning.location}</span>
                      </p>
                    )}
                    {currentDayData.morning.description && (
                      <p className="text-xs sm:text-sm text-charcoal leading-relaxed mt-2 font-normal">
                        {currentDayData.morning.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Afternoon Slot */}
              {currentDayData.afternoon && (
                <div className="p-6 rounded-2xl bg-parchment-light border border-border-parchment shadow-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-100/80 text-orange-800 flex items-center justify-center">
                        <Sunset className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal block">
                          Afternoon Discovery
                        </span>
                        <span className="text-xs font-mono text-gold-dark font-semibold">
                          {currentDayData.afternoon.time || '02:00 PM - 04:30 PM'}
                        </span>
                      </div>
                    </div>

                    {currentDayData.afternoon.estimatedCost > 0 && (
                      <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-forest/5 text-forest border border-forest/10">
                        {formatINR(currentDayData.afternoon.estimatedCost)}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-serif text-ink font-medium">
                      {currentDayData.afternoon.activity}
                    </h3>
                    {currentDayData.afternoon.location && (
                      <p className="text-xs text-forest font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gold" />
                        <span>{currentDayData.afternoon.location}</span>
                      </p>
                    )}
                    {currentDayData.afternoon.description && (
                      <p className="text-xs sm:text-sm text-charcoal leading-relaxed mt-2 font-normal">
                        {currentDayData.afternoon.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Evening Slot */}
              {currentDayData.evening && (
                <div className="p-6 rounded-2xl bg-parchment-light border border-border-parchment shadow-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-indigo-800 flex items-center justify-center">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal block">
                          Evening Promenade & Sunset
                        </span>
                        <span className="text-xs font-mono text-gold-dark font-semibold">
                          {currentDayData.evening.time || '05:30 PM - 08:30 PM'}
                        </span>
                      </div>
                    </div>

                    {currentDayData.evening.estimatedCost > 0 && (
                      <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-forest/5 text-forest border border-forest/10">
                        {formatINR(currentDayData.evening.estimatedCost)}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-serif text-ink font-medium">
                      {currentDayData.evening.activity}
                    </h3>
                    {currentDayData.evening.location && (
                      <p className="text-xs text-forest font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gold" />
                        <span>{currentDayData.evening.location}</span>
                      </p>
                    )}
                    {currentDayData.evening.description && (
                      <p className="text-xs sm:text-sm text-charcoal leading-relaxed mt-2 font-normal">
                        {currentDayData.evening.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Daily Meals Pairings */}
            {currentDayData.meals && (
              <div className="p-6 rounded-2xl bg-parchment border border-border-parchment space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-charcoal font-semibold">
                  <Utensils className="w-4 h-4 text-gold-dark" />
                  <span>Curated Dining & Regional Flavors</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {currentDayData.meals.breakfast && (
                    <div className="p-3 rounded-xl bg-ivory border border-border-parchment">
                      <span className="text-[10px] font-mono uppercase text-gold block font-semibold">Breakfast</span>
                      <p className="text-ink mt-0.5 font-medium">{currentDayData.meals.breakfast}</p>
                    </div>
                  )}
                  {currentDayData.meals.lunch && (
                    <div className="p-3 rounded-xl bg-ivory border border-border-parchment">
                      <span className="text-[10px] font-mono uppercase text-gold block font-semibold">Lunch</span>
                      <p className="text-ink mt-0.5 font-medium">{currentDayData.meals.lunch}</p>
                    </div>
                  )}
                  {currentDayData.meals.dinner && (
                    <div className="p-3 rounded-xl bg-ivory border border-border-parchment">
                      <span className="text-[10px] font-mono uppercase text-gold block font-semibold">Dinner</span>
                      <p className="text-ink mt-0.5 font-medium">{currentDayData.meals.dinner}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Budget Optimization Breakdown Grid */}
        <div className="p-6 sm:p-8 rounded-3xl bg-parchment-light border border-border-parchment shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-parchment pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-cartographic text-gold-dark block mb-1">
                FINANCIAL ARCHITECTURE & OPTIMIZATION
              </span>
              <h2 className="text-2xl font-serif text-ink">Estimated Budget Breakdown</h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-charcoal">Total Projected:</span>
              <span className="text-xl font-serif font-bold text-forest">{formatINR(totalCalculated)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-ivory border border-border-parchment text-center">
              <span className="text-[10px] font-mono uppercase text-charcoal/70 block">Lodging</span>
              <span className="text-base sm:text-lg font-serif font-semibold text-ink block mt-1">
                {formatINR(breakdown.accommodation)}
              </span>
              <span className="text-[10px] text-charcoal/60 font-mono mt-0.5 block">Havelis / Resorts</span>
            </div>

            <div className="p-4 rounded-2xl bg-ivory border border-border-parchment text-center">
              <span className="text-[10px] font-mono uppercase text-charcoal/70 block">Sightseeing</span>
              <span className="text-base sm:text-lg font-serif font-semibold text-ink block mt-1">
                {formatINR(breakdown.activities)}
              </span>
              <span className="text-[10px] text-charcoal/60 font-mono mt-0.5 block">Passes & Guides</span>
            </div>

            <div className="p-4 rounded-2xl bg-ivory border border-border-parchment text-center">
              <span className="text-[10px] font-mono uppercase text-charcoal/70 block">Dining</span>
              <span className="text-base sm:text-lg font-serif font-semibold text-ink block mt-1">
                {formatINR(breakdown.food)}
              </span>
              <span className="text-[10px] text-charcoal/60 font-mono mt-0.5 block">All Meals</span>
            </div>

            <div className="p-4 rounded-2xl bg-ivory border border-border-parchment text-center">
              <span className="text-[10px] font-mono uppercase text-charcoal/70 block">Transit</span>
              <span className="text-base sm:text-lg font-serif font-semibold text-ink block mt-1">
                {formatINR(breakdown.transport)}
              </span>
              <span className="text-[10px] text-charcoal/60 font-mono mt-0.5 block">Local Cabs / Boats</span>
            </div>

            <div className="p-4 rounded-2xl bg-ivory border border-border-parchment text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-charcoal/70 block">Buffer / Shopping</span>
              <span className="text-base sm:text-lg font-serif font-semibold text-ink block mt-1">
                {formatINR(breakdown.miscellaneous)}
              </span>
              <span className="text-[10px] text-charcoal/60 font-mono mt-0.5 block">Contingency</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 flex items-start gap-2.5 text-xs text-charcoal leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <span>
              <strong>Budget Transparency:</strong> All quotes are estimated in INR based on prevailing heritage rates, verified entry fees, and traveler group selections. Transport and lodging can be adjusted as you proceed with reservations.
            </span>
          </div>
        </div>

        {/* Practical Tips Dossier */}
        {trip.practicalTips && trip.practicalTips.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-parchment-light border border-border-parchment shadow-soft space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-cartographic text-gold-dark block">
              LOCAL PRACTICALITIES & ETIQUETTE
            </span>
            <h2 className="text-2xl font-serif text-ink">Field Notes for the Explorer</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {trip.practicalTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-ivory border border-border-parchment flex items-start gap-2.5 text-xs text-charcoal"
                >
                  <span className="w-5 h-5 rounded-full bg-forest/10 text-forest font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/my-trips"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-loose-editorial text-forest hover:text-gold-dark transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gold" />
            <span>Return to All Expeditions in My Atlas</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/plan-trip"
              state={{
                destination: trip.destination,
                duration: trip.duration?.toString(),
                budget: trip.budget?.toString(),
                interest: trip.interests?.[0] || '',
              }}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-ivory border border-border-parchment hover:border-gold text-charcoal hover:text-ink font-semibold text-xs uppercase tracking-loose-editorial transition-colors"
            >
              <span>Edit Preferences</span>
            </Link>

            <Link
              to="/explore"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-forest hover:bg-forest-light text-ivory font-semibold text-xs uppercase tracking-loose-editorial shadow-soft transition-colors"
            >
              <span>Explore More Chapters</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
