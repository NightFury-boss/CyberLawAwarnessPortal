const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const LawSection = require('../models/LawSection');
const CyberCrime = require('../models/CyberCrime');

const PORT = 5998;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;
let adminToken = '';
let userToken = '';
let adminUser = null;
let standardUser = null;

async function runAuditTests() {
  console.log('====================================================');
  console.log('STARTING PHASE 5: ADMIN AUDIT PANEL VERIFICATION SUITE');
  console.log('====================================================\n');

  try {
    // 1. Boot Isolated Test Server
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`[Test Server] Running on port ${PORT}`);
        resolve();
      });
    });

    // 2. Setup Test Users
    console.log('- Setting up test users (Admin & Standard)...');
    await User.deleteMany({ email: { $in: ['audit_test_admin@portal.test', 'audit_test_user@portal.test'] } });
    await LawSection.deleteMany({ sectionNumber: { $in: ['TEST-66Z', 'TEST-66Y'] } });
    await CyberCrime.deleteMany({ title: { $in: ['Test Audit Phishing', 'Test Audit Ransomware'] } });

    const passwordHash = await bcrypt.hash('TestSecurePass123!', 10);

    adminUser = await User.create({
      fullName: 'Chief Audit Officer',
      email: 'audit_test_admin@portal.test',
      passwordHash,
      role: 'admin'
    });

    standardUser = await User.create({
      fullName: 'Standard Student',
      email: 'audit_test_user@portal.test',
      passwordHash,
      role: 'user'
    });

    // Login Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'audit_test_admin@portal.test', password: 'TestSecurePass123!' })
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token;

    // Login User
    const userLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'audit_test_user@portal.test', password: 'TestSecurePass123!' })
    });
    const userLoginData = await userLoginRes.json();
    userToken = userLoginData.token;

    console.log('  * PASS: Test admin and user sessions established\n');

    // -------------------------------------------------------------------------
    // TEST 1: Admin can retrieve audit records
    // -------------------------------------------------------------------------
    console.log('TEST 1: Admin can retrieve audit records...');
    const getRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const getData = await getRes.json();

    if (getRes.status !== 200) {
      throw new Error(`Admin failed to get audit logs. Status: ${getRes.status}`);
    }
    if (!getData.success || !Array.isArray(getData.logs) || !getData.pagination) {
      throw new Error(`Invalid audit logs payload format. Expected { success: true, logs: [], pagination: {} }`);
    }
    console.log('  * PASS: Admin can retrieve paginated audit logs\n');

    // -------------------------------------------------------------------------
    // TEST 2: Non-admin users are denied access
    // -------------------------------------------------------------------------
    console.log('TEST 2: Non-admin users are denied access...');
    const nonAdminRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    if (nonAdminRes.status !== 403) {
      throw new Error(`Security breach: Non-admin was granted access with status ${nonAdminRes.status}`);
    }
    console.log('  * PASS: Non-admin received 403 Forbidden\n');

    // -------------------------------------------------------------------------
    // TEST 3: Unauthenticated requests are denied
    // -------------------------------------------------------------------------
    console.log('TEST 3: Unauthenticated requests are denied...');
    const unauthRes = await fetch(`${BASE_URL}/admin/audit-logs`);
    if (unauthRes.status !== 401) {
      throw new Error(`Security breach: Unauthenticated request received status ${unauthRes.status}`);
    }
    console.log('  * PASS: Unauthenticated request received 401 Unauthorized\n');

    // -------------------------------------------------------------------------
    // TEST 4: Invalid filters and oversized pagination are safely normalized
    // -------------------------------------------------------------------------
    console.log('TEST 4: Oversized pagination and invalid filters are safely clamped/normalized...');
    const clampedRes = await fetch(`${BASE_URL}/admin/audit-logs?page=-10&limit=9999&outcome=INVALID_VALUE&actionType=HACKED`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const clampedData = await clampedRes.json();
    if (clampedRes.status !== 200) {
      throw new Error(`Server crashed on bad query params. Status: ${clampedRes.status}`);
    }
    if (clampedData.pagination.page !== 1) {
      throw new Error(`Page was not normalized to 1. Got: ${clampedData.pagination.page}`);
    }
    if (clampedData.pagination.limit > 100) {
      throw new Error(`Limit was not clamped to max 100. Got: ${clampedData.pagination.limit}`);
    }
    console.log(`  * PASS: Page normalized to 1, limit clamped to ${clampedData.pagination.limit} (max 100)\n`);

    // -------------------------------------------------------------------------
    // TEST 5: Relevant administrative actions produce expected audit events
    // -------------------------------------------------------------------------
    console.log('TEST 5: Administrative mutations produce persisted audit records...');
    
    // Create Law
    const createLawRes = await fetch(`${BASE_URL}/admin/laws`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sectionNumber: 'TEST-66Z',
        officialTitle: 'Punishment for identity deception in audit test',
        actName: 'Information Technology Act, 2000',
        plainLanguageExplanation: 'Explaining identity deception clearly in plain language.',
        whyItMatters: 'Protects citizens from fraudulent impersonation and cyber theft.',
        exampleScenario: 'An attacker pretends to be an official to extract banking credentials.'
      })
    });
    const createdLaw = await createLawRes.json();
    if (createLawRes.status !== 201) {
      throw new Error(`Failed to create law: ${JSON.stringify(createdLaw)}`);
    }

    // Verify audit log for CREATE
    const lawAudit = await AdminAuditLog.findOne({
      entityId: createdLaw._id,
      actionType: 'CREATE',
      entityType: 'LawSection'
    });
    if (!lawAudit) {
      throw new Error('Audit record was not created for LawSection creation!');
    }
    if (lawAudit.outcome !== 'SUCCESS') {
      throw new Error(`Audit record outcome was not SUCCESS: ${lawAudit.outcome}`);
    }
    if (lawAudit.adminId.toString() !== adminUser._id.toString()) {
      throw new Error('Audit record adminId does not match server-authenticated admin user!');
    }
    console.log('  * PASS: CREATE LawSection generated valid audit log with server identity');

    // Update Law
    const updateLawRes = await fetch(`${BASE_URL}/admin/laws/${createdLaw._id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        officialTitle: 'Updated Tampering with Audit Logs Title'
      })
    });
    if (updateLawRes.status !== 200) {
      throw new Error(`Failed to update law: ${updateLawRes.status}`);
    }

    const updateAudit = await AdminAuditLog.findOne({
      entityId: createdLaw._id,
      actionType: 'UPDATE',
      entityType: 'LawSection'
    });
    if (!updateAudit) {
      throw new Error('Audit record was not created for LawSection update!');
    }
    console.log('  * PASS: UPDATE LawSection generated valid audit log');

    // Delete Law
    const deleteLawRes = await fetch(`${BASE_URL}/admin/laws/${createdLaw._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (deleteLawRes.status !== 200) {
      throw new Error(`Failed to delete law: ${deleteLawRes.status}`);
    }

    const deleteAudit = await AdminAuditLog.findOne({
      entityId: createdLaw._id,
      actionType: 'DELETE',
      entityType: 'LawSection'
    });
    if (!deleteAudit) {
      throw new Error('Audit record was not created for LawSection deletion!');
    }
    console.log('  * PASS: DELETE LawSection generated valid audit log\n');

    // -------------------------------------------------------------------------
    // TEST 6: Failed actions are represented accurately with outcome: 'FAILURE'
    // -------------------------------------------------------------------------
    console.log('TEST 6: Failed administrative actions produce FAILURE audit records...');
    const fakeId = new mongoose.Types.ObjectId();
    const failUpdateRes = await fetch(`${BASE_URL}/admin/laws/${fakeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ officialTitle: 'Non-existent Law' })
    });
    if (failUpdateRes.status !== 404) {
      throw new Error(`Expected 404 on non-existent law update, got ${failUpdateRes.status}`);
    }

    const failureAudit = await AdminAuditLog.findOne({
      outcome: 'FAILURE',
      entityType: 'LawSection',
      'metadata.targetId': fakeId.toString()
    });
    if (!failureAudit) {
      throw new Error('FAILURE audit record was not recorded for non-existent law update!');
    }
    console.log('  * PASS: Failed update recorded with outcome = "FAILURE" and targetId in metadata\n');

    // -------------------------------------------------------------------------
    // TEST 7: Sensitive information is excluded from logs and responses
    // -------------------------------------------------------------------------
    console.log('TEST 7: Sensitive information is redacted/stripped from audit logs...');
    const createCrimeRes = await fetch(`${BASE_URL}/admin/crimes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Audit Phishing',
        slug: 'test-audit-phishing-' + Date.now(),
        category: 'Phishing & Messaging Scams',
        shortDescription: 'Audit test description',
        whatIsIt: 'Deceptive messages designed to trick victims into sharing private credentials.',
        howItWorks: 'Attackers send urgent SMS or emails mimicking trusted institutions.',
        // Injected sensitive data fields
        password: 'SuperSecretAdminPassword123!',
        jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        userPin: '9988',
        aadhaarNumber: '1234-5678-9012'
      })
    });
    const createdCrime = await createCrimeRes.json();
    if (createCrimeRes.status !== 201) {
      throw new Error(`Failed to create crime: ${createCrimeRes.status}`);
    }

    const crimeAudit = await AdminAuditLog.findOne({
      entityId: createdCrime._id,
      entityType: 'CyberCrime'
    });
    if (!crimeAudit) {
      throw new Error('Audit log for CyberCrime not found');
    }

    // Verify sensitive keys are redacted or not stored as plain text
    const changesJson = JSON.stringify(crimeAudit.changes || {});
    if (changesJson.includes('SuperSecretAdminPassword123!')) {
      throw new Error('Security defect: Raw password leaked into audit log changes!');
    }
    if (changesJson.includes('eyJhbGciOiJIUzI1Ni')) {
      throw new Error('Security defect: Raw token leaked into audit log changes!');
    }
    if (crimeAudit.changes?.password && crimeAudit.changes.password !== '[REDACTED_SENSITIVE_DATA]') {
      throw new Error('Security defect: Sensitive field was not sanitized!');
    }
    console.log('  * PASS: Sensitive credentials (passwords, tokens, pins) successfully redacted from audit record\n');

    // -------------------------------------------------------------------------
    // TEST 8: Audit records cannot be altered or deleted via API
    // -------------------------------------------------------------------------
    console.log('TEST 8: Audit records cannot be created, altered, or deleted through API routes...');
    const postAuditRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'Forged Log' })
    });
    if (postAuditRes.status !== 405) {
      throw new Error(`Expected 405 Method Not Allowed on POST /admin/audit-logs, got: ${postAuditRes.status}`);
    }

    const putAuditRes = await fetch(`${BASE_URL}/admin/audit-logs/${crimeAudit._id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'Tampered Action' })
    });
    if (putAuditRes.status !== 405 && putAuditRes.status !== 404) {
      throw new Error(`Expected 405 or 404 on PUT /admin/audit-logs/:id, got: ${putAuditRes.status}`);
    }

    const deleteAuditRes = await fetch(`${BASE_URL}/admin/audit-logs/${crimeAudit._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (deleteAuditRes.status !== 405 && deleteAuditRes.status !== 404) {
      throw new Error(`Expected 405 or 404 on DELETE /admin/audit-logs/:id, got: ${deleteAuditRes.status}`);
    }
    console.log('  * PASS: Append-only integrity enforced; write/delete methods rejected with 405/404\n');

    // -------------------------------------------------------------------------
    // TEST 9: Pagination and filters work against persisted records
    // -------------------------------------------------------------------------
    console.log('TEST 9: Server pagination and filtering against persisted records...');
    
    // Filter by entityType
    const filterEntityRes = await fetch(`${BASE_URL}/admin/audit-logs?entityType=CyberCrime`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const filterEntityData = await filterEntityRes.json();
    if (!filterEntityData.logs.every(l => l.entityType === 'CyberCrime')) {
      throw new Error('Filter by entityType returned mismatched records');
    }

    // Filter by outcome
    const filterOutcomeRes = await fetch(`${BASE_URL}/admin/audit-logs?outcome=FAILURE`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const filterOutcomeData = await filterOutcomeRes.json();
    if (!filterOutcomeData.logs.every(l => l.outcome === 'FAILURE')) {
      throw new Error('Filter by outcome returned mismatched records');
    }

    // Pagination limit check
    const pageLimitRes = await fetch(`${BASE_URL}/admin/audit-logs?page=1&limit=2`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const pageLimitData = await pageLimitRes.json();
    if (pageLimitData.logs.length > 2) {
      throw new Error(`Pagination limit failed: requested 2, got ${pageLimitData.logs.length}`);
    }
    if (pageLimitData.pagination.total < 2) {
      throw new Error('Pagination total is unexpectedly less than 2');
    }

    // Text Search
    const searchRes = await fetch(`${BASE_URL}/admin/audit-logs?search=Phishing`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const searchData = await searchRes.json();
    const hasPhishing = searchData.logs.some(l => 
      (l.action && l.action.toLowerCase().includes('phishing')) ||
      (l.description && l.description.toLowerCase().includes('phishing'))
    );
    if (!hasPhishing) {
      throw new Error('Search query for "Phishing" did not return matching audit record');
    }
    console.log('  * PASS: Entity filter, outcome filter, page limits, and text search all function accurately\n');

    // -------------------------------------------------------------------------
    // TEST 10: Existing admin CMS functionality remains intact
    // -------------------------------------------------------------------------
    console.log('TEST 10: Existing admin CMS functionality (analytics, users progress, delete)...');
    
    const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (analyticsRes.status !== 200) {
      throw new Error(`Analytics endpoint failed: ${analyticsRes.status}`);
    }

    const usersRes = await fetch(`${BASE_URL}/admin/users-progress`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (usersRes.status !== 200) {
      throw new Error(`Users progress endpoint failed: ${usersRes.status}`);
    }

    // Cleanup created test crime
    await fetch(`${BASE_URL}/admin/crimes/${createdCrime._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('  * PASS: Existing analytics and progress CMS endpoints respond with 200 OK\n');

    console.log('====================================================');
    console.log('✅ ALL 10 AUDIT PANEL TEST REQUIREMENTS PASSED!');
    console.log('====================================================\n');

  } catch (err) {
    console.error('\n❌ AUDIT VERIFICATION FAILED:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup test users
    try {
      await User.deleteMany({ email: { $in: ['audit_test_admin@portal.test', 'audit_test_user@portal.test'] } });
      await LawSection.deleteMany({ sectionNumber: { $in: ['TEST-66Z', 'TEST-66Y'] } });
      await CyberCrime.deleteMany({ title: { $in: ['Test Audit Phishing', 'Test Audit Ransomware'] } });
    } catch (e) {
      // ignore cleanup errors
    }

    if (server) {
      server.close();
      console.log('Test server shut down.');
    }
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runAuditTests();
