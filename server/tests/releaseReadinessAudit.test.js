const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/User');

async function runReleaseReadinessAudit() {
  console.log('\n=============================================================');
  console.log('RELEASE READINESS & SECURITY HARDENING TEST SUITE');
  console.log('=============================================================\n');

  let server;
  let baseUrl;

  try {
    // 1. Boot on ephemeral port (avoids collision with 5000 or other test runners)
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        console.log(`[Test Server] Listening on dynamic port ${port}`);
        resolve();
      });
    });

    // -------------------------------------------------------------
    // TEST 1: Security Response Headers
    // -------------------------------------------------------------
    console.log('[TEST 1] Auditing security response headers...');
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200, 'Health endpoint must respond with 200');
    assert.strictEqual(healthRes.headers.get('x-content-type-options'), 'nosniff', 'X-Content-Type-Options must be nosniff');
    assert.strictEqual(healthRes.headers.get('x-frame-options'), 'SAMEORIGIN', 'X-Frame-Options must be SAMEORIGIN');
    assert.strictEqual(healthRes.headers.get('referrer-policy'), 'strict-origin-when-cross-origin', 'Referrer-Policy must be strict-origin-when-cross-origin');
    console.log('  * PASS: Security headers verified (nosniff, SAMEORIGIN, strict-origin-when-cross-origin).');

    // -------------------------------------------------------------
    // TEST 2: ReDoS and Regex Meta-character Injection Protection
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Auditing Regex Meta-character Injection Defense (Assistant & Searches)...');

    // 2a. Assistant endpoint with raw regex metacharacters
    const nastyQueries = ['(', '(((.*)*)*)', '[abc', '{5,10}', '+', '?', '^$'];
    for (const q of nastyQueries) {
      const askRes = await fetch(`${baseUrl}/assistant/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });
      assert.strictEqual(askRes.status, 200, `Assistant must handle "${q}" gracefully without 500 crash, got ${askRes.status}`);
      const askData = await askRes.json();
      assert(typeof askData.reply === 'string', 'Assistant must return string reply');
    }
    // Test terminal sentence punctuation preprocessing in conversational query (e.g. "phishing?")
    const punctuationRes = await fetch(`${baseUrl}/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is phishing?' })
    });
    const punctuationData = await punctuationRes.json();
    if (punctuationRes.status !== 200) {
      console.error('Punctuation test error response:', punctuationData);
    }
    assert.strictEqual(punctuationRes.status, 200);
    assert(punctuationData.reply.toLowerCase().includes('phishing'), 'Assistant must match "phishing" when asked "What is phishing?" with terminal punctuation');
    console.log('  * PASS: Assistant endpoint cleanly handles regex meta-character injection and terminal punctuation queries.');

    // 2b. Laws search with unescaped parenthesis: verify data integrity against literal "("
    const lawSearchRes = await fetch(`${baseUrl}/laws/search?q=%28`);
    assert.strictEqual(lawSearchRes.status, 200, 'Laws search must handle "(" gracefully without 500 crash');
    const matchedLaws = await lawSearchRes.json();
    assert(Array.isArray(matchedLaws), 'Laws search must return an array');
    assert(matchedLaws.length > 0, 'Laws search for "(" must return matching statutory records');
    for (const law of matchedLaws) {
      const allText = [
        law.sectionNumber,
        law.officialTitle,
        law.plainLanguageExplanation,
        law.whyItMatters,
        law.actName,
        law.role,
        ...(Array.isArray(law.keywords) ? law.keywords : []),
        ...(Array.isArray(law.relatedCyberCrimes) ? law.relatedCyberCrimes : [])
      ].filter(Boolean).join(' ');
      assert(allText.includes('('), 'Every returned law record must contain literal "("');
    }
    // Verify non-matching query with parenthesis does NOT return unrelated records
    const noMatchLawRes = await fetch(`${baseUrl}/laws/search?q=%28nonexistent_literal_parenthesis_search_xyz%29`);
    const noMatchLaws = await noMatchLawRes.json();
    assert.strictEqual(noMatchLaws.length, 0, 'Unmatched literal parenthesis search must return 0 records');
    console.log('  * PASS: Laws search handles regex meta-characters and returns only verified literal matches.');

    // 2c. Crimes search with unescaped bracket & parenthesis
    const crimeSearchRes = await fetch(`${baseUrl}/crimes/crimes/search?q=%28`);
    assert.strictEqual(crimeSearchRes.status, 200, 'Crimes search must handle "(" gracefully without 500 crash');
    const matchedCrimes = await crimeSearchRes.json();
    assert(Array.isArray(matchedCrimes), 'Crimes search must return an array');
    assert(matchedCrimes.length > 0, 'Crimes search for "(" must return matching crime records (e.g. BEC)');
    for (const crime of matchedCrimes) {
      const allText = [
        crime.title,
        crime.category,
        crime.shortDescription,
        crime.whatIsIt,
        crime.attackerObjective,
        ...(Array.isArray(crime.warningSigns) ? crime.warningSigns : []),
        ...(Array.isArray(crime.attackVectors) ? crime.attackVectors : [])
      ].filter(Boolean).join(' ');
      assert(allText.includes('('), 'Every returned crime record must contain literal "("');
    }
    const noMatchCrimeRes = await fetch(`${baseUrl}/crimes/crimes/search?q=%28nonexistent_literal_parenthesis_search_xyz%29`);
    const noMatchCrimes = await noMatchCrimeRes.json();
    assert.strictEqual(noMatchCrimes.length, 0, 'Unmatched literal parenthesis search must return 0 records');
    console.log('  * PASS: Crimes search handles regex meta-characters and returns only verified literal matches.');

    // 2d. Cases search with literal parenthesis
    const caseSearchRes = await fetch(`${baseUrl}/crimes/cases/search?q=%28`);
    assert.strictEqual(caseSearchRes.status, 200, 'Cases search must handle "(" gracefully without 500 crash');
    const matchedCases = await caseSearchRes.json();
    assert(Array.isArray(matchedCases), 'Cases search must return an array');
    for (const c of matchedCases) {
      const allText = [
        c.title,
        c.incidentType,
        c.attackVector,
        c.shortDescription,
        c.sourceSummary,
        c.legalContext
      ].filter(Boolean).join(' ');
      assert(allText.includes('('), 'Every returned case record must contain literal "("');
    }
    // Cases search with known fixture term returns only matching cases
    const simCaseRes = await fetch(`${baseUrl}/crimes/cases/search?q=SIM`);
    assert.strictEqual(simCaseRes.status, 200);
    const simCases = await simCaseRes.json();
    assert(Array.isArray(simCases) && simCases.length > 0, 'Cases search for "SIM" must find SIM swap cases');
    for (const c of simCases) {
      const allText = [c.title, c.incidentType, c.attackVector, c.shortDescription].join(' ');
      assert(/SIM/i.test(allText), 'Every returned case must match search term "SIM"');
    }
    console.log('  * PASS: Cases search handles regex meta-characters and verifies match contents against fixtures.');

    // -------------------------------------------------------------
    // TEST 3: Statutory Accuracy in AI Assistant Emergency Reporting
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Auditing Statutory Accuracy & Non-Guarantee Reporting Phrasing in Assistant...');
    const assistantRes = await fetch(`${baseUrl}/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How do I report financial cyber fraud?' })
    });
    const assistantData = await assistantRes.json();
    const reply = assistantData.reply || '';

    assert(reply.includes('1930'), 'Assistant must cite National Cybercrime Helpline 1930');
    assert(reply.includes('Golden Hour') || reply.includes('CFCFRMS'), 'Assistant must mention Golden Hour or CFCFRMS');
    assert(
      !/(?:funds?\s+(?:will|shall)\s+be\s+frozen|will\s+freeze\s+(?:the\s+|stolen\s+)?funds?|to\s+freeze\s+stolen\s+funds)/i.test(reply),
      'Assistant must NOT guarantee fund freezing'
    );
    assert(reply.toLowerCase().includes('cannot be guaranteed') || reply.toLowerCase().includes('not guaranteed'), 'Assistant must clarify recovery is not guaranteed');
    console.log('  * PASS: Emergency reporting text strictly adheres to statutory accuracy without false guarantees.');

    // -------------------------------------------------------------
    // TEST 4: Invalid ObjectId Input Handling (CastError Protection)
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Auditing Invalid ObjectId Parameter Handling (No 500 CastError)...');
    const invalidLawRes = await fetch(`${baseUrl}/laws/non-existent-id-123`);
    assert.strictEqual(invalidLawRes.status, 400, `Expected 400 Bad Request for invalid Law ID, got ${invalidLawRes.status}`);

    const invalidCrimeRes = await fetch(`${baseUrl}/crimes/crimes/invalid-id-xyz`);
    assert.strictEqual(invalidCrimeRes.status, 400, `Expected 400 Bad Request for invalid Crime ID, got ${invalidCrimeRes.status}`);

    const invalidCaseRes = await fetch(`${baseUrl}/crimes/cases/bad-id-456`);
    assert.strictEqual(invalidCaseRes.status, 400, `Expected 400 Bad Request for invalid Case ID, got ${invalidCaseRes.status}`);
    console.log('  * PASS: Invalid ObjectId parameters return 400 Bad Request instead of 500 CastError.');

    // -------------------------------------------------------------
    // TEST 5: Registration Validation & Weak Password / Malformed Email Rejection
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Auditing Registration Input Validation (Passwords, Emails, Injection Objects)...');

    // 5a. Password too short (< 8 chars)
    const shortPassRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'valid.user@test.com', password: '123', fullName: 'Valid User' })
    });
    assert.strictEqual(shortPassRes.status, 400, 'Password < 8 characters must be rejected with 400');
    const shortPassData = await shortPassRes.json();
    assert(shortPassData.message.includes('8 characters'), 'Error message must note 8 character requirement');

    // 5b. Malformed email
    const badEmailRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'ValidPassword123!', fullName: 'Valid User' })
    });
    assert.strictEqual(badEmailRes.status, 400, 'Malformed email must be rejected with 400');

    // 5c. Non-string body types (NoSQL injection attempt)
    const injectionRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: { $ne: null }, password: 'ValidPassword123!', fullName: 'Valid User' })
    });
    assert.strictEqual(injectionRes.status, 400, 'Non-string email must be rejected with 400 Bad Request');
    console.log('  * PASS: Registration validates email format, password length (>=8), and rejects injection objects.');

    console.log('\n=============================================================');
    console.log('ALL 5 RELEASE READINESS & SECURITY HARDENING AUDITS PASSED!');
    console.log('=============================================================\n');

  } finally {
    if (server) {
      server.close();
    }
  }
}

runReleaseReadinessAudit()
  .then(() => {
    console.log('Release readiness test completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Release readiness test failed:', err);
    process.exit(1);
  });

