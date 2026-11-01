import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-ivory px-4">
        <div className="w-16 h-16 rounded-2xl bg-forest/10 border border-forest/20 text-forest flex items-center justify-center shadow-soft animate-ambient-drift mb-4">
          <Compass className="w-8 h-8 text-forest animate-spin-slow" />
        </div>
        <span className="text-[10px] font-mono tracking-cartographic uppercase text-gold-dark">
          VERIFYING EXPEDITION CREDENTIALS
        </span>
        <p className="text-xs text-charcoal/70 mt-1 font-serif italic">
          Consulting the atlas archive...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination path in state.from
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
