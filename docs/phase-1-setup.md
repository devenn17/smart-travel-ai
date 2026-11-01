# SmartTravel — Phase 1 Architecture & Setup Guide
**"The Art of Going Further" — Intelligent Travel Experience (2026 Edition)**

---

## 1. Project Overview & Phase 1 Scope

SmartTravel is an intelligent travel companion designed to help travelers discover extraordinary Indian destinations and craft thoughtful, budget-aligned journeys.

### What is Included in Phase 1
- **Design System**: Warm Ivory (`#F7F5F0`), Deep Forest (`#183D35`), Midnight Ink (`#101A24`), Burnished Gold (`#C49A62`), and Muted Sage (`#A8B8A6`) palette with editorial serif typography (`DM Serif Display`) and clean interface sans (`Plus Jakarta Sans`).
- **Showpiece Home Page (`/`)**:
  - Immersive cinematic landscape hero with expressive typography.
  - Interactive Trip Concierge search panel transferring data to `/plan-trip`.
  - Editorial Destination Showcase with varied card layouts (featuring Udaipur as dominant feature).
  - "A better way to travel" feature section and "How SmartTravel works" 3-step progression.
  - Closing CTA and brand footer.
- **Explore Page (`/explore`)**:
  - Case-insensitive search across destinations, regions, descriptions, and tags.
  - Category filters: Beach, Heritage, Mountains, Nature, Adventure, Spiritual, All.
  - Synchronized query parameters (`?search=...&category=...`).
  - Empty state with reset filters action.
- **Plan Your Trip Page (`/plan-trip`)**:
  - Structured preference intake (Destination, Start/End dates with calculated duration, Traveler count & group, INR Budget, Multi-select interests, Travel style).
  - Comprehensive inline validation (start date >= today, end date >= start date, travelers >= 1, budget > 0, at least 1 interest).
  - Phase 1 validation milestone card summarizing preferences.
  - Form prefilling from home concierge.
- **My Trips (`/my-trips`)**:
  - Editorial empty state explaining future persistent trip storage.
  - "Plan a New Journey" CTA.
- **Authentication Screens (`/login`, `/register`)**:
  - Split editorial layout with destination imagery.
  - Form validation with clear Phase 1 UI-only notices (no stored plain passwords, no false auth claims).
- **Backend Foundation (Express & Node.js)**:
  - ES Modules (`"type": "module"`).
  - Centralized error handling & 404 handler.
  - Helmet security headers, CORS protection, Morgan logging in development.
  - `/api/health` and `/api/health/db` endpoints reporting actual Mongoose connection state.
- **Environment & Scripts**:
  - Single command startup (`npm run dev`) launching both backend and frontend concurrently.
  - `.env.example` and `.gitignore` configured.

---

## 2. Prerequisites & Environment Setup

Ensure you have **Node.js** (v18+ or v20+, verified on v22) installed.

### Environment Configuration
The root contains an `.env` file based on `.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/smart_travel_planner
VITE_API_URL=http://localhost:5000
```

> **Note on MongoDB in Phase 1**: The server connects gracefully to MongoDB if available at `MONGODB_URI`. If MongoDB is offline, the backend continues to serve all API and health routes without crashing, and `/api/health/db` accurately reports `disconnected` (HTTP 503). Phase 1 operates with local curated demonstration data.

---

## 3. Installation & Running Instructions

### Windows PowerShell Quickstart

From the workspace root directory (`smart-travel-planner`):

```powershell
# 1. Install all dependencies across root, client, and server
npm run install:all

# 2. Start both Frontend and Backend concurrently
npm run dev
```

### Individual Service Commands
If you prefer running the client and server in separate terminal windows:

**Terminal 1 (Backend Server):**
```powershell
npm run dev:server
# (or npm run server) -> Listening on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```powershell
npm run dev:client
# (or npm run client) -> Listening on http://localhost:5173
```

---

## 4. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Identifies SmartTravel backend API, phase, and status |
| `GET` | `/api/health` | Service health status, environment, and ISO timestamp |
| `GET` | `/api/health/db` | Reports real Mongoose readyState code (0: disconnected, 1: connected) |

---

## 5. Technical Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4 (`@tailwindcss/postcss`), React Router DOM v7, Axios, Lucide React.
- **Backend**: Node.js 22, Express 4, Mongoose 8, Helmet, CORS, Morgan, Dotenv.
- **Design Tokens**: Warm Ivory, Deep Forest, Midnight Ink, Burnished Gold, Muted Sage.
- **Typography**: DM Serif Display (Headings), Plus Jakarta Sans (Interface & Body).

---

## 6. Functional Boundaries & Future Phase 2 Roadmap

- **Phase 1 (Complete)**: Responsive design system, all 6 routes, working concierge transfer, interactive search & filters, validation engine, Express API & health monitors.
- **Phase 2 (Upcoming)**: MongoDB models, user registration/login with JWT & bcrypt, persistent saved itineraries, Google Gemini AI itinerary generation, budget optimizer, and live map integrations.
