/**
 * @file dbIsolationGuards.test.js
 * @description Unit Test Suite for Test Database Isolation Guards, Fail-Closed Rules,
 * and Deterministic Checksum Snapshot Integrity.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test } = require('node:test');
const {
  canonicalStringify,
  calculateCollectionHash,
  validateTestEnvironment
} = require('../utils/dbSnapshotHash');

// -------------------------------------------------------------
// TESTS
// -------------------------------------------------------------

test('Database Isolation Guards: Fail-closed validation rules', () => {
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

    // 2. Must fail if MONGO_URI_TEST is missing or empty
    process.env.NODE_ENV = 'test';
    delete process.env.MONGO_URI_TEST;
    assert.throws(() => validateTestEnvironment(), /MONGO_URI_TEST is required/);

    process.env.MONGO_URI_TEST = '   ';
    assert.throws(() => validateTestEnvironment(), /MONGO_URI_TEST is required/);

    // 3. Must fail if MONGO_URI_TEST matches MONGO_URI
    process.env.MONGO_URI = 'mongodb+srv://user:pass@cluster0.mongodb.net/cyber_law';
    process.env.MONGO_URI_TEST = 'mongodb+srv://user:pass@cluster0.mongodb.net/cyber_law';
    assert.throws(() => validateTestEnvironment(), /MONGO_URI_TEST must not match MONGO_URI/);

    // 4. Must fail if MONGO_URI_TEST contains production keywords
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/cyber_dev';
    process.env.MONGO_URI_TEST = 'mongodb+srv://user:pass@cluster0.mongodb.net/cyber_prod';
    assert.throws(() => validateTestEnvironment(), /forbidden production keyword/);

    // 5. Must pass with valid dedicated test URI and NODE_ENV=test
    delete process.env.MONGO_URI;
    process.env.MONGO_URI_TEST = 'mongodb://127.0.0.1:27017/cyber_law_test_isolated';
    const valid = validateTestEnvironment();
    assert.strictEqual(valid, 'mongodb://127.0.0.1:27017/cyber_law_test_isolated');
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

  // REGRESSION CHECK 1: Unchanged collection with permuted keys & array order must match
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
      scores: { UA: 75, FP: 80, DQ: 90, VB: 65, SI: 70, TR: 85 },
      title: 'Baseline Assessment Session',
      _id: 'doc-001'
    }
  ];

  const permutedHash = calculateCollectionHash(permutedCollection);
  assert.strictEqual(
    permutedHash,
    baseHash,
    'Unchanged collection must produce identical checksum regardless of object key order or array order'
  );

  // REGRESSION CHECK 2: Deep nested field modification must change checksum
  const modifiedCollection = JSON.parse(JSON.stringify(baseCollection));
  modifiedCollection[0].scores.TR = 86; // single score point change
  const modifiedHash = calculateCollectionHash(modifiedCollection);
  assert.notStrictEqual(
    modifiedHash,
    baseHash,
    'Checksum must detect field-level score mutation'
  );

  const deeplyModifiedCollection = JSON.parse(JSON.stringify(baseCollection));
  deeplyModifiedCollection[0].history[0].action = 'MUTATED_ACTION';
  const deeplyModifiedHash = calculateCollectionHash(deeplyModifiedCollection);
  assert.notStrictEqual(
    deeplyModifiedHash,
    baseHash,
    'Checksum must detect deep nested array object field mutation'
  );

  // REGRESSION CHECK 3: Document insertion must change checksum
  const insertedCollection = [
    ...baseCollection,
    { _id: 'doc-003', title: 'Intruder Document', scores: {} }
  ];
  const insertedHash = calculateCollectionHash(insertedCollection);
  assert.notStrictEqual(
    insertedHash,
    baseHash,
    'Checksum must detect document insertion'
  );

  // REGRESSION CHECK 4: Document deletion must change checksum
  const deletedCollection = [baseCollection[0]];
  const deletedHash = calculateCollectionHash(deletedCollection);
  assert.notStrictEqual(
    deletedHash,
    baseHash,
    'Checksum must detect document deletion'
  );
});

test('Authoritative Storage Key Verification: cl_counterfactual_completed_slugs contract', () => {
  const storageFilePath = path.resolve(__dirname, '../../client/src/utils/counterfactualStorage.js');
  const storageCode = fs.readFileSync(storageFilePath, 'utf8');

  assert.ok(
    storageCode.includes("'cl_counterfactual_completed_slugs'"),
    'Authoritative storage file must define STORAGE_KEY as cl_counterfactual_completed_slugs'
  );

  assert.ok(
    !storageCode.includes('cyber_portal_cf_completions'),
    'Obsolete key cyber_portal_cf_completions must not exist in counterfactualStorage.js'
  );
});
