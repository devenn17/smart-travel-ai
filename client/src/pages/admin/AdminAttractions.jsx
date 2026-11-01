import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Ticket,
  Upload,
  AlertTriangle,
  X,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getAdminAttractions,
  getAdminDestinations,
  createAdminAttraction,
  updateAdminAttraction,
  toggleAttractionStatus,
  deleteAdminAttraction,
  uploadAdminImage,
} from '../../services/api';

const ATTRACTION_CATEGORIES = [
  'Palace',
  'Fort',
  'Temple',
  'Lake',
  'Beach',
  'Nature',
  'Monument',
  'Market',
  'Museum',
  'Viewpoint',
  'Heritage',
];

export default function AdminAttractions() {
  const [attractions, setAttractions] = useState([]);
  const [destinationsList, setDestinationsList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const initialForm = {
    name: '',
    slug: '',
    destination: '',
    headline: '',
    description: '',
    category: 'Palace',
    image: '',
    location: '',
    estimatedPriceINR: 0,
    priceNote: 'Standard entrance ticket estimate',
    estimatedDuration: '2–3 hours',
    openingHours: '09:00 AM – 05:00 PM',
    bestTimeToVisit: 'Morning or late afternoon',
    suitableInterests: 'Architecture, Photography, History',
    order: 1,
    isActive: true,
  };

  const [formData, setFormData] = useState(initialForm);

  // Load destinations for the dropdown
  useEffect(() => {
    getAdminDestinations({ limit: 100 })
      .then((res) => {
        if (res.success && res.data) {
          setDestinationsList(res.data);
          if (res.data.length > 0 && !formData.destination) {
            setFormData((prev) => ({ ...prev, destination: res.data[0].id }));
          }
        }
      })
      .catch((err) => console.warn('Could not load destinations dropdown:', err.message));
  }, []);

  const fetchAttractions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminAttractions({
        search,
        destination: destinationFilter,
        category: categoryFilter,
        page,
        limit: 12,
      });
      if (res.success) {
        setAttractions(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('[AdminAttractions] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, destinationFilter, categoryFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttractions();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAttractions]);

  const handleOpenCreate = () => {
    setEditingAttr(null);
    setFormData({
      ...initialForm,
      destination: destinationsList[0]?.id || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (attr) => {
    setEditingAttr(attr);
    setFormData({
      name: attr.name || '',
      slug: attr.slug || '',
      destination: attr.destination?.id || attr.destination?._id || attr.destination || '',
      headline: attr.headline || '',
      description: attr.description || '',
      category: attr.category || 'Palace',
      image: attr.image || '',
      location: attr.location || '',
      estimatedPriceINR: attr.estimatedPriceINR ?? 0,
      priceNote: attr.priceNote || 'Estimated entry',
      estimatedDuration: attr.estimatedDuration || '2–3 hours',
      openingHours: attr.openingHours || '',
      bestTimeToVisit: attr.bestTimeToVisit || '',
      suitableInterests: Array.isArray(attr.suitableInterests) ? attr.suitableInterests.join(', ') : '',
      order: attr.order || 1,
      isActive: attr.isActive !== false,
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
      alert(err.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const payload = {
        ...formData,
        estimatedPriceINR: Number(formData.estimatedPriceINR) || 0,
        order: Number(formData.order) || 0,
        suitableInterests: formData.suitableInterests
          ? formData.suitableInterests.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingAttr) {
        await updateAdminAttraction(editingAttr.id, payload);
      } else {
        await createAdminAttraction(payload);
      }

      setIsModalOpen(false);
      fetchAttractions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving attraction.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (attrId) => {
    try {
      await toggleAttractionStatus(attrId);
      setAttractions((prev) =>
        prev.map((a) => (a.id === attrId ? { ...a, isActive: !a.isActive } : a))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminAttraction(deleteTarget.id);
      setDeleteTarget(null);
      fetchAttractions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete attraction.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-cartographic uppercase text-gold-dark mb-1">
            <Compass className="w-3.5 h-3.5 text-gold" />
            <span>SANCTUARIES & LANDMARKS</span>
          </div>
          <h1 className="text-3xl font-serif text-ink tracking-tight">
            Attractions Archive
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-light transition-all shadow-md self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          <span>New Attraction</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-parchment-light border border-border-parchment rounded-2xl p-4 sm:p-5 shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by landmark name, location, or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs sm:text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:outline-none"
          />
        </div>

        {/* Destination Filter */}
        <select
          value={destinationFilter}
          onChange={(e) => {
            setDestinationFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs font-mono uppercase text-ink focus:border-gold focus:outline-none"
        >
          <option value="All">All Destinations</option>
          {destinationsList.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.region})
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs font-mono uppercase text-ink focus:border-gold focus:outline-none"
        >
          <option value="All">All Categories</option>
          {ATTRACTION_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Attractions Table */}
      <div className="bg-ivory border border-border-subtle rounded-3xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-parchment-light border-b border-border-parchment text-charcoal font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Attraction</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Est. Entry</th>
                <th className="py-3.5 px-4">Duration</th>
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
                      <span>Surveying attractions...</span>
                    </div>
                  </td>
                </tr>
              ) : attractions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-charcoal font-mono">
                    No attractions matched your filter criteria.
                  </td>
                </tr>
              ) : (
                attractions.map((attr) => (
                  <tr key={attr.id} className="hover:bg-parchment/40 transition-colors">
                    {/* Attraction Name & Image */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={attr.image}
                          alt={attr.name}
                          className="w-10 h-10 rounded-lg object-cover bg-forest-dark shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div>
                          <span className="font-serif text-sm font-semibold text-ink block leading-tight">
                            {attr.name}
                          </span>
                          <span className="text-[11px] text-charcoal font-mono block">
                            /{attr.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="py-3.5 px-4 font-mono font-medium text-forest">
                      {attr.destination?.name || attr.destinationSlug || '—'}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-parchment text-forest text-[10px] font-semibold uppercase border border-border-parchment">
                        {attr.category}
                      </span>
                    </td>

                    {/* Entry Price */}
                    <td className="py-3.5 px-4 font-mono text-ink">
                      {attr.estimatedPriceINR === 0 ? (
                        <span className="text-emerald-700 font-bold">Free</span>
                      ) : (
                        `₹${attr.estimatedPriceINR}`
                      )}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 font-mono text-charcoal">
                      {attr.estimatedDuration || '2–3 hours'}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(attr.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                          attr.isActive
                            ? 'bg-emerald-950/10 text-emerald-800 border border-emerald-500/20'
                            : 'bg-charcoal/10 text-charcoal border border-charcoal/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${attr.isActive ? 'bg-emerald-600' : 'bg-charcoal'}`} />
                        <span>{attr.isActive ? 'Active' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right pr-6 space-x-2">
                      <button
                        onClick={() => handleOpenEdit(attr)}
                        className="p-1.5 rounded-lg border border-border-parchment text-forest hover:bg-forest/5 hover:border-gold transition-colors"
                        title="Edit Attraction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(attr)}
                        className="p-1.5 rounded-lg border border-border-parchment text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                        title="Delete Attraction"
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

        {/* Pagination */}
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
            <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-2xl bg-parchment-light border border-border-parchment rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-parchment">
                <h2 className="font-serif text-2xl text-ink tracking-tight">
                  {editingAttr ? `Edit "${editingAttr.name}"` : 'Register New Attraction'}
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

              <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs font-sans">
                {/* Associated Destination */}
                <div>
                  <label className="block font-mono uppercase text-charcoal mb-1">
                    Parent Destination *
                  </label>
                  <select
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                  >
                    <option value="">Select a Destination...</option>
                    {destinationsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.region})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Attraction Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. City Palace Museum"
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
                      placeholder="e.g. city-palace-museum"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink font-mono focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category & Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    >
                      {ATTRACTION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Display Priority Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink font-mono focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Headline & Description */}
                <div>
                  <label className="block font-mono uppercase text-charcoal mb-1">Brief Editorial Headline</label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="e.g. Architectural masterpiece on the lake shore"
                    className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono uppercase text-charcoal mb-1">Description *</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Visiting narrative and historical context..."
                    className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                  />
                </div>

                {/* Image Upload / URL */}
                <div>
                  <label className="block font-mono uppercase text-charcoal mb-1">Hero Image *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    />
                    <label className="cursor-pointer px-4 py-2.5 bg-forest text-ivory rounded-xl hover:bg-forest-light flex items-center gap-1.5 shrink-0">
                      <Upload className="w-4 h-4 text-gold" />
                      <span>{uploadingImage ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Price & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Estimated Entry (INR)</label>
                    <input
                      type="number"
                      value={formData.estimatedPriceINR}
                      onChange={(e) => setFormData({ ...formData, estimatedPriceINR: e.target.value })}
                      placeholder="0 for free"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink font-mono focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Visit Duration</label>
                    <input
                      type="text"
                      value={formData.estimatedDuration}
                      onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                      placeholder="e.g. 2–3 hours"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Location & Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Location Address</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Old City, Lake Pichola Bank"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-charcoal mb-1">Opening Hours</label>
                    <input
                      type="text"
                      value={formData.openingHours}
                      onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                      placeholder="e.g. 09:30 AM – 05:30 PM (Daily)"
                      className="w-full px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-ink focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status Checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-forest focus:ring-gold"
                    />
                    <span className="font-mono text-charcoal">Publicly Active in Atlas</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-border-parchment flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-full border border-border-parchment text-charcoal hover:bg-ivory"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-2.5 rounded-full bg-forest text-ivory font-semibold uppercase tracking-wider hover:bg-forest-light disabled:opacity-50"
                  >
                    {formSubmitting ? 'Saving...' : editingAttr ? 'Update Landmark' : 'Register Landmark'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION */}
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
              <h3 className="font-serif text-xl text-ink">Delete Attraction?</h3>
              <p className="text-xs text-charcoal leading-relaxed">
                Are you sure you wish to permanently delete <strong className="text-ink">"{deleteTarget.name}"</strong>? This will remove it from the destination's public itinerary index.
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
                  Yes, Delete Attraction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
