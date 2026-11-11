/**
 * Cyber Law Awareness Portal — Seed Execution & Credential Security Guard
 *
 * Enforces fail-closed protection across all database seed, reset, fixture, and
 * migration scripts:
 * 1. Prevents execution against production databases or unguarded remote clusters.
 * 2. Requires explicit strong administrator credentials (zero hardcoded fallbacks).
 * 3. Blocks automatic demo-user creation outside local development/test hosts.
 * 4. Prevents destructive resets on any non-local or non-development database.
 * 5. Never exposes credentials, password hashes, or raw URIs in logs or errors.
 */

const {
  KNOWN_PRODUCTION_NAMES,
  PROHIBITED_DATABASE_KEYWORDS,
  parseDatabaseTarget,
  assertApprovedStagingDatabase
} = require('./stagingDatabaseGuard');
const { redactMongoUri } = require('./stagingInitGuard');
const { maskEmail } = require('./stagingAdminProvisioner');
const { redactSensitiveText } = require('../utils/apiErrorResponder');

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const MIN_SEED_PASSWORD_LENGTH = 8;

const DISALLOWED_SEED_PASSWORDS = new Set([
  'adminpass123!',
  'userpass123!',
  'change_this_to_a_strong_staging_admin_password_123!',
  'change_this_password_in_development',
  'change_this_in_development',
  'password',
  'password123',
  'admin123',
  '12345678',
  'qwerty123'
]);

const DISALLOWED_PLACEHOLDER_EMAILS = new Set([
  'admin@cyberlawportal.test',
  'staging-admin@cyberlawportal.org'
]);

function isLocalDatabaseHost(host) {
  return typeof host === 'string' && LOCAL_HOSTS.has(host.trim().toLowerCase());
}

/**
 * Resolves explicit database URI without falling back to a hardcoded default DB.
 * Ensures scripts cannot silently connect to an unintended database.
 */
function resolveExplicitSeedUri(env = process.env) {
  if (env.NODE_ENV === 'test' && typeof env.MONGO_URI_TEST === 'string' && env.MONGO_URI_TEST.trim()) {
    return env.MONGO_URI_TEST.trim();
  }
  if (typeof env.MONGODB_URI === 'string' && env.MONGODB_URI.trim()) {
    return env.MONGODB_URI.trim();
  }
  if (typeof env.MONGO_URI === 'string' && env.MONGO_URI.trim()) {
    return env.MONGO_URI.trim();
  }
  return '';
}

/**
 * Validates required seed administrator credentials strictly from environment variables.
 * Never provides public fallback passwords or emails.
 */
function validateSeedAdminCredentials(env = process.env, { allowPlaceholderStagingEmailInDev = true } = {}) {
  const rawEmail = typeof env.ADMIN_EMAIL === 'string' ? env.ADMIN_EMAIL.trim().toLowerCase() : '';
  const rawPassword = typeof env.ADMIN_PASSWORD === 'string' ? env.ADMIN_PASSWORD : '';

  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    throw new Error(
      '[SEED SECURITY BLOCK] Explicit valid ADMIN_EMAIL environment variable is required. Public fallback admin identities are disabled.'
    );
  }

  if (env.NODE_ENV === 'production' && DISALLOWED_PLACEHOLDER_EMAILS.has(rawEmail)) {
    throw new Error(
      '[SEED SECURITY BLOCK] ADMIN_EMAIL cannot use a sample/documentation placeholder in production or staging.'
    );
  }

  if (!allowPlaceholderStagingEmailInDev && DISALLOWED_PLACEHOLDER_EMAILS.has(rawEmail)) {
    throw new Error(
      '[SEED SECURITY BLOCK] ADMIN_EMAIL uses a public documentation placeholder.'
    );
  }

  if (!rawPassword || !rawPassword.trim()) {
    throw new Error(
      '[SEED SECURITY BLOCK] Explicit ADMIN_PASSWORD environment variable is required. Public fallback passwords are disabled.'
    );
  }

  if (rawPassword.length < MIN_SEED_PASSWORD_LENGTH) {
    throw new Error(
      `[SEED SECURITY BLOCK] ADMIN_PASSWORD must be at least ${MIN_SEED_PASSWORD_LENGTH} characters long.`
    );
  }

  if (DISALLOWED_SEED_PASSWORDS.has(rawPassword.trim().toLowerCase())) {
    throw new Error(
      '[SEED SECURITY BLOCK] ADMIN_PASSWORD uses a known insecure/default fallback password. Supply a unique strong password.'
    );
  }

  return {
    email: rawEmail,
    maskedEmail: maskEmail(rawEmail),
    password: rawPassword
  };
}

/**
 * Validates target environment, database URI, and operational safety before connecting/seeding.
 *
 * @param {Object} options
 * @param {Object} [options.env]
 * @param {boolean} [options.isReset=false]
 * @param {string} [options.connectedDbName=''] - Runtime connection.name when already connected (e.g. MongoMemoryServer in test mode)
 * @param {boolean} [options.allowReset=true] - Whether caller permits reset in dev mode
 * @returns {{ targetUri: string, redactedUri: string, host: string, dbName: string, isLocalHost: boolean, allowDemoUser: boolean }}
 */
