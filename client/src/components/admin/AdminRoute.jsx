import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Compass, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-forest/20 border-t-forest animate-spin" />
          <span className="text-xs font-mono tracking-cartographic uppercase text-gold-dark">
            VERIFYING ADMINISTRATIVE CLEARANCE...
          </span>
        </div>
      </div>
    );
  }

  // If unauthenticated, redirect to admin login
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If authenticated but not an admin, show branded luxury access restricted screen
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full bg-parchment-light border border-border-parchment rounded-3xl p-8 sm:p-10 shadow-parchment text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-cartography opacity-40 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-950/10 border border-red-500/20 text-red-700 mx-auto flex items-center justify-center shadow-soft">
              <ShieldAlert className="w-8 h-8 text-red-700" />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono tracking-cartographic uppercase text-gold-dark">
              <Compass className="w-3 h-3 text-gold" />
              <span>SECURITY PROTOCOL 403</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">
              Administrative Clearance Required
            </h1>

            <p className="text-xs sm:text-sm text-charcoal leading-relaxed font-normal">
              Your account (<strong className="text-ink">{user.email}</strong>) holds standard explorer privileges. Administrative clearance is required to survey the inner archive.
            </p>

            <div className="pt-4 flex flex-col gap-2.5">
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-loose-editorial hover:bg-forest-light transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-gold" />
                <span>Return to Public Atlas</span>
              </Link>

              <Link
                to="/admin/login"
                className="w-full text-center text-xs font-mono text-charcoal hover:text-gold-dark py-1"
              >
                Sign in with an Administrator Account &rarr;
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return children;
}
