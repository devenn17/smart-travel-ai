import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  LayoutDashboard,
  MapPin,
  Landmark,
  Users,
  Briefcase,
  ShieldCheck,
  Activity,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ChevronRight,
  Database,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/destinations', label: 'Destinations', icon: MapPin },
  { path: '/admin/attractions', label: 'Attractions', icon: Landmark },
  { path: '/admin/users', label: 'User Directory', icon: Users },
  { path: '/admin/trips', label: 'Trips Archive', icon: Briefcase },
  { path: '/admin/audit-logs', label: 'Audit Trail', icon: ShieldCheck },
  { path: '/admin/settings', label: 'System & Health', icon: Activity },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isCurrentActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  // Determine current page label for breadcrumbs
  const currentNav = NAV_ITEMS.find((n) => isCurrentActive(n)) || { label: 'Console' };

  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col font-sans selection:bg-gold/20 selection:text-ink">
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-forest text-ivory px-4 py-3.5 border-b border-border-dark flex items-center justify-between sticky top-0 z-40 shadow-soft">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif text-lg tracking-tight text-white block leading-none">SmartTravel</span>
            <span className="text-[9px] font-mono tracking-cartographic text-gold uppercase block">ADMINISTRATION</span>
          </div>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-ivory hover:text-gold transition-colors"
          aria-label="Toggle navigation drawer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Sidebar (Theme-Matched Deep Forest) */}
        <aside
          className={`hidden lg:flex flex-col bg-forest border-r border-border-dark transition-all duration-300 relative z-30 ${
            collapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand Header */}
          <div className="p-5 border-b border-border-dark/60 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0 shadow-sm">
                <Compass className="w-5 h-5" />
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <span className="font-serif text-xl tracking-tight text-white block leading-none truncate">
                    SmartTravel
                  </span>
                  <span className="text-[9px] font-mono tracking-cartographic text-gold uppercase block mt-1">
                    INNER ARCHIVE
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto scrollbar-none">
            {!collapsed && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-mono tracking-cartographic text-gold-light/60 uppercase">
                ADMINISTRATIVE ATLAS
              </div>
            )}

            {NAV_ITEMS.map((item) => {
              const active = isCurrentActive(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all group ${
                    active
                      ? 'bg-gold text-ink font-bold shadow-md'
                      : 'text-ivory/80 hover:bg-forest-light hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${active ? 'text-ink' : 'text-gold group-hover:scale-110'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-border-dark/60 space-y-2">
            <Link
              to="/"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-ivory/70 hover:text-gold hover:bg-forest-light/60 transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
              title="Return to Public Atlas"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gold shrink-0" />
              {!collapsed && <span className="text-[11px] truncate">Public Atlas</span>}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-ivory/60 hover:text-ivory hover:bg-forest-light/40 transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span className="text-[11px]">Collapse View</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="lg:hidden fixed inset-0 z-50 flex"
            >
              <div
                className="fixed inset-0 bg-ink/70 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <div className="relative w-72 bg-forest text-ivory flex flex-col z-10 shadow-2xl p-4">
                <div className="flex items-center justify-between pb-4 border-b border-border-dark">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-gold" />
                    <span className="font-serif text-lg text-white">SmartTravel Admin</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)}>
                    <X className="w-5 h-5 text-ivory/70" />
                  </button>
                </div>

                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                  {NAV_ITEMS.map((item) => {
                    const active = isCurrentActive(item);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider ${
                          active ? 'bg-gold text-ink font-bold' : 'text-ivory/80 hover:bg-forest-light'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-gold" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t border-border-dark space-y-2">
                  <Link
                    to="/"
                    className="flex items-center gap-2 text-xs font-mono text-ivory/70 hover:text-gold py-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gold" />
                    <span>View Public Website</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-xs font-mono text-red-300 hover:text-red-200 py-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-ivory">
          
          {/* Top Bar (Editorial Luxury Banner) */}
          <header className="bg-parchment-light border-b border-border-parchment px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-soft">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-charcoal">
              <span className="hidden sm:inline text-gold-dark">ARCHIVE</span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="text-ink font-semibold">{currentNav.label}</span>
            </div>

            {/* Right Meta Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Atlas Database Live Indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/5 border border-forest/20 text-forest text-[10px] font-mono uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>MongoDB Atlas &bull; Live</span>
              </div>

              {/* Admin Profile Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-ivory border border-border-parchment shadow-sm">
                <div className="w-6 h-6 rounded-full bg-forest text-gold text-[10px] font-mono font-bold flex items-center justify-center">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <span className="text-xs font-medium text-ink block leading-none">
                    {user?.name}
                  </span>
                  <span className="text-[9px] font-mono text-gold-dark font-bold uppercase tracking-widest block mt-0.5">
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Sign Out Action */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full border border-border-parchment text-charcoal hover:text-ink hover:border-gold hover:bg-ivory transition-colors"
                title="Sign Out of Admin Console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Subpage Container */}
          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  );
}
