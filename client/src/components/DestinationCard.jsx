import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function DestinationCard({ destination, featured = false, layout = 'standard', index = 0 }) {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    const targetSlug = destination.slug || destination.id;
    if (targetSlug) {
      navigate(`/destinations/${targetSlug}`);
    } else {
      navigate(`/explore?search=${encodeURIComponent(destination.name)}`);
    }
  };

  const handlePlanClick = (e) => {
    e.stopPropagation();
    navigate(`/plan-trip?destination=${encodeURIComponent(destination.name)}`);
  };

  const formattedCoords =
    typeof destination.coordinates === 'object'
      ? destination.coordinates?.formatted
      : destination.coordinates;

  // FEATURED / DOMINANT CHAPTER CARD (Used in Homepage Showcase & Highlight spots)
  if (featured && layout === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        onClick={handleCardClick}
        className="group relative rounded-2xl overflow-hidden bg-ivory cursor-pointer shadow-elevated transition-all duration-700 border border-border-subtle grid grid-cols-1 lg:grid-cols-12 lg:h-[460px] max-h-none lg:max-h-[480px]"
      >
        {/* Dominant Image Side */}
        <div className="lg:col-span-7 relative h-72 sm:h-80 lg:h-full min-h-0 overflow-hidden bg-forest-dark">
          {!imageError ? (
            <img
              src={destination.image}
              alt={destination.name}
              onError={() => setImageError(true)}
              className="absolute inset-0 w-full h-full object-cover img-editorial opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              loading="lazy"
            />
          ) : (
            <div
              className="absolute inset-0 w-full h-full flex items-center justify-center p-8"
              style={{ backgroundColor: destination.fallbackColor || '#183D35' }}
            >
              <span className="text-3xl font-serif text-ivory/30">{destination.name}</span>
            </div>
          )}

          {/* Film gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-80 lg:opacity-40 pointer-events-none" />
          
          {/* Top Left Coordinates & Chapter Badge */}
          <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
            <span className="px-3 py-1 text-[10px] font-mono tracking-cartographic uppercase bg-ink/80 backdrop-blur-md text-gold rounded-full border border-gold/30">
              CH. {destination.chapter || '01'} &bull; {formattedCoords || 'INDIA'}
            </span>
          </div>

          {/* Bottom Left Elevation Indicator */}
          {destination.elevation && (
            <div className="absolute bottom-5 left-5 z-10 hidden sm:block">
              <span className="text-[10px] font-mono tracking-widest uppercase text-ivory/70 bg-ink/70 px-2.5 py-1 rounded backdrop-blur-sm border border-white/10">
                ELEV. {destination.elevation}
              </span>
            </div>
          )}
        </div>

        {/* Editorial Narrative Side (Warm Parchment) */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-9 flex flex-col justify-between bg-ivory text-ink relative min-h-0">
          <div>
            <div className="flex items-center justify-between text-xs text-charcoal font-medium tracking-wide uppercase mb-3">
              <span className="flex items-center gap-1.5 text-forest font-semibold">
                <MapPin className="w-3.5 h-3.5 text-gold" />
                {destination.region}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-parchment text-forest text-[11px] font-semibold tracking-wider uppercase border border-border-parchment">
                {destination.category}
              </span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-serif text-ink tracking-tight mb-2 group-hover:text-forest transition-colors">
              {destination.name}
            </h3>

            <p className="text-sm font-medium text-gold-dark italic mb-3">
              "{destination.headline}"
            </p>

            <p className="text-sm text-charcoal leading-relaxed mb-6 font-normal">
              {destination.description}
            </p>

            {/* Travel Notes */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-border-subtle text-xs text-charcoal mb-6">
              <div>
                <span className="text-[10px] font-mono text-gold-dark block uppercase tracking-wider">Ideal Rhythm</span>
                <span className="font-medium text-ink">{destination.idealDays}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-gold-dark block uppercase tracking-wider">Best Season</span>
                <span className="font-medium text-ink">{destination.bestTime}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-gold-dark block uppercase tracking-wider">Est. Budget</span>
                <span className="font-medium text-ink">
                  {destination.estimatedDailyBudget ? `₹${destination.estimatedDailyBudget.toLocaleString('en-IN')}/day` : destination.budgetTier || 'Balanced'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handlePlanClick}
              className="text-xs font-semibold uppercase tracking-loose-editorial px-4 py-2 bg-forest text-ivory rounded-full hover:bg-forest-light transition-colors"
            >
              Plan Journey
            </button>
            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-loose-editorial text-forest group-hover:text-gold-dark transition-colors">
              <span>View In Atlas</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // STANDARD EDITORIAL CARD
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -6, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
      transition={{ duration: 0.5, delay: Math.min((index % 6) * 0.06, 0.35), ease: [0.16, 1, 0.3, 1] }}
      onClick={handleCardClick}
      className="group relative rounded-xl overflow-hidden bg-ivory border border-border-subtle shadow-soft hover:shadow-card transition-shadow duration-400 flex flex-col cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-forest-dark">
        {!imageError ? (
          <img
            src={destination.image}
            alt={destination.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover img-editorial transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-6"
            style={{ backgroundColor: destination.fallbackColor || '#183D35' }}
          >
            <span className="text-xl font-serif text-ivory/50">{destination.name}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink/80 backdrop-blur-md text-[10px] font-mono tracking-wider text-ivory border border-white/10">
          <span>CH. {destination.chapter || '•'}</span>
          <span className="text-gold">&bull;</span>
          <span>{destination.region}</span>
        </div>

        <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-forest-dark/85 backdrop-blur-md text-[10px] font-semibold tracking-wider uppercase text-gold border border-gold/25">
          {destination.category}
        </div>

        {/* Coordinates stamp over image bottom with slide-up reveal */}
        {formattedCoords && (
          <div className="absolute bottom-2.5 left-3.5 text-[9px] font-mono tracking-widest uppercase text-ivory/90 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            {formattedCoords}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-ivory">
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <h4 className="text-2xl font-serif text-ink tracking-tight group-hover:text-forest transition-colors">
              {destination.name}
            </h4>
            <div className="text-right">
              <span className="text-[11px] text-charcoal/80 font-mono block">
                {destination.idealDays}
              </span>
              {destination.estimatedDailyBudget && (
                <span className="text-[11px] font-mono font-medium text-forest block">
                  ₹{destination.estimatedDailyBudget.toLocaleString('en-IN')}/day
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-charcoal leading-relaxed line-clamp-2 mb-4">
            {destination.description}
          </p>
        </div>

        <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handlePlanClick}
            className="text-[11px] font-semibold uppercase tracking-loose-editorial px-3 py-1.5 text-forest hover:bg-forest/5 rounded-md transition-colors"
          >
            Compose Plan
          </motion.button>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-loose-editorial text-forest group-hover:text-gold-dark transition-colors">
            Explore
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
