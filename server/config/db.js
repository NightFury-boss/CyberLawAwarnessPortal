const mongoose = require('mongoose');
const { redactSensitiveText } = require('../utils/apiErrorResponder');
const {
  parseDatabaseTarget,
  assertApprovedStagingDatabase,
  APPROVED_STAGING_DATABASE_NAMES
} = require('./stagingDatabaseGuard');

let listenersAttached = false;

const getDatabaseUri = () => {
  if (process.env.NODE_ENV === 'test' && process.env.MONGO_URI_TEST) {
    return process.env.MONGO_URI_TEST;
  }
  return process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/cyber_law_portal';
};

// Helper to safely obfuscate connection string secrets for logging
const getObfuscatedURI = (uri) => {
  return redactSensitiveText(uri || '');
};

/**
 * Checks whether a database name refers to a staging/test target that must never
 * be connected by an unguarded production server process.
 */
function isStagingDatabaseTarget(dbName) {
  if (!dbName || typeof dbName !== 'string') return false;
  const lowerDb = dbName.trim().toLowerCase();
  if (!lowerDb) return false;
  if (APPROVED_STAGING_DATABASE_NAMES.has(lowerDb)) {
    return true;
  }
  return lowerDb.includes('staging') || /(?:^|[_-])(?:stage|test)(?:$|[_-])/.test(lowerDb);
}

/**
 * Validates runtime MongoDB connection policy before calling mongoose.connect().
 * - Approved staging mode (including Render staging with NODE_ENV=production + ASSERT_STAGING_DB="true")
 *   enforces assertApprovedStagingDatabase.
 * - Reverse production guard rejects staging/test targets and cluster-root defaults whenever
 *   NODE_ENV=production without ASSERT_STAGING_DB="true".
 */
function assertDatabaseConnectionPolicy(targetUri, env = process.env) {
  const nodeEnv = typeof env.NODE_ENV === 'string' ? env.NODE_ENV.trim().toLowerCase() : '';
  const assertStagingDb = env.ASSERT_STAGING_DB === 'true';
  const expectedStagingDbName = typeof env.EXPECTED_STAGING_DB_NAME === 'string'
    ? env.EXPECTED_STAGING_DB_NAME.trim()
    : '';

  if (assertStagingDb || (nodeEnv !== 'production' && expectedStagingDbName)) {
    return assertApprovedStagingDatabase(targetUri, {
      expectedDbName: expectedStagingDbName || undefined,
      expectedHost: env.EXPECTED_STAGING_HOST
    });
  }

  if (nodeEnv === 'production') {
    if (expectedStagingDbName) {
      throw new Error(
        '[PRODUCTION DATABASE GUARD] Refusing startup: EXPECTED_STAGING_DB_NAME is set in NODE_ENV=production without ASSERT_STAGING_DB="true".'
      );
    }

    const parsed = parseDatabaseTarget(targetUri);
    if (!parsed.valid) {
      throw new Error(
        `[PRODUCTION DATABASE GUARD] Refusing startup with invalid database URI: ${redactSensitiveText(parsed.error)}`
      );
    }

    if (!parsed.dbName) {
      throw new Error(
        '[PRODUCTION DATABASE GUARD] Refusing production connection without an explicit database name in URI pathname.'
      );
    }

    if (isStagingDatabaseTarget(parsed.dbName)) {
      throw new Error(
        `[PRODUCTION DATABASE GUARD] Refusing production connection to staging database target "${parsed.dbName}" without approved staging configuration (ASSERT_STAGING_DB="true").`
      );
    }
  }

  return null;
}

/**
 * Formats runtime Mongoose connection errors with credentials, tokens, and hashes stripped.
 */
function formatRuntimeConnectionError(error) {
  const safeName = error?.name ? String(error.name) : 'Error';
  const safeCode = error?.code ? ` code=${String(error.code)}` : '';
  const safeMsg = redactSensitiveText(error?.message || String(error || 'Unknown connection error'));
  return `[Database] Mongoose runtime connection error [${safeName}${safeCode}]: ${safeMsg}`;
}

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('[Database] Mongoose successfully connected to DB cluster.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(formatRuntimeConnectionError(err));
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose connection lost/disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] Mongoose successfully reconnected to the cluster.');
  });
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  const targetUri = getDatabaseUri();

  // Enforce forward staging guard and reverse production database guard prior to connecting
  assertDatabaseConnectionPolicy(targetUri, process.env);

  console.log(`[Database] Attempting connection to target host: ${getObfuscatedURI(targetUri)}`);

  // Event Listeners for robust monitoring (idempotent registration)
  attachConnectionListeners();

  try {
    const conn = await mongoose.connect(targetUri, {
      family: 4 // Force IPv4 resolution to prevent DNS issues on modern dual-stack networks
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('\n=========================================');
    console.error('[DATABASE CONNECTION CRITICAL FAILURE]');
    console.error(`Error Message: ${redactSensitiveText(error.message)}`);
    console.error('-----------------------------------------');
    console.error('TROUBLESHOOTING CHECKLIST:');
    console.error('1. Whitelist Current IP: Ensure your IP is added to the Network Access whitelist in MongoDB Atlas.');
    console.error('2. Open Port 27017: Ensure outgoing port 27017 is not blocked by local firewalls or VPNs.');
    console.error('3. Check URI: Ensure the MONGODB_URI in server/.env is fully correct and contains the correct user password.');
    console.error('4. Check Local Mongo: If running locally, make sure the mongod service is running.');
    console.error('=========================================\n');
    process.exit(1);
  }
};

connectDB.isStagingDatabaseTarget = isStagingDatabaseTarget;
connectDB.assertDatabaseConnectionPolicy = assertDatabaseConnectionPolicy;
connectDB.formatRuntimeConnectionError = formatRuntimeConnectionError;
connectDB.attachConnectionListeners = attachConnectionListeners;

module.exports = connectDB;
