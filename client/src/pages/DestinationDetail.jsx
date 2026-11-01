import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Ticket,
  ChevronRight,
  RotateCcw,
  Tag,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDestinationBySlugOrId } from '../services/api';

export default function DestinationDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  const fetchDestination = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDestinationBySlugOrId(slug);
      if (res.success && res.data) {
        setDestination(res.data);
      } else {
        setError(res.message || 'Destination not found in atlas.');
      }
    } catch (err) {
      console.error('[DestinationDetail] Fetch error:', err);
      setError(err.response?.data?.message || 'Unable to connect to the cartographic archive.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestination();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse space-y-8">
          <div className="h-6 w-32 bg-forest/10 rounded-full" />
          <div className="h-96 w-full bg-forest/10 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-10 w-3/4 bg-forest/10 rounded-xl" />
              <div className="h-28 w-full bg-forest/10 rounded-xl" />
            </div>
            <div className="h-64 bg-forest/10 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-28 bg-ivory">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-parchment-light border border-border-parchment p-8 sm:p-10 rounded-2xl shadow-parchment text-center space-y-5"
        >
          <div className="w-14 h-14 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center border border-forest/20">
            <Compass className="w-7 h-7 text-forest" />
          </div>
          <h2 className="text-2xl font-serif text-ink tracking-tight">Chapter Uncharted</h2>
          <p className="text-sm text-charcoal leading-relaxed">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={fetchDestination}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-loose-editorial hover:bg-forest-light transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gold" />
              <span>Retry Survey</span>
            </button>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-border-parchment bg-ivory text-xs font-semibold uppercase tracking-loose-editorial text-ink hover:border-gold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Explore</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const coordinatesText =
    typeof destination.coordinates === 'object'
      ? destination.coordinates?.formatted
      : destination.coordinates;

  const galleryImages = [
    destination.image,
    ...(destination.gallery || []),
  ].filter(Boolean);

  const attractions = destination.attractions || [];

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-24">
      {/* Editorial Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-charcoal">
          <Link to="/explore" className="hover:text-forest flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Explore Atlas
          </Link>
          <span>/</span>
          <span className="text-gold-dark">{destination.region}</span>
          <span>/</span>
          <span className="text-ink font-semibold">{destination.name}</span>
        </div>
      </div>

      {/* Hero Visual Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden bg-forest-dark border border-border-subtle shadow-elevated h-[440px] sm:h-[520px] flex items-end p-6 sm:p-12 text-ivory"
        >
          {/* Main Hero Background Photo */}
          <img
            src={galleryImages[activeGalleryIndex] || destination.image}
            alt={destination.name}
            className="absolute inset-0 w-full h-full object-cover img-editorial transition-all duration-700"
          />

          {/* Luxury Film Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent pointer-events-none" />

          {/* Top Cartographic Header Stamp */}
          <div className="absolute top-6 left-6 sm:left-12 flex flex-wrap items-center gap-2 z-10">
            <span className="px-3.5 py-1 text-[11px] font-mono tracking-cartographic uppercase bg-ink/80 backdrop-blur-md text-gold rounded-full border border-gold/30 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-gold" />
              CHAPTER {destination.chapter || '01'} &bull; {coordinatesText || `${destination.region}, INDIA`}
            </span>
            <span className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase bg-forest-dark/80 backdrop-blur-md text-ivory rounded-full border border-white/20">
              {destination.category}
            </span>
            {destination.elevation && (
              <span className="hidden sm:inline px-3 py-1 text-[10px] font-mono tracking-widest uppercase bg-ink/70 backdrop-blur-md text-ivory/80 rounded-full border border-white/10">
                ELEV. {destination.elevation}
              </span>
            )}
          </div>

          {/* Hero Information Overlay */}
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-gold flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gold" />
              <span>{destination.region}, {destination.country || 'India'}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif text-white tracking-tight">
              {destination.name}
            </h1>

            {destination.headline && (
              <p className="text-base sm:text-xl font-light italic text-parchment-light/90 max-w-2xl">
                "{destination.headline}"
              </p>
            )}

            <div className="pt-3 flex flex-wrap gap-4 items-center">
              <button
                onClick={() => navigate(`/plan-trip?destination=${encodeURIComponent(destination.name)}`)}
                className="px-6 py-3 rounded-full bg-gold hover:bg-gold-light text-ink text-xs font-bold uppercase tracking-loose-editorial shadow-lg transition-transform hover:scale-105"
              >
                Plan Journey to {destination.name} &rarr;
              </button>

              {galleryImages.length > 1 && (
                <div className="flex items-center gap-1.5 bg-ink/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ivory/70 mr-1">Views:</span>
                  {galleryImages.slice(0, 4).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveGalleryIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        activeGalleryIndex === i ? 'bg-gold w-6' : 'bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid: Editorial Narrative & Travel Specs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Editorial Narrative (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-parchment-light border border-border-parchment p-8 sm:p-10 rounded-3xl shadow-soft">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-cartographic text-gold-dark mb-3">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>CHRONICLE & ESSENCE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight mb-4">
                The Spirit of {destination.name}
              </h2>
              <p className="text-base text-charcoal leading-relaxed mb-6 font-normal">
                {destination.description}
              </p>
              {destination.editorialStory && (
                <div className="pt-6 border-t border-border-parchment text-sm text-charcoal/90 leading-relaxed font-normal whitespace-pre-line space-y-4">
                  {destination.editorialStory}
                </div>
              )}

              {/* Tags & Interests */}
              {destination.interests && destination.interests.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border-parchment flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-cartographic text-charcoal/70 mr-1">
                    Key Interests:
                  </span>
                  {destination.interests.map((interest, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-ivory border border-border-parchment text-[11px] font-medium text-forest"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Travel Specifications Card (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-ivory border border-border-subtle p-6 sm:p-7 rounded-3xl shadow-soft space-y-6">
              <h3 className="text-lg font-serif text-ink tracking-tight pb-3 border-b border-border-subtle flex items-center justify-between">
                <span>Travel Specification</span>
                <SlidersHorizontal className="w-4 h-4 text-gold-dark" />
              </h3>

              <div className="space-y-4 text-xs">
                {/* Estimated Daily Budget */}
                <div className="flex items-start justify-between py-2 border-b border-border-subtle/60">
                  <span className="text-charcoal font-medium">Daily Budget Est.</span>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-forest block">
                      ₹{destination.estimatedDailyBudget?.toLocaleString('en-IN') || '—'}
                    </span>
                    <span className="text-[10px] text-charcoal/70 font-mono">
                      INR / person / day
                    </span>
                  </div>
                </div>

                {/* Budget Tier */}
                <div className="flex items-center justify-between py-2 border-b border-border-subtle/60">
                  <span className="text-charcoal font-medium">Budget Tier</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-parchment text-forest text-[11px] font-semibold tracking-wider uppercase border border-border-parchment">
                    {destination.budgetTier || 'Balanced'}
                  </span>
                </div>

                {/* Ideal Days */}
                <div className="flex items-center justify-between py-2 border-b border-border-subtle/60">
                  <span className="text-charcoal font-medium">Ideal Rhythm</span>
                  <span className="font-mono text-ink font-semibold">
                    {destination.idealDays || `${destination.averageDurationDays || 4} days`}
                  </span>
                </div>

                {/* Best Season */}
                <div className="flex items-center justify-between py-2 border-b border-border-subtle/60">
                  <span className="text-charcoal font-medium">Best Season</span>
                  <span className="font-medium text-ink">{destination.bestTime}</span>
                </div>

                {/* Coordinates */}
                {coordinatesText && (
                  <div className="flex items-start justify-between py-2 border-b border-border-subtle/60">
                    <span className="text-charcoal font-medium">Coordinates</span>
                    <span className="font-mono text-[11px] text-gold-dark font-medium text-right">
                      {coordinatesText}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => navigate(`/plan-trip?destination=${encodeURIComponent(destination.name)}`)}
                  className="w-full py-3 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-loose-editorial hover:bg-forest-light transition-colors text-center"
                >
                  Compose Custom Itinerary
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Curated Attractions & Sanctuaries */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-cartographic text-gold-dark mb-1">
              <Compass className="w-3.5 h-3.5 text-gold" />
              <span>SURVEYED LANDMARKS & SANCTUARIES</span>
            </div>
            <h2 className="text-3xl font-serif text-ink tracking-tight">
              Attractions in {destination.name}
            </h2>
          </div>
          <span className="text-xs font-mono uppercase text-charcoal mt-2 sm:mt-0">
            [ {attractions.length} Curated Landmarks ]
          </span>
        </div>

        {attractions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {attractions.map((attr, index) => (
              <motion.div
                key={attr.id || attr._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group rounded-2xl overflow-hidden bg-ivory border border-border-subtle shadow-soft hover:shadow-card transition-all flex flex-col"
              >
                {/* Attraction Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-forest-dark">
                  <img
                    src={attr.image}
                    alt={attr.name}
                    className="w-full h-full object-cover img-editorial group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-60" />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-ink/80 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-gold border border-gold/30">
                    {attr.category}
                  </div>

                  {/* Estimated Price Tag */}
                  <div className="absolute bottom-2.5 right-3 px-2.5 py-1 rounded bg-forest-dark/90 backdrop-blur-md text-ivory text-[10px] font-mono tracking-wider border border-white/10 flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-gold" />
                    <span>
                      {attr.estimatedPriceINR === 0 ? 'Free Entry' : `Est. ₹${attr.estimatedPriceINR}`}
                    </span>
                  </div>
                </div>

                {/* Attraction Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-serif text-ink tracking-tight group-hover:text-forest transition-colors mb-1.5">
                      {attr.name}
                    </h3>

                    {attr.headline && (
                      <p className="text-xs font-medium text-gold-dark italic mb-2">
                        "{attr.headline}"
                      </p>
                    )}

                    <p className="text-xs text-charcoal leading-relaxed line-clamp-3 mb-4">
                      {attr.description}
                    </p>

                    {/* Operational Details */}
                    <div className="space-y-1.5 text-[11px] text-charcoal pt-3 border-t border-border-subtle">
                      {attr.openingHours && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gold-dark shrink-0" />
                          <span className="truncate">{attr.openingHours}</span>
                        </div>
                      )}

                      {attr.estimatedDuration && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gold-dark shrink-0" />
                          <span>Visit duration: {attr.estimatedDuration}</span>
                        </div>
                      )}

                      {attr.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-gold-dark shrink-0" />
                          <span className="truncate">{attr.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suitable Interests Badges */}
                  {attr.suitableInterests && attr.suitableInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border-subtle">
                      {attr.suitableInterests.slice(0, 3).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded bg-parchment text-forest text-[10px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-parchment-light border border-dashed border-border-parchment rounded-2xl p-12 text-center max-w-md mx-auto">
            <Compass className="w-8 h-8 text-forest/40 mx-auto mb-3" />
            <h4 className="font-serif text-lg text-ink">Sanctuary Survey in Progress</h4>
            <p className="text-xs text-charcoal mt-1">
              Attractions for this chapter are currently being cataloged by our cartographers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
