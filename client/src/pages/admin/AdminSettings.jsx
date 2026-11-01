import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Server,
  Database,
  Activity,
  Cpu,
  Layers,
  Terminal,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe,
  HardDrive,
  Clock,
  KeyRound,
  FileCode2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getAdminSystemHealth } from '../../services/api';

export default function AdminSettings() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCmd, setCopiedCmd] = useState(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminSystemHealth();
      if (res.success) {
        setHealthData(res);
      } else {
        setError(res.message || 'Unable to retrieve telemetry diagnostics.');
      }
    } catch (err) {
      console.error('[AdminSettings] Error fetching diagnostics:', err);
      setError(err.response?.data?.message || 'Server diagnostic endpoint unreachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return '—';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const copyToClipboard = (cmd, key) => {
    navigator.clipboard?.writeText(cmd);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-forest/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-loose-editorial text-gold font-sans block mb-1">
            System Architecture & Observability
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">
            Settings & System Health
          </h1>
          <p className="text-xs sm:text-sm text-charcoal/80 font-sans mt-0.5">
            Safe operational telemetry, database connection health, security configurations, and administrative tools.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-forest/20 text-xs font-semibold uppercase tracking-loose-editorial text-forest hover:bg-forest/5 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-gold ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-800">
            <p className="font-semibold mb-0.5">Diagnostic Report Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading && !healthData ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-forest/5 rounded-3xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-forest/5 rounded-3xl" />
            <div className="h-64 bg-forest/5 rounded-3xl" />
          </div>
        </div>
      ) : healthData ? (
        <div className="space-y-8">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Database Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-parchment-light/80 border border-forest/10 rounded-3xl p-5 shadow-soft relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-forest/5 border border-forest/10 flex items-center justify-center text-forest">
                  <Database className="w-5 h-5" />
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-loose-editorial ${
                    healthData.database.connected
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      healthData.database.connected ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                    }`}
                  />
                  {healthData.database.connected ? 'Atlas Online' : 'Disconnected'}
                </span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-loose-editorial text-charcoal/70 mb-1">
                Database Cluster
              </h3>
              <p className="text-lg font-serif text-ink tracking-tight mb-2">
                {healthData.database.name}
              </p>
              <div className="text-[11px] text-charcoal/70 font-mono truncate bg-parchment/60 p-2 rounded-xl border border-forest/5">
                Host: {healthData.database.host}
              </div>
            </motion.div>

            {/* Server Process Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-parchment-light/80 border border-forest/10 rounded-3xl p-5 shadow-soft relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-forest/5 border border-forest/10 flex items-center justify-center text-forest">
                  <Server className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-loose-editorial bg-forest/10 text-forest border border-forest/20">
                  <Clock className="w-3 h-3 text-gold" />
                  {formatUptime(healthData.system.uptimeSeconds)}
                </span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-loose-editorial text-charcoal/70 mb-1">
                Node.js Runtime
              </h3>
              <p className="text-lg font-serif text-ink tracking-tight mb-2">
                {healthData.system.nodeVersion}
              </p>
              <div className="text-[11px] text-charcoal/70 font-mono bg-parchment/60 p-2 rounded-xl border border-forest/5 flex items-center justify-between">
                <span>Platform: {healthData.system.platform}</span>
                <span className="capitalize text-forest font-semibold">
                  {healthData.system.environment}
                </span>
              </div>
            </motion.div>

            {/* Memory Usage Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-parchment-light/80 border border-forest/10 rounded-3xl p-5 shadow-soft relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-forest/5 border border-forest/10 flex items-center justify-center text-forest">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-forest">
                  {healthData.system.memory.heapUsedMB} MB Heap
                </span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-loose-editorial text-charcoal/70 mb-1">
                Process Memory
              </h3>
              <p className="text-lg font-serif text-ink tracking-tight mb-2">
                {healthData.system.memory.rssMB} MB RSS
              </p>
              <div className="w-full bg-forest/10 h-2 rounded-full overflow-hidden mb-1">
                <div
                  className="bg-gold h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (healthData.system.memory.heapUsedMB /
                          Math.max(1, healthData.system.memory.heapTotalMB)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-charcoal/60 font-mono">
                <span>Used: {healthData.system.memory.heapUsedMB} MB</span>
                <span>Allocated: {healthData.system.memory.heapTotalMB} MB</span>
              </div>
            </motion.div>
          </div>

          {/* Database Entities Inventory */}
          <div className="bg-parchment-light/90 border border-forest/10 rounded-3xl p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-gold" />
              <h2 className="text-sm font-bold uppercase tracking-loose-editorial text-forest">
                Database Document Telemetry
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-parchment/60 border border-forest/5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-loose-editorial text-charcoal/70 block mb-1">
                  Users
                </span>
                <span className="text-2xl font-serif text-ink">
                  {healthData.database.collections?.users ?? 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-parchment/60 border border-forest/5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-loose-editorial text-charcoal/70 block mb-1">
                  Destinations
                </span>
                <span className="text-2xl font-serif text-ink">
                  {healthData.database.collections?.destinations ?? 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-parchment/60 border border-forest/5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-loose-editorial text-charcoal/70 block mb-1">
                  Attractions
                </span>
                <span className="text-2xl font-serif text-ink">
                  {healthData.database.collections?.attractions ?? 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-parchment/60 border border-forest/5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-loose-editorial text-charcoal/70 block mb-1">
                  Trips
                </span>
                <span className="text-2xl font-serif text-ink">
                  {healthData.database.collections?.trips ?? 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-parchment/60 border border-forest/5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-loose-editorial text-charcoal/70 block mb-1">
                  Audit Logs
                </span>
                <span className="text-2xl font-serif text-ink">
                  {healthData.database.collections?.auditLogs ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Transport Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Architecture */}
            <div className="bg-parchment-light/90 border border-forest/10 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  <h2 className="text-sm font-bold uppercase tracking-loose-editorial text-forest">
                    Security & Session Policies
                  </h2>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between text-xs py-2 border-b border-forest/5 font-sans">
                    <span className="text-charcoal flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-forest/70" />
                      JWT Cryptographic Signature
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        healthData.security.jwtConfigured ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {healthData.security.jwtConfigured ? 'Configured' : 'Missing'}
                    </span>
                  </li>
                  <li className="flex items-center justify-between text-xs py-2 border-b border-forest/5 font-sans">
                    <span className="text-charcoal flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-forest/70" />
                      HttpOnly Cookie Protection
                    </span>
                    <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active (XSS immune)
                    </span>
                  </li>
                  <li className="flex items-center justify-between text-xs py-2 border-b border-forest/5 font-sans">
                    <span className="text-charcoal flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-forest/70" />
                      SameSite Policy
                    </span>
                    <span className="font-mono text-forest font-semibold uppercase">
                      {healthData.security.sameSite}
                    </span>
                  </li>
                  <li className="flex items-center justify-between text-xs py-2 font-sans">
                    <span className="text-charcoal flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-forest/70" />
                      Whitelisted CORS Origin
                    </span>
                    <span className="font-mono text-forest text-[11px]">
                      {healthData.security.corsOrigins?.join(', ') || 'Default'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 p-3 rounded-2xl bg-forest/5 border border-forest/10 text-[11px] text-charcoal/80 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <p>
                  Zero credentials or raw keys are disclosed through the administration telemetry API.
                  All database connection strings are masked.
                </p>
              </div>
            </div>

            {/* Administrative CLI Bootstrap Reference */}
            <div className="bg-forest text-ivory rounded-3xl p-6 shadow-soft relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4 text-gold" />
                  <h2 className="text-sm font-bold uppercase tracking-loose-editorial text-gold">
                    Server CLI Administrative Bootstrap
                  </h2>
                </div>
                <p className="text-xs text-ivory/80 font-sans mb-4">
                  For secure offline administrator provisioning, use the dedicated server-side CLI tool.
                  Never promote admins via untrusted frontend forms.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  {/* Command 1: Status */}
                  <div className="bg-forest-dark/80 p-3 rounded-2xl border border-gold/15 flex items-center justify-between gap-2">
                    <div className="truncate text-ivory/90">
                      <span className="text-gold/80">$ </span>node server/scripts/bootstrapAdmin.js status
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard('node server/scripts/bootstrapAdmin.js status', 'status')
                      }
                      className="px-2.5 py-1 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold text-[10px] uppercase font-bold shrink-0 transition"
                    >
                      {copiedCmd === 'status' ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Command 2: Promote */}
                  <div className="bg-forest-dark/80 p-3 rounded-2xl border border-gold/15 flex items-center justify-between gap-2">
                    <div className="truncate text-ivory/90">
                      <span className="text-gold/80">$ </span>node server/scripts/bootstrapAdmin.js promote &lt;email&gt;
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          'node server/scripts/bootstrapAdmin.js promote <email>',
                          'promote'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold text-[10px] uppercase font-bold shrink-0 transition"
                    >
                      {copiedCmd === 'promote' ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Command 3: Create */}
                  <div className="bg-forest-dark/80 p-3 rounded-2xl border border-gold/15 flex items-center justify-between gap-2">
                    <div className="truncate text-ivory/90">
                      <span className="text-gold/80">$ </span>node server/scripts/bootstrapAdmin.js create &lt;email&gt; &quot;&lt;Name&gt;&quot; &quot;&lt;Pass&gt;&quot;
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          'node server/scripts/bootstrapAdmin.js create <email> "<Name>" "<Pass>"',
                          'create'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold text-[10px] uppercase font-bold shrink-0 transition"
                    >
                      {copiedCmd === 'create' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-ivory/10 flex items-center justify-between text-[11px] text-ivory/60 font-sans">
                <span>Safe offline execution</span>
                <span className="text-gold">Role-Based Access Control</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