function validateSeedExecutionTarget({
  env = process.env,
  isReset = false,
  connectedDbName = '',
  allowReset = true
} = {}) {
  const targetUri = resolveExplicitSeedUri(env);
  if (!targetUri) {
    throw new Error(
      '[SEED SECURITY BLOCK] Missing explicit database URI (MONGODB_URI / MONGO_URI, or MONGO_URI_TEST in test mode). Refusing implicit localhost fallback.'
    );
  }

  const parsed = parseDatabaseTarget(targetUri);
  if (!parsed.valid) {
    throw new Error(`[SEED SECURITY BLOCK] Invalid database URI: ${redactSensitiveText(parsed.error)}`);
  }

  const host = (parsed.host || '').toLowerCase();
  const isLocal = isLocalDatabaseHost(host);
  const dbName = (parsed.dbName || (env.NODE_ENV === 'test' && isLocal ? connectedDbName : '') || '').trim();

  if (!dbName) {
    throw new Error(
      '[SEED SECURITY BLOCK] Database name is missing in URI pathname. Refusing silent root cluster default.'
    );
  }

  const lowerDb = dbName.toLowerCase();

  // Check prohibited production keywords in any environment
  for (const kw of PROHIBITED_DATABASE_KEYWORDS) {
    if (lowerDb.includes(kw)) {
      throw new Error(
        `[SEED SECURITY BLOCK] Target database "${dbName}" contains prohibited keyword "${kw}". Refusing seed operation.`
      );
    }
  }

  // Known production database names are strictly blocked on remote hosts and in production
  if ((!isLocal || env.NODE_ENV === 'production') && KNOWN_PRODUCTION_NAMES.has(lowerDb)) {
    throw new Error(
      `[SEED SECURITY BLOCK] Refusing seed execution against production database "${dbName}".`
    );
  }

  // Production environment safeguard:
  // General/legacy seed scripts are prohibited against production; only explicitly approved staging targets
  // (ASSERT_STAGING_DB=true + approved staging allowlist, non-reset) are permitted.
  if (env.NODE_ENV === 'production') {
    if (isReset || env.ALLOW_DB_RESET === 'true') {
      throw new Error(
        '[SEED SECURITY BLOCK] Destructive database resets are strictly prohibited when NODE_ENV=production.'
      );
    }
    if (env.ASSERT_STAGING_DB !== 'true') {
      throw new Error(
        '[SEED SECURITY BLOCK] Seed execution is blocked when NODE_ENV=production unless explicitly targeting an approved staging database with ASSERT_STAGING_DB=true.'
      );
    }
    assertApprovedStagingDatabase(targetUri, {
      expectedDbName: env.EXPECTED_STAGING_DB_NAME,
      expectedHost: env.EXPECTED_STAGING_HOST
    });
  }

  // Remote host safeguard in ANY environment (prevents accidental local dev seed against remote Atlas)
  if (!isLocal) {
    if (isReset || env.ALLOW_DB_RESET === 'true') {
      throw new Error(
        '[SEED SECURITY BLOCK] Destructive resets are strictly prohibited against remote/cloud databases.'
      );
    }
    if (env.ASSERT_STAGING_DB !== 'true') {
      throw new Error(
        `[SEED SECURITY BLOCK] Refusing seed against remote host "${host}" without explicit ASSERT_STAGING_DB=true staging approval.`
      );
    }
    assertApprovedStagingDatabase(targetUri, {
      expectedDbName: env.EXPECTED_STAGING_DB_NAME,
      expectedHost: env.EXPECTED_STAGING_HOST
    });
  }

  // Reset guard (must be explicit local development + ALLOW_DB_RESET=true + allowReset)
  if (isReset) {
    if (!allowReset) {
      throw new Error('[SEED SECURITY BLOCK] Destructive reset mode is disabled for this script.');
    }
    if (env.NODE_ENV !== 'development' || env.ALLOW_DB_RESET !== 'true' || !isLocal) {
      throw new Error(
        '[SEED SECURITY BLOCK] Destructive database reset requires NODE_ENV=development, ALLOW_DB_RESET=true, and a local database host.'
      );
    }
  }

  // Demo users may ONLY be auto-created on local development/test hosts, never production or staging
  const isStagingFlag = env.ASSERT_STAGING_DB === 'true' || env.NODE_ENV === 'staging';
  const allowDemoUser = env.NODE_ENV !== 'production' && !isStagingFlag && isLocal;

  return {
    targetUri,
    redactedUri: redactMongoUri(targetUri),
    host,
    dbName,
    isLocalHost: isLocal,
    allowDemoUser
  };
}

module.exports = {
  LOCAL_HOSTS,
  MIN_SEED_PASSWORD_LENGTH,
  DISALLOWED_SEED_PASSWORDS,
  isLocalDatabaseHost,
  resolveExplicitSeedUri,
  validateSeedAdminCredentials,
  validateSeedExecutionTarget
};
