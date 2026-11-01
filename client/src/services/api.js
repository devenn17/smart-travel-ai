import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Send and receive HttpOnly session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Root API inspection
export const getApiRoot = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    console.warn('[API] Root check failed:', error.message);
    return null;
  }
};

// API service health check
export const getApiHealth = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    console.warn('[API] Health check failed:', error.message);
    return {
      success: false,
      message: 'Backend server is not responding. Ensure backend server is running.',
      environment: 'offline',
      timestamp: new Date().toISOString(),
    };
  }
};

// Actual database health check
export const getDbHealth = async () => {
  try {
    const response = await api.get('/api/health/db');
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Database status unavailable.',
      database: {
        status: 'disconnected',
        stateCode: 0,
        connected: false,
      },
    };
  }
};

// ==========================================
// AUTHENTICATION API METHODS (PHASE 2)
// ==========================================

export const registerUser = async ({ name, email, password }) => {
  const response = await api.post('/api/auth/register', { name, email, password });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

// ==========================================
// USER TRIPS API METHODS (PHASE 2)
// ==========================================

export const getUserTrips = async () => {
  const response = await api.get('/api/trips');
  return response.data;
};

export const getTripById = async (id) => {
  const response = await api.get(`/api/trips/${id}`);
  return response.data;
};

export const generateTripItinerary = async (tripData) => {
  const response = await api.post('/api/trips/generate', tripData);
  return response.data;
};

export const saveUserTrip = async (tripData) => {
  const response = await api.post('/api/trips', tripData);
  return response.data;
};

export const deleteUserTrip = async (id) => {
  const response = await api.delete(`/api/trips/${id}`);
  return response.data;
};

// ==========================================
// DESTINATIONS & ATTRACTIONS (PHASE 3)
// ==========================================

export const getDestinations = async (params = {}) => {
  const response = await api.get('/api/destinations', { params });
  return response.data;
};

export const getDestinationBySlugOrId = async (idOrSlug) => {
  const response = await api.get(`/api/destinations/${encodeURIComponent(idOrSlug)}`);
  return response.data;
};

export const getDestinationAttractions = async (idOrSlug) => {
  const response = await api.get(`/api/destinations/${encodeURIComponent(idOrSlug)}/attractions`);
  return response.data;
};

export const getAttractionBySlugOrId = async (idOrSlug) => {
  const response = await api.get(`/api/attractions/${encodeURIComponent(idOrSlug)}`);
  return response.data;
};

export const getAttractions = async (params = {}) => {
  const response = await api.get('/api/attractions', { params });
  return response.data;
};

// ==========================================
// ADMINISTRATION PANEL API METHODS (RBAC)
// ==========================================

export const getAdminStats = async () => {
  const response = await api.get('/api/admin/dashboard/stats');
  return response.data;
};

// Admin Destinations
export const getAdminDestinations = async (params = {}) => {
  const response = await api.get('/api/admin/destinations', { params });
  return response.data;
};

export const getAdminDestination = async (id) => {
  const response = await api.get(`/api/admin/destinations/${id}`);
  return response.data;
};

export const createAdminDestination = async (data) => {
  const response = await api.post('/api/admin/destinations', data);
  return response.data;
};

export const updateAdminDestination = async (id, data) => {
  const response = await api.put(`/api/admin/destinations/${id}`, data);
  return response.data;
};

export const toggleDestinationStatus = async (id) => {
  const response = await api.patch(`/api/admin/destinations/${id}/toggle-status`);
  return response.data;
};

export const deleteAdminDestination = async (id) => {
  const response = await api.delete(`/api/admin/destinations/${id}`);
  return response.data;
};

// Admin Attractions
export const getAdminAttractions = async (params = {}) => {
  const response = await api.get('/api/admin/attractions', { params });
  return response.data;
};

export const getAdminAttraction = async (id) => {
  const response = await api.get(`/api/admin/attractions/${id}`);
  return response.data;
};

export const createAdminAttraction = async (data) => {
  const response = await api.post('/api/admin/attractions', data);
  return response.data;
};

export const updateAdminAttraction = async (id, data) => {
  const response = await api.put(`/api/admin/attractions/${id}`, data);
  return response.data;
};

export const toggleAttractionStatus = async (id) => {
  const response = await api.patch(`/api/admin/attractions/${id}/toggle-status`);
  return response.data;
};

export const deleteAdminAttraction = async (id) => {
  const response = await api.delete(`/api/admin/attractions/${id}`);
  return response.data;
};

// Admin Users
export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/api/admin/users', { params });
  return response.data;
};

export const getAdminUser = async (id) => {
  const response = await api.get(`/api/admin/users/${id}`);
  return response.data;
};

export const updateUserRole = async (id, role) => {
  const response = await api.patch(`/api/admin/users/${id}/role`, { role });
  return response.data;
};

export const toggleUserStatus = async (id) => {
  const response = await api.patch(`/api/admin/users/${id}/status`);
  return response.data;
};

// Admin Trips
export const getAdminTrips = async (params = {}) => {
  const response = await api.get('/api/admin/trips', { params });
  return response.data;
};

export const getAdminTrip = async (id) => {
  const response = await api.get(`/api/admin/trips/${id}`);
  return response.data;
};

export const updateAdminTripStatus = async (id, status) => {
  const response = await api.patch(`/api/admin/trips/${id}/status`, { status });
  return response.data;
};

export const deleteAdminTrip = async (id) => {
  const response = await api.delete(`/api/admin/trips/${id}`);
  return response.data;
};

// Admin Audit Logs & System Health
export const getAdminAuditLogs = async (params = {}) => {
  const response = await api.get('/api/admin/audit-logs', { params });
  return response.data;
};

export const getAdminSystemHealth = async () => {
  const response = await api.get('/api/admin/settings/health');
  return response.data;
};

// Image Upload
export const uploadAdminImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/api/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default api;
