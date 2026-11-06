/**
 * @file dbSnapshotHash.js
 * @description Deterministic canonical serialization, SHA-256 snapshot hashing,
 * and fail-closed test environment validation for test database isolation.
 */

const crypto = require('crypto');

/**
 * Deterministic recursive canonical serialization.
 * Recursively sorts object keys at all nesting levels and handles primitives,
 * arrays, dates, and MongoDB BSON ObjectIds uniformly without omitting fields.
 */
function canonicalStringify(val) {
  if (val === null || val === undefined) {
    return 'null';
  }
  if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'string') {
    return JSON.stringify(val);
  }
  if (val instanceof Date) {
    return JSON.stringify(val.toISOString());
  }
  if (Array.isArray(val)) {
    return '[' + val.map(canonicalStringify).join(',') + ']';
  }
  if (typeof val === 'object') {
    let plainObj = val;
    if (typeof val.toObject === 'function') {
      plainObj = val.toObject();
    } else if (val._bsontype === 'ObjectID' || val._bsontype === 'ObjectId') {
      return JSON.stringify(val.toString());
    }
    const keys = Object.keys(plainObj).sort();
    const pairs = keys.map(k => `${JSON.stringify(k)}:${canonicalStringify(plainObj[k])}`);
    return '{' + pairs.join(',') + '}';
  }
  return JSON.stringify(String(val));
}

/**
 * Calculates a deterministic SHA-256 hash for an array or single document.
 * Documents are sorted by canonical _id before hashing.
 */
function calculateCollectionHash(documents) {
  const docsArray = Array.isArray(documents) ? documents : [documents];
  const sortedDocs = [...docsArray].sort((a, b) => {
    const idA = a && a._id ? (typeof a._id === 'object' ? a._id.toString() : String(a._id)) : '';
    const idB = b && b._id ? (typeof b._id === 'object' ? b._id.toString() : String(b._id)) : '';
    return idA.localeCompare(idB);
  });

  const canonicalJson = canonicalStringify(sortedDocs);
  return crypto.createHash('sha256').update(canonicalJson).digest('hex');
}

/**
 * Validates test environment and enforces fail-closed isolation rules.
 */
function validateTestEnvironment() {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== 'test') {
    throw new Error(`FAIL-CLOSED ISOLATION VIOLATION: Expected NODE_ENV === 'test', received '${nodeEnv}'`);
  }

  const testUri = process.env.MONGO_URI_TEST;
  if (!testUri || !testUri.trim()) {
    throw new Error('FAIL-CLOSED ISOLATION VIOLATION: MONGO_URI_TEST is required and must be explicitly configured.');
  }

  const prodUri = process.env.MONGO_URI;
  if (prodUri && testUri.trim() === prodUri.trim()) {
    throw new Error('FAIL-CLOSED ISOLATION VIOLATION: MONGO_URI_TEST must not match MONGO_URI.');
  }

  const forbiddenProductionKeywords = ['cluster0', 'mongodb.net/cyber_law_prod', 'prod', 'production', 'live'];
  for (const keyword of forbiddenProductionKeywords) {
    if (testUri.toLowerCase().includes(keyword) && !testUri.toLowerCase().includes('test')) {
      throw new Error(`FAIL-CLOSED ISOLATION VIOLATION: MONGO_URI_TEST contains forbidden production keyword: '${keyword}'`);
    }
  }

  return testUri.trim();
}

module.exports = {
  canonicalStringify,
  calculateCollectionHash,
  validateTestEnvironment
};

