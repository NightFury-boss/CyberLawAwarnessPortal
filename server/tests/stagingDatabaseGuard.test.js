/**
 * Cyber Law Awareness Portal — Staging Database Guard Offline Verification Suite
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseDatabaseTarget,
  validateStagingDatabaseTarget,
  assertApprovedStagingDatabase,
  APPROVED_STAGING_DATABASE_NAMES
} = require('../config/stagingDatabaseGuard');

describe('Staging Database Guard: Fail-Closed Isolation Verification', () => {
  it('1. parseDatabaseTarget correctly extracts host and dbName while masking credentials', () => {
    const raw = 'mongodb+srv://stage_user:SuperSecretPassword123@cluster0.abcde.mongodb.net/cyber_law_staging?retryWrites=true&w=majority';
    const parsed = parseDatabaseTarget(raw);
    assert.equal(parsed.valid, true);
    assert.equal(parsed.scheme, 'mongodb+srv');
    assert.equal(parsed.host, 'cluster0.abcde.mongodb.net');
    assert.equal(parsed.dbName, 'cyber_law_staging');
    assert.equal(JSON.stringify(parsed).includes('SuperSecretPassword123'), false);
  });

  it('2. Rejects empty, missing, or malformed connection strings', () => {
    assert.equal(validateStagingDatabaseTarget('').approved, false);
    assert.equal(validateStagingDatabaseTarget(null).approved, false);
    assert.equal(validateStagingDatabaseTarget('postgres://localhost/db').approved, false);
  });

  it('3. Rejects URIs with missing database name in pathname', () => {
    const res = validateStagingDatabaseTarget('mongodb+srv://user:pass@cluster.mongodb.net/');
    assert.equal(res.approved, false);
    assert.match(res.reason, /Database name is missing/i);
  });

  it('4. Rejects known production database names with fatal block', () => {
    const prodNames = ['cyber_law_portal', 'cyberlaw_portal', 'cyber_law_prod'];
    for (const name of prodNames) {
      const uri = `mongodb+srv://admin:pass@cluster.mongodb.net/${name}?retryWrites=true`;
      const res = validateStagingDatabaseTarget(uri);
      assert.equal(res.approved, false);
      assert.match(res.reason, /production database/i);
      assert.throws(() => assertApprovedStagingDatabase(uri), /production database/i);
    }
  });

  it('5. Rejects any database containing prohibited keywords (prod, live, master)', () => {
    const badNames = ['cyber_law_production_backup', 'live_data', 'master_db', 'app_prod'];
    for (const name of badNames) {
      const uri = `mongodb://127.0.0.1:27017/${name}`;
      const res = validateStagingDatabaseTarget(uri);
      assert.equal(res.approved, false);
      assert.match(res.reason, /prohibited keyword/i);
    }
  });

  it('6. Rejects unapproved names not in approved whitelist (fail-closed)', () => {
    const unapproved = ['my_random_db', 'cyberlaw_temp', 'staging_db_unapproved'];
    for (const name of unapproved) {
      const uri = `mongodb://127.0.0.1:27017/${name}`;
      const res = validateStagingDatabaseTarget(uri);
      assert.equal(res.approved, false);
      assert.match(res.reason, /not on the approved staging database whitelist/i);
    }
  });

  it('7. Accepts explicitly approved staging database names', () => {
    for (const approvedName of APPROVED_STAGING_DATABASE_NAMES) {
      const uri = `mongodb+srv://stage_user:pass@staging-cluster.mongodb.net/${approvedName}?retryWrites=true`;
      const res = validateStagingDatabaseTarget(uri);
      assert.equal(res.approved, true);
      assert.equal(res.dbName, approvedName);
      assert.equal(res.host, 'staging-cluster.mongodb.net');
      assert.doesNotThrow(() => assertApprovedStagingDatabase(uri));
    }
  });

  it('8. Enforces expected host match when expectedHost option is supplied', () => {
    const uri = 'mongodb+srv://user:pass@staging-cluster-1.mongodb.net/cyber_law_staging';
    const mismatch = validateStagingDatabaseTarget(uri, { expectedHost: 'staging-cluster-2.mongodb.net' });
    assert.equal(mismatch.approved, false);
    assert.match(mismatch.reason, /does not match expected staging cluster/i);

    const match = validateStagingDatabaseTarget(uri, { expectedHost: 'staging-cluster-1.mongodb.net' });
    assert.equal(match.approved, true);
  });

  it('9. Enforces EXPECTED_STAGING_DB_NAME environment variable restriction over broad whitelist', () => {
    const originalEnv = process.env.EXPECTED_STAGING_DB_NAME;
    try {
      process.env.EXPECTED_STAGING_DB_NAME = 'cyber_law_staging';
      // cyber_law_test is on broad whitelist, but should be rejected because EXPECTED_STAGING_DB_NAME is set
      const uri = 'mongodb+srv://user:pass@staging-cluster.mongodb.net/cyber_law_test';
      const res = validateStagingDatabaseTarget(uri);
      assert.equal(res.approved, false);
      assert.match(res.reason, /does not match explicitly configured EXPECTED_STAGING_DB_NAME/i);

      // cyber_law_staging matches
      const matchUri = 'mongodb+srv://user:pass@staging-cluster.mongodb.net/cyber_law_staging';
      const matchRes = validateStagingDatabaseTarget(matchUri);
      assert.equal(matchRes.approved, true);
    } finally {
      if (originalEnv !== undefined) process.env.EXPECTED_STAGING_DB_NAME = originalEnv;
      else delete process.env.EXPECTED_STAGING_DB_NAME;
    }
  });

  it('10. Enforces EXPECTED_STAGING_HOST environment variable restriction', () => {
    const originalEnv = process.env.EXPECTED_STAGING_HOST;
    try {
      process.env.EXPECTED_STAGING_HOST = 'staging-cluster.mongodb.net';
      const mismatchUri = 'mongodb+srv://user:pass@rogue-cluster.mongodb.net/cyber_law_staging';
      const res = validateStagingDatabaseTarget(mismatchUri);
      assert.equal(res.approved, false);
      assert.match(res.reason, /does not match expected staging cluster/i);

      const matchUri = 'mongodb+srv://user:pass@staging-cluster.mongodb.net/cyber_law_staging';
      const matchRes = validateStagingDatabaseTarget(matchUri);
      assert.equal(matchRes.approved, true);
    } finally {
      if (originalEnv !== undefined) process.env.EXPECTED_STAGING_HOST = originalEnv;
      else delete process.env.EXPECTED_STAGING_HOST;
    }
  });
});

