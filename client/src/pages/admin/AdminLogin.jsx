import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Compass, ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in as admin, redirect to /admin immediately
  useEffect(() => {
    if (user && user.role === 'admin') {
      const target = location.state?.from?.pathname || '/admin';
      navigate(target, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.user?.role !== 'admin') {
          setErrorMessage('Access denied: This account does not possess administrative privileges.');
          setSubmitting(false);
          return;
        }
        const target = location.state?.from?.pathname || '/admin';
        navigate(target, { replace: true });
      } else {
        setErrorMessage(result.message || 'Invalid administrative credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4 py-16 relative">
      <div className="absolute inset-0 bg-cartography opacity-35 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-parchment-light border border-border-parchment rounded-3xl p-8 sm:p-10 shadow-parchment relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-forest text-gold mx-auto flex items-center justify-center shadow-md border border-gold/30">
            <Compass className="w-7 h-7" />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono tracking-cartographic uppercase text-gold-dark">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>INNER ARCHIVE SECURITY</span>
          </div>

          <h1 className="text-3xl font-serif text-ink tracking-tight">
            Administrator Sign In
          </h1>

          <p className="text-xs sm:text-sm text-charcoal leading-relaxed">
            Enter administrative credentials to manage destinations, attractions, user accounts, and system health.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/10 border border-red-500/20 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smarttravel.test"
                className="w-full pl-10 pr-4 py-3 bg-ivory border border-border-parchment rounded-xl text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-ivory border border-border-parchment rounded-xl text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-full bg-forest text-ivory text-xs font-bold uppercase tracking-loose-editorial hover:bg-forest-light transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? 'Authenticating Clearance...' : 'Access Administration'}</span>
              <ArrowRight className="w-4 h-4 text-gold" />
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-border-parchment text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-charcoal hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gold-dark" />
            <span>Return to Public Website</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
