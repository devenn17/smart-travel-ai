import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Luggage, Plus, ArrowRight, ShieldCheck, MapPin, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { getUserTrips } from '../services/api';

export default function MyTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTrips = async () => {
      try {
        const data = await getUserTrips();
        if (isMounted && data && Array.isArray(data.trips)) {
          setTrips(data.trips);
        }
      } catch (err) {
        console.warn('[MyTrips] Unable to load saved trips:', err.message);
      } finally {
        if (isMounted) setLoadingTrips(false);
      }
    };

    fetchTrips();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="py-10 max-w-2xl"
        >
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-cartographic text-gold-dark mb-2">
            <Compass className="w-3.5 h-3.5 text-gold animate-ambient-drift" />
            <span>PERSONAL EXPEDITION JOURNAL &bull; {user?.name || 'EXPLORER'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif text-ink tracking-tight mb-3">
            Your atlas of journeys.
          </h1>
          <p className="text-base text-charcoal leading-relaxed font-normal">
            Welcome, <span className="font-semibold text-ink">{user?.name}</span>. A private sanctuary to review your upcoming Indian itineraries, travel notes, and departures.
          </p>
        </motion.div>

        {/* Trips Display or Empty State */}
        {trips.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <span className="text-xs font-mono uppercase tracking-cartographic text-charcoal">
                SAVED EXPEDITIONS ({trips.length})
              </span>
              <Link
                to="/plan-trip"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-loose-editorial text-forest hover:text-gold-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Expedition</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trips.map((trip) => {
                const tripId = trip.id || trip._id;
                return (
                  <Link
                    key={tripId}
                    to={`/trips/${tripId}`}
                    className="p-6 rounded-2xl bg-parchment-light border border-border-parchment hover:border-gold shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-charcoal mb-2">
                        <span className="flex items-center gap-1.5 font-semibold text-forest">
                          <MapPin className="w-3.5 h-3.5 text-gold" />
                          {trip.destination}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {trip.aiGenerated && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest text-gold border border-gold/30">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>AI</span>
                            </span>
                          )}
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-parchment border border-border-parchment text-charcoal">
                            {trip.travelStyle || 'Curated'}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-serif text-ink group-hover:text-forest transition-colors">
                        {trip.destination}
                      </h3>
                      {trip.summary ? (
                        <p className="text-xs text-charcoal mt-2 line-clamp-2 leading-relaxed">
                          {trip.summary}
                        </p>
                      ) : trip.notes ? (
                        <p className="text-xs text-charcoal mt-2 line-clamp-2 leading-relaxed">
                          {trip.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="pt-3 border-t border-border-parchment flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4 text-charcoal">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-forest" />
                          <span>{trip.duration} Days</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-forest" />
                          <span>₹{Number(trip.budget).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-loose-editorial text-forest group-hover:text-gold-dark transition-colors">
                        <span>View Plan</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          /* Beautiful Journal Empty State */
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="bg-parchment-light border border-border-parchment rounded-2xl p-8 sm:p-14 shadow-parchment text-center relative overflow-hidden"
          >
            {/* Subtle cartographic linework overlay */}
            <div className="absolute inset-0 bg-cartography pointer-events-none opacity-40" />

            {/* Central content */}
            <div className="relative z-10 max-w-lg mx-auto space-y-6">
              
              {/* Compass / Luggage Emblem */}
              <div className="w-20 h-20 rounded-2xl bg-forest/10 border border-forest/20 text-forest mx-auto flex items-center justify-center shadow-soft animate-ambient-drift">
                <Luggage className="w-10 h-10 text-forest" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-cartographic uppercase text-gold-dark block">
                  [ UNCHARTED EXPEDITION LOG ]
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-ink">
                  Your next story begins here.
                </h2>
                <p className="text-sm text-charcoal leading-relaxed font-normal">
                  Start planning a journey and discover where the world might take you. Your authenticated expedition journal is ready to preserve your synchronized Indian departures.
                </p>
              </div>

              {/* Architecture note */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest/5 border border-forest/15 text-xs text-forest font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                <span>Authenticated Session Active &bull; Scoped to {user?.email}</span>
              </div>

              {/* Action CTA */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/plan-trip"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-forest hover:bg-forest-light text-ivory font-semibold text-xs uppercase tracking-loose-editorial shadow-soft transition-all group"
                >
                  <Plus className="w-4 h-4 text-gold" />
                  <span>Plan your first journey</span>
                  <ArrowRight className="w-4 h-4 text-gold/80 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/explore"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-full bg-ivory border border-border-parchment hover:border-gold text-charcoal hover:text-ink font-semibold text-xs uppercase tracking-loose-editorial transition-colors"
                >
                  Browse Curated Chapters
                </Link>
              </div>

            </div>

            {/* Cartographic Explorer Quote */}
            <div className="mt-14 pt-8 border-t border-border-parchment text-xs text-charcoal/70 italic font-serif max-w-md mx-auto">
              "To travel is to discover that everyone is wrong about other countries." — Aldous Huxley
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
