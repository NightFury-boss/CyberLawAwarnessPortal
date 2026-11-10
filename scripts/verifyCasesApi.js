/**
 * API Verification Script for Case Studies Endpoints
 * Verifies GET /api/crimes/cases and GET /api/crimes/cases/slug/:slug
 */

const http = require('http');
const path = require('path');
let dotenv;
try {
  dotenv = require('dotenv');
} catch (e) {
  dotenv = require('../server/node_modules/dotenv');
}
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const mongoose = require('../server/node_modules/mongoose');
const app = require('../server/server');
const { TARGET_SLUGS } = require('../server/config/seedJusticeShortcomingsCases');

async function testApiEndpoints() {
  console.log('======================================================================');
  console.log('API INTEGRATION VERIFICATION: CASE STUDIES ENDPOINTS');
  console.log('======================================================================\n');

  // Wait for mongoose connection if connecting
  if (mongoose.connection.readyState !== 1) {
    console.log('[API] Waiting for database connection to be ready...');
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) return resolve();
      mongoose.connection.once('connected', resolve);
    });
  }

  // Create ephemeral HTTP server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[API] Test server listening on ${baseUrl}\n`);

  try {
    // 1. Test GET /api/crimes/cases
    console.log('[1/3] Testing GET /api/crimes/cases ...');
    const catalogRes = await fetch(`${baseUrl}/api/crimes/cases`);
    console.log(`  Response Status: ${catalogRes.status} ${catalogRes.statusText}`);
    if (catalogRes.status !== 200) {
      throw new Error(`GET /api/crimes/cases returned status ${catalogRes.status}`);
    }

    const cases = await catalogRes.json();
    console.log(`  Total Cases Returned: ${cases.length} (Expected: 21)`);
    if (cases.length !== 21) {
      throw new Error(`Expected 21 cases, received ${cases.length}`);
    }

    const shortcomingsCases = cases.filter(c => c.collection === 'Cases Where Justice Fell Short');
    const landmarkCases = cases.filter(c => c.collection !== 'Cases Where Justice Fell Short');
    console.log(`  - Landmark Precedents: ${landmarkCases.length} (Expected: 11)`);
    console.log(`  - Cases Where Justice Fell Short: ${shortcomingsCases.length} (Expected: 10)`);
    if (shortcomingsCases.length !== 10 || landmarkCases.length !== 11) {
      throw new Error('Collection breakdown mismatch in API response!');
    }
    console.log('  [PASS] GET /api/crimes/cases returned all 21 cases with exact collection breakdown.');

    // 2. Test GET /api/crimes/cases/slug/:slug for all 10 target slugs
    console.log('\n[2/3] Testing GET /api/crimes/cases/slug/:slug for all 10 new cases...');
    let passedSlugs = 0;
    for (const slug of TARGET_SLUGS) {
      const res = await fetch(`${baseUrl}/api/crimes/cases/slug/${slug}`);
      if (res.status !== 200) {
        throw new Error(`Failed to fetch slug "${slug}": status ${res.status}`);
      }
      const data = await res.json();
      if (!data || data.slug !== slug) {
        throw new Error(`Data mismatch on slug "${slug}"`);
      }
      if (!data.narrativeSections || data.narrativeSections.length !== 6) {
        throw new Error(`Narrative sections mismatch on "${slug}": expected 6 parts, got ${data.narrativeSections?.length}`);
      }
      passedSlugs++;
      console.log(`  [PASS 200 OK] "${slug}" -> [${data.caseNumber}] "${data.title}" (6 sections)`);
    }
    console.log(`  [PASS] All ${passedSlugs}/10 new case endpoints returned HTTP 200 with full 6-part narrative.`);

    // 3. Test Legacy Case Endpoint
    console.log('\n[3/3] Testing GET /api/crimes/cases/slug/:slug for legacy case...');
    const legacyRes = await fetch(`${baseUrl}/api/crimes/cases/slug/phishing-credential-takeover`);
    if (legacyRes.status !== 200) {
      throw new Error(`Legacy slug fetch failed with status ${legacyRes.status}`);
    }
    const legacyData = await legacyRes.json();
    console.log(`  [PASS 200 OK] "phishing-credential-takeover" -> "${legacyData.title}"`);

    console.log('\n======================================================================');
    console.log('API INTEGRATION VERIFICATION: ALL 12 CHECKS PASSED');
    console.log('======================================================================\n');
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('[API] Server and database disconnected cleanly.');
  }
}

testApiEndpoints()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[API VERIFICATION FAILED]:', err.message);
    process.exit(1);
  });

