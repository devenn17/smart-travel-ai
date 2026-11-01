import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Menu, X, ArrowUpRight, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Discover', path: '/explore' },
    { name: 'The Journey', path: '/plan-trip' },
    { name: 'My Atlas', path: '/my-trips' },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || !isHome
        ? 'bg-ivory/95 backdrop-blur-md border-b border-border-subtle shadow-soft py-3.5'
        : 'bg-transparent py-5 sm:py-6'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Brand Logo & Wordmark */}
          <Link
            to="/"
            onClick={handleLinkClick}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-sm"
          >
            {/* Cartographic Compass Mark */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${!scrolled && isHome
              ? 'bg-ink/80 text-gold-light border border-gold/40 shadow-glow-gold'
              : 'bg-forest text-gold border border-gold/30 shadow-sm'
              }`}>
              <Compass className="w-5 h-5 stroke-[1.6] transition-transform duration-700 group-hover:rotate-45" />
            </div>

            <div className="flex flex-col">
              <span className={`text-xl font-bold tracking-tight transition-colors ${!scrolled && isHome ? 'text-white' : 'text-ink'
                }`}>
                Smart<span className="text-gold font-serif italic font-normal">Travel</span>
              </span>
              <span className={`text-[9px] font-mono tracking-cartographic uppercase -mt-0.5 ${!scrolled && isHome ? 'text-gold-foil/80' : 'text-charcoal/80'
                }`}>
                The Atlas of Elsewhere
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Animated Sliding Pill Indicator */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-loose-editorial rounded-full transition-colors duration-200 relative ${isActive
                    ? !scrolled && isHome
                      ? 'text-white font-bold'
                      : 'text-forest font-bold'
                    : !scrolled && isHome
                      ? 'text-ivory/80 hover:text-white'
                      : 'text-charcoal hover:text-ink'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className={`absolute inset-0 rounded-full -z-10 ${!scrolled && isHome
                        ? 'bg-white/15 border border-white/25 shadow-sm'
                        : 'bg-forest/10 border border-forest/20 shadow-sm'
                        }`}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* User badge */}
                <Link
                  to="/my-trips"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!scrolled && isHome
                    ? 'bg-white/15 text-ivory border border-white/20 hover:bg-white/25'
                    : 'bg-forest/10 text-forest border border-forest/20 hover:bg-forest/15'
                    }`}
                  title={user?.email}
                >
                  <UserIcon className="w-3.5 h-3.5 text-gold" />
                  <span className="font-serif font-normal">{user?.name ? user.name.split(' ')[0] : 'Explorer'}</span>
                </Link>

                {/* Admin Console Link if User is Admin */}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-loose-editorial transition-all shadow-sm ${!scrolled && isHome
                      ? 'bg-gold/20 text-gold-light border border-gold/40 hover:bg-gold/30'
                      : 'bg-forest text-ivory border border-gold/40 hover:bg-forest-light'
                      }`}
                    title="Administration Console"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-loose-editorial px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${!scrolled && isHome
                    ? 'text-ivory/80 hover:text-rose-300'
                    : 'text-charcoal hover:text-rose-600'
                    }`}
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`text-xs font-semibold uppercase tracking-loose-editorial px-3 py-1.5 transition-colors ${!scrolled && isHome
                  ? 'text-ivory/90 hover:text-white'
                  : 'text-charcoal hover:text-ink'
                  }`}
              >
                Sign In
              </Link>
            )}

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/plan-trip"
                className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-loose-editorial px-5 py-2.5 rounded-full transition-all duration-300 group shadow-sm ${!scrolled && isHome
                  ? 'bg-gold hover:bg-gold-light text-ink border border-gold-light/40 hover:shadow-glow-gold'
                  : 'bg-forest hover:bg-forest-light text-ivory border border-forest-light/40'
                  }`}
              >
                <span>Plan a Journey</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gold ${!scrolled && isHome
                ? 'text-white hover:bg-white/10'
                : 'text-ink hover:bg-ink/5'
                }`}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-ivory border-b border-border-subtle shadow-card px-5 pt-5 pb-7 mt-3 overflow-hidden"
          >
            <div className="flex flex-col space-y-2.5">
              <div className="pb-2 border-b border-border-subtle flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-cartographic uppercase text-gold-dark">
                  Atlas Navigation
                </span>
                <span className="text-[9px] font-mono text-charcoal/50 uppercase">
                  Press ESC to close
                </span>
              </div>

              {/* Mobile links */}
              {navLinks.map((link) => (
                <NavLink
                  key={`mobile-${link.name}`}
                  to={link.path}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${isActive
                      ? 'bg-forest/10 text-forest font-semibold'
                      : 'text-ink hover:bg-forest/5'
                    }`
                  }
                >
                  <span>{link.name}</span>
                  <span className="text-[10px] font-mono text-charcoal/60">&bull;</span>
                </NavLink>
              ))}

              <div className="pt-3 border-t border-border-subtle flex flex-col gap-2.5">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <div className="px-3 py-2 bg-parchment rounded-xl flex items-center justify-between text-xs text-charcoal">
                      <span className="font-serif text-ink font-medium">{user?.name}</span>
                      <span className="text-[10px] font-mono text-gold-dark uppercase tracking-wider">{user?.email}</span>
                    </div>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={handleLinkClick}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-loose-editorial text-forest bg-gold/15 border border-gold/30 rounded-xl hover:bg-gold/25 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-gold-dark" />
                        <span>Admin Console</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-loose-editorial text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={handleLinkClick}
                    className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-loose-editorial text-ink border border-border-subtle rounded-xl hover:bg-ivory-dark transition-colors"
                  >
                    Sign In
                  </Link>
                )}

                <Link
                  to="/plan-trip"
                  onClick={handleLinkClick}
                  className="inline-flex items-center justify-center gap-2 bg-forest text-ivory text-xs font-semibold uppercase tracking-loose-editorial px-4 py-3 rounded-xl shadow-sm hover:bg-forest-light transition-colors"
                >
                  <span>Plan a Journey</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
