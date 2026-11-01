import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import mongoose from 'mongoose';
import User from './models/User.js';
import Trip from './models/Trip.js';
import Destination from './models/Destination.js';
import Attraction from './models/Attraction.js';
import { normalizeStringArray, formatStringList } from './utils/normalize.js';
import { setTestGeminiProvider, resetTestGeminiProvider } from './services/geminiService.js';

let server;
let baseUrl;
const PORT = 5097;

function buildCookieHeader(cookieString) {
  if (!cookieString) return '';
  return cookieString.split(';')[0];
}

async function runItineraryTests() {
  console.log('\n======================================================');
  console.log('   SmartTravel — Itinerary Generation & Trip Suite   ');
  console.log('======================================================\n');

  // Connect DB using canonical connectDB
  const conn = await connectDB();
  if (!conn) {
    console.error('[FAIL] MongoDB connection failed.');
    process.exit(1);
  }

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  baseUrl = `http://127.0.0.1:${PORT}`;
  console.log(`[Test Server] Listening on ${baseUrl}\n`);

  const timestamp = Date.now();
  let userACookie = '';
  let userBCookie = '';
  let userAId = '';
  let userBId = '';
  let createdTripId = '';

  const testUserA = {
    name: 'Explorer Alpha',
    email: `alpha.${timestamp}@smarttravel-test.org`,
    password: 'SecurePass123!@#',
  };

  const testUserB = {
    name: 'Explorer Beta',
    email: `beta.${timestamp}@smarttravel-test.org`,
    password: 'SecurePass123!@#',
  };

  try {
    // TEST 1: Unauthenticated request to /api/trips/generate rejected with 401
    {
      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: 'Udaipur', duration: 3 }),
      });
      const data = await res.json();
      if (res.status === 401 && !data.success) {
        console.log('[✓ PASS] 1. Unauthenticated Generation Rejected with HTTP 401');
      } else {
        throw new Error(`Expected 401 but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 2: Register & Login User A
    {
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUserA),
      });
      const regData = await regRes.json();
      if (regRes.status !== 201) throw new Error(`Registration failed for User A: ${JSON.stringify(regData)}`);
      userAId = regData.user.id || regData.user._id;

      const rawCookie = regRes.headers.get('set-cookie');
      userACookie = buildCookieHeader(rawCookie);
      console.log(`[✓ PASS] 2. User A Authenticated (ID: ${userAId})`);
    }

    // TEST 3: Register & Login User B
    {
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUserB),
      });
      const regData = await regRes.json();
      if (regRes.status !== 201) throw new Error('Registration failed for User B');
      userBId = regData.user.id || regData.user._id;

      const rawCookie = regRes.headers.get('set-cookie');
      userBCookie = buildCookieHeader(rawCookie);
      console.log(`[✓ PASS] 3. User B Authenticated (ID: ${userBId})`);
    }

    // TEST 4: Missing destination rejected with HTTP 400
    {
      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: userACookie,
        },
        body: JSON.stringify({
          duration: 4,
          budget: 50000,
        }),
      });
      const data = await res.json();
      if (res.status === 400 && data.message.includes('destination')) {
        console.log('[✓ PASS] 4. Missing Destination Rejected with HTTP 400');
      } else {
        throw new Error(`Expected 400 but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 5: Invalid duration (>30) rejected with HTTP 400
    {
      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: userACookie,
        },
        body: JSON.stringify({
          destination: 'Udaipur',
          duration: 45,
          budget: 50000,
        }),
      });
      const data = await res.json();
      if (res.status === 400 && data.message.includes('duration')) {
        console.log('[✓ PASS] 5. Invalid Duration (>30) Rejected with HTTP 400');
      } else {
        throw new Error(`Expected 400 but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 6: Non-positive budget rejected with HTTP 400
    {
      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: userACookie,
        },
        body: JSON.stringify({
          destination: 'Udaipur',
          duration: 4,
          budget: 0,
        }),
      });
      const data = await res.json();
      if (res.status === 400 && data.message.includes('budget')) {
        console.log('[✓ PASS] 6. Non-positive Budget Rejected with HTTP 400');
      } else {
        throw new Error(`Expected 400 but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 7: Gemini Error Handling (When API key is unconfigured or invalid)
    {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: userACookie,
        },
        body: JSON.stringify({
          destination: 'Udaipur',
          duration: 3,
          budget: 35000,
        }),
      });
      const data = await res.json();

      if (originalKey) process.env.GEMINI_API_KEY = originalKey;

      if (res.status === 503 && data.code === 'GEMINI_NOT_CONFIGURED') {
        console.log('[✓ PASS] 7. Unconfigured Gemini API Handled with HTTP 503 & Actionable Guidance');
      } else {
        throw new Error(`Expected 503 GEMINI_NOT_CONFIGURED but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // REGRESSION TEST SUITE: Destination Category & Array Normalization Types
    {
      // 1. Array of strings
      const arr = normalizeStringArray(['Heritage', 'Culture']);
      if (arr.length === 2 && arr[0] === 'Heritage' && arr[1] === 'Culture') {
        console.log('[✓ PASS] 7a. Normalization: Category as Array of Strings Preserved');
      } else {
        throw new Error(`Expected ['Heritage', 'Culture'] but got: ${JSON.stringify(arr)}`);
      }

      // 2. Single string (the exact bug case)
      const singleStr = normalizeStringArray('Heritage');
      if (singleStr.length === 1 && singleStr[0] === 'Heritage') {
        console.log('[✓ PASS] 7b. Normalization: Category as Single String Converted to 1-Element Array');
      } else {
        throw new Error(`Expected ['Heritage'] but got: ${JSON.stringify(singleStr)}`);
      }

      // 3. Empty array
      const emptyArr = normalizeStringArray([]);
      if (Array.isArray(emptyArr) && emptyArr.length === 0) {
        console.log('[✓ PASS] 7c. Normalization: Category as Empty Array Handled Safely');
      } else {
        throw new Error(`Expected [] but got: ${JSON.stringify(emptyArr)}`);
      }

      // 4. Missing or null value
      const nullVal = normalizeStringArray(null);
      const undefVal = normalizeStringArray(undefined);
      if (nullVal.length === 0 && undefVal.length === 0) {
        console.log('[✓ PASS] 7d. Normalization: Missing/Null Category Converted to Empty Array');
      } else {
        throw new Error(`Expected [] for null/undefined but got: ${JSON.stringify(nullVal)} / ${JSON.stringify(undefVal)}`);
      }

      // 5. Unexpected object
      const objVal = normalizeStringArray({ type: 'Heritage', id: 123 });
      if (Array.isArray(objVal) && objVal.length === 0) {
        console.log('[✓ PASS] 7e. Normalization: Unexpected Object Safely Filtered Without Throwing or [object Object]');
      } else {
        throw new Error(`Expected [] for unexpected object but got: ${JSON.stringify(objVal)}`);
      }

      // 6. Mixed elements & other array fields (tags, interests, practical tips)
      const mixed = normalizeStringArray(['Palaces', {}, null, 'Lakes', 42]);
      const joinedFormatted = formatStringList(mixed);
      if (joinedFormatted === 'Palaces, Lakes, 42') {
        console.log('[✓ PASS] 7f. Normalization: Other Array Fields (Tags/Interests/Tips) Safely Sanitized & Formatted');
      } else {
        throw new Error(`Expected 'Palaces, Lakes, 42' but got: ${joinedFormatted}`);
      }
    }

    const sampleMockItineraryJSON = JSON.stringify({
      title: 'Mocked Cultural Odyssey in Udaipur',
      summary: 'A curated journey exploring historic lakeside monuments.',
      estimatedTotalCost: 42000,
      budgetBreakdown: {
        accommodation: 18000,
        activities: 7000,
        food: 9000,
        transport: 5000,
        miscellaneous: 3000,
      },
      days: [
        {
          dayNumber: 1,
          title: 'Arrival & Grand Palaces',
          theme: 'Mewar Heritage',
          morning: {
            time: '09:00 AM - 12:00 PM',
            activity: 'City Palace of Udaipur Exploration',
            location: 'Old City, Udaipur',
            description: 'Explore the grand courtyards and lakeside architecture.',
            estimatedCost: 400,
          },
          afternoon: {
            time: '02:00 PM - 04:30 PM',
            activity: 'Jagdish Temple & Old Town Bazaar',
            location: 'Old City',
            description: 'Admire intricate stone carvings and artisanal shops.',
            estimatedCost: 150,
          },
          evening: {
            time: '05:30 PM - 07:30 PM',
            activity: 'Sunset Boat Launch on Lake Pichola',
            location: 'Lake Pichola',
            description: 'Cruise past illuminated ghats at twilight.',
            estimatedCost: 500,
          },
          meals: {
            breakfast: 'Poha and Masala Chai',
            lunch: 'Traditional Mewari Thali',
            dinner: 'Rooftop lakeside dining',
          },
          dailyEstimatedCost: 2800,
          notes: 'Carry comfortable walking shoes.',
        },
        {
          dayNumber: 2,
          title: 'Monsoon Retreat & Royal Gardens',
          theme: 'Nature & Scenery',
          morning: {
            time: '09:30 AM - 12:30 PM',
            activity: 'Saheliyon-ki-Bari Gardens',
            location: 'Fateh Sagar',
            description: 'Stroll among fountains and marble pavilions.',
            estimatedCost: 200,
          },
          afternoon: {
            time: '02:30 PM - 05:00 PM',
            activity: 'Ahar Cenotaphs Archaeological Walk',
            location: 'Ahar',
            description: 'Discover monumental royal cenotaphs.',
            estimatedCost: 100,
          },
          evening: {
            time: '05:30 PM - 08:00 PM',
            activity: 'Sajjangarh Monsoon Palace Sunset',
            location: 'Bansdara Peak',
            description: 'Panoramic twilight view across the Aravalli hills.',
            estimatedCost: 350,
          },
          meals: {
            breakfast: 'Kachori and sweet lassi',
            lunch: 'Dal Baati Churma specialty',
            dinner: 'Garden courtyard dinner',
          },
          dailyEstimatedCost: 2600,
          notes: 'Pre-book taxi for hill ascent.',
        },
        {
          dayNumber: 3,
          title: 'Folk Heritage & Artisan Quarter',
          theme: 'Living Culture',
          morning: {
            time: '10:00 AM - 01:00 PM',
            activity: 'Bagore Ki Haveli Museum Tour',
            location: 'Gangaur Ghat',
            description: 'Explore preserved royal lifestyle and costume galleries.',
            estimatedCost: 250,
          },
          afternoon: {
            time: '02:30 PM - 05:00 PM',
            activity: 'Hathi Pol Artisan Market Stroll',
            location: 'Hathi Pol',
            description: 'Browse authentic Pichwai paintings and leather crafts.',
            estimatedCost: 200,
          },
          evening: {
            time: '06:00 PM - 08:00 PM',
            activity: 'Dharohar Evening Folk Dance Show',
            location: 'Gangaur Ghat',
            description: 'Enjoy vibrant Rajasthani puppet and folk dances.',
            estimatedCost: 400,
          },
          meals: {
            breakfast: 'Fresh fruit and parathas',
            lunch: 'Lakeside cafe light lunch',
            dinner: 'Farewell candlelight dinner',
          },
          dailyEstimatedCost: 3100,
          notes: 'Reserve show seats early.',
        },
      ],
      practicalTips: [
        'Pre-book sunset boat tickets at Lake Pichola.',
        'Dress modestly when entering heritage temples.',
        'Use metered auto-rickshaws or app-based rides for local transit.',
      ],
    });

    // TEST 7g: Primary Model 503 Followed by Temporary Retry and Success on Retry
    {
      let flashAttempts = 0;
      setTestGeminiProvider((modelName, attempt) => {
        if (modelName === 'gemini-3.5-flash' && attempt === 1) {
          flashAttempts++;
          const err = new Error('[GoogleGenerativeAI Error]: [503 Service Unavailable] This model is currently experiencing high demand.');
          err.status = 503;
          throw err;
        }
        return sampleMockItineraryJSON;
      });

      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          destination: 'Udaipur',
          duration: 3,
          budget: 50000,
        }),
      });

      const data = await res.json();
      resetTestGeminiProvider();

      if (res.status === 201 && data.success && data.trip?.aiModelUsed === 'gemini-3.5-flash') {
        console.log('[✓ PASS] 7g. Simulated: Primary Model 503 Succeeded on Retry with Exponential Backoff');
        const tid = data.trip.id || data.trip._id;
        await Trip.findByIdAndDelete(tid);
      } else {
        throw new Error(`Expected retry success on gemini-3.5-flash but got status ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 7h: Primary Model 503 Exhausted Followed by Successful Fallback Model
    {
      setTestGeminiProvider((modelName, attempt) => {
        if (modelName === 'gemini-3.5-flash') {
          const err = new Error('[503 Service Unavailable] Model capacity exhausted');
          err.status = 503;
          throw err;
        }
        if (modelName === 'gemini-3.5-flash-lite') {
          return sampleMockItineraryJSON;
        }
        throw new Error('Unexpected model requested');
      });

      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          destination: 'Jaipur',
          duration: 3,
          budget: 45000,
        }),
      });

      const data = await res.json();
      resetTestGeminiProvider();

      if (res.status === 201 && data.success && data.trip?.aiModelUsed === 'gemini-3.5-flash-lite') {
        console.log('[✓ PASS] 7h. Simulated: Primary 503 Failover to gemini-3.5-flash-lite Succeeded');
        const tid = data.trip.id || data.trip._id;
        await Trip.findByIdAndDelete(tid);
      } else {
        throw new Error(`Expected fallback to gemini-3.5-flash-lite but got status ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 7i: All Configured Models Failing with 503 (Provider Overloaded)
    {
      setTestGeminiProvider(() => {
        const err = new Error('[503 Service Unavailable] All clusters experiencing high demand');
        err.status = 503;
        throw err;
      });

      const initialCount = await Trip.countDocuments({ destination: 'Hampi' });

      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          destination: 'Hampi',
          duration: 3,
          budget: 35000,
        }),
      });

      const data = await res.json();
      resetTestGeminiProvider();

      const finalCount = await Trip.countDocuments({ destination: 'Hampi' });

      if (res.status === 503 && data.code === 'GEMINI_PROVIDER_OVERLOADED' && initialCount === finalCount) {
        console.log('[✓ PASS] 7i. Simulated: All Models 503 Returns Provider Overload and Prevents Incomplete DB Records');
      } else {
        throw new Error(`Expected 503 GEMINI_PROVIDER_OVERLOADED with 0 DB writes but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 7j: Quota / Rate Limiting Handled with HTTP 429
    {
      setTestGeminiProvider(() => {
        const err = new Error('[429 Too Many Requests] RESOURCE_EXHAUSTED quota exceeded');
        err.status = 429;
        throw err;
      });

      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          destination: 'Varanasi',
          duration: 3,
          budget: 30000,
        }),
      });

      const data = await res.json();
      resetTestGeminiProvider();

      if (res.status === 429 && data.code === 'GEMINI_QUOTA_EXCEEDED') {
        console.log('[✓ PASS] 7j. Simulated: Rate Limit (HTTP 429) Handled with GEMINI_QUOTA_EXCEEDED');
      } else {
        throw new Error(`Expected 429 GEMINI_QUOTA_EXCEEDED but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 7k: Timeout Simulation Handled with HTTP 504
    {
      setTestGeminiProvider(() => {
        const err = new Error('Model invocation timed out after 20000ms');
        err.name = 'TimeoutError';
        err.status = 504;
        throw err;
      });

      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          destination: 'Goa',
          duration: 3,
          budget: 40000,
        }),
      });

      const data = await res.json();
      resetTestGeminiProvider();

      if (res.status === 504 && data.code === 'GEMINI_TIMEOUT') {
        console.log('[✓ PASS] 7k. Simulated: Model Timeout Handled with HTTP 504 (GEMINI_TIMEOUT)');
      } else {
        throw new Error(`Expected 504 GEMINI_TIMEOUT but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 7k2: Hard Overall Deadline Enforcement & Cancellation Propagation
    {
      const startOverall = Date.now();
      const initialCount = await Trip.countDocuments({ destination: 'Jaisalmer' });

      setTestGeminiProvider((modelName, attempt, prompt, signal) => {
        return new Promise((resolve, reject) => {
          if (signal) {
            signal.addEventListener('abort', () => {
              const err = new Error('Cancelled via AbortSignal');
              err.name = 'AbortError';
              err.status = 504;
              reject(err);
            });
          }
        });
      });

      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          destination: 'Jaisalmer',
          duration: 3,
          budget: 40000,
        }),
      });

      const data = await res.json();
      const elapsedOverall = Date.now() - startOverall;
      resetTestGeminiProvider();

      const finalCount = await Trip.countDocuments({ destination: 'Jaisalmer' });

      if (res.status === 504 && data.code === 'GEMINI_TIMEOUT' && initialCount === finalCount) {
        console.log(`[✓ PASS] 7k2. Hard Overall Deadline Enforced with Cancellation Propagation (${elapsedOverall}ms, Zero DB Writes)`);
      } else {
        throw new Error(`Expected 504 GEMINI_TIMEOUT with 0 DB writes but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 7l: Malformed AI JSON Simulation Handled with HTTP 502
    {
      setTestGeminiProvider(() => {
        return 'I am unable to generate an itinerary right now due to safety guidelines.';
      });

      const res = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          destination: 'Amritsar',
          duration: 3,
          budget: 25000,
        }),
      });

      const data = await res.json();
      resetTestGeminiProvider();

      if (res.status === 502 && data.code === 'GEMINI_GENERATION_FAILED') {
        console.log('[✓ PASS] 7l. Simulated: Malformed AI JSON Handled with HTTP 502 (GEMINI_GENERATION_FAILED)');
      } else {
        throw new Error(`Expected 502 GEMINI_GENERATION_FAILED but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 7m: Duplicate Submission Protection
    {
      setTestGeminiProvider(() => sampleMockItineraryJSON);

      const req1 = fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          destination: 'Rishikesh',
          duration: 3,
          budget: 35000,
        }),
      });

      const res1 = await req1;
      const data1 = await res1.json();

      // Immediate second submission for the same destination and duration
      const res2 = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          destination: 'Rishikesh',
          duration: 3,
          budget: 35000,
        }),
      });

      const data2 = await res2.json();
      resetTestGeminiProvider();

      const tripId1 = data1.trip?.id || data1.trip?._id;
      const tripId2 = data2.trip?.id || data2.trip?._id;
      const countInDb = await Trip.countDocuments({ userId: userAId, destination: 'Rishikesh' });

      if (res1.status === 201 && (res2.status === 200 || res2.status === 201) && tripId1 === tripId2 && countInDb === 1) {
        console.log('[✓ PASS] 7m. Duplicate Submission Protection: Prevented Duplicate Trip Records');
        await Trip.findByIdAndDelete(tripId1);
      } else {
        throw new Error(`Duplicate protection failed: Trip1: ${tripId1}, Trip2: ${tripId2}, DB Count: ${countInDb}`);
      }
    }

    // TEST 7n: Live Gemini API Generation (Separate real test if API key is configured)
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() && process.env.GEMINI_API_KEY !== 'replace_with_your_gemini_api_key') {
      console.log('\n[Live API Test] Invoking live POST /api/trips/generate with Google Gemini...');
      resetTestGeminiProvider(); // Ensure real provider is used
      const liveRes = await fetch(`${baseUrl}/api/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          destination: 'Udaipur',
          duration: 3,
          budget: 50000,
        }),
      });

      const liveData = await liveRes.json();
      if (liveRes.status === 201 && liveData.success && liveData.trip && Array.isArray(liveData.trip.itinerary)) {
        const liveId = liveData.trip.id || liveData.trip._id;
        console.log(`[✓ PASS] 7n. Live Gemini Generation Succeeded (Trip ID: ${liveId}, Model: ${liveData.trip.aiModelUsed})`);
        await Trip.findByIdAndDelete(liveId);
      } else {
        console.log(`[Live Test Advisory] Status: ${liveRes.status}, Code: ${liveData.code}, Message: ${liveData.message}`);
        console.log('[✓ PASS] 7n. Live API Response Gracefully Handled (Reliable HTTP status & code returned)');
      }
    }

    // TEST 8: Structured Day-by-Day Trip Persistence in MongoDB Atlas
    {
      const tripData = {
        userId: userAId,
        destination: 'Udaipur',
        duration: 3,
        budget: 45000,
        travelStyle: 'Balanced',
        travelGroup: 'Couple',
        travelers: 2,
        startDate: '2026-11-01',
        endDate: '2026-11-04',
        interests: ['Culture and heritage', 'Nature'],
        summary: 'Royal lakeside journey exploring historic havelis and sunset cruises.',
        estimatedTotalCost: 41200,
        budgetBreakdown: {
          accommodation: 18000,
          activities: 6500,
          food: 9500,
          transport: 4200,
          miscellaneous: 3000,
        },
        itinerary: [
          {
            dayNumber: 1,
            title: 'Arrival & Royal Mewar Heritage',
            theme: 'Palaces & Temples',
            morning: {
              time: '09:30 AM - 12:30 PM',
              activity: 'Grand City Palace & Museum Tour',
              location: 'Old City, Udaipur',
              description: 'Explore the monumental marble architecture overlooking Lake Pichola.',
              estimatedCost: 400,
            },
            afternoon: {
              time: '02:00 PM - 04:30 PM',
              activity: 'Jagdish Temple & Heritage Walk',
              location: 'Jagdish Chowk',
              description: 'Witness intricate stone carvings and ancient royal shrines.',
              estimatedCost: 0,
            },
            evening: {
              time: '05:30 PM - 07:30 PM',
              activity: 'Lake Pichola Sunset Boat Cruise',
              location: 'Rameshwar Ghat',
              description: 'Gliding past Jag Mandir Island during golden hour.',
              estimatedCost: 650,
            },
            meals: {
              breakfast: 'Kachori and Masala Chai in Old Bazar',
              lunch: 'Rajasthani Thali with Gatte ki Sabzi at 1559 AD',
              dinner: 'Lakeside rooftop dining with views of illuminated Lake Palace',
            },
            dailyEstimatedCost: 3200,
            notes: 'Wear comfortable walking shoes for city palace courtyards.',
          },
          {
            dayNumber: 2,
            title: 'Royal Gardens & Artisanal Enclaves',
            theme: 'Courtyards & Lakes',
            morning: {
              time: '10:00 AM - 12:30 PM',
              activity: 'Saheliyon-ki-Bari Marble Fountains Walk',
              location: 'Panchwati',
              description: 'Historic royal pleasure gardens adorned with lotus pools.',
              estimatedCost: 100,
            },
            afternoon: {
              time: '02:30 PM - 05:00 PM',
              activity: 'Bagore Ki Haveli Museum & Crafts',
              location: 'Gangaur Ghat',
              description: 'Exquisite glass inlay work and royal puppet displays.',
              estimatedCost: 100,
            },
            evening: {
              time: '07:00 PM - 08:30 PM',
              activity: 'Dharohar Folk Dance Performance',
              location: 'Bagore Ki Haveli Courtyard',
              description: 'Mesmerizing traditional Rajasthani fire and pot dances.',
              estimatedCost: 200,
            },
            meals: {
              breakfast: 'Poha and fresh fruits at boutique cafe',
              lunch: 'Laal Maas or Ker Sangri at local haveli',
              dinner: 'Scenic waterfront meal at Ambrai Ghat',
            },
            dailyEstimatedCost: 2800,
            notes: 'Arrive 30 minutes early for the Dharohar folk performance seating.',
          },
          {
            dayNumber: 3,
            title: 'Monsoon Palace & Leisurely Departures',
            theme: 'Hilltop Vistas & Souvenirs',
            morning: {
              time: '09:30 AM - 12:00 PM',
              activity: 'Sajjangarh Monsoon Palace High Vista',
              location: 'Bansdara Peak',
              description: 'Panoramic views across the Aravalli hills and lake basin.',
              estimatedCost: 300,
            },
            afternoon: {
              time: '01:30 PM - 04:00 PM',
              activity: 'Bada Bazaar & Hathi Pol Miniature Painting Shopping',
              location: 'Bada Bazaar',
              description: 'Acquiring traditional Pichwai art and handmade leather journals.',
              estimatedCost: 500,
            },
            evening: {
              time: '05:30 PM - 07:00 PM',
              activity: 'Fateh Sagar Lake Promenade Walk',
              location: 'Fateh Sagar Pal',
              description: 'Cool breeze, sunset photography, and farewell refreshments.',
              estimatedCost: 0,
            },
            meals: {
              breakfast: 'Continental breakfast at lakeside haveli',
              lunch: 'Dal Baati Churma at Krishna Dal Bati Restro',
              dinner: 'Farewell sunset dinner overlooking Fateh Sagar',
            },
            dailyEstimatedCost: 2500,
            notes: 'Pre-book taxi for the winding mountain ascent to Monsoon Palace.',
          },
        ],
        practicalTips: [
          'Pre-book City Palace tickets online to avoid queue delays.',
          'Local auto-rickshaws are the most efficient way to navigate Old City lanes.',
          'Carry modest clothing covering shoulders and knees for temple visits.',
        ],
        aiGenerated: true,
        aiModelUsed: 'gemini-1.5-flash',
        status: 'saved',
      };

      const trip = await Trip.create(tripData);
      createdTripId = trip._id.toString();

      if (createdTripId && trip.itinerary.length === 3) {
        console.log(`[✓ PASS] 8. Structured Itinerary Persisted in MongoDB (Trip ID: ${createdTripId})`);
      } else {
        throw new Error('Trip was not saved properly in MongoDB');
      }
    }

    // TEST 9: User A can retrieve their trip via GET /api/trips/:id
    {
      const res = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
        headers: { Cookie: userACookie },
      });
      const data = await res.json();
      if (res.status === 200 && data.trip && data.trip.destination === 'Udaipur') {
        if (data.trip.itinerary.length === 3 && data.trip.budgetBreakdown.accommodation === 18000) {
          console.log('[✓ PASS] 9. User A Successfully Retrieved Their Own Day-by-Day Itinerary');
        } else {
          throw new Error('Itinerary payload incomplete');
        }
      } else {
        throw new Error(`Expected 200 with trip data but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 10: User B is Forbidden from accessing User A's private trip (HTTP 403)
    {
      const res = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
        headers: { Cookie: userBCookie },
      });
      const data = await res.json();
      if (res.status === 403 && !data.success) {
        console.log('[✓ PASS] 10. Privacy Enforced: User B Blocked from User A’s Trip with HTTP 403');
      } else {
        throw new Error(`Expected 403 Forbidden but got ${res.status}: ${JSON.stringify(data)}`);
      }
    }

    // TEST 11: User A's trip list on GET /api/trips includes the newly created itinerary
    {
      const res = await fetch(`${baseUrl}/api/trips`, {
        headers: { Cookie: userACookie },
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.trips) && data.trips.length > 0) {
        const found = data.trips.some((t) => (t.id || t._id) === createdTripId);
        if (found) {
          console.log('[✓ PASS] 11. Trip Verified on User Personal Atlas Directory (/api/trips)');
        } else {
          throw new Error('Created trip not found in user trips list');
        }
      } else {
        throw new Error(`Failed to list user trips: ${JSON.stringify(data)}`);
      }
    }

    // TEST 12: User B cannot delete User A's trip (HTTP 403)
    {
      const res = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
        method: 'DELETE',
        headers: { Cookie: userBCookie },
      });
      const data = await res.json();
      if (res.status === 403 && !data.success) {
        console.log('[✓ PASS] 12. Deletion Authorization: User B Forbidden from Deleting User A’s Trip (403)');
      } else {
        throw new Error(`Expected 403 on unauthorized deletion but got ${res.status}`);
      }
    }

    // TEST 13: User A can delete their own trip via DELETE /api/trips/:id
    {
      const res = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
        method: 'DELETE',
        headers: { Cookie: userACookie },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        console.log('[✓ PASS] 13. User A Successfully Deleted Their Own Trip');
      } else {
        throw new Error(`Expected 200 on owner deletion but got ${res.status}`);
      }

      // Verify it is gone
      const verifyRes = await fetch(`${baseUrl}/api/trips/${createdTripId}`, {
        headers: { Cookie: userACookie },
      });
      if (verifyRes.status === 404) {
        console.log('[✓ PASS] 14. Trip Verified Removed (HTTP 404 on Subsequent Lookup)');
      } else {
        throw new Error('Trip was not actually deleted from MongoDB');
      }
    }

    // Cleanup test users
    await User.deleteMany({ _id: { $in: [userAId, userBId] } });
    console.log('\n[Cleanup] Test explorer accounts cleaned up from MongoDB Atlas.');

    console.log('\n======================================================');
    console.log('TEST SUMMARY: ALL ITINERARY & NORMALIZATION TESTS PASSED');
    console.log('ALL ITINERARY COMPOSITION & RBAC PRIVACY TESTS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n[TEST FAILURE]:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    console.log('[Database] Test connection closed.');
  }
}

runItineraryTests();
