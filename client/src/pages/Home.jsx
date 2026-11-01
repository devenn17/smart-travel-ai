import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Calendar,
  Sparkles,
  ChevronDown,
  Heart,
  CheckCircle2,
  Film
} from 'lucide-react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion
} from 'motion/react';
import DestinationCard from '../components/DestinationCard';
import { DESTINATIONS } from '../data/destinations';

export default function Home() {
  const navigate = useNavigate();

  // Section references for scroll parallax
  const heroRef = useRef(null);
  const mountainRef = useRef(null);
  const closingRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Integrated journey finder state
  const [destinationInput, setDestinationInput] = useState('');
  const [travelDuration, setTravelDuration] = useState('4');
  const [travelStyle, setTravelStyle] = useState('Heritage');
  const [travelBudget] = useState('45000');

  // Video fallback states
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);
  const [mountainVideoFailed, setMountainVideoFailed] = useState(false);
  const [closingVideoFailed, setClosingVideoFailed] = useState(false);

  // ========================================================
  // CONTINUOUS SCROLL-LINKED OBSERVABLES (Hero Parallax)
  // ========================================================
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  const rawHeroVideoY = useTransform(heroProgress, [0, 1], ['0%', '20%']);
  const rawHeroVideoScale = useTransform(heroProgress, [0, 1], [1.02, 1.16]);
  const rawHeroOverlay = useTransform(heroProgress, [0, 0.7, 1], [0.65, 0.85, 0.98]);
  const rawHeroTextY = useTransform(heroProgress, [0, 1], ['0%', '40%']);
  const rawHeroTextOpacity = useTransform(heroProgress, [0, 0.6], [1, 0]);

  // Spring smoothing for 60fps / 120fps display refresh rates
  const smoothHeroVideoY = useSpring(rawHeroVideoY, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const smoothHeroVideoScale = useSpring(rawHeroVideoScale, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const smoothHeroTextY = useSpring(rawHeroTextY, { stiffness: 120, damping: 30, restDelta: 0.001 });

  // ========================================================
  // SECTION 5 MOUNTAIN VIDEO SCROLL EXPANSION & PARALLAX
  // ========================================================
  const { scrollYProgress: mountainProgress } = useScroll({
    target: mountainRef,
    offset: ['start end', 'end start']
  });

  const rawMountainScale = useTransform(mountainProgress, [0, 0.45, 1], [0.94, 1.02, 0.96]);
  const rawMountainY = useTransform(mountainProgress, [0, 1], ['-6%', '6%']);
  const smoothMountainScale = useSpring(rawMountainScale, { stiffness: 100, damping: 25, restDelta: 0.001 });
  const smoothMountainY = useSpring(rawMountainY, { stiffness: 100, damping: 25, restDelta: 0.001 });

  // ========================================================
  // SECTION 7 CLOSING CTA CONTINUOUS ATMOSPHERIC DRIFT
  // ========================================================
  const { scrollYProgress: closingProgress } = useScroll({
    target: closingRef,
    offset: ['start end', 'end end']
  });

  const rawClosingScale = useTransform(closingProgress, [0, 1], [1.02, 1.14]);
  const smoothClosingScale = useSpring(rawClosingScale, { stiffness: 100, damping: 25, restDelta: 0.001 });

  // Core showcase destinations
  const showcaseDestinations = DESTINATIONS.filter((d) =>
    ['udaipur', 'kerala', 'manali', 'jaipur', 'goa', 'rishikesh'].includes(d.id)
  );
  const featuredDestination = showcaseDestinations.find((d) => d.id === 'udaipur') || showcaseDestinations[0];
  const supportingDestinations = showcaseDestinations.filter((d) => d.id !== featuredDestination.id);

  const handleFinderSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      destination: destinationInput || 'Udaipur',
      duration: travelDuration,
      budget: travelBudget,
      interest: travelStyle,
    });
    navigate(`/plan-trip?${params.toString()}`, {
      state: {
        fromHome: true,
        destination: destinationInput || 'Udaipur',
        duration: travelDuration,
        budget: travelBudget,
        interest: travelStyle,
      },
    });
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* ========================================================
          WORLD A: CINEMATIC MIDNIGHT HERO WITH CONTINUOUS SCROLL PARALLAX
          "Go where the story takes you."
          ======================================================== */}
      <section
        ref={heroRef}
        className="relative min-h-[96vh] flex items-center justify-center pt-28 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-ink"
      >
        
        {/* Continuous Scroll-Linked Parallax Video Layer */}
        <motion.div
          style={{
            y: shouldReduceMotion ? '0%' : smoothHeroVideoY,
            scale: shouldReduceMotion ? 1 : smoothHeroVideoScale
          }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          {!heroVideoFailed ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=2200&q=85"
              onError={() => setHeroVideoFailed(true)}
              className="w-full h-full object-cover object-center cinematic-video opacity-85"
            >
              <source src="/videos/hero-travel.mp4" type="video/mp4" />
            </video>
          ) : (
            <img
              src="https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=2200&q=85"
              alt="Dramatic mountain sunrise in the Himalayas"
              className="w-full h-full object-cover object-center scale-105"
            />
          )}

          {/* Subtle cartographic linework grid overlay */}
          <div className="absolute inset-0 bg-cartography-dark opacity-30 pointer-events-none" />
          
          {/* Graded dark editorial film overlay with golden vignette */}
          <motion.div
            style={{ opacity: shouldReduceMotion ? 0.7 : rawHeroOverlay }}
            className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/65 to-ink/95 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-ink/70 pointer-events-none" />
        </motion.div>

        {/* Vertical Chapter Marker (Desktop Left Edge) */}
        <div className="hidden xl:flex absolute left-8 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-6 text-[10px] font-mono tracking-cartographic uppercase text-gold-light/60">
          <span className="[writing-mode:vertical-rl] rotate-180">
            [ 24° 35' N, 73° 41' E ] &bull; ATLAS CHAPTER 01
          </span>
          <div className="w-[1px] h-16 bg-gold/30" />
          <Compass className="w-3.5 h-3.5 text-gold animate-compass-slow" />
        </div>

        {/* Hero Foreground Content with Scroll Parallax Float & Masked Line Reveals */}
        <motion.div
          style={{
            y: shouldReduceMotion ? '0%' : smoothHeroTextY,
            opacity: shouldReduceMotion ? 1 : rawHeroTextOpacity
          }}
          className="relative z-10 max-w-5xl mx-auto text-center space-y-7 pt-8 pb-16"
        >
          
          {/* Eyebrow Label */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ink/75 border border-gold/40 text-gold text-xs font-mono tracking-cartographic uppercase backdrop-blur-md shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>A DIFFERENT WAY TO SEE THE WORLD</span>
          </motion.div>

          {/* Main Headline with Split Masked Line Entrance */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-ivory tracking-tight leading-[1.08] max-w-4xl mx-auto">
            <span className="block overflow-hidden py-1">
              <motion.span
                initial={{ y: '110%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                Go where the
              </motion.span>
            </span>
            <span className="block overflow-hidden py-1">
              <motion.span
                initial={{ y: '110%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 0.95, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block italic font-normal text-gold-light"
              >
                story takes you.
              </motion.span>
            </span>
          </h1>

          {/* Supporting Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.52, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-ivory/85 font-normal max-w-2xl mx-auto leading-relaxed"
          >
            Your AI-powered travel companion, crafting personalized journeys, uncovering hidden gems, and turning your dreams into unforgettable adventures.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/plan-trip"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-gold hover:bg-gold-light text-ink font-semibold text-xs uppercase tracking-loose-editorial shadow-card transition-all group"
              >
                <span>Plan your journey</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-ivory border border-white/20 text-xs font-semibold uppercase tracking-loose-editorial backdrop-blur-md transition-all"
              >
                <span>Explore the atlas</span>
                <ArrowUpRight className="w-4 h-4 text-gold" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Cartographic Coordinates Footer of Hero & Reel Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="pt-6 flex flex-wrap items-center justify-center gap-3 text-ivory/50 text-[10px] font-mono tracking-widest uppercase"
          >
            <span>2026 EDITION</span>
            <span>&bull;</span>
            <span>CURATED INDIAN EXPEDITIONS</span>
            <span>&bull;</span>
            <span>THE ATLAS OF ELSEWHERE</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-gold/80">
              <Film className="w-3 h-3 text-gold" />
              CINEMATIC 720P AMBIENT REEL
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ========================================================
          SECTION 3: INTEGRATED JOURNEY FINDER
          Warm Parchment Surface Overlapping Hero Boundary
          ======================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 -mt-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="bg-parchment-light rounded-2xl p-6 sm:p-8 shadow-parchment border border-border-parchment">
          
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-border-parchment">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-forest/10 flex items-center justify-center text-forest border border-forest/20">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold tracking-loose-editorial text-ink uppercase">
                Journey Finder &bull; The Atlas Concierge
              </span>
            </div>
            <span className="text-[11px] font-mono text-charcoal hidden sm:inline">
              [ DIRECT TRAVEL PREFERENCE SYNC ]
            </span>
          </div>

          <form onSubmit={handleFinderSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Field 1: Destination */}
            <div className="space-y-1.5">
              <label htmlFor="finder-dest" className="block text-[10px] font-mono font-semibold text-charcoal tracking-cartographic uppercase">
                01 &bull; Destination
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-forest absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="finder-dest"
                  type="text"
                  placeholder="Where to? (e.g. Udaipur, Kerala)"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-sm text-ink placeholder:text-charcoal/50 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Field 2: Duration */}
            <div className="space-y-1.5">
              <label htmlFor="finder-duration" className="block text-[10px] font-mono font-semibold text-charcoal tracking-cartographic uppercase">
                02 &bull; Travel Rhythm
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-forest absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="finder-duration"
                  value={travelDuration}
                  onChange={(e) => setTravelDuration(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-sm text-ink focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="3">3 Days (Weekend Escape)</option>
                  <option value="4">4–5 Days (Immersive)</option>
                  <option value="7">7 Days (Full Circuit)</option>
                  <option value="10">10+ Days (Grand Journey)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-charcoal absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Field 3: Travel Style / Interest */}
            <div className="space-y-1.5">
              <label htmlFor="finder-style" className="block text-[10px] font-mono font-semibold text-charcoal tracking-cartographic uppercase">
                03 &bull; Travel Style
              </label>
              <div className="relative">
                <Heart className="w-4 h-4 text-forest absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="finder-style"
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-sm text-ink focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="Heritage">Heritage & Architecture</option>
                  <option value="Nature">Nature & Waterways</option>
                  <option value="Mountains">Himalayan Peaks</option>
                  <option value="Beach">Coastal Coves</option>
                  <option value="Spiritual">Spiritual Retreat</option>
                  <option value="Adventure">Active Adventure</option>
                </select>
                <ChevronDown className="w-4 h-4 text-charcoal absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Field 4: Find My Journey CTA */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-forest hover:bg-forest-light text-ivory font-semibold rounded-xl text-xs uppercase tracking-loose-editorial shadow-soft hover:shadow-card active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                <span>Find my journey</span>
                <ArrowRight className="w-4 h-4 text-gold transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </div>
      </motion.section>

      {/* ========================================================
          SECTION 4: DESTINATION EDITORIAL GALLERY
          "Not just places. Possibilities."
          ======================================================== */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
        >
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-cartographic text-gold-dark mb-2">
              <Compass className="w-3.5 h-3.5 text-gold animate-ambient-drift" />
              <span>PLACES WITH A PULSE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif text-ink tracking-tight">
              Not just places. Possibilities.
            </h2>
            <p className="text-base text-charcoal mt-2 max-w-xl font-normal">
              From timeless cities to untouched landscapes, find destinations that move you.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-loose-editorial text-forest hover:text-gold-dark transition-colors group"
          >
            <span>Explore The Full Atlas</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </motion.div>

        {/* Featured Dominant Story (Udaipur) */}
        <div className="mb-8">
          <DestinationCard destination={featuredDestination} featured={true} layout="featured" />
        </div>

        {/* Supporting Destination Gallery (Asymmetric Editorial Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportingDestinations.map((dest, i) => (
            <DestinationCard key={dest.id} destination={dest} index={i} />
          ))}
        </div>
      </section>

      {/* ========================================================
          SECTION 5: A NEW WAY TO TRAVEL & MOUNTAIN ESCAPE STORYTELLING
          "Less searching. More discovering."
          ======================================================== */}
      <section
        ref={mountainRef}
        className="py-24 bg-parchment-light border-y border-border-subtle relative overflow-hidden"
      >
        {/* Cartographic line overlay */}
        <div className="absolute inset-0 bg-cartography pointer-events-none opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Live Chapter Scroll Progress Line */}
          <div className="w-full h-[1px] bg-border-parchment relative overflow-hidden mb-12">
            <motion.div
              style={{ scaleX: shouldReduceMotion ? 1 : mountainProgress, transformOrigin: 'left' }}
              className="absolute inset-y-0 left-0 w-full bg-gold"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mb-12"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-cartographic text-gold-dark font-semibold">
                The SmartTravel Philosophy
              </span>
              <span className="text-[10px] font-mono tracking-widest text-charcoal/70 uppercase">
                [ 02 / 03 ATLAS CHAPTERS ]
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif text-ink tracking-tight mb-4">
              Less searching. More discovering.
            </h2>
            <p className="text-base text-charcoal leading-relaxed font-normal">
              Your next journey should feel like it was made just for you. Discover remarkable places, find your kind of adventure, and turn the way you want to travel into a journey worth remembering.
            </p>
          </motion.div>

          {/* Cinematic Editorial Mountain Video Showcase with Continuous Scroll Scaling */}
          <motion.div
            style={{
              scale: shouldReduceMotion ? 1 : smoothMountainScale
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl overflow-hidden bg-ink mb-16 shadow-elevated border border-border-subtle aspect-[16/9] sm:aspect-[21/9] max-h-[460px] flex items-end p-6 sm:p-10"
          >
            <motion.div
              style={{
                y: shouldReduceMotion ? '0%' : smoothMountainY,
                scale: 1.08
              }}
              className="absolute inset-0 w-full h-full"
            >
              {!mountainVideoFailed ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80"
                  onError={() => setMountainVideoFailed(true)}
                  className="w-full h-full object-cover cinematic-video opacity-80"
                >
                  <source src="/videos/mountain-escape.mp4" type="video/mp4" />
                </video>
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80"
                  alt="Mountain Ridge"
                  className="w-full h-full object-cover"
                />
              )}
            </motion.div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-2xl text-ivory space-y-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink/75 backdrop-blur-md border border-gold/40 text-gold text-[10px] font-mono tracking-cartographic uppercase shadow-sm">
                <Compass className="w-3 h-3 text-gold animate-ambient-drift" />
                EXPEDITION STORY &bull; HIGH ALTITUDES &bull; 32° 14' N, 77° 11' E
              </span>
              <h3 className="text-2xl sm:text-4xl font-serif text-white tracking-tight">
                Terrains that invite you to slow down.
              </h3>
              <p className="text-xs sm:text-sm text-ivory/85 max-w-lg leading-relaxed">
                From silent alpine passes to pine-scented valleys, travel isn't about rushing from coordinates to coordinates—it's about finding the moments that stay with you forever.
              </p>
            </div>

            <div className="hidden sm:block absolute top-6 right-6 z-10">
              <span className="text-[10px] font-mono text-ivory/60 tracking-widest uppercase bg-ink/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                DRONE CINEMATOGRAPHY &bull; 720P
              </span>
            </div>
          </motion.div>

          {/* 3 Practical Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Benefit 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-2xl bg-ivory border border-border-parchment shadow-soft hover:shadow-card hover:-translate-y-1 transition-all space-y-4"
            >
              <span className="text-xs font-mono font-semibold tracking-cartographic text-gold-dark uppercase block">
                01 &bull; RESONANCE
              </span>
              <h3 className="text-2xl font-serif text-ink">Find your kind of journey.</h3>
              <p className="text-sm text-charcoal leading-relaxed">
                Rather than generic top-ten lists, explore destinations aligned with your pace—whether that is quiet lakeside heritage, solitude among cedar forests, or active coastal living.
              </p>
              <div className="pt-2 text-xs font-mono text-forest flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                <span>Tailored to taste, group, and season</span>
              </div>
            </motion.div>

            {/* Benefit 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-2xl bg-ivory border border-border-parchment shadow-soft hover:shadow-card hover:-translate-y-1 transition-all space-y-4"
            >
              <span className="text-xs font-mono font-semibold tracking-cartographic text-gold-dark uppercase block">
                02 &bull; DISCOVERY
              </span>
              <h3 className="text-2xl font-serif text-ink">Discover places beyond the obvious.</h3>
              <p className="text-sm text-charcoal leading-relaxed">
                Uncover authentic chapters—from hidden spice estates in Wayanad to windswept boulder shrines in Hampi—connecting you to the stories behind the coordinates.
              </p>
              <div className="pt-2 text-xs font-mono text-forest flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                <span>Curated chapters with authentic context</span>
              </div>
            </motion.div>

            {/* Benefit 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-2xl bg-ivory border border-border-parchment shadow-soft hover:shadow-card hover:-translate-y-1 transition-all space-y-4"
            >
              <span className="text-xs font-mono font-semibold tracking-cartographic text-gold-dark uppercase block">
                03 &bull; CLARITY
              </span>
              <h3 className="text-2xl font-serif text-ink">Shape a trip around your time and budget.</h3>
              <p className="text-sm text-charcoal leading-relaxed">
                Set transparent financial guardrails in Indian Rupees. Shape your journey with realistic time horizons and practical travel rhythm.
              </p>
              <div className="pt-2 text-xs font-mono text-forest flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                <span>Transparent INR budgeting without surprises</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 6: THE JOURNEY PROCESS
          "THE ART OF GOING FURTHER"
          ======================================================== */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-[11px] font-mono uppercase tracking-cartographic text-gold-dark font-semibold">
            THE ART OF GOING FURTHER
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-ink tracking-tight mt-2 mb-3">
            From a passing thought to a remarkable journey.
          </h2>
          <p className="text-sm sm:text-base text-charcoal">
            Three simple steps designed to turn vague travel dreams into an executable, memorable expedition.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-parchment-light p-8 rounded-2xl border border-border-parchment shadow-soft space-y-4 hover:shadow-card hover:-translate-y-1 transition-all"
          >
            <span className="text-4xl font-serif text-gold-dark/40 font-bold block">
              01
            </span>
            <h3 className="text-xl font-serif text-ink">Tell us what moves you.</h3>
            <p className="text-sm text-charcoal leading-relaxed">
              Select your travel style, target dates, group composition, and the experiences that excite you—from royal palaces to mountain trails.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-parchment-light p-8 rounded-2xl border border-border-parchment shadow-soft space-y-4 hover:shadow-card hover:-translate-y-1 transition-all"
          >
            <span className="text-4xl font-serif text-gold-dark/40 font-bold block">
              02
            </span>
            <h3 className="text-xl font-serif text-ink">Explore possibilities.</h3>
            <p className="text-sm text-charcoal leading-relaxed">
              Explore curated Indian destinations with authentic previews, regional coordinates, and ideal seasonal guidance in the atlas.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-parchment-light p-8 rounded-2xl border border-border-parchment shadow-soft space-y-4 hover:shadow-card hover:-translate-y-1 transition-all"
          >
            <span className="text-4xl font-serif text-gold-dark/40 font-bold block">
              03
            </span>
            <h3 className="text-xl font-serif text-ink">Shape your journey.</h3>
            <p className="text-sm text-charcoal leading-relaxed">
              Fine-tune your rhythm, travelers, and budget in the dedicated trip workspace ready for upcoming intelligent itinerary generation.
            </p>
          </motion.div>

        </div>
      </section>

      {/* ========================================================
          SECTION 7: CLOSING CTA WITH ATMOSPHERIC VIDEO & SCROLL PARALLAX
          "Somewhere wonderful is waiting."
          ======================================================== */}
      <section
        ref={closingRef}
        className="py-28 bg-ink text-ivory relative overflow-hidden"
      >
        {/* Real atmospheric background video with continuous scroll scaling */}
        <motion.div
          style={{
            scale: shouldReduceMotion ? 1 : smoothClosingScale
          }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          {!closingVideoFailed ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1600&q=80"
              onError={() => setClosingVideoFailed(true)}
              className="w-full h-full object-cover object-center cinematic-video opacity-35"
            >
              <source src="/videos/atmospheric-journey.mp4" type="video/mp4" />
            </video>
          ) : (
            <img
              src="https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1600&q=80"
              alt="Udaipur Lake"
              className="w-full h-full object-cover opacity-25"
            />
          )}

          <div className="absolute inset-0 bg-cartography-dark pointer-events-none opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/90 pointer-events-none" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6"
        >
          <span className="text-[11px] font-mono uppercase tracking-cartographic text-gold font-semibold inline-block">
            YOUR NEXT CHAPTER
          </span>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight">
            Somewhere wonderful is waiting.
          </h2>
          <p className="text-base sm:text-lg text-ivory/80 max-w-xl mx-auto leading-relaxed font-normal">
            Begin with a place, a feeling, or simply the desire to go.
          </p>
          <div className="pt-3">
            <Link
              to="/plan-trip"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gold hover:bg-gold-light text-ink font-semibold text-xs uppercase tracking-loose-editorial shadow-card active:scale-95 transition-all group"
            >
              <span>Start planning</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
