import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Briefcase,
  Calendar,
  AlertTriangle,
  X,
  Compass,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAdminUsers, updateUserRole, toggleUserStatus, getAdminUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [roleTarget, setRoleTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [inspectUser, setInspectUser] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: 12,
      });
      if (res.success) {
        setUsers(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('[AdminUsers] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleInspect = async (userId) => {
    try {
      setInspectLoading(true);
      const res = await getAdminUser(userId);
      if (res.success) {
        setInspectUser(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not load account details.');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleTarget) return;
    setActionError('');
    try {
      const nextRole = roleTarget.role === 'admin' ? 'user' : 'admin';
      await updateUserRole(roleTarget.id, nextRole);
      setRoleTarget(null);
      fetchUsers();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusTarget) return;
    setActionError('');
    try {
      await toggleUserStatus(statusTarget.id);
      setStatusTarget(null);
      fetchUsers();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update account status.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-cartographic uppercase text-gold-dark mb-1">
            <Compass className="w-3.5 h-3.5 text-gold" />
            <span>EXPLORER ACCOUNTS & CLEARANCE</span>
          </div>
          <h1 className="text-3xl font-serif text-ink tracking-tight">
            User Directory
          </h1>
        </div>

        <div className="text-xs font-mono text-charcoal">
          <span>Total Registered: <strong className="text-ink">{total}</strong></span>
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
            placeholder="Search by full name or email address..."
            className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs sm:text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs font-mono uppercase text-ink focus:border-gold focus:outline-none"
        >
          <option value="all">All Roles</option>
          <option value="user">Explorers (user)</option>
          <option value="admin">Administrators (admin)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-ivory border border-border-parchment rounded-xl text-xs font-mono uppercase text-ink focus:border-gold focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Deactivated Only</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-ivory border border-border-subtle rounded-3xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-parchment-light border-b border-border-parchment text-charcoal font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Explorer Account</th>
                <th className="py-3.5 px-4">Role Clearance</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Planned Trips</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4 text-right pr-6">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/70 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-charcoal font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                      <span>Retrieving explorer accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-charcoal font-mono">
                    No accounts found matching your query.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrentSelf = currentAdmin?.id === u.id || currentAdmin?._id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-parchment/40 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-forest/10 text-forest text-xs font-bold font-mono flex items-center justify-center shrink-0">
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink text-sm block leading-tight">
                                {u.name}
                              </span>
                              {isCurrentSelf && (
                                <span className="px-1.5 py-0.2 rounded bg-gold/20 text-gold-dark text-[9px] font-mono uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-charcoal font-mono block">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Clearance */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold ${
                            u.role === 'admin'
                              ? 'bg-gold/20 text-gold-dark border border-gold/40'
                              : 'bg-forest/10 text-forest border border-forest/20'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                            u.isActive !== false
                              ? 'bg-emerald-950/10 text-emerald-800 border border-emerald-500/20'
                              : 'bg-red-950/10 text-red-700 border border-red-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive !== false ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                          <span>{u.isActive !== false ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>

                      {/* Trips Count */}
                      <td className="py-3.5 px-4 font-mono text-ink">
                        <span className="font-semibold">{u.tripsCount || 0}</span>
                        <span className="text-charcoal text-[10px] ml-1">trip(s)</span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-charcoal text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right pr-6 space-x-2">
                        {/* Inspect user */}
                        <button
                          onClick={() => handleInspect(u.id)}
                          className="px-2.5 py-1 rounded-lg border border-border-parchment text-[11px] font-mono text-charcoal hover:text-ink hover:bg-ivory transition-colors"
                        >
                          View
                        </button>

                        {/* Promote / Demote */}
                        <button
                          disabled={isCurrentSelf}
                          onClick={() => setRoleTarget(u)}
                          className="px-2.5 py-1 rounded-lg border border-border-parchment text-[11px] font-mono text-forest hover:border-gold hover:bg-forest/5 disabled:opacity-40 transition-colors"
                          title={isCurrentSelf ? 'Cannot modify your own role' : 'Change Role'}
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>

                        {/* Suspend / Reactivate */}
                        <button
                          disabled={isCurrentSelf}
                          onClick={() => setStatusTarget(u)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors disabled:opacity-40 ${
                            u.isActive !== false
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={isCurrentSelf ? 'Cannot deactivate your own account' : 'Toggle Status'}
                        >
                          {u.isActive !== false ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-parchment-light border-t border-border-parchment flex items-center justify-between text-xs font-mono">
            <span className="text-charcoal">
              Showing page {page} of {totalPages} ({total} total accounts)
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

      {/* ROLE CHANGE CONFIRMATION */}
      <AnimatePresence>
        {roleTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setRoleTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-parchment-light border border-border-parchment rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold-dark mx-auto flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-ink">
                {roleTarget.role === 'admin' ? 'Demote Administrator?' : 'Promote to Administrator?'}
              </h3>
              <p className="text-xs text-charcoal leading-relaxed">
                Confirm role modification for <strong className="text-ink">{roleTarget.email}</strong>.
                {roleTarget.role === 'admin'
                  ? ' This will revoke administrative panel privileges.'
                  : ' This will grant complete administrative access across the platform.'}
              </p>

              {actionError && (
                <div className="p-3 rounded-xl bg-red-950/10 border border-red-500/20 text-red-800 text-xs">
                  {actionError}
                </div>
              )}

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => setRoleTarget(null)}
                  className="px-5 py-2.5 rounded-full border border-border-parchment text-charcoal hover:bg-ivory text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRoleChange}
                  className="px-5 py-2.5 rounded-full bg-forest hover:bg-forest-light text-ivory text-xs font-mono font-semibold"
                >
                  Confirm Role Change
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUSPENSION TOGGLE CONFIRMATION */}
      <AnimatePresence>
        {statusTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setStatusTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-parchment-light border border-border-parchment rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-ink">
                {statusTarget.isActive !== false ? 'Suspend Explorer Account?' : 'Reactivate Explorer Account?'}
              </h3>
              <p className="text-xs text-charcoal leading-relaxed">
                {statusTarget.isActive !== false
                  ? `Deactivating "${statusTarget.email}" will immediately revoke login access and block ongoing sessions.`
                  : `Reactivating "${statusTarget.email}" will restore normal explorer access.`}
              </p>

              {actionError && (
                <div className="p-3 rounded-xl bg-red-950/10 border border-red-500/20 text-red-800 text-xs">
                  {actionError}
                </div>
              )}

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => setStatusTarget(null)}
                  className="px-5 py-2.5 rounded-full border border-border-parchment text-charcoal hover:bg-ivory text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatusToggle}
                  className={`px-5 py-2.5 rounded-full text-white text-xs font-mono font-semibold ${
                    statusTarget.isActive !== false ? 'bg-red-700 hover:bg-red-800' : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {statusTarget.isActive !== false ? 'Yes, Suspend Account' : 'Reactivate Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INSPECT USER MODAL */}
      <AnimatePresence>
        {inspectUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setInspectUser(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-parchment-light border border-border-parchment rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-5 my-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-parchment">
                <h3 className="font-serif text-xl text-ink">Explorer File</h3>
                <button onClick={() => setInspectUser(null)}>
                  <X className="w-5 h-5 text-charcoal hover:text-ink" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Account Name</span>
                  <span className="font-bold text-ink">{inspectUser.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Email Address</span>
                  <span className="font-mono text-ink">{inspectUser.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Clearance Role</span>
                  <span className="font-mono font-bold text-forest uppercase">{inspectUser.role}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Status</span>
                  <span className="font-mono uppercase font-semibold">
                    {inspectUser.isActive !== false ? 'Active' : 'Suspended'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-parchment/60">
                  <span className="font-mono text-charcoal">Registered On</span>
                  <span className="font-mono text-charcoal">
                    {new Date(inspectUser.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trip History for this user */}
              <div className="pt-2">
                <h4 className="font-serif text-sm font-semibold text-ink mb-2">
                  Stored Expeditions ({inspectUser.trips?.length || 0})
                </h4>
                {inspectUser.trips && inspectUser.trips.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inspectUser.trips.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-xl bg-ivory border border-border-subtle flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-serif font-semibold text-ink">{t.destination}</span>
                          <span className="text-[10px] text-charcoal font-mono block">
                            {t.duration} days &bull; ₹{t.budget?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-forest text-ivory text-[9px] font-mono uppercase">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-charcoal italic py-2">No expeditions saved yet.</p>
                )}
              </div>

              <div className="pt-3 text-right">
                <button
                  onClick={() => setInspectUser(null)}
                  className="px-5 py-2 rounded-full bg-forest text-ivory text-xs font-mono font-semibold"
                >
                  Close File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
