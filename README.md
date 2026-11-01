# SmartTravel — Intelligent Travel Planner (2026 Edition)

> **"The Atlas of Elsewhere — The Art of Going Further"**  
> A premium intelligent travel companion that helps people discover extraordinary Indian destinations, save journeys, and experience personalized travel.

---

## Architecture & Milestones Overview

### Phase 1 — Foundation & Editorial Design System (Complete)
- **Editorial Luxury Brand Identity**: Warm Ivory, Deep Forest, Burnished Gold, Midnight Ink, and Muted Sage.
- **Display Typography**: Editorial serif (`DM Serif Display`) paired with clean interface typography (`Plus Jakarta Sans`).
- **Showcase Home (`/`)**: Parallax destination showcase featuring Udaipur, Kerala, Manali, Jaipur, Goa, and Rishikesh.
- **Cartographic Discovery (`/explore`)**: Case-insensitive search, 6 category filters, and responsive grid.
- **Trip Planning Workspace (`/plan-trip`)**: Multi-step itinerary intake engine.
- **Backend Infrastructure**: Express server, Helmet, CORS, and health endpoints (`/api/health`, `/api/health/db`).

### Phase 2 — MongoDB Integration, Secure Authentication & Protected Routes (Complete)
- **MongoDB Integration (`server/config/db.js`)**:
  - Connection handling with connection event listeners (`connected`, `error`, `disconnected`).
  - Safe credential masking (no passwords or secrets printed to logs).
  - Truthful database health check at `GET /api/health/db`.
  - Fail-safe operation: when database is offline, server responds with informative HTTP 503 instead of crashing.
- **Mongoose User Model (`server/models/User.js`)**:
  - `name`, `email` (normalized, unique, trimmed, validated), `passwordHash` (`select: false`).
  - Methods: `comparePassword(candidatePassword)` via bcrypt, `toSafeObject()` stripping sensitive fields.
  - Custom `toJSON` transform automatically stripping `passwordHash` and `__v`.
- **Mongoose Trip Model (`server/models/Trip.js`)**:
  - User-scoped persistence model (`userId` reference to `User`).
  - Every query and creation is strictly restricted to the authenticated user ID (`req.user._id`).
- **Cryptographic Password Hashing**:
  - Handled via `bcryptjs` with salt work factor of 12. Plaintext passwords are never stored or returned.
- **JWT Authentication & Session Management**:
  - Issued upon registration and login with configurable expiry (`JWT_EXPIRES_IN=7d`).
  - **HttpOnly Cookie Strategy**: Default browser session cookie with `httpOnly: true`, `sameSite: 'lax'`, `secure` in production.
  - **Bearer Token Support**: Flexible fallback for API clients and automated tests (`Authorization: Bearer <token>`).
- **Route & Endpoint Protection**:
  - Backend `protect` middleware (`server/middleware/authMiddleware.js`) validates tokens and populates `req.user`.
  - Frontend `ProtectedRoute` component (`client/src/components/ProtectedRoute.jsx`) intercepts unauthenticated access to `/my-trips` and redirects to `/login` preserving target location.
- **Rate Limiting**:
  - Express rate limiter applied to `/api/auth/register` and `/api/auth/login` (30 requests per 15 minutes per IP).
- **Persistent Auth State (`client/src/context/AuthContext.jsx`)**:
  - Verifies session on mount via `GET /api/auth/me`.
  - Updates navigation and UI reactively upon login and logout.

---

## Environment Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

### Environment Variables Reference

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `CLIENT_URL` | Frontend origin for CORS credential allowance | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas or local MongoDB connection URI | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/smart_travel_planner` |
| `JWT_SECRET` | Cryptographic secret for signing JWTs (32+ chars) | `smart_travel_jwt_secret_dev_key_2026_phase2_atlas` |
| `JWT_EXPIRES_IN`| Token expiration timeframe | `7d` |
| `COOKIE_SECRET` | Cookie signing secret | `smart_travel_cookie_secret_dev_key_2026` |
| `VITE_API_URL` | Base API URL consumed by Vite frontend | `http://localhost:5000` |

---

## MongoDB Setup Guide

### Option A: MongoDB Atlas (Recommended for Cloud / Team Deployment)

1. Sign up for a free MongoDB Atlas account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free **M0 Sandbox** cluster.
3. Under **Database Access**, create a database user with read/write privileges (note username and password).
4. Under **Network Access**, add IP Address `0.0.0.0/0` (allow access from anywhere) or your current IP.
5. In your cluster dashboard, click **Connect** -> **Drivers** -> Copy the connection string.
6. Replace `<username>` and `<password>` with your database user credentials.
7. Paste this URI into your `.env` file under `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://admin:YourSecurePassword@cluster0.abcde.mongodb.net/smart_travel_planner?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB (Community Server)

1. Download and install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community).
2. Start the MongoDB service:
   - **Windows:** Run `net start MongoDB` or verify the service in `services.msc`.
   - **Linux / Mac:** Run `sudo systemctl start mongod` or `brew services start mongodb-community`.
3. Set your `.env` to:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/smart_travel_planner
   ```

---

## Quickstart Commands

### 1. Install All Dependencies
```bash
npm run install:all
```

### 2. Run Both Frontend and Backend Concurrently
```bash
npm run dev
```

### 3. Run Backend or Frontend Individually
```bash
# Run backend only (port 5000)
npm run dev:server

# Run frontend only (port 5173)
npm run dev:client
```

### 4. Build Frontend for Production
```bash
npm run build:client
```

---

## API Endpoints Reference

### Health & Diagnostics
- `GET /` — API service identity & available routes.
- `GET /api/health` — API service status & uptime timestamp.
- `GET /api/health/db` — Truthful database connection monitor (returns 200 when connected, 503 when disconnected).

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account (`{ name, email, password }`). Returns safe user object & sets HttpOnly cookie.
- `POST /api/auth/login` — Sign in with credentials (`{ email, password }`). Returns safe user object & sets HttpOnly cookie.
- `GET /api/auth/me` — **[Protected]** Retrieves currently authenticated user profile.
- `POST /api/auth/logout` — Terminates session & clears the HttpOnly authentication cookie.

### Personal Expeditions (`/api/trips`)
- `GET /api/trips` — **[Protected]** Retrieves trips scoped strictly to the authenticated user ID.
- `POST /api/trips` — **[Protected]** Creates a new trip dossier scoped to the authenticated user ID.

---

## Verification & Testing

Run the included security & cryptographic unit tests:
```bash
node server/test_unit.js
```

Verify backend health endpoints:
```bash
# General health
curl http://localhost:5000/api/health

# Database health
curl http://localhost:5000/api/health/db
```

---

## Troubleshooting

1. **`MongoDB database is currently disconnected` (HTTP 503)**:
   - Ensure local MongoDB service is started, or verify MongoDB Atlas credentials and IP access in `.env`.
   - The app runs gracefully without crashing and clearly indicates database status on `/api/health/db`.
2. **`CORS error on login or register`**:
   - Ensure `CLIENT_URL` in `.env` matches the port your Vite server is running on (default `http://localhost:5173`).
3. **Session cookie not stored in browser**:
   - Ensure `withCredentials: true` is enabled in Axios (already configured in `client/src/services/api.js`).
