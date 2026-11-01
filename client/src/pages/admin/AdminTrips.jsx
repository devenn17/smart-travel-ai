import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Search,
  Eye,
  Trash2,
  Calendar,
  IndianRupee,
  AlertTriangle,
  X,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAdminTrips, updateAdminTripStatus, deleteAdminTrip } from '../../services/api';

const STATUS_OPTIONS = ['draft', 'saved', 'completed'];

export default function AdminTrips() {
  const [trips, setTrips] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [inspectTrip, setInspectTrip] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminTrips({
        search,
        status: statusFilter,
        page,
        limit: 12,
      });
      if (res.success) {
        setTrips(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('[AdminTrips] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrips();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTrips]);

  const handleStatusChange = async (tripId, newStatus) => {
    try {
      await updateAdminTripStatus(tripId, newStatus);
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, status: newStatus } : t))
      );
      if (inspectTrip && inspectTrip.id === tripId) {
        setInspectTrip((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update trip status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminTrip(deleteTarget.id);
      setDeleteTarget(null);
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete trip.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-cartographic uppercase text-gold-dark mb-1">
            <Compass className="w-3.5 h-3.5 text-gold" />
            <span>EXPEDITIONS & ITINERARIES</span>
          </div>
          <h1 className="text-3xl font-serif text-ink tracking-tight">
            Trips Archive
          </h1>
        </div>

        <div className="text-xs font-mono text-charcoal">
          <span>Total Planned: <strong className="text-ink">{total}</strong></span>
        </div>
      </div>

      {/* Filter Controls */}
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
            placeholder="Search by destination name, explorer email, or style..."
            className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs sm:text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs font-mono uppercase text-ink focus:border-gold focus:outline-none"
        >
          <option value="all">All Trip Statuses</option>
          <option value="saved">Saved Only</option>
          <option value="completed">Completed Only</option>
          <option value="draft">Drafts Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-ivory border border-border-subtle rounded-3xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-parchment-light border-b border-border-parchment text-charcoal font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Destination</th>
                <th className="py-3.5 px-4">Explorer</th>
                <th className="py-3.5 px-4">Rhythm</th>
                <th className="py-3.5 px-4">Budget</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date Created</th>
                <th className="py-3.5 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/70 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-charcoal font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                      <span>Reading expedition records...</span>
                    </div>
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-charcoal font-mono">
                    No trips recorded matching your query.
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="hover:bg-parchment/40 transition-colors">
                    {/* Destination */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="font-serif text-sm font-semibold text-ink block leading-tight">
                        {t.destination}
                      </span>
                      <span className="text-[11px] text-charcoal font-mono block">
                        Style: {t.travelStyle || 'Heritage'}
                      </span>
                    </td>

                    {/* Explorer User */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-ink block">
                        {t.userId?.name || 'Explorer'}
                      </span>
                      <span className="text-[11px] text-charcoal font-mono block">
                        {t.userId?.email || '—'}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 font-mono text-ink">
                      {t.duration} days
                    </td>

                    {/* Budget */}
                    <td className="py-3.5 px-4 font-mono font-medium text-forest">
                      ₹{t.budget?.toLocaleString('en-IN')}
                    </td>

                    {/* Status Pill with Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={t.status || 'saved'}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                          t.status === 'completed'
                            ? 'bg-emerald-950/10 text-emerald-800 border-emerald-500/20'
                            : t.status === 'saved'
                            ? 'bg-forest/10 text-forest border-forest/20'
                            : 'bg-charcoal/10 text-charcoal border-charcoal/20'
                        }`}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 font-mono text-charcoal text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right pr-6 space-x-2">
                      <button
                        onClick={() => setInspectTrip(t)}
                        className="p-1.5 rounded-lg border border-border-parchment text-forest hover:bg-forest/5 hover:border-gold transition-colors"
                        title="View Trip Specification"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="p-1.5 rounded-lg border border-border-parchment text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                        title="Delete Trip"
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
              Showing page {page} of {totalPages} ({total} total trips)
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

      {/* INSPECT TRIP MODAL */}
      <AnimatePresence>
        {inspectTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setInspectTrip(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-parchment-light border border-border-parchment rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-parchment">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-cartographic text-gold-dark block">
                    EXPEDITION DOSSIER
                  </span>
                  <h3 className="font-serif text-2xl text-ink tracking-tight">
                    {inspectTrip.destination}
                  </h3>
                </div>
                <button onClick={() => setInspectTrip(null)}>
                  <X className="w-5 h-5 text-charcoal hover:text-ink" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Explorer Account</span>
                  <span className="font-bold text-ink">
                    {inspectTrip.userId?.name} ({inspectTrip.userId?.email})
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Planned Duration</span>
                  <span className="font-mono text-ink">{inspectTrip.duration} days</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Allocated Budget</span>
                  <span className="font-mono font-bold text-forest">
                    ₹{inspectTrip.budget?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Travel Style</span>
                  <span className="font-mono text-ink">{inspectTrip.travelStyle || 'Heritage'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Status</span>
                  <span className="font-mono uppercase font-semibold">{inspectTrip.status}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Saved On</span>
                  <span className="font-mono text-charcoal">
                    {new Date(inspectTrip.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {inspectTrip.notes && (
                <div className="pt-2">
                  <h4 className="font-mono uppercase text-[10px] text-charcoal mb-1">Explorer Notes</h4>
                  <div className="p-3 rounded-xl bg-ivory border border-border-subtle text-xs text-charcoal whitespace-pre-line">
                    {inspectTrip.notes}
                  </div>
                </div>
              )}

              <div className="pt-3 text-right">
                <button
                  onClick={() => setInspectTrip(null)}
                  className="px-5 py-2 rounded-full bg-forest text-ivory text-xs font-mono font-semibold"
                >
                  Close Dossier
                </button>
              </div>
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
              <h3 className="font-serif text-xl text-ink">Delete Expedition?</h3>
              <p className="text-xs text-charcoal leading-relaxed">
                Confirm administrative deletion of trip to <strong className="text-ink">"{deleteTarget.destination}"</strong> for account <strong className="text-ink">{deleteTarget.userId?.email}</strong>?
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
                  Yes, Delete Trip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
