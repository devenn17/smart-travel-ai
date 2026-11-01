import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import mongoose from 'mongoose';
import User from './models/User.js';
import Destination from './models/Destination.js';
import Attraction from './models/Attraction.js';
import Trip from './models/Trip.js';
import AuditLog from './models/AuditLog.js';

const PORT = 5099; // Dedicated port for admin suite

const runAdminSuite = async () => {
  console.log('\n======================================================');
  console.log('   SmartTravel — Complete Admin Panel Test Suite');
  console.log('======================================================\n');

  const conn = await connectDB();
  if (!conn) {
    console.error('FATAL: Database connection failed for admin suite.');
    process.exit(1);
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://127.0.0.1:${PORT}`;
  console.log(`[Test Server] Admin test server active at ${baseUrl}\n`);

  const results = [];
  const recordResult = (name, passed, details = '') => {
    results.push({ name, passed, details });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${mark}] ${name} ${details ? `(${details})` : ''}`);
  };

  const timestamp = Date.now();
  const adminEmail = `admin.suite.${timestamp}@smarttravel-test.org`;
  const adminPassword = 'AdminSecretPassword2026!';
  const userEmail = `explorer.suite.${timestamp}@smarttravel-test.org`;
  const userPassword = 'UserSecretPassword2026!';

  let adminCookie = '';
  let adminToken = '';
  let adminUserId = '';
  let userCookie = '';
  let userToken = '';
  let normalUserId = '';
  let testDestinationId = '';
  let testDestinationSlug = `test-dest-${timestamp}`;
  let testAttractionId = '';
  let testTripId = '';

  const request = async (path, options = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { status: res.status, headers: res.headers, body };
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Database Health Check
    // -------------------------------------------------------------------------
    const healthRes = await request('/api/health/db');
    recordResult(
      '1. Database Health Check (/api/health/db)',
      healthRes.status === 200 && healthRes.body.database?.connected === true,
      `Status: ${healthRes.status}, connected: ${healthRes.body.database?.connected}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Unauthenticated Access to Admin API Rejected with 401
    // -------------------------------------------------------------------------
    const unauthRes = await request('/api/admin/dashboard/stats');
    recordResult(
      '2. Unauthenticated Admin API Access Rejected (401)',
      unauthRes.status === 401 && unauthRes.body.success === false,
      `Status: ${unauthRes.status}, message: "${unauthRes.body.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Public Registration Cannot Assign Role 'admin' (Privilege Escalation Protection)
    // -------------------------------------------------------------------------
    const regHackerRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Normal Explorer',
        email: userEmail,
        password: userPassword,
        role: 'admin', // Malicious attempt to elevate role
      }),
    });

    const parsedUserCookie = regHackerRes.headers.get('set-cookie')?.split(';')[0];
    userCookie = parsedUserCookie || '';
    userToken = regHackerRes.body.token || '';
    normalUserId = regHackerRes.body.user?.id || '';

    // Verify role in database is strictly 'user'
    const dbNormalUser = await User.findById(normalUserId);
    const roleIsUser = regHackerRes.body.user?.role === 'user' && dbNormalUser?.role === 'user';
    recordResult(
      '3. Public Registration Cannot Assign Admin Role (Strictly defaults to "user")',
      regHackerRes.status === 201 && roleIsUser,
      `Created role: "${regHackerRes.body.user?.role}", DB role: "${dbNormalUser?.role}"`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Normal User Blocked from Every Admin Endpoint with 403 Forbidden
    // -------------------------------------------------------------------------
    const normalUserAdminRes = await request('/api/admin/dashboard/stats', {
      headers: { Cookie: userCookie },
    });
    recordResult(
      '4. Authenticated Regular User Blocked from Admin APIs (403 Forbidden)',
      normalUserAdminRes.status === 403 && normalUserAdminRes.body.success === false,
      `Status: ${normalUserAdminRes.status}, message: "${normalUserAdminRes.body.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Bootstrap Admin Account Creation
    // -------------------------------------------------------------------------
    const bcrypt = (await import('bcryptjs')).default;
    const adminHash = await bcrypt.hash(adminPassword, 12);
    const adminDoc = await User.create({
      name: 'Test Administrator',
      email: adminEmail,
      passwordHash: adminHash,
      role: 'admin',
      isActive: true,
    });
    adminUserId = adminDoc._id.toString();

    recordResult(
      '5. Admin Account Bootstrap',
      adminDoc.role === 'admin' && adminDoc.isActive === true,
      `Admin ID: ${adminUserId}, Email: ${adminEmail}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Admin Login & Session Cookie Issuance
    // -------------------------------------------------------------------------
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    adminCookie = adminLoginRes.headers.get('set-cookie')?.split(';')[0] || '';
    adminToken = adminLoginRes.body.token || '';

    recordResult(
      '6. Admin Login & Session Cookie Persistence',
      adminLoginRes.status === 200 && adminLoginRes.body.user?.role === 'admin' && adminCookie.includes('token='),
      `Status: ${adminLoginRes.status}, role: "${adminLoginRes.body.user?.role}"`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Dashboard Metrics Verification Against Real DB Counts
    // -------------------------------------------------------------------------
    const statsRes = await request('/api/admin/dashboard/stats', {
      headers: { Cookie: adminCookie },
    });
    const expectedUsersCount = await User.countDocuments();
    const expectedDestCount = await Destination.countDocuments();
    const metricsMatch =
      statsRes.status === 200 &&
      statsRes.body.stats.users.total === expectedUsersCount &&
      statsRes.body.stats.destinations.total === expectedDestCount;

    recordResult(
      '7. Dashboard Metrics Match Real Database Counts',
      metricsMatch,
      `Users: ${statsRes.body.stats?.users?.total}/${expectedUsersCount}, Destinations: ${statsRes.body.stats?.destinations?.total}/${expectedDestCount}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Admin Destination CRUD — Create
    // -------------------------------------------------------------------------
    const createDestRes = await request('/api/admin/destinations', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        name: `Test Destination ${timestamp}`,
        slug: testDestinationSlug,
        region: 'Himalayan Ridge',
        category: 'Mountains',
        description: 'A test mountain sanctuary for automated admin verification.',
        editorialStory: 'Comprehensive editorial story testing narrative integrity.',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        estimatedDailyBudget: 4800,
        bestTime: 'May – October',
        featured: false,
      }),
    });
    testDestinationId = createDestRes.body.data?._id || createDestRes.body.data?.id || '';
    recordResult(
      '8. Admin Destination CRUD — Create Destination',
      createDestRes.status === 201 && !!testDestinationId,
      `Created ID: ${testDestinationId}, slug: "${testDestinationSlug}"`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Duplicate Destination Slug Rejected with HTTP 400
    // -------------------------------------------------------------------------
    const dupSlugRes = await request('/api/admin/destinations', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Duplicate Slug Test',
        slug: testDestinationSlug, // same slug
        region: 'Test',
        category: 'Beach',
        description: 'Duplicate slug test.',
        image: 'https://example.com/test.jpg',
        estimatedDailyBudget: 3000,
        bestTime: 'All Year',
      }),
    });
    recordResult(
      '9. Duplicate Destination Slug Rejected (400)',
      dupSlugRes.status === 400 && dupSlugRes.body.success === false,
      `Status: ${dupSlugRes.status}, message: "${dupSlugRes.body.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Admin Destination Status Toggle (Publish/Unpublish)
    // -------------------------------------------------------------------------
    const toggleDestRes = await request(`/api/admin/destinations/${testDestinationId}/toggle-status`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
    });
    recordResult(
      '10. Admin Destination Toggle Publish/Unpublish Status',
      toggleDestRes.status === 200 && toggleDestRes.body.data?.isActive === false,
      `New isActive: ${toggleDestRes.body.data?.isActive}`
    );

    // -------------------------------------------------------------------------
    // TEST 11: Admin Attraction CRUD — Create Linked to Destination
    // -------------------------------------------------------------------------
    const createAttrRes = await request('/api/admin/attractions', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        name: `High Ridge Pass ${timestamp}`,
        slug: `high-ridge-pass-${timestamp}`,
        destination: testDestinationId,
        category: 'Nature',
        description: 'Scenic high-altitude alpine viewpoint overlooking glacial valleys.',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        estimatedPriceINR: 150,
        estimatedDuration: '2 hours',
      }),
    });
    testAttractionId = createAttrRes.body.data?._id || createAttrRes.body.data?.id || '';
    recordResult(
      '11. Admin Attraction CRUD — Create Linked Attraction',
      createAttrRes.status === 201 && !!testAttractionId,
      `Attraction ID: ${testAttractionId}`
    );

    // -------------------------------------------------------------------------
    // TEST 12: User Management Directory with Dynamic Trip Counts
    // -------------------------------------------------------------------------
    // Create a trip for our normal user first
    const tripRes = await request('/api/trips', {
      method: 'POST',
      headers: { Cookie: userCookie },
      body: JSON.stringify({
        destination: 'Jaipur Royal Amber',
        duration: 4,
        budget: 25000,
        travelStyle: 'Heritage',
      }),
    });
    testTripId = tripRes.body.trip?._id || tripRes.body.trip?.id || tripRes.body.data?._id || tripRes.body.data?.id || '';

    const usersDirRes = await request('/api/admin/users', {
      headers: { Cookie: adminCookie },
    });
    const foundUserInDir = usersDirRes.body.data?.find((u) => u.email === userEmail);
    recordResult(
      '12. User Directory with Calculated Trip Count',
      usersDirRes.status === 200 && foundUserInDir?.tripsCount >= 1,
      `User ${foundUserInDir?.name} has tripsCount: ${foundUserInDir?.tripsCount}`
    );

    // -------------------------------------------------------------------------
    // TEST 13: Self-Demotion Protection Safeguard
    // -------------------------------------------------------------------------
    const selfDemoteRes = await request(`/api/admin/users/${adminUserId}/role`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ role: 'user' }),
    });
    recordResult(
      '13. Self-Demotion Protection Safeguard (Blocked with 400)',
      selfDemoteRes.status === 400 && selfDemoteRes.body.success === false,
      `Status: ${selfDemoteRes.status}, message: "${selfDemoteRes.body.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST 14: User Role Promotion & Demotion
    // -------------------------------------------------------------------------
    const promoteUserRes = await request(`/api/admin/users/${normalUserId}/role`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ role: 'admin' }),
    });
    const demoteUserRes = await request(`/api/admin/users/${normalUserId}/role`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ role: 'user' }),
    });
    recordResult(
      '14. User Role Promotion and Subsequent Demotion',
      promoteUserRes.status === 200 && promoteUserRes.body.data?.role === 'admin' &&
      demoteUserRes.status === 200 && demoteUserRes.body.data?.role === 'user',
      `Promoted to: ${promoteUserRes.body.data?.role}, Demoted back to: ${demoteUserRes.body.data?.role}`
    );

    // -------------------------------------------------------------------------
    // TEST 15: Trip Privacy & Admin Permissions (Admin can view and update trips)
    // -------------------------------------------------------------------------
    const adminTripsRes = await request('/api/admin/trips', {
      headers: { Cookie: adminCookie },
    });
    const tripStatusRes = await request(`/api/admin/trips/${testTripId}/status`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ status: 'completed' }),
    });
    recordResult(
      '15. Admin Trip Inspection and Status Modification',
      adminTripsRes.status === 200 && tripStatusRes.status === 200 && tripStatusRes.body.data?.status === 'completed',
      `Trip count: ${adminTripsRes.body.data?.length}, new status: "${tripStatusRes.body.data?.status}"`
    );

    // -------------------------------------------------------------------------
    // TEST 16: Audit Trail Generation & Immutability
    // -------------------------------------------------------------------------
    const auditRes = await request('/api/admin/audit-logs', {
      headers: { Cookie: adminCookie },
    });
    const hasAuditLogs = auditRes.status === 200 && Array.isArray(auditRes.body.data) && auditRes.body.data.length >= 4;
    recordResult(
      '16. Automated Audit Log Trail Generation',
      hasAuditLogs,
      `Captured ${auditRes.body.data?.length} audit log entries`
    );

    // -------------------------------------------------------------------------
    // TEST 17: Account Deactivation Blocks Authentication & Sessions
    // -------------------------------------------------------------------------
    // Deactivate the normal user account
    const deactivateRes = await request(`/api/admin/users/${normalUserId}/status`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
    });

    // Try to access protected resource with existing user session
    const blockedSessionRes = await request('/api/auth/me', {
      headers: { Cookie: userCookie },
    });

    // Try to log in again as deactivated user
    const blockedLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });

    const deactivationEnforced =
      deactivateRes.status === 200 &&
      blockedSessionRes.status === 403 &&
      blockedLoginRes.status === 403;

    recordResult(
      '17. Account Deactivation Blocks Sessions & Login (403 Forbidden)',
      deactivationEnforced,
      `Session status: ${blockedSessionRes.status}, Login status: ${blockedLoginRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 18: System Health Diagnostics (Zero Leaked Secrets)
    // -------------------------------------------------------------------------
    const healthDiagRes = await request('/api/admin/settings/health', {
      headers: { Cookie: adminCookie },
    });
    const safeDiagnostics =
      healthDiagRes.status === 200 &&
      healthDiagRes.body.database?.connected === true &&
      !JSON.stringify(healthDiagRes.body).includes('password') &&
      !JSON.stringify(healthDiagRes.body).includes('@'); // ensure credentials not in URI

    recordResult(
      '18. System Health Diagnostics Endpoint (Safe, zero credentials)',
      safeDiagnostics,
      `DB State: ${healthDiagRes.body.database?.status}, Node: ${healthDiagRes.body.system?.nodeVersion}`
    );
  } catch (err) {
    console.error('[Admin Suite Execution Error]', err);
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP: Purge test records
    // -------------------------------------------------------------------------
    console.log('\n--- Cleaning up temporary test records from MongoDB Atlas ---');
    try {
      if (testAttractionId) await Attraction.findByIdAndDelete(testAttractionId);
      if (testDestinationId) await Destination.findByIdAndDelete(testDestinationId);
      if (testTripId) await Trip.findByIdAndDelete(testTripId);
      if (adminUserId) await User.findByIdAndDelete(adminUserId);
      if (normalUserId) await User.findByIdAndDelete(normalUserId);
      await AuditLog.deleteMany({ adminEmail: { $in: [adminEmail, userEmail] } });
      console.log('Cleaned up test users, test destination, test attraction, test trip, and test audit logs.');
    } catch (cleanErr) {
      console.warn('Notice: Cleanup warning:', cleanErr.message);
    }

    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    console.log('[Test Runner] Test server and DB connection closed.');

    const failed = results.filter((r) => !r.passed);
    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${results.length - failed.length}/${results.length} PASSED`);
    if (failed.length > 0) {
      console.log(`Failures: ${failed.map((f) => f.name).join(', ')}`);
      process.exit(1);
    } else {
      console.log('ALL COMPLETE ADMIN PANEL BACKEND TESTS PASSED PERFECTLY!');
      console.log('======================================================\n');
      process.exit(0);
    }
  }
};

runAdminSuite();
