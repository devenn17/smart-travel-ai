import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, User, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/my-trips', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs = {};
    if (!fullName || !fullName.trim()) {
      errs.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters.';
    }

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

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your password.';
    } else if (confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match.';
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
      const result = await register(fullName.trim(), email.trim(), password);
      if (result.success) {
        navigate('/my-trips', { replace: true });
      } else {
        setServerError(result.message || 'Unable to register account.');
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
        className="w-full max-w-4xl bg-parchment-light border border-border-parchment rounded-2xl shadow-elevated overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]"
      >
        
        {/* Left Editorial Visual Side (Cinematic Midnight) */}
        <div className="lg:col-span-5 relative bg-ink p-8 sm:p-10 text-ivory flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-25">
            <img
              src="/images/udaipur.jpg"
              alt="Udaipur Royal Haveli"
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
              [ 24° 35' N, 73° 41' E ] &bull; NEW EXPEDITION
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-white leading-snug">
              Travel thoughtfully. Experience further.
            </h2>
            <p className="text-xs text-ivory/80 leading-relaxed font-normal">
              Create a personal space to save curated routes, align collaborative trips with companions, and prepare for intelligent AI scheduling.
            </p>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/10 text-[10px] font-mono tracking-wider text-ivory/60">
            THE ATLAS OF ELSEWHERE &bull; VERIFIED DOSSIER
          </div>
        </div>

        {/* Right Form Side (Warm Parchment) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-parchment-light">
          <div className="max-w-md mx-auto w-full">
            
            <div className="mb-6">
              <span className="text-[10px] font-mono tracking-cartographic uppercase text-gold-dark block mb-1">
                CREATE PROFILE
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif text-ink tracking-tight">
                Begin your atlas.
              </h1>
              <p className="text-xs sm:text-sm text-charcoal mt-1 font-normal">
                Create your space for journeys yet to come.
              </p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Registration Notice</p>
                  <p className="font-normal text-rose-700">{serverError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label htmlFor="reg-name" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                      if (serverError) setServerError('');
                    }}
                    placeholder="Aditi Sharma"
                    autoComplete="name"
                    className={`w-full pl-10 pr-4 py-2.5 bg-ivory border ${
                      errors.fullName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border-parchment'
                    } rounded-xl text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                      if (serverError) setServerError('');
                    }}
                    placeholder="aditi@example.com"
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-2.5 bg-ivory border ${
                      errors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border-parchment'
                    } rounded-xl text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                      if (serverError) setServerError('');
                    }}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
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
                  <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="reg-confirm-password" className="block text-[11px] font-mono font-semibold text-charcoal uppercase tracking-cartographic mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                      if (serverError) setServerError('');
                    }}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-4 py-2.5 bg-ivory border ${
                      errors.confirmPassword ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border-parchment'
                    } rounded-xl text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-forest hover:bg-forest-light text-ivory font-semibold rounded-xl text-xs uppercase tracking-loose-editorial shadow-soft transition-all flex items-center justify-center gap-2 group mt-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    <span>Creating your dossier...</span>
                  </>
                ) : (
                  <>
                    <span>Create your account</span>
                    <ArrowRight className="w-4 h-4 text-gold transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Link */}
            <div className="mt-6 pt-5 border-t border-border-parchment text-center text-xs text-charcoal">
              Already have an atlas account?{' '}
              <Link to="/login" className="font-semibold text-forest hover:text-gold-dark transition-colors">
                Sign in here
              </Link>
            </div>

          </div>
        </div>

      </motion.div>
    </div>
  );
}
