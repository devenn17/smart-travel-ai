import mongoose from 'mongoose';
import User from './models/User.js';
import Trip from './models/Trip.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import app from './app.js';
import connectDB, { sanitizeMongoUri } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runLiveE2ETests() {
  console.log('=====================================================');
  console.log('   SMARTTRAVEL PHASE 2 LIVE ACCEPTANCE TEST SUITE    ');
  console.log('=====================================================\n');

  // Establish connection for direct model inspection within test runner
  await connectDB();

  let serverInstance = null;
  let BASE_URL = 'http://localhost:5000';

  try {
    const probe = await fetch(`${BASE_URL}/api/health`);
    if (probe.status !== 200) throw new Error('Port 5000 not responding');
  } catch {
    serverInstance = http.createServer(app);
    await new Promise((resolve) => serverInstance.listen(0, resolve));
    const port = serverInstance.address().port;
    BASE_URL = `http://127.0.0.1:${port}`;
    console.log(`[Test Server] Launched internal test server at ${BASE_URL}\n`);
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName} ${details ? '— ' + details : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? '— ' + details : ''}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const userAEmail = `explorer.alpha.${timestamp}@smarttravel-test.org`;
  const userAPassword = 'SecureAlphaPassword2026!';
  const userAName = 'Arjun Mehta';

  const userBEmail = `explorer.beta.${timestamp}@smarttravel-test.org`;
  const userBPassword = 'SecureBetaPassword2026!';
  const userBName = 'Priya Nair';

  let userAToken = '';
  let userACookie = '';
  let userBToken = '';
  let userBCookie = '';
  let userATripId = '';

  try {
    // ----------------------------------------------------
    // TEST 1: Database Health Status Endpoint
    // ----------------------------------------------------
    const dbHealthRes = await fetch(`${BASE_URL}/api/health/db`);
    const dbHealthData = await dbHealthRes.json();
    assert(
      dbHealthRes.status === 200 && dbHealthData.success === true && dbHealthData.database.connected === true,
      '1. Database Health Check (/api/health/db)',
      `HTTP ${dbHealthRes.status}, connected: ${dbHealthData.database.connected}`
    );

    // ----------------------------------------------------
    // TEST 2: Registration - User A
    // ----------------------------------------------------
    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userAName,
        email: userAEmail,
        password: userAPassword,
      }),
    });
    const regDataA = await regResA.json();
    userAToken = regDataA.token;
    const cookieHeaderA = regResA.headers.get('set-cookie') || '';
    userACookie = cookieHeaderA.split(';')[0];

    assert(
      regResA.status === 201 && regDataA.success === true,
      '2. Registration of User A',
      `HTTP ${regResA.status}, user: ${regDataA.user?.name}`
    );
    assert(
      regDataA.user && regDataA.user.passwordHash === undefined,
      '3. Safe User Serialization in Registration Response',
      'passwordHash omitted from API response'
    );
    assert(
      cookieHeaderA.includes('token=') && cookieHeaderA.includes('HttpOnly'),
      '4. HttpOnly Session Cookie Issued on Registration',
      'Cookie header contains HttpOnly'
    );

    // ----------------------------------------------------
    // TEST 3: Direct MongoDB Inspection of User A
    // ----------------------------------------------------
    const userDocInDb = await User.findOne({ email: userAEmail }).select('+passwordHash');
    assert(
      userDocInDb !== null,
      '5. MongoDB Document Persistence',
      `User record found in Atlas collection: ${userDocInDb?.email}`
    );
    assert(
      userDocInDb?.passwordHash &&
        userDocInDb.passwordHash.startsWith('$2') &&
        !userDocInDb.passwordHash.includes(userAPassword),
      '6. Bcrypt Password Hashing in MongoDB',
      'Password stored as bcrypt hash; plaintext password absent'
    );

    // ----------------------------------------------------
    // TEST 4: Duplicate Email Rejection (Exact and Case Variations)
    // ----------------------------------------------------
    const dupExactRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Attempt',
        email: userAEmail,
        password: 'anotherPassword123',
      }),
    });
    assert(
      dupExactRes.status === 400,
      '7. Duplicate Email Rejection (Exact match)',
      `HTTP ${dupExactRes.status}`
    );

    const dupCaseRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Case Variant Attempt',
        email: userAEmail.toUpperCase(),
        password: 'anotherPassword123',
      }),
    });
    assert(
      dupCaseRes.status === 400,
      '8. Duplicate Email Rejection (Case variation match)',
      `HTTP ${dupCaseRes.status} on uppercase variant`
    );

    // ----------------------------------------------------
    // TEST 5: Login - Valid Credentials
    // ----------------------------------------------------
    const loginValidRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userAEmail,
        password: userAPassword,
      }),
    });
    const loginValidData = await loginValidRes.json();
    assert(
      loginValidRes.status === 200 && loginValidData.success === true,
      '9. Successful Login with Valid Credentials',
      `HTTP ${loginValidRes.status}, user: ${loginValidData.user?.name}`
    );
    assert(
      loginValidData.user && loginValidData.user.passwordHash === undefined,
      '10. Safe User Serialization in Login Response',
      'passwordHash omitted from API response'
    );

    // ----------------------------------------------------
    // TEST 6: Login - Invalid Credentials & Unknown Email
    // ----------------------------------------------------
    const loginBadPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userAEmail,
        password: 'IncorrectPassword!',
      }),
    });
    const loginBadPassData = await loginBadPassRes.json();
    assert(
      loginBadPassRes.status === 401 && loginBadPassData.message === 'Invalid email or password.',
      '11. Login Rejection on Incorrect Password',
      `HTTP ${loginBadPassRes.status}: "${loginBadPassData.message}"`
    );

    const loginUnknownEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `nonexistent.${timestamp}@smarttravel-test.org`,
        password: 'SomePassword123!',
      }),
    });
    const loginUnknownData = await loginUnknownEmailRes.json();
    assert(
      loginUnknownEmailRes.status === 401 && loginUnknownData.message === 'Invalid email or password.',
      '12. Login Rejection on Unknown Email (Prevents Account Enumeration)',
      `HTTP ${loginUnknownEmailRes.status}: "${loginUnknownData.message}"`
    );

    // ----------------------------------------------------
    // TEST 7: Current User Endpoint (/api/auth/me)
    // ----------------------------------------------------
    const meUnauthRes = await fetch(`${BASE_URL}/api/auth/me`);
    assert(
      meUnauthRes.status === 401,
      '13. Unauthenticated /api/auth/me Rejection',
      `HTTP ${meUnauthRes.status}`
    );

    // Via Cookie
    const meCookieRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: userACookie },
    });
    const meCookieData = await meCookieRes.json();
    assert(
      meCookieRes.status === 200 && meCookieData.user?.email === userAEmail,
      '14. Authenticated /api/auth/me via HttpOnly Cookie',
      `HTTP ${meCookieRes.status}, verified email: ${meCookieData.user?.email}`
    );

    // Via Bearer Header
    const meBearerRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const meBearerData = await meBearerRes.json();
    assert(
      meBearerRes.status === 200 && meBearerData.user?.email === userAEmail,
      '15. Authenticated /api/auth/me via Bearer Token Header',
      `HTTP ${meBearerRes.status}`
    );

    // ----------------------------------------------------
    // TEST 8: Malformed & Expired JWT Rejection
    // ----------------------------------------------------
    const meMalformedRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer this.is.not.a.valid.jwt.token' },
    });
    assert(
      meMalformedRes.status === 401,
      '16. Malformed Token Rejection',
      `HTTP ${meMalformedRes.status}`
    );

    const expiredToken = jwt.sign(
      { id: userDocInDb?._id },
      process.env.JWT_SECRET || 'fallback',
      { expiresIn: '-10s' }
    );
    const meExpiredRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const meExpiredData = await meExpiredRes.json();
    assert(
      meExpiredRes.status === 401 && meExpiredData.isExpired === true,
      '17. Expired JWT Rejection with isExpired Flag',
      `HTTP ${meExpiredRes.status}, isExpired: ${meExpiredData.isExpired}`
    );

    // ----------------------------------------------------
    // TEST 9: Trip Ownership & Data Isolation
    // ----------------------------------------------------
    // User A creates a trip
    const createTripResA = await fetch(`${BASE_URL}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        destination: 'Udaipur Royal Lakes',
        duration: 4,
        budget: 45000,
        travelStyle: 'Heritage & Luxury',
        notes: 'Sunset boat tour on Lake Pichola',
      }),
    });
    const createTripDataA = await createTripResA.json();
    userATripId = createTripDataA.trip?.id || createTripDataA.trip?._id;
    assert(
      createTripResA.status === 201 && createTripDataA.success === true,
      '18. User A Trip Creation Scoped to Account',
      `HTTP ${createTripResA.status}, tripId: ${userATripId}`
    );

    // User A fetches their trips
    const tripsResA = await fetch(`${BASE_URL}/api/trips`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const tripsDataA = await tripsResA.json();
    assert(
      tripsResA.status === 200 &&
        tripsDataA.trips.some((t) => (t.id || t._id) === userATripId),
      '19. User A Retrieves Owned Trip',
      `Found ${tripsDataA.count} trip(s) for User A`
    );

    // Register User B
    const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userBName,
        email: userBEmail,
        password: userBPassword,
      }),
    });
    const regDataB = await regResB.json();
    userBToken = regDataB.token;

    // User B fetches trips -> MUST NOT see User A's trip!
    const tripsResB = await fetch(`${BASE_URL}/api/trips`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const tripsDataB = await tripsResB.json();
    const userBSeesUserATrip = tripsDataB.trips.some(
      (t) => (t.id || t._id) === userATripId
    );
    assert(
      tripsResB.status === 200 && !userBSeesUserATrip && tripsDataB.count === 0,
      '20. Strict Multi-Tenant Data Isolation (User B cannot see User A trip)',
      `User B trip count: ${tripsDataB.count}, User A trip leaked: ${userBSeesUserATrip}`
    );

    // Unauthenticated request to /api/trips
    const tripsUnauthRes = await fetch(`${BASE_URL}/api/trips`);
    assert(
      tripsUnauthRes.status === 401,
      '21. Unauthenticated /api/trips Access Rejection',
      `HTTP ${tripsUnauthRes.status}`
    );

    // ----------------------------------------------------
    // TEST 10: Logout & Session Termination
    // ----------------------------------------------------
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
    });
    const logoutCookie = logoutRes.headers.get('set-cookie') || '';
    assert(
      logoutRes.status === 200,
      '22. Successful Logout Request',
      `HTTP ${logoutRes.status}`
    );
    assert(
      logoutCookie.includes('token=;') || logoutCookie.includes('Expires=Thu, 01 Jan 1970'),
      '23. Session Cookie Cleared by Logout Response',
      'Cookie expiration set to epoch'
    );
  } finally {
    // ----------------------------------------------------
    // CLEANUP: Clean up test accounts and trips from Atlas
    // ----------------------------------------------------
    console.log('\n--- Cleaning up temporary test records from MongoDB Atlas ---');
    try {
      if (mongoose.connection.readyState !== 1) {
        await connectDB();
      }
      const deletedTrips = await Trip.deleteMany({
        destination: 'Udaipur Royal Lakes',
      });
      const deletedUsers = await User.deleteMany({
        email: { $in: [userAEmail, userBEmail] },
      });
      console.log(`Cleaned up ${deletedUsers.deletedCount} test user(s) and ${deletedTrips.deletedCount} test trip(s).`);
      await mongoose.disconnect();
      if (serverInstance) {
        await new Promise((resolve) => serverInstance.close(resolve));
      }
    } catch (cleanErr) {
      console.warn('Notice: Cleanup warning:', cleanErr.message);
    }
  }

  console.log('\n=====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveE2ETests();
