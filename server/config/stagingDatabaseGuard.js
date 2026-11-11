/**
 * Cyber Law Awareness Portal — Staging Database Guard
 * 
 * Enforces fail-closed validation of database connection targets to guarantee
 * that smoke tests and staging operations CANNOT connect to or mutate production data.
 */

const APPROVED_STAGING_DATABASE_NAMES = new Set([
  'cyber_law_staging',
  'cyberlaw_staging',
  'cyber_law_portal_staging',
  'cyber_law_test',
  'cyberlaw_test',
  'cyber_law_portal_test'
]);

const PROHIBITED_DATABASE_KEYWORDS = [
  'prod',
  'production',
  'live',
  'master',
  'primary'
];

const KNOWN_PRODUCTION_NAMES = new Set([
  'cyber_law_portal',
  'cyberlaw_portal',
  'cyber_law_portal_prod',
  'cyber_law_prod'
]);

/**
 * Extracts and sanitizes target host and database name without exposing credentials.
 * 
 * @param {string} rawUri - Connection string
 * @returns {{ valid: boolean, scheme?: string, host?: string, dbName?: string, error?: string }}
 */
function parseDatabaseTarget(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') {
    return { valid: false, error: 'Database connection URI is missing, empty, or not a string.' };
  }

  const trimmed = rawUri.trim();

  // Validate scheme
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    return { valid: false, error: 'Invalid MongoDB connection scheme. Must begin with mongodb:// or mongodb+srv://' };
  }

  // Mask credentials before URL parsing to prevent URL parse errors or credential leaks
  let sanitized = trimmed;
  if (sanitized.includes('@')) {
    const parts = sanitized.split('@');
    const scheme = parts[0].split('://')[0];
    sanitized = `${scheme}://hidden_auth@${parts.slice(1).join('@')}`;
  }

  try {
    const url = new URL(sanitized);
    const host = url.hostname;
    const pathname = (url.pathname || '').replace(/^\//, '');
    const dbName = pathname.split('?')[0].trim();

    return {
      valid: true,
      scheme: url.protocol.replace(':', ''),
      host,
      dbName
    };
  } catch (err) {
    return { valid: false, error: `Malformed connection string: ${err.message}` };
  }
}

/**
 * Evaluates whether a database connection target is an explicitly approved staging database.
 * Fail-closed: only explicitly approved names pass.
 * 
 * @param {string} rawUri - Target connection URI
 * @param {Object} options - Custom validation options
 * @returns {{ approved: boolean, reason?: string, host?: string, dbName?: string }}
 */
function validateStagingDatabaseTarget(rawUri, options = {}) {
  const parsed = parseDatabaseTarget(rawUri);

  if (!parsed.valid) {
    return { approved: false, reason: parsed.error };
  }

  const { host, dbName } = parsed;

  // 1. Database name MUST be explicitly present
  if (!dbName) {
    return {
      approved: false,
      reason: 'Database name is missing in connection URI path. Smoke tests refuse to run against cluster root default.',
      host
    };
  }

  const lowerDb = dbName.toLowerCase();

  // 2. Reject known production names regardless of any other setting
  if (KNOWN_PRODUCTION_NAMES.has(lowerDb)) {
    return {
      approved: false,
      reason: `FATAL: Target database "${dbName}" is identified as a production database. Smoke tests aborted.`,
      host,
      dbName
    };
  }

  // 3. Reject any database containing production keywords
  for (const keyword of PROHIBITED_DATABASE_KEYWORDS) {
    if (lowerDb.includes(keyword)) {
      return {
        approved: false,
        reason: `FATAL: Target database "${dbName}" contains prohibited keyword "${keyword}". Refusing connection.`,
        host,
        dbName
      };
    }
  }

  // 4. Verify database against explicit whitelist or configured expected name
  const expectedName = options.expectedDbName || process.env.EXPECTED_STAGING_DB_NAME;
  let isNameApproved = false;

  if (expectedName) {
    isNameApproved = lowerDb === expectedName.toLowerCase();
    if (!isNameApproved) {
      return {
        approved: false,
        reason: `Target database "${dbName}" does not match explicitly configured EXPECTED_STAGING_DB_NAME ("${expectedName}").`,
        host,
        dbName
      };
    }
  } else {
    isNameApproved = APPROVED_STAGING_DATABASE_NAMES.has(lowerDb);
    if (!isNameApproved) {
      return {
        approved: false,
        reason: `Target database "${dbName}" is not on the approved staging database whitelist. Approved: [${Array.from(APPROVED_STAGING_DATABASE_NAMES).join(', ')}]`,
        host,
        dbName
      };
    }
  }

  // 5. Host validation if expected cluster or host is specified
  const expectedHost = options.expectedHost || process.env.EXPECTED_STAGING_HOST;
  if (expectedHost && host.toLowerCase() !== expectedHost.toLowerCase()) {
    return {
      approved: false,
      reason: `Target host "${host}" does not match expected staging cluster "${expectedHost}".`,
      host,
      dbName
    };
  }

  return {
    approved: true,
    host,
    dbName
  };
}

/**
 * Asserts that the database connection URI targets an approved staging database.
 * Throws a fatal Error if validation fails.
 * 
 * @param {string} rawUri - Target connection string
 * @param {Object} options - Custom options
 */
function assertApprovedStagingDatabase(rawUri, options = {}) {
  const result = validateStagingDatabaseTarget(rawUri, options);
  if (!result.approved) {
    throw new Error(`[STAGING DATABASE GUARD CRITICAL REJECTION] ${result.reason}`);
  }
  return result;
}

module.exports = {
  parseDatabaseTarget,
  validateStagingDatabaseTarget,
  assertApprovedStagingDatabase,
  APPROVED_STAGING_DATABASE_NAMES,
  KNOWN_PRODUCTION_NAMES,
  PROHIBITED_DATABASE_KEYWORDS
};

