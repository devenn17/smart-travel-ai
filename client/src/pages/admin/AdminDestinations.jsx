import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  RotateCcw,
  Upload,
  AlertTriangle,
  X,
  Compass,
  ArrowUpDown,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getAdminDestinations,
  createAdminDestination,
  updateAdminDestination,
  toggleDestinationStatus,
  deleteAdminDestination,
  uploadAdminImage,
} from '../../services/api';

const CATEGORIES = ['Beach', 'Heritage', 'Mountains', 'Nature', 'Adventure', 'Spiritual'];
const BUDGET_TIERS = ['Budget', 'Budget & Balanced', 'Balanced', 'Balanced & Luxury', 'Luxury & Balanced', 'Luxury'];

export default function AdminDestinations() {
  const [destinations, setDestinations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDest, setEditingDest] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const initialForm = {
    name: '',
    slug: '',
    region: '',
    country: 'India',
    chapter: '01',
    category: 'Heritage',
    headline: '',
    description: '',
    editorialStory: '',
    image: '',
    gallery: '',
    estimatedDailyBudget: 4500,
    budgetTier: 'Balanced',
    bestTime: 'October – March',
    idealDays: '3–4 days',
    elevation: '',
    latitude: '',
    longitude: '',
    featured: false,
    isActive: true,
  };

  const [formData, setFormData] = useState(initialForm);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchDestinations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminDestinations({
        search,
        category,
        status,
        page,
        limit: 10,
      });
      if (res.success) {
        setDestinations(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('[AdminDestinations] Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to retrieve destinations.');
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDestinations();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDestinations]);

  const handleOpenCreate = () => {
    setEditingDest(null);
    setFormData(initialForm);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dest) => {
    setEditingDest(dest);
    setFormData({
      name: dest.name || '',
      slug: dest.slug || '',
      region: dest.region || '',
      country: dest.country || 'India',
      chapter: dest.chapter || '01',
      category: dest.category || 'Heritage',
      headline: dest.headline || '',
      description: dest.description || '',
      editorialStory: dest.editorialStory || '',
      image: dest.image || '',
      gallery: Array.isArray(dest.gallery) ? dest.gallery.join(', ') : '',
      estimatedDailyBudget: dest.estimatedDailyBudget || 4500,
      budgetTier: dest.budgetTier || 'Balanced',
      bestTime: dest.bestTime || '',
      idealDays: dest.idealDays || '3–4 days',
      elevation: dest.elevation || '',
      latitude: dest.coordinates?.latitude || '',
      longitude: dest.coordinates?.longitude || '',
      featured: Boolean(dest.featured),
      isActive: dest.isActive !== false,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const generateSlug = () => {
    if (!formData.name) return;
    const generated = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData({ ...formData, slug: generated });
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await uploadAdminImage(file);
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, image: res.data.url }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Image upload failed. Ensure size is under 5MB.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const payload = {
        ...formData,
        estimatedDailyBudget: Number(formData.estimatedDailyBudget),
        gallery: formData.gallery
          ? formData.gallery.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        coordinates: {
          formatted: `${formData.latitude || '00.00'}° N, ${formData.longitude || '00.00'}° E`,
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
        },
      };

      if (editingDest) {
        await updateAdminDestination(editingDest.id, payload);
      } else {
        await createAdminDestination(payload);
      }

      setIsModalOpen(false);
      fetchDestinations();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving destination.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (destId) => {
    try {
      await toggleDestinationStatus(destId);
      setDestinations((prev) =>
        prev.map((d) => (d.id === destId ? { ...d, isActive: !d.isActive } : d))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminDestination(deleteTarget.id);
      setDeleteTarget(null);
      fetchDestinations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete destination.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-cartographic uppercase text-gold-dark mb-1">
            <Compass className="w-3.5 h-3.5 text-gold" />
            <span>TERRITORIAL DIRECTORY</span>
          </div>
          <h1 className="text-3xl font-serif text-ink tracking-tight">
            Destinations Archive
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-light transition-all shadow-md self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          <span>New Destination</span>
        </button>
      </div>

      {/* Toolbar / Search & Filter Controls */}
      <div className="bg-parchment-light border border-border-parchment rounded-2xl p-4 sm:p-5 shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, slug, or region..."
            className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs sm:text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:outline-none"
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs font-mono uppercase text-ink focus:border-gold focus:outline-none"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs font-mono uppercase text-ink focus:border-gold focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Unpublished</option>
        </select>
      </div>

      {/* Table / Data View */}
      <div className="bg-ivory border border-border-subtle rounded-3xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-parchment-light border-b border-border-parchment text-charcoal font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Chapter</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Est. Daily Budget</th>
                <th className="py-3.5 px-4">Attractions</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/70 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-charcoal font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                      <span>Loading destination registry...</span>
                    </div>
                  </td>
                </tr>
              ) : destinations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-charcoal font-mono">
                    No destinations matched your criteria.
                  </td>
                </tr>
              ) : (
                destinations.map((dest) => (
                  <tr key={dest.id} className="hover:bg-parchment/40 transition-colors">
                    {/* Chapter */}
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-gold-dark font-bold">
                      CH. {dest.chapter || '01'}
                    </td>

                    {/* Name & Region */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={dest.image}
                          alt={dest.name}
                          className="w-10 h-10 rounded-lg object-cover bg-forest-dark shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div>
                          <span className="font-serif text-sm font-semibold text-ink block leading-tight">
                            {dest.name}
                          </span>
                          <span className="text-[11px] text-charcoal font-mono block">
                            {dest.region} &bull; /{dest.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-parchment text-forest text-[10px] font-semibold tracking-wider uppercase border border-border-parchment">
                        {dest.category}
                      </span>
                    </td>

                    {/* Budget */}
                    <td className="py-3.5 px-4 font-mono font-medium text-ink">
                      ₹{dest.estimatedDailyBudget?.toLocaleString('en-IN')}/day
                    </td>

                    {/* Attractions Count */}
                    <td className="py-3.5 px-4 font-mono text-charcoal">
                      {dest.attractionsCount || dest.attractions?.length || 0} landmarks
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(dest.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                          dest.isActive
                            ? 'bg-emerald-950/10 text-emerald-800 border border-emerald-500/20'
                            : 'bg-charcoal/10 text-charcoal border border-charcoal/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dest.isActive ? 'bg-emerald-600' : 'bg-charcoal'}`} />
                        <span>{dest.isActive ? 'Active' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right pr-6 space-x-2">
                      <button
                        onClick={() => handleOpenEdit(dest)}
                        className="p-1.5 rounded-lg border border-border-parchment text-forest hover:bg-forest/5 hover:border-gold transition-colors"
                        title="Edit Destination"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(dest)}
                        className="p-1.5 rounded-lg border border-border-parchment text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                        title="Delete Destination"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-parchment-light border-t border-border-parchment flex items-center justify-between text-xs font-mono">
            <span className="text-charcoal">
              Showing page {page} of {totalPages} ({total} total records)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg border border-border-parchment bg-ivory disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg border border-border-parchment bg-ivory disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div
              className="fixed inset-0 bg-ink/70 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-2xl bg-parchment-light border border-border-parchment rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-parchment">
                <h2 className="font-serif text-2xl text-ink tracking-tight">
                  {editingDest ? `Edit "${editingDest.name}"` : 'Catalog New Destination'}
                </h2>
                <button onClick={() => setIsModalOpen(false)}>
                  <X className="w-5 h-5 text-charcoal hover:text-ink" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-red-950/10 border border-red-500/20 text-red-800 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="mt-6 space-y-4 text-xs font-sans">
                
                {/* Name & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Destination Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Udaipur"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-mono uppercase text-charcoal">Slug *</label>
                      <button
                        type="button"
                        onClick={generateSlug}
                        className="text-[10px] font-mono text-gold-dark hover:underline"
                      >
                        Generate Slug
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                      placeholder="e.g. udaipur"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink font-mono focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Region, Category, Chapter */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Region / State *</label>
                    <input
                      type="text"
                      required
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="e.g. Rajasthan"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Chapter Index</label>
                    <input
                      type="text"
                      value={formData.chapter}
                      onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                      placeholder="e.g. 01"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink font-mono focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Headline */}
                <div>
                  <label className="block font-mono uppercase text-charcoal mb-1">Editorial Headline</label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="e.g. Where marble palaces float over tranquil waters"
                    className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block font-mono uppercase text-charcoal mb-1">Overview Description *</label>
                  <textarea
                    required
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short summary displayed on cards..."
                    className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                  />
                </div>

                {/* Editorial Deep Story */}
                <div>
                  <label className="block font-mono uppercase text-charcoal mb-1">Deep Chronicle & Essence</label>
                  <textarea
                    rows="4"
                    value={formData.editorialStory}
                    onChange={(e) => setFormData({ ...formData, editorialStory: e.target.value })}
                    placeholder="In-depth history and cultural chronicle..."
                    className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                  />
                </div>

                {/* Image URL & File Upload */}
                <div>
                  <label className="block font-mono uppercase text-charcoal mb-1">Hero Image *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="/images/udaipur.jpg or https://images.unsplash.com/..."
                      className="flex-1 px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    />
                    <label className="cursor-pointer px-4 py-2.5 bg-forest text-ivory rounded-xl hover:bg-forest-light flex items-center gap-1.5 shrink-0">
                      <Upload className="w-4 h-4 text-gold" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Budget, Rhythm, Season */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Daily Budget (INR) *</label>
                    <input
                      type="number"
                      required
                      value={formData.estimatedDailyBudget}
                      onChange={(e) => setFormData({ ...formData, estimatedDailyBudget: e.target.value })}
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink font-mono focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Ideal Rhythm</label>
                    <input
                      type="text"
                      value={formData.idealDays}
                      onChange={(e) => setFormData({ ...formData, idealDays: e.target.value })}
                      placeholder="e.g. 3–4 days"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Best Season *</label>
                    <input
                      type="text"
                      required
                      value={formData.bestTime}
                      onChange={(e) => setFormData({ ...formData, bestTime: e.target.value })}
                      placeholder="e.g. October – March"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Coordinates & Elevation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Elevation</label>
                    <input
                      type="text"
                      value={formData.elevation}
                      onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                      placeholder="e.g. 598 m"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="24.5854"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink font-mono focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="73.6844"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink font-mono focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Featured & Active checkboxes */}
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-forest focus:ring-gold"
                    />
                    <span className="font-mono text-charcoal">Featured Expedition</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-forest focus:ring-gold"
                    />
                    <span className="font-mono text-charcoal">Published in Atlas</span>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="pt-6 border-t border-border-parchment flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-full border border-border-parchment text-charcoal hover:text-ink hover:bg-ivory"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-2.5 rounded-full bg-forest text-ivory font-semibold uppercase tracking-wider hover:bg-forest-light disabled:opacity-50"
                  >
                    {formSubmitting ? 'Saving...' : editingDest ? 'Update Destination' : 'Create Destination'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-parchment-light border border-red-200 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-ink">Delete Destination?</h3>
              <p className="text-xs text-charcoal leading-relaxed">
                Are you certain you wish to purge <strong className="text-ink">"{deleteTarget.name}"</strong>? All associated attractions will also be deleted to maintain relational integrity.
              </p>
              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 rounded-full border border-border-parchment text-charcoal hover:bg-ivory text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-full bg-red-700 hover:bg-red-800 text-white text-xs font-mono font-semibold"
                >
                  Yes, Purge Destination
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
