import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Users,
  MapPin,
  Landmark,
  Briefcase,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  AlertCircle,
  RotateCcw,
  PlusCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getAdminStats } from '../../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminStats();
      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'Failed to load dashboard metrics.');
      }
    } catch (err) {
      console.error('[AdminDashboard] Fetch error:', err);
      setError(err.response?.data?.message || 'Unable to connect to administration API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-forest/10 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-forest/10 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-forest/10 rounded-2xl" />
          <div className="h-72 bg-forest/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-parchment-light border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h2 className="text-xl font-serif text-ink mb-2">Metrics Unavailable</h2>
        <p className="text-xs sm:text-sm text-charcoal mb-4">{error}</p>
        <button
          onClick={loadStats}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-loose-editorial hover:bg-forest-light"
        >
          <RotateCcw className="w-3.5 h-3.5 text-gold" />
          <span>Retry Survey</span>
        </button>
      </div>
    );
  }

  const { stats, distributions, activity, system } = data;

  const statCards = [
    {
      title: 'Explorers & Accounts',
      value: stats.users.total,
      sub: `${stats.users.active} active accounts &bull; ${stats.users.admins} admin(s)`,
      icon: Users,
      link: '/admin/users',
      color: 'forest',
    },
    {
      title: 'Curated Destinations',
      value: stats.destinations.total,
      sub: `${stats.destinations.active} published in atlas`,
      icon: MapPin,
      link: '/admin/destinations',
      color: 'gold',
    },
    {
      title: 'Surveyed Attractions',
      value: stats.attractions.total,
      sub: `${stats.attractions.active} public landmarks`,
      icon: Landmark,
      link: '/admin/attractions',
      color: 'forest',
    },
    {
      title: 'Planned Expeditions',
      value: stats.trips.total,
      sub: `Stored user travel itineraries`,
      icon: Briefcase,
      link: '/admin/trips',
      color: 'gold',
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      
      {/* Title & Quick Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-cartographic uppercase text-gold-dark mb-1">
            <Compass className="w-3.5 h-3.5 text-gold" />
            <span>OPERATIONAL RECONNAISSANCE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-ink tracking-tight">
            Archive Overview
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/destinations"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-light transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-gold" />
            <span>New Destination</span>
          </Link>
          <Link
            to="/admin/attractions"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border-parchment bg-ivory text-xs font-semibold uppercase tracking-wider text-ink hover:border-gold transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-forest" />
            <span>New Attraction</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="bg-parchment-light border border-border-parchment rounded-2xl p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-charcoal mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider">{card.title}</span>
                  <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-serif text-ink tracking-tight mb-1">
                  {card.value}
                </div>
                <p
                  className="text-[11px] text-charcoal"
                  dangerouslySetInnerHTML={{ __html: card.sub }}
                />
              </div>

              <div className="pt-3 mt-3 border-t border-border-parchment/60 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-forest hover:text-gold-dark transition-colors">
                <Link to={card.link} className="inline-flex items-center gap-1">
                  <span>Manage</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Category Breakdown & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Categories Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-ivory border border-border-subtle rounded-3xl p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-cartographic text-gold-dark block">
                TAXONOMY
              </span>
              <h2 className="text-lg font-serif text-ink tracking-tight">
                Destinations by Category
              </h2>
            </div>
            <span className="text-xs font-mono text-charcoal">
              {stats.destinations.total} Total
            </span>
          </div>

          <div className="space-y-3.5">
            {distributions.categories.map((c, i) => {
              const pct = stats.destinations.total > 0 ? Math.round((c.count / stats.destinations.total) * 100) : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-ink font-medium">{c.category}</span>
                    <span className="text-charcoal">{c.count} chapters ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-parchment rounded-full overflow-hidden">
                    <div
                      className="h-full bg-forest rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: System & Database Live Status (5 cols) */}
        <div className="lg:col-span-5 bg-parchment-light border border-border-parchment rounded-3xl p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border-parchment">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-cartographic text-gold-dark block">
                INFRASTRUCTURE
              </span>
              <h2 className="text-lg font-serif text-ink tracking-tight">
                System Diagnostics
              </h2>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-forest text-gold text-[10px] font-mono uppercase">
              <CheckCircle2 className="w-3 h-3 text-gold" />
              Operational
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-border-parchment/60">
              <span className="text-charcoal font-medium">Database Host</span>
              <span className="font-mono text-ink">MongoDB Atlas Cluster</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-parchment/60">
              <span className="text-charcoal font-medium">Connection State</span>
              <span className="font-mono text-forest font-semibold capitalize">{system.databaseState}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-parchment/60">
              <span className="text-charcoal font-medium">Server Uptime</span>
              <span className="font-mono text-ink">{Math.floor(system.serverUptimeSeconds / 60)} mins</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-parchment/60">
              <span className="text-charcoal font-medium">Security Mode</span>
              <span className="font-mono text-gold-dark font-medium">HttpOnly JWT + RBAC</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/admin/settings"
              className="w-full py-2.5 rounded-xl border border-border-parchment bg-ivory text-xs font-semibold uppercase tracking-wider text-ink hover:border-gold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-forest" />
              <span>Full Health Telemetry</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Recent Activity Grid: Users & Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Registrations */}
        <div className="bg-ivory border border-border-subtle rounded-3xl p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <h3 className="font-serif text-lg text-ink tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-dark" />
              <span>Recent Explorers</span>
            </h3>
            <Link to="/admin/users" className="text-xs font-mono uppercase text-forest hover:text-gold-dark">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {activity.recentUsers.map((u) => (
              <div
                key={u.id}
                className="p-3 rounded-xl bg-parchment-light border border-border-parchment flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-ink block">{u.name}</span>
                  <span className="text-charcoal font-mono text-[11px] block">{u.email}</span>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                      u.role === 'admin'
                        ? 'bg-gold/20 text-gold-dark font-bold'
                        : 'bg-forest/10 text-forest font-medium'
                    }`}
                  >
                    {u.role}
                  </span>
                  <span className="text-[10px] text-charcoal/70 block mt-0.5 font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trips */}
        <div className="bg-ivory border border-border-subtle rounded-3xl p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <h3 className="font-serif text-lg text-ink tracking-tight flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gold-dark" />
              <span>Recent Expeditions</span>
            </h3>
            <Link to="/admin/trips" className="text-xs font-mono uppercase text-forest hover:text-gold-dark">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {activity.recentTrips.length > 0 ? (
              activity.recentTrips.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-parchment-light border border-border-parchment flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-serif text-sm font-semibold text-ink block">{t.destination}</span>
                    <span className="text-charcoal font-mono text-[11px] block">
                      By {t.userId?.name || 'Explorer'} ({t.duration} days &bull; ₹{t.budget?.toLocaleString('en-IN')})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-forest text-ivory text-[10px] font-mono uppercase">
                    {t.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-charcoal text-center py-4">No expeditions planned yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Recent Audit Trail Preview */}
      <div className="bg-parchment-light border border-border-parchment rounded-3xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-parchment">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-cartographic text-gold-dark block">
              IMMUTABLE JOURNAL
            </span>
            <h3 className="font-serif text-lg text-ink tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forest" />
              <span>Recent Administrative Actions</span>
            </h3>
          </div>
          <Link to="/admin/audit-logs" className="text-xs font-mono uppercase text-forest hover:text-gold-dark">
            View Full Trail &rarr;
          </Link>
        </div>

        <div className="space-y-2">
          {activity.recentAuditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-ivory border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-forest/10 text-forest text-[10px] font-mono font-bold uppercase">
                    {log.action}
                  </span>
                  <span className="font-mono text-charcoal text-[11px]">
                    Admin: <strong>{log.adminEmail}</strong>
                  </span>
                </div>
                <p className="text-ink font-medium">{log.summary}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-[10px] text-charcoal/70">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
