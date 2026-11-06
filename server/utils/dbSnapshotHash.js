/**
 * @file dbSnapshotHash.js
 * @description Deterministic canonical serialization, SHA-256 snapshot hashing,
 * and fail-closed test environment validation for test database isolation.
 */

const crypto = require('crypto');

/**
 * Strict approved test database name allowlist.
 * Suffix-based arbitrary database naming is strictly rejected.
 * Only explicitly listed, vetted test database names are permitted.
 */
const APPROVED_TEST_DB_NAMES = Object.freeze([
  'cyber_law_test_isolated',
  'cyber_law_test'
]);

/**
 * Approved isolated test hosts.
 * Tests must execute only against local loopback daemons.
 * Remote clusters, cloud databases, and staging IPs are strictly prohibited.
 */
const APPROVED_TEST_HOSTS = Object.freeze([
  '127.0.0.1',
  'localhost'
]);

/**
 * Sanitizes a MongoDB connection URI for safe logging by redacting credentials.
 * @param {string} uri 
 * @returns {string} Redacted URI string
 */
function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

/**
 * Extracts the database name from a standard or SRV MongoDB connection URI.
 * @param {string} uri 
 * @returns {string} Database name or empty string
 */
function extractDatabaseName(uri) {
  if (!uri || typeof uri !== 'string') return '';
  try {
    const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, '');
    const slashIdx = withoutProtocol.indexOf('/');
    if (slashIdx === -1) return '';
    const afterSlash = withoutProtocol.slice(slashIdx + 1);
    const questionIdx = afterSlash.indexOf('?');
    return questionIdx !== -1 ? afterSlash.slice(0, questionIdx).trim() : afterSlash.trim();
  } catch {
    return '';
  }
}

/**
 * Extracts the host from a standard or SRV MongoDB connection URI.
 * @param {string} uri 
 * @returns {string} Host string or empty string
 */
function extractHost(uri) {
  if (!uri || typeof uri !== 'string') return '';
  try {
    const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, '');
    const withoutAuth = withoutProtocol.replace(/^[^:]+:[^@]+@/, '');
    const slashIdx = withoutAuth.indexOf('/');
    const hostPort = slashIdx !== -1 ? withoutAuth.slice(0, slashIdx) : withoutAuth;
    const colonIdx = hostPort.indexOf(':');
    return colonIdx !== -1 ? hostPort.slice(0, colonIdx).trim() : hostPort.trim();
  } catch {
    return '';
  }
}

/**
 * Deterministic recursive canonical serialization.
 * - Recursively sorts object keys alphabetically at all nesting levels.
 * - Preserves array element ordering (array sequence is semantically significant).
 * - Distinguishes undefined ('undefined') from null ('null') so they are not conflated.
 * - Uniformly serializes Date objects to ISO string format.
 * - Uniformly serializes MongoDB BSON ObjectId instances to their canonical hex strings.
 * - Omits no document fields.
 * 
 * @param {*} val 
 * @returns {string} Canonical JSON-like serialization string
 */
function canonicalStringify(val) {
  if (val === null) {
    return 'null';
  }
  if (val === undefined) {
    return 'undefined';
  }
  if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'string') {
    return JSON.stringify(val);
  }
  if (val instanceof Date) {
    return JSON.stringify(`Date(${val.toISOString()})`);
  }
  // Check for BSON ObjectId or Mongoose ObjectId
  if (
    val &&
    (val._bsontype === 'ObjectID' ||
      val._bsontype === 'ObjectId' ||
      (val.constructor && (val.constructor.name === 'ObjectId' || val.constructor.name === 'ObjectID')) ||
      (typeof val.toHexString === 'function' && typeof val.getTimestamp === 'function'))
  ) {
    return JSON.stringify(`ObjectId(${val.toString()})`);
  }
  if (Array.isArray(val)) {
    return '[' + val.map(canonicalStringify).join(',') + ']';
  }
  if (typeof val === 'object') {
    let plainObj = val;
    if (typeof val.toObject === 'function') {
      plainObj = val.toObject();
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
 * 
 * @param {Array<Object>|Object} documents 
 * @returns {string} SHA-256 hexadecimal hash
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
 * Throws immediately if:
 * 1. NODE_ENV !== 'test'.
 * 2. MONGO_URI_TEST is missing or empty.
 * 3. MONGO_URI_TEST matches MONGO_URI (production collision).
 * 4. MONGO_URI_TEST contains forbidden production/staging keywords.
 * 5. Host is not in the approved test host allowlist (127.0.0.1, localhost).
 * 6. Database name is not in the strict APPROVED_TEST_DB_NAMES allowlist.
 *    (Suffix-only arbitrary database naming is strictly rejected).
 * 
 * @returns {string} Validated test URI
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

  const trimmedTestUri = testUri.trim();
  const prodUri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : null;

  if (prodUri && trimmedTestUri === prodUri) {
    throw new Error('FAIL-CLOSED ISOLATION VIOLATION: MONGO_URI_TEST must not match MONGO_URI.');
  }

  const forbiddenProductionKeywords = ['cluster0', 'mongodb.net', 'prod', 'production', 'live', 'staging'];
  for (const keyword of forbiddenProductionKeywords) {
    if (trimmedTestUri.toLowerCase().includes(keyword) && !trimmedTestUri.toLowerCase().includes('test')) {
      throw new Error(`FAIL-CLOSED ISOLATION VIOLATION: MONGO_URI_TEST contains forbidden production keyword: '${keyword}'`);
    }
  }

  const host = extractHost(trimmedTestUri);
  if (!host || !APPROVED_TEST_HOSTS.includes(host.toLowerCase())) {
    throw new Error(
      `FAIL-CLOSED ISOLATION VIOLATION: MONGO_URI_TEST host "${host}" is not in the approved test host allowlist (${APPROVED_TEST_HOSTS.join(', ')}). Remote clusters and unvetted hosts are strictly prohibited.`
    );
  }

  const dbName = extractDatabaseName(trimmedTestUri);
  if (!dbName) {
    throw new Error('FAIL-CLOSED ISOLATION VIOLATION: Could not parse database name from MONGO_URI_TEST.');
  }

  if (!APPROVED_TEST_DB_NAMES.includes(dbName.toLowerCase())) {
    throw new Error(
      `FAIL-CLOSED ISOLATION VIOLATION: Database name "${dbName}" in MONGO_URI_TEST is not in the approved test database allowlist (${APPROVED_TEST_DB_NAMES.join(', ')}). Suffix-based arbitrary database names are strictly rejected.`
    );
  }

  return trimmedTestUri;
}

module.exports = {
  canonicalStringify,
  calculateCollectionHash,
  validateTestEnvironment,
  sanitizeMongoUri,
  extractDatabaseName,
  extractHost,
  APPROVED_TEST_DB_NAMES,
  APPROVED_TEST_HOSTS
};
