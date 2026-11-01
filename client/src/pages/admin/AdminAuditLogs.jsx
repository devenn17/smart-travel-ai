import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Eye,
  Calendar,
  Lock,
  Filter,
  X,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAdminAuditLogs } from '../../services/api';

const TARGET_TYPES = ['All', 'Destination', 'Attraction', 'User', 'Trip', 'Media', 'System'];

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [targetType, setTargetType] = useState('All');

  // Modal
  const [inspectLog, setInspectLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminAuditLogs({
        search,
        targetType: targetType !== 'All' ? targetType : undefined,
        page,
        limit: 15,
      });
      if (res.success) {
        setLogs(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('[AdminAuditLogs] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, targetType, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-cartographic uppercase text-gold-dark mb-1">
            <Compass className="w-3.5 h-3.5 text-gold" />
            <span>SECURITY CHRONICLE & COMPLIANCE</span>
          </div>
          <h1 className="text-3xl font-serif text-ink tracking-tight">
            Audit Trail
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-charcoal">
          <Lock className="w-3.5 h-3.5 text-forest" />
          <span>Immutable Journal ({total} events logged)</span>
        </div>
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
            placeholder="Search by admin email, target record, or summary..."
            className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs sm:text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:outline-none"
          />
        </div>

        <select
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs font-mono uppercase text-ink focus:border-gold focus:outline-none"
        >
          {TARGET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All Target Types' : t}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-ivory border border-border-subtle rounded-3xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-parchment-light border-b border-border-parchment text-charcoal font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Type</th>
                <th className="py-3.5 px-4">Admin Email</th>
                <th className="py-3.5 px-4">Summary</th>
                <th className="py-3.5 px-4 text-right pr-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/70 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-charcoal font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                      <span>Reading immutable ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-charcoal font-mono">
                    No administrative audit records match your query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-parchment/40 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-charcoal whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded bg-forest/10 text-forest text-[10px] font-mono font-bold uppercase whitespace-nowrap">
                        {log.action}
                      </span>
                    </td>

                    {/* Target Type */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-gold-dark">
                      {log.targetType}
                    </td>

                    {/* Admin Email */}
                    <td className="py-3.5 px-4 font-mono text-ink">
                      {log.adminEmail}
                    </td>

                    {/* Summary */}
                    <td className="py-3.5 px-4 text-charcoal max-w-xs truncate">
                      {log.summary}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right pr-6">
                      <button
                        onClick={() => setInspectLog(log)}
                        className="p-1.5 rounded-lg border border-border-parchment text-forest hover:bg-forest/5 hover:border-gold transition-colors"
                        title="View Sanitized Audit Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
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
              Showing page {page} of {totalPages} ({total} total entries)
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

      {/* INSPECT LOG MODAL */}
      <AnimatePresence>
        {inspectLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setInspectLog(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-parchment-light border border-border-parchment rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-parchment">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-cartographic text-gold-dark block">
                    AUDIT RECORD #{inspectLog.id?.slice(-8)}
                  </span>
                  <h3 className="font-serif text-xl text-ink tracking-tight">
                    {inspectLog.action}
                  </h3>
                </div>
                <button onClick={() => setInspectLog(null)}>
                  <X className="w-5 h-5 text-charcoal hover:text-ink" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Acting Administrator</span>
                  <span className="font-bold text-ink">{inspectLog.adminEmail}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Target Entity</span>
                  <span className="font-mono text-ink">
                    {inspectLog.targetType} {inspectLog.targetName ? `(${inspectLog.targetName})` : ''}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Origin IP</span>
                  <span className="font-mono text-charcoal">{inspectLog.ip || '127.0.0.1'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Recorded Timestamp</span>
                  <span className="font-mono text-charcoal">
                    {new Date(inspectLog.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal block mb-1">Action Summary</span>
                  <p className="text-ink font-medium leading-relaxed">{inspectLog.summary}</p>
                </div>
              </div>

              {/* Metadata JSON Viewer */}
              {inspectLog.metadata && Object.keys(inspectLog.metadata).length > 0 && (
                <div className="pt-2">
                  <span className="font-mono uppercase text-[10px] text-charcoal block mb-1">
                    Sanitized Payload Metadata
                  </span>
                  <pre className="p-3 rounded-xl bg-ivory border border-border-subtle font-mono text-[11px] text-ink overflow-x-auto max-h-36">
                    {JSON.stringify(inspectLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="pt-3 text-right">
                <button
                  onClick={() => setInspectLog(null)}
                  className="px-5 py-2 rounded-full bg-forest text-ivory text-xs font-mono font-semibold"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
