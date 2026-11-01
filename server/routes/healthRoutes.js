import express from 'express';
import { getDbConnectionStatus } from '../config/db.js';

const router = express.Router();

// GET /api/health - General API health check
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartTravel API service is operational and healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0 (Phase 2 - Authentication & MongoDB)',
  });
});

// GET /api/health/db - Actual database connection status
router.get('/db', (req, res) => {
  const dbStatus = getDbConnectionStatus();

  res.status(dbStatus.isConnected ? 200 : 503).json({
    success: dbStatus.isConnected,
    message: dbStatus.isConnected
      ? 'MongoDB database connection is active and responsive'
      : dbStatus.diagnosticMessage || `MongoDB database is currently ${dbStatus.status}. Configure MONGODB_URI in .env to connect to MongoDB Atlas or local MongoDB.`,
    database: {
      status: dbStatus.status,
      stateCode: dbStatus.stateCode,
      connected: dbStatus.isConnected,
      diagnostic: dbStatus.diagnosticReason || 'Check MONGODB_URI in .env',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
