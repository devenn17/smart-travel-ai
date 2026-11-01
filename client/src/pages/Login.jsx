import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/my-trips';

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const validate = () => {
    const errs = {};
    if (!email) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please provide a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setServerError(result.message || 'Invalid email or password.');
      }
    } catch (err) {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-20 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl bg-parchment-light border border-border-parchment rounded-2xl shadow-elevated overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]"
      >
        
        {/* Left Editorial Visual Side (Cinematic Midnight) */}
        <div className="lg:col-span-5 relative bg-ink p-8 sm:p-10 text-ivory flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-25">
            <img
              src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80"
              alt="Kerala Backwaters"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-cartography-dark pointer-events-none opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent z-0" />

          {/* Top Brand Mark */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center text-gold border border-gold/30">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Smart<span className="text-gold font-serif italic font-normal">Travel</span>
              </span>
            </Link>
          </div>

          {/* Central Editorial Narrative */}
          <div className="relative z-10 my-8 space-y-3">
            <span className="text-[10px] font-mono tracking-cartographic uppercase text-gold">
              [ 09° 29' N, 76° 20' E ] &bull; LOG IN
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-white leading-snug">
              Every return is a prelude to departure.
            </h2>
            <p className="text-xs text-ivory/80 leading-relaxed font-normal">
              Access your personalized Indian travel itineraries, saved preferences, and future journeys in the atlas.
            </p>
          </div>

          {/* Bottom Phase Badge */}
          <div className="relative z-10 pt-4 border-t border-white/10 text-[10px] font-mono tracking-wider text-ivory/60">
            THE ATLAS OF ELSEWHERE &bull; SECURE ATLAS ACCESS
          </div>
        </div>

        {/* Right Form Side (Warm Parchment) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-parchment-light">
          <div className="max-w-md mx-auto w-full">
            
            <div className="mb-8">
              <span className="text-[10px] font-mono tracking-cartographic uppercase text-gold-dark block mb-1">
                MEMBERSHIP DOSSIER
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif text-ink tracking-tight">
                Welcome back, traveller.
              </h1>
              <p className="text-xs sm:text-sm text-charcoal mt-1 font-normal">
                Sign in to access your saved journeys and personal atlas.
              </p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Sign In Failed</p>
                  <p className="font-normal text-rose-700">{serverError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                      if (serverError) setServerError('');
                    }}
                    placeholder="explorer@smarttravel.com"
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-2.5 bg-ivory border ${
                      errors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border-parchment'
                    } rounded-xl text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="login-password" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                      if (serverError) setServerError('');
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full pl-10 pr-10 py-2.5 bg-ivory border ${
                      errors.password ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border-parchment'
                    } rounded-xl text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-forest hover:bg-forest-light text-ivory font-semibold rounded-xl text-xs uppercase tracking-loose-editorial shadow-soft transition-all flex items-center justify-center gap-2 group mt-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4 text-gold transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Link */}
            <div className="mt-8 pt-6 border-t border-border-parchment text-center text-xs text-charcoal">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-forest hover:text-gold-dark transition-colors">
                Create an account
              </Link>
            </div>

          </div>
        </div>

      </motion.div>
    </div>
  );
}
