/**
 * Cyber Law Awareness Portal — Strict Staging Initialization Guard
 *
 * Enforces mandatory fail-closed environment and URI validation BEFORE any
 * MongoDB driver call is initiated by staging initialization, verification,
 * or rollback utilities.
 *
 * Security Invariants:
 * 1. Never reads local .env files; requires explicit environment variables.
 * 2. Requires ASSERT_STAGING_DB === 'true' and EXPECTED_STAGING_DB_NAME === 'cyber_law_staging'.
 * 3. Requires explicit non-local EXPECTED_STAGING_HOST matching the parsed Atlas host.
 * 4. Rejects missing URIs, localhost fallbacks, production names, and prohibited keywords.
 * 5. Never prints or embeds raw credentials or unmasked URIs in errors/logs.
 */

const {
  parseDatabaseTarget,
  assertApprovedStagingDatabase
} = require('./stagingDatabaseGuard');

const REQUIRED_STAGING_DB_NAME = 'cyber_law_staging';
const DISALLOWED_LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0'
]);

/**
 * Redacts credentials from any MongoDB connection string for safe diagnostics.
 * @param {string} rawUri
 * @returns {string}
 */
function redactMongoUri(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') return '<missing>';
  const parsed = parseDatabaseTarget(rawUri);
  if (!parsed.valid) return '<unparseable-uri>';
  return `${parsed.scheme}://****:****@${parsed.host}/${parsed.dbName || ''}`;
}

/**
 * Validates that the caller environment satisfies all mandatory staging-only
 * initialization preconditions. Throws immediately (fail-closed) on any gap.
 *
 * @param {Object} env - Process environment map (defaults to process.env)
 * @param {Object} options - Optional strictness controls for offline unit tests
 * @returns {{ approved: true, scheme: string, host: string, dbName: string, redactedUri: string }}
 */
function assertStrictStagingInitEnvironment(env = process.env, options = {}) {
  const { requireSrv = true } = options;

  if (!env || typeof env !== 'object') {
    throw new Error('[STAGING INIT GUARD] Environment object is missing.');
  }

  // Block initialization if destructive reset flag is active in shell
  if (env.ALLOW_DB_RESET === 'true') {
    throw new Error(
      '[STAGING INIT GUARD] Refusing staging initialization while ALLOW_DB_RESET=true is set in environment.'
    );
  }

  // 1. Explicit staging assertion flag
  if (env.ASSERT_STAGING_DB !== 'true') {
    throw new Error(
      '[STAGING INIT GUARD] ASSERT_STAGING_DB must be explicitly set to "true". Aborting before connection.'
    );
  }

  // 2. Explicit expected staging database name (exact match)
  const expectedDb = typeof env.EXPECTED_STAGING_DB_NAME === 'string'
    ? env.EXPECTED_STAGING_DB_NAME.trim()
    : '';
  if (expectedDb !== REQUIRED_STAGING_DB_NAME) {
    throw new Error(
      `[STAGING INIT GUARD] EXPECTED_STAGING_DB_NAME must equal "${REQUIRED_STAGING_DB_NAME}". Found "${expectedDb || '<unset>'}".`
    );
  }

  // 3. Explicit expected Atlas cluster hostname (mandatory for staging init)
  const expectedHost = typeof env.EXPECTED_STAGING_HOST === 'string'
    ? env.EXPECTED_STAGING_HOST.trim().toLowerCase()
    : '';
  if (!expectedHost) {
    throw new Error(
      '[STAGING INIT GUARD] EXPECTED_STAGING_HOST is mandatory and must specify the exact Atlas cluster hostname.'
    );
  }
  if (DISALLOWED_LOCAL_HOSTS.has(expectedHost)) {
    throw new Error(
      `[STAGING INIT GUARD] EXPECTED_STAGING_HOST "${expectedHost}" points to a local host. Atlas staging host required.`
    );
  }

  // 4. Explicit connection URI (never fall back to localhost or .env files)
  const rawUri = typeof env.MONGODB_URI === 'string' && env.MONGODB_URI.trim()
    ? env.MONGODB_URI.trim()
    : (typeof env.MONGO_URI === 'string' && env.MONGO_URI.trim() ? env.MONGO_URI.trim() : '');

  if (!rawUri) {
    throw new Error(
      '[STAGING INIT GUARD] Explicit MONGODB_URI environment variable is required. Refusing local .env or localhost fallback.'
    );
  }

  const parsed = parseDatabaseTarget(rawUri);
  if (!parsed.valid) {
    throw new Error(`[STAGING INIT GUARD] Invalid MONGODB_URI format: ${parsed.error}`);
  }

  if (requireSrv && parsed.scheme !== 'mongodb+srv') {
    throw new Error(
      `[STAGING INIT GUARD] Atlas staging requires an encrypted SRV URI scheme ("mongodb+srv://"), got "${parsed.scheme}://".`
    );
  }

  if (DISALLOWED_LOCAL_HOSTS.has((parsed.host || '').toLowerCase())) {
    throw new Error(
      `[STAGING INIT GUARD] Refusing local/loopback connection target "${parsed.host}" during staging initialization.`
    );
  }

  // 5. Delegate final fail-closed DB name, keyword blocklist, and host verification
  const verified = assertApprovedStagingDatabase(rawUri, {
    expectedDbName: REQUIRED_STAGING_DB_NAME,
    expectedHost
  });

  return {
    approved: true,
    scheme: parsed.scheme,
    host: verified.host,
    dbName: verified.dbName,
    redactedUri: redactMongoUri(rawUri)
  };
}

module.exports = {
  REQUIRED_STAGING_DB_NAME,
  DISALLOWED_LOCAL_HOSTS,
  redactMongoUri,
  assertStrictStagingInitEnvironment
};

