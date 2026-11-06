/**
 * @file dbIsolationGuards.test.js
 * @description Comprehensive Unit Test Suite for Test Database Isolation Guards,
 * Fail-Closed Environment Rules, Database Allowlist Validation, and Canonical Checksum Integrity.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test } = require('node:test');
const {
  canonicalStringify,
  calculateCollectionHash,
  validateTestEnvironment,
  sanitizeMongoUri,
  extractDatabaseName,
  APPROVED_TEST_DB_NAMES
} = require('../utils/dbSnapshotHash');

// -------------------------------------------------------------
// TESTS
// -------------------------------------------------------------

test('Database Isolation Guards: Fail-closed validation rules & DB allowlist', () => {
  const originalEnv = { ...process.env };

  try {
    // 1. Must fail if NODE_ENV !== 'test'
    process.env.NODE_ENV = 'production';
    process.env.MONGO_URI_TEST = 'mongodb://127.0.0.1:27017/cyber_law_test';
    assert.throws(() => validateTestEnvironment(), /Expected NODE_ENV === 'test'/);

    process.env.NODE_ENV = 'development';
    assert.throws(() => validateTestEnvironment(), /Expected NODE_ENV === 'test'/);

    delete process.env.NODE_ENV;
    assert.throws(() => validateTestEnvironment(), /Expected NODE_ENV === 'test'/);

    // 2. Must fail if MONGO_URI_TEST is missing or whitespace
    process.env.NODE_ENV = 'test';
    delete process.env.MONGO_URI_TEST;
    assert.throws(() => validateTestEnvironment(), /MONGO_URI_TEST is required/);

    process.env.MONGO_URI_TEST = '   ';
    assert.throws(() => validateTestEnvironment(), /MONGO_URI_TEST is required/);

    // 3. Must fail if MONGO_URI_TEST matches MONGO_URI (production collision)
    process.env.MONGO_URI = 'mongodb+srv://admin:pass@cluster0.mongodb.net/cyber_law';
    process.env.MONGO_URI_TEST = 'mongodb+srv://admin:pass@cluster0.mongodb.net/cyber_law';
    assert.throws(() => validateTestEnvironment(), /MONGO_URI_TEST must not match MONGO_URI/);

    // 4. Must fail if MONGO_URI_TEST contains forbidden production keywords
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/cyber_dev';
    process.env.MONGO_URI_TEST = 'mongodb+srv://admin:pass@cluster0.mongodb.net/cyber_prod';
    assert.throws(() => validateTestEnvironment(), /forbidden production keyword/);

    // 5. Must fail if database name in MONGO_URI_TEST is not allowlisted or lacks test suffix
    delete process.env.MONGO_URI;
    process.env.MONGO_URI_TEST = 'mongodb://127.0.0.1:27017/cyber_law_main';
    assert.throws(() => validateTestEnvironment(), /not in the approved test database allowlist/);

    process.env.MONGO_URI_TEST = 'mongodb://127.0.0.1:27017/admin';
    assert.throws(() => validateTestEnvironment(), /not in the approved test database allowlist/);

    // 6. Must pass with allowlisted database names
    for (const approvedName of APPROVED_TEST_DB_NAMES) {
      process.env.MONGO_URI_TEST = `mongodb://127.0.0.1:27017/${approvedName}`;
      const valid = validateTestEnvironment();
      assert.strictEqual(valid, `mongodb://127.0.0.1:27017/${approvedName}`);
    }

    // 7. Must pass with valid test suffix conventions (_test, _test_isolated)
    process.env.MONGO_URI_TEST = 'mongodb://127.0.0.1:27017/ephemeral_unit_test';
    assert.strictEqual(validateTestEnvironment(), 'mongodb://127.0.0.1:27017/ephemeral_unit_test');

    process.env.MONGO_URI_TEST = 'mongodb://127.0.0.1:27017/staging_run_isolated';
    assert.strictEqual(validateTestEnvironment(), 'mongodb://127.0.0.1:27017/staging_run_isolated');

    // 8. Sanitization check: Credential redaction
    const secretUri = 'mongodb://app_user:super_secret_pw@127.0.0.1:27017/cyber_law_test';
    const sanitized = sanitizeMongoUri(secretUri);
    assert.strictEqual(sanitized, 'mongodb://***:***@127.0.0.1:27017/cyber_law_test');
    assert.ok(!sanitized.includes('super_secret_pw'), 'Credentials must be redacted from sanitized URI');
  } finally {
    process.env = originalEnv;
  }
});

test('Collection Snapshot Integrity: Deterministic canonical hashing & mutation detection', () => {
  const baseCollection = [
    {
      _id: 'doc-001',
      title: 'Baseline Assessment Session',
      learner: { id: 'usr-123', email: 'e2e_learner_isolated@test.local' },
      scores: { TR: 85, SI: 70, VB: 65, DQ: 90, FP: 80, UA: 75 },
      history: [
        { step: 1, action: 'VERIFY_DISCOM', timestamp: new Date('2026-11-04T10:00:00Z') }
      ]
    },
    {
      _id: 'doc-002',
      title: 'Final Check Session',
      learner: { id: 'usr-123', email: 'e2e_learner_isolated@test.local' },
      scores: { TR: 95, SI: 85, VB: 80, DQ: 95, FP: 90, UA: 85 },
      history: []
    }
  ];

  const baseHash = calculateCollectionHash(baseCollection);
  assert.ok(baseHash && baseHash.length === 64, 'SHA-256 hash must be 64 hex characters');

  // REGRESSION CHECK 1: Key ordering invariance & document sort invariance
  const permutedCollection = [
    {
      scores: { UA: 85, FP: 90, DQ: 95, VB: 80, SI: 85, TR: 95 },
      title: 'Final Check Session',
      _id: 'doc-002',
      history: [],
      learner: { email: 'e2e_learner_isolated@test.local', id: 'usr-123' }
    },
    {
      history: [
        { timestamp: new Date('2026-11-04T10:00:00Z'), action: 'VERIFY_DISCOM', step: 1 }
      ],
      learner: { email: 'e2e_learner_isolated@test.local', id: 'usr-123' },
      scores: { FP: 80, DQ: 90, UA: 75, TR: 85, SI: 70, VB: 65 },
      title: 'Baseline Assessment Session',
      _id: 'doc-001'
    }
  ];
  const permutedHash = calculateCollectionHash(permutedCollection);
  assert.strictEqual(
    permutedHash,
    baseHash,
    'Regression Failure: Key ordering or document initial order must NOT alter canonical collection hash'
  );

  // REGRESSION CHECK 2: Array element ordering sensitivity (array sequence is semantically significant)
  const arrayOrderModified = [
    {
      _id: 'doc-arr',
      items: ['action_first', 'action_second']
    }
  ];
  const arrayOrderInverted = [
    {
      _id: 'doc-arr',
      items: ['action_second', 'action_first']
    }
  ];
  assert.notStrictEqual(
    calculateCollectionHash(arrayOrderModified),
    calculateCollectionHash(arrayOrderInverted),
    'Regression Failure: Array sequence mutation MUST change the checksum'
  );

  // REGRESSION CHECK 3: Nested scalar modification
  const mutatedScoreCollection = JSON.parse(JSON.stringify(baseCollection));
  mutatedScoreCollection[0].scores.TR = 95;
  const mutatedScoreHash = calculateCollectionHash(mutatedScoreCollection);
  assert.notStrictEqual(
    mutatedScoreHash,
    baseHash,
    'Regression Failure: Scalar field mutation MUST alter canonical collection hash'
  );

  // REGRESSION CHECK 4: Deep array action modification
  const mutatedActionCollection = JSON.parse(JSON.stringify(baseCollection));
  mutatedActionCollection[0].history[0].action = 'CALL_SCAMMER';
  const mutatedActionHash = calculateCollectionHash(mutatedActionCollection);
  assert.notStrictEqual(
    mutatedActionHash,
    baseHash,
    'Regression Failure: Deep array element mutation MUST alter canonical collection hash'
  );

  // REGRESSION CHECK 5: Document insertion
  const insertedCollection = [
    ...baseCollection,
    {
      _id: 'doc-003',
      title: 'Injected Session',
      scores: { TR: 50, SI: 50, VB: 50, DQ: 50, FP: 50, UA: 50 }
    }
  ];
  const insertedHash = calculateCollectionHash(insertedCollection);
  assert.notStrictEqual(
    insertedHash,
    baseHash,
    'Regression Failure: Document insertion MUST alter canonical collection hash'
  );

  // REGRESSION CHECK 6: Document deletion
  const deletedCollection = [baseCollection[0]];
  const deletedHash = calculateCollectionHash(deletedCollection);
  assert.notStrictEqual(
    deletedHash,
    baseHash,
    'Regression Failure: Document deletion MUST alter canonical collection hash'
  );

  // REGRESSION CHECK 7: Null vs Undefined distinctness (must NOT be silently conflated)
  const docWithNull = [{ _id: 'd1', field: null }];
  const docWithUndefined = [{ _id: 'd1', field: undefined }];
  const docWithoutField = [{ _id: 'd1' }];
  assert.notStrictEqual(
    calculateCollectionHash(docWithNull),
    calculateCollectionHash(docWithUndefined),
    'Regression Failure: null and undefined must produce distinct hashes'
  );
  assert.notStrictEqual(
    calculateCollectionHash(docWithNull),
    calculateCollectionHash(docWithoutField),
    'Regression Failure: field with null must not match missing field'
  );

  // REGRESSION CHECK 8: MongoDB ObjectId & Date handling
  const mockBsonObjectId = {
    _bsontype: 'ObjectID',
    toString: () => '64f1a2b3c4d5e6f7a8b9c0d1'
  };
  const mockDate = new Date('2026-11-06T12:00:00.000Z');
  const bsonDoc = [{ _id: mockBsonObjectId, createdAt: mockDate, tag: 'BSON_TEST' }];
  const bsonHash = calculateCollectionHash(bsonDoc);
  assert.ok(bsonHash && bsonHash.length === 64, 'BSON ObjectId and Date must serialize deterministically');
});

test('Authoritative Storage Key Verification: cl_counterfactual_completed_slugs contract', () => {
  const storageFilePath = path.resolve(__dirname, '../../client/src/utils/counterfactualStorage.js');
  assert.ok(fs.existsSync(storageFilePath), 'counterfactualStorage.js must exist');

  const content = fs.readFileSync(storageFilePath, 'utf8');

  // Verify authoritative key declaration
  assert.ok(
    content.includes("STORAGE_KEY = 'cl_counterfactual_completed_slugs'"),
    'Authoritative STORAGE_KEY must be exactly cl_counterfactual_completed_slugs'
  );

  // Verify legacy keys are NOT declared as authoritative storage targets
  assert.ok(
    !content.includes("STORAGE_KEY = 'cyber_portal_cf_completions'"),
    'Stale key cyber_portal_cf_completions must not be the active STORAGE_KEY'
  );
  assert.ok(
    !content.includes("STORAGE_KEY = 'counterfactual_completions'"),
    'Generic key counterfactual_completions must not be the active STORAGE_KEY'
  );
});
