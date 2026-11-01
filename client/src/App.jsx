import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import PlanTrip from './pages/PlanTrip';
import MyTrips from './pages/MyTrips';
import Login from './pages/Login';
import Register from './pages/Register';
import DestinationDetail from './pages/DestinationDetail';
import TripDetail from './pages/TripDetail';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { Compass, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Admin imports
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDestinations from './pages/admin/AdminDestinations';
import AdminAttractions from './pages/admin/AdminAttractions';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTrips from './pages/admin/AdminTrips';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminSettings from './pages/admin/AdminSettings';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Custom 404 Page (The Atlas of Elsewhere)
function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-28 text-center bg-ivory">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md space-y-6 bg-parchment-light border border-border-parchment p-8 sm:p-12 rounded-2xl shadow-parchment relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-cartography pointer-events-none opacity-40" />

        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-forest/10 border border-forest/20 text-forest mx-auto flex items-center justify-center shadow-soft animate-ambient-drift">
            <Compass className="w-8 h-8 text-forest" />
          </div>

          <span className="text-[10px] font-mono tracking-cartographic uppercase text-gold-dark block">
            [ 00° 00' N, 00° 00' E ] &bull; UNCHARTED COORDINATE
          </span>

          <h1 className="text-3xl sm:text-4xl font-serif text-ink tracking-tight">
            Beyond the known atlas.
          </h1>

          <p className="text-xs sm:text-sm text-charcoal leading-relaxed font-normal">
            The path or coordinate you are seeking has not yet been surveyed. Let us return to charted lands.
          </p>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-forest text-ivory text-xs font-semibold uppercase tracking-loose-editorial hover:bg-forest-light transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gold" />
              <span>Return to the Atlas</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Root Application Shell with Admin Separation
function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-ivory text-ink selection:bg-gold/20 selection:text-ink">
      <ScrollToTop />
      {!isAdminRoute && <Navbar />}

      <main className="flex-grow flex flex-col">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/destinations/:slug" element={<DestinationDetail />} />
          <Route path="/plan-trip" element={<PlanTrip />} />
          <Route
            path="/my-trips"
            element={
              <ProtectedRoute>
                <MyTrips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id"
            element={
              <ProtectedRoute>
                <TripDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Administration Panel */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="destinations" element={<AdminDestinations />} />
            <Route path="attractions" element={<AdminAttractions />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="trips" element={<AdminTrips />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
