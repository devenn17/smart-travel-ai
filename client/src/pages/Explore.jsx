import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  MapPin,
  Compass,
  Waves,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  IndianRupee,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from 'motion/react';
import DestinationCard from '../components/DestinationCard';
import { getDestinations } from '../services/api';

const CATEGORIES = [
  'All',
  'Beach',
  'Heritage',
  'Mountains',
  'Nature',
  'Adventure',
  'Spiritual',
];

const BUDGET_PRESETS = [
  { id: 'all', label: 'All Budgets', min: undefined, max: undefined },
  { id: 'under-3500', label: 'Under ₹3,500', min: 0, max: 3500 },
  { id: '3500-5000', label: '₹3,500 – ₹5,000', min: 3500, max: 5000 },
  { id: 'above-5000', label: 'Above ₹5,000', min: 5000, max: undefined },
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'budget-asc', label: 'Budget: Low to High' },
  { id: 'budget-desc', label: 'Budget: High to Low' },
  { id: 'name-asc', label: 'Alphabetical (A–Z)' },
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videoFailed, setVideoFailed] = useState(false);
  const bannerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Coastal banner scroll-linked parallax
  const { scrollYProgress: bannerProgress } = useScroll({
    target: bannerRef,
    offset: ['start end', 'end start'],
  });

  const rawBannerScale = useTransform(bannerProgress, [0, 0.5, 1], [0.97, 1.02, 0.98]);
  const smoothBannerScale = useSpring(rawBannerScale, { stiffness: 100, damping: 25, restDelta: 0.001 });

  // Read initial query params
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialBudget = searchParams.get('budget') || 'all';
  const initialSort = searchParams.get('sort') || 'popular';
  const initialPage = parseInt(searchParams.get('page'), 10) || 1;

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeBudgetPreset, setActiveBudgetPreset] = useState(initialBudget);
  const [activeSort, setActiveSort] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // API State
  const [destinations, setDestinations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search query input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Synchronize state to URL search parameters
  const updateUrlParams = useCallback(
    (newSearch, newCategory, newBudget, newSort, newPage) => {
      const params = new URLSearchParams();
      if (newSearch) params.set('search', newSearch);
      if (newCategory && newCategory !== 'All') params.set('category', newCategory);
      if (newBudget && newBudget !== 'all') params.set('budget', newBudget);
      if (newSort && newSort !== 'popular') params.set('sort', newSort);
      if (newPage && newPage > 1) params.set('page', newPage.toString());
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Fetch destinations from backend API
  const fetchDestinations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const budgetConfig = BUDGET_PRESETS.find((b) => b.id === activeBudgetPreset) || BUDGET_PRESETS[0];

      const queryParams = {
        page: currentPage,
        limit: 9,
        sort: activeSort,
      };

      if (debouncedSearch.trim()) {
        queryParams.search = debouncedSearch.trim();
      }

      if (activeCategory && activeCategory !== 'All') {
        queryParams.category = activeCategory;
      }

      if (budgetConfig.min !== undefined) {
        queryParams.minBudget = budgetConfig.min;
      }

      if (budgetConfig.max !== undefined) {
        queryParams.maxBudget = budgetConfig.max;
      }

      const res = await getDestinations(queryParams);

      if (res.success) {
        setDestinations(res.data || []);
        setTotalCount(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      } else {
        setError(res.message || 'Unable to load chapters from archive.');
      }
    } catch (err) {
      console.error('[Explore] Fetch error:', err);
      setError(err.response?.data?.message || 'Database connection offline. Ensure server is active.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeCategory, activeBudgetPreset, activeSort, currentPage]);

  // Trigger fetch when any parameter updates
  useEffect(() => {
    fetchDestinations();
    updateUrlParams(debouncedSearch, activeCategory, activeBudgetPreset, activeSort, currentPage);
  }, [fetchDestinations, debouncedSearch, activeCategory, activeBudgetPreset, activeSort, currentPage, updateUrlParams]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setActiveCategory('All');
    setActiveBudgetPreset('all');
    setActiveSort('popular');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleCategorySelect = (category) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleBudgetSelect = (presetId) => {
    setActiveBudgetPreset(presetId);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setActiveSort(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Atlas Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="py-8 max-w-3xl"
        >
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-cartographic text-gold-dark mb-2">
            <Compass className="w-3.5 h-3.5 text-gold animate-ambient-drift" />
            <span>THE CARTOGRAPHIC ARCHIVE</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif text-ink tracking-tight mb-3">
            Find your elsewhere.
          </h1>
          <p className="text-base sm:text-lg text-charcoal leading-relaxed font-normal">
            Some journeys begin with a place. Others begin with a feeling. Explore database-backed Indian chapters across sacred rivers, mist-draped peaks, and royal havelis.
          </p>
        </motion.div>

        {/* Cinematic Coastal Journey Highlight Strip */}
        <motion.div
          ref={bannerRef}
          style={{
            scale: shouldReduceMotion ? 1 : smoothBannerScale,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl overflow-hidden bg-ink mb-10 shadow-elevated border border-border-subtle h-48 sm:h-56 flex items-center px-6 sm:px-10"
        >
          {!videoFailed ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80"
              onError={() => setVideoFailed(true)}
              className="absolute inset-0 w-full h-full object-cover cinematic-video opacity-75"
            >
              <source src="/videos/coastal-journey.mp4" type="video/mp4" />
            </video>
          ) : (
            <img
              src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80"
              alt="Goa Beach"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-xl text-ivory space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-forest-dark/80 backdrop-blur-md text-gold text-[10px] font-mono tracking-cartographic uppercase border border-gold/30 flex items-center gap-1.5">
                <Waves className="w-3 h-3 text-gold" />
                FEATURED EXPEDITION &bull; COASTAL ARCHIVES &bull; GOA & KERALA
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
              Where sunlit sands meet turquoise tides.
            </h2>
            <div className="pt-1">
              <button
                onClick={() => handleCategorySelect('Beach')}
                className="text-xs font-semibold uppercase tracking-loose-editorial px-4 py-1.5 rounded-full bg-gold/90 hover:bg-gold text-ink transition-colors shadow-sm cursor-pointer"
              >
                View Coastal Chapters &rarr;
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search, Filter & Sort Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-parchment-light border border-border-parchment rounded-2xl p-4 sm:p-6 mb-8 shadow-soft space-y-5"
        >
          {/* Row 1: Search bar and Sort Dropdown */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search atlas by name, region, or keyword (e.g. Udaipur, Lakes, Rajasthan, Palaces)..."
                className="w-full pl-10 pr-16 py-3 bg-ivory border border-border-parchment rounded-xl text-sm text-ink placeholder:text-charcoal/50 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-charcoal hover:text-ink px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <ArrowUpDown className="w-3.5 h-3.5 text-forest absolute left-3 pointer-events-none" />
                <select
                  value={activeSort}
                  onChange={handleSortChange}
                  className="pl-8 pr-8 py-3 bg-ivory border border-border-parchment rounded-xl text-xs font-semibold uppercase tracking-wider text-ink focus:border-gold focus:outline-none cursor-pointer appearance-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Button */}
              {(searchInput || activeCategory !== 'All' || activeBudgetPreset !== 'all' || activeSort !== 'popular') && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border-parchment bg-ivory text-xs font-semibold uppercase tracking-loose-editorial text-charcoal hover:text-ink hover:border-gold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Category Filter Pills */}
          <div className="pt-4 border-t border-border-parchment flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-mono uppercase tracking-cartographic text-charcoal mr-2 hidden sm:inline">
              Category:
            </span>
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`relative px-4 py-2 text-xs font-semibold uppercase tracking-loose-editorial rounded-full whitespace-nowrap transition-colors duration-200 z-10 cursor-pointer ${
                    isSelected ? 'text-ivory font-bold' : 'text-charcoal hover:text-ink'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeCategoryPill"
                      className="absolute inset-0 rounded-full bg-forest border border-forest-light shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    />
                  )}
                  {!isSelected && (
                    <div className="absolute inset-0 rounded-full bg-ivory border border-border-parchment hover:border-gold/50 -z-20 transition-colors" />
                  )}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Row 3: Budget Presets */}
          <div className="pt-3 border-t border-border-parchment flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-mono uppercase tracking-cartographic text-charcoal mr-2 hidden sm:inline">
              Daily Budget:
            </span>
            {BUDGET_PRESETS.map((b) => {
              const isSelected = activeBudgetPreset === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => handleBudgetSelect(b.id)}
                  className={`px-3 py-1.5 text-[11px] font-mono tracking-wider rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-gold/20 border-gold-dark text-ink font-bold'
                      : 'bg-ivory border-border-parchment text-charcoal hover:text-ink'
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Results Metadata */}
        <div className="flex items-center justify-between mb-6 text-xs text-charcoal">
          <p>
            {loading ? (
              <span>Surveying atlas database...</span>
            ) : (
              <span>
                Showing <strong className="text-ink">{destinations.length}</strong> of{' '}
                <strong className="text-ink">{totalCount}</strong>{' '}
                {totalCount === 1 ? 'chapter' : 'chapters'} in atlas
                {activeCategory !== 'All' && <span> under <strong className="text-forest">{activeCategory}</strong></span>}
                {debouncedSearch && <span> matching "<strong>{debouncedSearch}</strong>"</span>}
              </span>
            )}
          </p>

          <span className="font-mono text-[10px] tracking-wider uppercase text-charcoal/70">
            [ PAGE {currentPage} OF {totalPages} ]
          </span>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-xl overflow-hidden bg-ivory border border-border-subtle p-0 shadow-soft space-y-4">
                <div className="aspect-[4/3] bg-forest/10 w-full" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-forest/10 rounded w-2/3" />
                  <div className="h-4 bg-forest/10 rounded w-full" />
                  <div className="h-4 bg-forest/10 rounded w-4/5" />
                  <div className="pt-3 border-t border-border-subtle flex justify-between">
                    <div className="h-4 bg-forest/10 rounded w-20" />
                    <div className="h-4 bg-forest/10 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-parchment-light border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-8">
            <AlertCircle className="w-10 h-10 text-red-500/80 mx-auto mb-3" />
            <h3 className="text-lg font-serif text-ink mb-1">Archive Unavailable</h3>
            <p className="text-xs sm:text-sm text-charcoal mb-4">{error}</p>
            <button
              onClick={fetchDestinations}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-loose-editorial hover:bg-forest-light transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gold" />
              <span>Retry Survey</span>
            </button>
          </div>
        )}

        {/* Destination Grid */}
        {!loading && !error && destinations.length > 0 && (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {destinations.map((destination, i) => (
                <DestinationCard key={destination.id || destination._id} destination={destination} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && destinations.length === 0 && (
          <div className="bg-parchment-light border border-dashed border-border-parchment rounded-2xl py-16 px-6 text-center max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center mb-4 border border-forest/20">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-ink mb-2">No coordinates match your query</h3>
            <p className="text-xs sm:text-sm text-charcoal mb-6">
              We couldn't locate any chapters matching "{debouncedSearch}". Try selecting another category or resetting the search query.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-loose-editorial hover:bg-forest-light transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gold" />
              <span>Reset Search & Filters</span>
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-12 pt-8 border-t border-border-subtle flex items-center justify-between">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border-parchment bg-ivory text-xs font-semibold uppercase tracking-wider text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:border-gold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    currentPage === p
                      ? 'bg-forest text-ivory'
                      : 'bg-ivory border border-border-parchment text-charcoal hover:text-ink hover:border-gold'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border-parchment bg-ivory text-xs font-semibold uppercase tracking-wider text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:border-gold transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
