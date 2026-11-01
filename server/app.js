import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import destinationRoutes from './routes/destinationRoutes.js';
import attractionRoutes from './routes/attractionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration supporting credentials (cookies & authorization headers)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman) or if in allowedOrigins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin not permitted by CORS policy'));
      }
    },
    credentials: true,
  })
);

// Cookie parsing middleware (required for HttpOnly JWT session cookies)
app.use(cookieParser(process.env.COOKIE_SECRET));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded assets statically
app.use('/uploads', express.static(path.resolve(__dirname, '../client/public/uploads')));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Root route - identify SmartTravel backend
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'SmartTravel Backend API',
    tagline: 'The Atlas of Elsewhere',
    phase: 'Phase 3 - Complete Admin Panel, RBAC & Destination Management',
    status: 'online',
    endpoints: {
      health: '/api/health',
      databaseHealth: '/api/health/db',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
      },
      trips: {
        list: 'GET /api/trips',
        create: 'POST /api/trips',
      },
      destinations: {
        list: 'GET /api/destinations',
        details: 'GET /api/destinations/:idOrSlug',
        attractions: 'GET /api/destinations/:idOrSlug/attractions',
      },
      attractions: {
        list: 'GET /api/attractions',
        details: 'GET /api/attractions/:idOrSlug',
      },
      admin: {
        stats: 'GET /api/admin/dashboard/stats',
        destinations: 'GET /api/admin/destinations',
        attractions: 'GET /api/admin/attractions',
        users: 'GET /api/admin/users',
        trips: 'GET /api/admin/trips',
        auditLogs: 'GET /api/admin/audit-logs',
        health: 'GET /api/admin/settings/health',
        upload: 'POST /api/admin/upload',
      },
    },
  });
});

// Mount API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/attractions', attractionRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
