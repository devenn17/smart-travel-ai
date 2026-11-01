import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import mongoose from 'mongoose';

const PORT = 5098; // Dedicated port for isolated API testing

const runTest = async () => {
  console.log('\n======================================================');
  console.log('  SmartTravel Phase 3 — Backend API Automated Tests');
  console.log('======================================================\n');

  // 1. Connect to Database
  const conn = await connectDB();
  if (!conn) {
    console.error('FATAL: Could not connect to database for tests.');
    process.exit(1);
  }

  // 2. Start HTTP server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://127.0.0.1:${PORT}`;
  console.log(`[Test Runner] Test server listening on ${baseUrl}\n`);

  const results = [];

  const recordResult = (name, passed, details = '') => {
    results.push({ name, passed, details });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${mark}] ${name} ${details ? `(${details})` : ''}`);
  };

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
    // Test 1: Root endpoint reports Phase 3
    const rootRes = await request('/');
    recordResult(
      'Root API Discovery Info',
      rootRes.status === 200 && rootRes.body.phase?.includes('Phase 3'),
      `Status: ${rootRes.status}, Phase: "${rootRes.body.phase}"`
    );

    // Test 2: List destinations (Public, no auth)
    const listRes = await request('/api/destinations');
    const hasDestinations = listRes.status === 200 && Array.isArray(listRes.body.data) && listRes.body.data.length > 0;
    recordResult(
      'Public Destination Listing',
      hasDestinations,
      `Returned ${listRes.body?.data?.length || 0} destinations, Total: ${listRes.body?.pagination?.total}`
    );

    const firstDest = listRes.body.data[0];

    // Test 3: Search by keyword ("Udaipur")
    const searchRes = await request('/api/destinations?search=Udaipur');
    const searchMatch = searchRes.status === 200 && searchRes.body.data.some((d) => d.slug === 'udaipur');
    recordResult(
      'Keyword Search ("Udaipur")',
      searchMatch,
      `Found ${searchRes.body?.data?.length} match(es)`
    );

    // Test 4: Category Filter ("Heritage")
    const categoryRes = await request('/api/destinations?category=Heritage');
    const allHeritage =
      categoryRes.status === 200 &&
      categoryRes.body.data.length > 0 &&
      categoryRes.body.data.every((d) => d.category === 'Heritage');
    recordResult(
      'Category Filter ("Heritage")',
      allHeritage,
      `Matched ${categoryRes.body?.data?.length} Heritage destinations: ${categoryRes.body?.data?.map((d) => d.name).join(', ')}`
    );

    // Test 5: Budget Range Filter (min: 3000, max: 4500)
    const budgetRes = await request('/api/destinations?minBudget=3000&maxBudget=4500');
    const budgetMatches =
      budgetRes.status === 200 &&
      budgetRes.body.data.length > 0 &&
      budgetRes.body.data.every((d) => d.estimatedDailyBudget >= 3000 && d.estimatedDailyBudget <= 4500);
    recordResult(
      'Budget Filter (INR 3000 - 4500)',
      budgetMatches,
      `Found ${budgetRes.body?.data?.length} destination(s) within budget bounds`
    );

    // Test 6: Sorting by Budget Ascending
    const sortAscRes = await request('/api/destinations?sort=budget-asc');
    let isAscending = true;
    for (let i = 1; i < sortAscRes.body.data.length; i++) {
      if (sortAscRes.body.data[i].estimatedDailyBudget < sortAscRes.body.data[i - 1].estimatedDailyBudget) {
        isAscending = false;
        break;
      }
    }
    recordResult(
      'Sort Order: Budget Ascending',
      sortAscRes.status === 200 && isAscending,
      `Cheapest first: ${sortAscRes.body?.data[0]?.name} (INR ${sortAscRes.body?.data[0]?.estimatedDailyBudget})`
    );

    // Test 7: Sorting by Budget Descending
    const sortDescRes = await request('/api/destinations?sort=budget-desc');
    let isDescending = true;
    for (let i = 1; i < sortDescRes.body.data.length; i++) {
      if (sortDescRes.body.data[i].estimatedDailyBudget > sortDescRes.body.data[i - 1].estimatedDailyBudget) {
        isDescending = false;
        break;
      }
    }
    recordResult(
      'Sort Order: Budget Descending',
      sortDescRes.status === 200 && isDescending,
      `Highest first: ${sortDescRes.body?.data[0]?.name} (INR ${sortDescRes.body?.data[0]?.estimatedDailyBudget})`
    );

    // Test 8: Pagination (limit=3, page=1 and page=2)
    const page1Res = await request('/api/destinations?limit=3&page=1');
    const page2Res = await request('/api/destinations?limit=3&page=2');
    const paginationWorks =
      page1Res.status === 200 &&
      page2Res.status === 200 &&
      page1Res.body.data.length === 3 &&
      page2Res.body.data.length === 3 &&
      page1Res.body.data[0].id !== page2Res.body.data[0].id;
    recordResult(
      'Pagination (Page 1 vs Page 2)',
      paginationWorks,
      `Page 1 first: ${page1Res.body?.data[0]?.name}, Page 2 first: ${page2Res.body?.data[0]?.name}`
    );

    // Test 9: Get Destination by Slug with Virtual Populated Attractions
    const slugRes = await request('/api/destinations/udaipur');
    const hasAttractionsPopulated =
      slugRes.status === 200 &&
      slugRes.body.data.slug === 'udaipur' &&
      Array.isArray(slugRes.body.data.attractions) &&
      slugRes.body.data.attractions.length >= 4;
    recordResult(
      'Lookup Destination by Slug with Attractions',
      hasAttractionsPopulated,
      `Udaipur loaded with ${slugRes.body?.data?.attractions?.length} populated attractions`
    );

    // Test 10: Get Destination by MongoDB ObjectId
    const idRes = await request(`/api/destinations/${firstDest.id}`);
    recordResult(
      'Lookup Destination by ObjectId',
      idRes.status === 200 && idRes.body.data.id === firstDest.id,
      `Successfully loaded "${idRes.body?.data?.name}" using _id: ${firstDest.id}`
    );

    // Test 11: Get Attractions belonging to destination
    const destAttractionsRes = await request('/api/destinations/udaipur/attractions');
    recordResult(
      'Get Destination Attractions (/api/destinations/:slug/attractions)',
      destAttractionsRes.status === 200 && destAttractionsRes.body.count >= 4,
      `Returned ${destAttractionsRes.body?.count} attractions for Udaipur`
    );

    // Test 12: Get Single Attraction by Slug
    const attrRes = await request('/api/attractions/city-palace-udaipur');
    recordResult(
      'Get Attraction Details by Slug (/api/attractions/:slug)',
      attrRes.status === 200 && attrRes.body.data.name.includes('City Palace'),
      `Attraction name: "${attrRes.body?.data?.name}", Estimated entry: INR ${attrRes.body?.data?.estimatedPriceINR}`
    );

    // Test 13: 404 on Non-existent Destination
    const notFoundRes = await request('/api/destinations/atlantis-the-lost-city');
    recordResult(
      'Missing Destination Returns 404',
      notFoundRes.status === 404 && notFoundRes.body.success === false,
      `Status: ${notFoundRes.status}, Message: "${notFoundRes.body?.message}"`
    );

    // Test 14: Security - Unauthenticated POST to /api/destinations blocked
    const unauthPostRes = await request('/api/destinations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hacker Destination', slug: 'hacker-dest' }),
    });
    recordResult(
      'Security: Unauthenticated Destination Creation Blocked (401)',
      unauthPostRes.status === 401 && unauthPostRes.body.success === false,
      `Status: ${unauthPostRes.status}, Message: "${unauthPostRes.body?.message}"`
    );

    // Test 15: Security - Unauthenticated POST to /api/attractions blocked
    const unauthAttrRes = await request('/api/attractions', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hacker Attraction', slug: 'hacker-attr' }),
    });
    recordResult(
      'Security: Unauthenticated Attraction Creation Blocked (401)',
      unauthAttrRes.status === 401 && unauthAttrRes.body.success === false,
      `Status: ${unauthAttrRes.status}, Message: "${unauthAttrRes.body?.message}"`
    );
  } catch (err) {
    console.error('[Test Execution Error]', err);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    console.log('\n[Test Runner] Database connection and HTTP server closed.');

    const failed = results.filter((r) => !r.passed);
    console.log('\n======================================================');
    console.log(`Results: ${results.length - failed.length}/${results.length} PASSED`);
    if (failed.length > 0) {
      console.log(`Failures: ${failed.map((f) => f.name).join(', ')}`);
      process.exit(1);
    } else {
      console.log('ALL PHASE 3 BACKEND API TESTS PASSED PERFECTLY!');
      console.log('======================================================\n');
      process.exit(0);
    }
  }
};

runTest();
