/**
 * Cyber Law Awareness Portal — Dedicated Staging Administrator Provisioner
 *
 * Safely provisions a single dedicated administrator User document in the
 * staging database (`cyber_law_staging` on `cluster0.xxeclfp.mongodb.net`)
 * without seeding dev accounts, creating UserProgress, or modifying existing
 * learner records.
 *
 * Security & Boundary Invariants:
 * - Zero implicit `.env` loading; enforces assertStrictStagingInitEnvironment().
 * - Requires exact target database (`cyber_law_staging`) and Atlas host.
 * - Uses shared Mongoose singleton, ALL_MODELS, and assertModelsBoundToConnection.
 * - Uses bcryptjs with work factor 10 matching authController.register().
 * - Aborts fail-closed before writes if any admin exists or email collides.
 * - Post-write verification asserts exactly one admin, active status, role,
 *   and untouched learner User / UserProgress counts.
 */

const bcrypt = require('bcryptjs');
const { assertStrictStagingInitEnvironment } = require('./stagingInitGuard');
const {
  mongoose,
  ALL_MODELS,
  assertModelsBoundToConnection
} = require('./stagingInitializerEngine');
const { escapeRegex } = require('../utils/regexUtils');

const REQUIRED_STAGING_DB_NAME = 'cyber_law_staging';
const REQUIRED_STAGING_HOST = 'cluster0.xxeclfp.mongodb.net';
const BCRYPT_WORK_FACTOR = 10;
const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_ADMIN_FULL_NAME = 'Staging Administrator';

const DISALLOWED_PLACEHOLDER_PASSWORDS = new Set([
  'adminpass123!',
  'change_this_to_a_strong_staging_admin_password_123!',
  'change_this_password_in_development',
  'change_this_in_development',
  'password',
  'password123',
  'admin123',
  '12345678'
]);

/**
 * Masks an email address so logs never reveal full administrator identity.
 * @param {string} rawEmail
 * @returns {string}
 */
function maskEmail(rawEmail) {
  if (typeof rawEmail !== 'string' || !rawEmail.includes('@')) {
    return '***';
  }
  const [localPart = '', domainPart = ''] = rawEmail.trim().toLowerCase().split('@');
  if (!localPart || !domainPart) {
    return '***';
  }
  const visiblePrefix = localPart.length <= 1
    ? '*'
    : (localPart.length <= 3 ? `${localPart[0]}***` : `${localPart.slice(0, 2)}***`);
  return `${visiblePrefix}@${domainPart}`;
}

/**
 * Reads and validates administrator provisioning credentials strictly from
 * process environment variables (no defaults, no `.env` reading).
 *
 * @param {Object} env
 * @returns {{ email: string, maskedEmail: string, password: string, fullName: string }}
 */
function validateStagingAdminCredentials(env = process.env) {
  if (!env || typeof env !== 'object') {
    throw new Error('[STAGING ADMIN GUARD] Environment object is missing.');
  }

  const rawEmail = typeof env.ADMIN_EMAIL === 'string' && env.ADMIN_EMAIL.trim()
    ? env.ADMIN_EMAIL
    : (typeof env.STAGING_ADMIN_EMAIL === 'string' ? env.STAGING_ADMIN_EMAIL : '');

  if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
    throw new Error(
      '[STAGING ADMIN GUARD] ADMIN_EMAIL environment variable is required.'
    );
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error(
      '[STAGING ADMIN GUARD] ADMIN_EMAIL must be a valid email address.'
    );
  }

  const rawPassword = typeof env.ADMIN_PASSWORD === 'string' && env.ADMIN_PASSWORD.length > 0
    ? env.ADMIN_PASSWORD
    : (typeof env.STAGING_ADMIN_PASSWORD === 'string' ? env.STAGING_ADMIN_PASSWORD : '');

  if (typeof rawPassword !== 'string' || !rawPassword.trim()) {
    throw new Error(
      '[STAGING ADMIN GUARD] ADMIN_PASSWORD environment variable is required.'
    );
  }

  if (rawPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `[STAGING ADMIN GUARD] ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    );
  }

  if (DISALLOWED_PLACEHOLDER_PASSWORDS.has(rawPassword.trim().toLowerCase())) {
    throw new Error(
      '[STAGING ADMIN GUARD] ADMIN_PASSWORD uses a known insecure placeholder. Provide a unique strong password.'
    );
  }

  const rawFullName = typeof env.ADMIN_FULL_NAME === 'string' && env.ADMIN_FULL_NAME.trim()
    ? env.ADMIN_FULL_NAME.trim()
    : DEFAULT_ADMIN_FULL_NAME;

  return {
    email: normalizedEmail,
    maskedEmail: maskEmail(normalizedEmail),
    password: rawPassword,
    fullName: rawFullName
  };
}

/**
 * Enforces strict staging init guard PLUS exact staging database (`cyber_law_staging`)
 * and exact expected Atlas host (`cluster0.xxeclfp.mongodb.net`).
 *
 * @param {Object} env
 * @param {Object} [options]
 * @returns {{ approved: true, scheme: string, host: string, dbName: string, redactedUri: string }}
 */
function validateStagingAdminEnvironment(env = process.env, options = {}) {
  const {
    expectedHost = REQUIRED_STAGING_HOST,
    requireSrv = true
  } = options;

  const guardResult = assertStrictStagingInitEnvironment(env, { requireSrv });

  if (guardResult.dbName !== REQUIRED_STAGING_DB_NAME) {
    throw new Error(
      `[STAGING ADMIN GUARD] Database "${guardResult.dbName}" does not match required "${REQUIRED_STAGING_DB_NAME}".`
    );
  }

  if (guardResult.host.toLowerCase() !== expectedHost.toLowerCase()) {
    throw new Error(
      `[STAGING ADMIN GUARD] Cluster host "${guardResult.host}" does not match required Atlas host "${expectedHost}".`
    );
  }

  return guardResult;
}

/**
 * Verifies post-connect runtime database name and cluster host before any User query.
 *
 * @param {Object} activeMongoose
 * @param {string} expectedDbName
 * @param {string} expectedHost
 */
function verifyConnectedStagingTarget(
  activeMongoose = mongoose,
  expectedDbName = REQUIRED_STAGING_DB_NAME,
  expectedHost = REQUIRED_STAGING_HOST
) {
  const conn = activeMongoose?.connection;
  if (!conn) {
    throw new Error('[STAGING ADMIN GUARD] Active Mongoose connection object is missing.');
  }

  const connectedDbName = conn.name || '';
  const connectedHost = conn.host || '';
  const clientOpts = conn.client?.options || conn.client?.s?.options || {};
  const srvHost = clientOpts.srvHost || null;

  if (connectedDbName !== expectedDbName) {
    throw new Error(
      `[STAGING ADMIN GUARD] Connected database "${connectedDbName}" does not match expected "${expectedDbName}". Aborting before queries.`
    );
  }

  const expectedClusterDomain = expectedHost.includes('.')
    ? expectedHost.split('.').slice(1).join('.')
    : expectedHost;

  if (srvHost && srvHost.toLowerCase() !== expectedHost.toLowerCase()) {
    throw new Error(
      `[STAGING ADMIN GUARD] Connected cluster SRV host "${srvHost}" does not match expected "${expectedHost}". Aborting before queries.`
    );
  }

  if (connectedHost && !connectedHost.toLowerCase().includes(expectedClusterDomain.toLowerCase())) {
    throw new Error(
      `[STAGING ADMIN GUARD] Connected node host "${connectedHost}" does not match expected cluster "${expectedHost}". Aborting before queries.`
    );
  }

  if (!srvHost && !connectedHost) {
    throw new Error(
      `[STAGING ADMIN GUARD] Unable to verify connected cluster host against "${expectedHost}". Aborting before queries.`
    );
  }

  return {
    connectedDbName,
    connectedHost,
    srvHost: srvHost || connectedHost
  };
}

/**
 * Mongoose User/UserProgress read + single-admin create store strictly bound to
 * the shared singleton connection (zero deletes, zero UserProgress writes).
 */
const PROVISION_LOCK_COLLECTION = 'staging_admin_provision_locks';
const DEFAULT_LOCK_KEY = 'staging_admin_bootstrap';

function createMongooseAdminUserStore(activeMongoose = mongoose, models = ALL_MODELS) {
  const targetModels = {
    User: models.User,
    UserProgress: models.UserProgress
  };
  const writeAudit = {
    adminUserIds: [],
    nonAdminUserWrites: 0,
    userProgressWrites: 0
  };
  let lockIndexReady = false;

  async function getLockCollection() {
    assertModelsBoundToConnection(activeMongoose, targetModels);
    const col = activeMongoose.connection.collection(PROVISION_LOCK_COLLECTION);
    if (!lockIndexReady) {
      await col.createIndex({ lockKey: 1 }, { unique: true });
      lockIndexReady = true;
    }
    return col;
  }

  return {
    getWriteAudit() {
      return {
        adminUserIds: [...writeAudit.adminUserIds],
        nonAdminUserWrites: writeAudit.nonAdminUserWrites,
        userProgressWrites: writeAudit.userProgressWrites
      };
    },

    async acquireProvisionLock({ lockKey = DEFAULT_LOCK_KEY, ownerRunId, maskedEmail }) {
      const col = await getLockCollection();
      try {
        await col.insertOne({
          lockKey,
          ownerRunId,
          maskedEmail,
          status: 'IN_PROGRESS',
          acquiredAt: new Date()
        });
      } catch (err) {
        if (err && err.code === 11000) {
          throw new Error(
            '[CONCURRENT PROVISIONING CONFLICT] Staging administrator provisioning lock is already held or completed. Refusing concurrent admin creation.'
          );
        }
        throw err;
      }
    },

    async completeProvisionLock({ lockKey = DEFAULT_LOCK_KEY, ownerRunId, adminId }) {
      const col = await getLockCollection();
      await col.updateOne(
        { lockKey, ownerRunId },
        { $set: { status: 'COMPLETED', adminId: String(adminId), completedAt: new Date() } }
      );
    },

    async releaseProvisionLock({ lockKey = DEFAULT_LOCK_KEY, ownerRunId }) {
      const col = await getLockCollection();
      await col.deleteOne({ lockKey, ownerRunId, status: 'IN_PROGRESS' });
    },

    async findAdmins() {
      assertModelsBoundToConnection(activeMongoose, targetModels);
      return targetModels.User.find({ role: 'admin' })
        .select('_id email role isActive createdAt')
        .lean();
    },

    async findByEmailCaseInsensitive(normalizedEmail) {
      assertModelsBoundToConnection(activeMongoose, targetModels);
      return targetModels.User.find({
        $or: [
          { email: normalizedEmail },
          { email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') }
        ]
      })
        .select('_id email role isActive')
        .lean();
    },

    async countUsers() {
      assertModelsBoundToConnection(activeMongoose, targetModels);
      return targetModels.User.countDocuments({});
    },

    async countLearners() {
      assertModelsBoundToConnection(activeMongoose, targetModels);
      return targetModels.User.countDocuments({ role: 'user' });
    },

    async countUserProgress() {
      assertModelsBoundToConnection(activeMongoose, targetModels);
      return targetModels.UserProgress.countDocuments({});
    },

    async createAdminUser(payload) {
      assertModelsBoundToConnection(activeMongoose, targetModels);

      const candidate = new targetModels.User(payload);
      const validationError = candidate.validateSync();
      if (validationError) {
        throw new Error(`[SCHEMA VALIDATION ERROR] ${validationError.message}`);
      }

      const created = await targetModels.User.create(payload);
      if (created.role === 'admin') {
        writeAudit.adminUserIds.push(created._id);
      } else {
        writeAudit.nonAdminUserWrites += 1;
      }

      return {
        _id: created._id,
        fullName: created.fullName,
        email: created.email,
        role: created.role,
        isActive: created.isActive
      };
    }
  };
}

/**
 * Executes the strict pre-checks, single-admin creation, and post-insert verification.
 *
 * @param {Object} params
 * @param {Object} [params.env]
 * @param {Object} params.store
 * @param {{ dbName: string, host: string }} [params.guardResult]
 * @param {boolean} [params.dryRun]
 * @returns {Promise<Object>}
 */
async function provisionStagingAdmin({
  env = process.env,
  store,
  guardResult,
  dryRun = false
}) {
  if (!store) {
    throw new Error('[STAGING ADMIN ERROR] User store adapter is required.');
  }

  const credentials = validateStagingAdminCredentials(env);
  const targetDb = guardResult?.dbName || REQUIRED_STAGING_DB_NAME;
  const targetHost = guardResult?.host || REQUIRED_STAGING_HOST;

  // 1. Confirm zero existing admin accounts
  const existingAdmins = await store.findAdmins();
  if (existingAdmins.length > 0) {
    const maskedExisting = existingAdmins.map((a) => maskEmail(a.email)).join(', ');
    throw new Error(
      `[PRECONDITION ABORT] ${existingAdmins.length} existing administrator account(s) detected (${maskedExisting}). Refusing creation.`
    );
  }

  // 2. Confirm supplied email does not already belong to any existing account
  const emailCollisions = await store.findByEmailCaseInsensitive(credentials.email);
  if (emailCollisions.length > 0) {
    throw new Error(
      `[PRECONDITION ABORT] Email "${credentials.maskedEmail}" already belongs to an existing account (role=${emailCollisions[0].role}). Refusing creation.`
    );
  }

  // Record baseline protected counts (existing learners & UserProgress must stay untouched)
  const preTotalUsers = await store.countUsers();
  const preLearnerCount = await store.countLearners();
  const preProgressCount = await store.countUserProgress();

  if (dryRun) {
    return {
      status: 'DRY_RUN_READY',
      database: targetDb,
      host: targetHost,
      maskedEmail: credentials.maskedEmail,
      role: 'admin',
      isActive: true,
      preTotalUsers,
      preLearnerCount,
      preProgressCount,
      verification: 'DRY_RUN_SKIPPED'
    };
  }

  // 3. Acquire atomic unique provisioning lock BEFORE creating any privileged account (#48)
  const ownerRunId = `prov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const hasLockSupport = typeof store.acquireProvisionLock === 'function';
  if (hasLockSupport) {
    await store.acquireProvisionLock({
      lockKey: DEFAULT_LOCK_KEY,
      ownerRunId,
      maskedEmail: credentials.maskedEmail
    });
  }

  let created = null;
  try {
    // Re-check inside lock to catch non-locked pre-existing admins
    const lockedExistingAdmins = await store.findAdmins();
    if (lockedExistingAdmins.length > 0) {
      const maskedExisting = lockedExistingAdmins.map((a) => maskEmail(a.email)).join(', ');
      throw new Error(
        `[PRECONDITION ABORT] ${lockedExistingAdmins.length} existing administrator account(s) detected (${maskedExisting}). Refusing creation.`
      );
    }

    // 4. Hash password with bcryptjs using identical cost factor as authController.register (10)
    const passwordHash = await bcrypt.hash(credentials.password, BCRYPT_WORK_FACTOR);

    // 5. Insert strictly one administrator User document (never touch UserProgress)
    const userPayload = {
      fullName: credentials.fullName,
      email: credentials.email,
      passwordHash,
      role: 'admin',
      isActive: true
    };

    created = await store.createAdminUser(userPayload);
    if (!created || !created._id) {
      throw new Error('[VERIFICATION ERROR] Administrator creation did not return a persisted record.');
    }

    if (hasLockSupport && typeof store.completeProvisionLock === 'function') {
      await store.completeProvisionLock({
        lockKey: DEFAULT_LOCK_KEY,
        ownerRunId,
        adminId: created._id
      });
    }
  } catch (err) {
    if (!created && hasLockSupport && typeof store.releaseProvisionLock === 'function') {
      try {
        await store.releaseProvisionLock({ lockKey: DEFAULT_LOCK_KEY, ownerRunId });
      } catch (_releaseErr) {
        // Ignore cleanup failure when surfacing primary provisioning error
      }
    }
    throw err;
  }

  // 5. Re-query database directly to verify post-insertion invariants scoped to this operation
  const postAdmins = await store.findAdmins();
  if (postAdmins.length !== 1) {
    throw new Error(
      `[VERIFICATION ERROR] Expected exactly 1 administrator account after insertion, found ${postAdmins.length}.`
    );
  }

  const verifiedAdmin = postAdmins.find((a) => String(a._id) === String(created._id));
  if (!verifiedAdmin) {
    throw new Error(
      `[VERIFICATION ERROR] Provisioned administrator ID "${created._id}" was not found during post-insert verification.`
    );
  }

  if (verifiedAdmin.role !== 'admin') {
    throw new Error(
      `[VERIFICATION ERROR] Provisioned administrator role mismatch: expected "admin", got "${verifiedAdmin.role}".`
    );
  }

  if (verifiedAdmin.isActive !== true) {
    throw new Error(
      `[VERIFICATION ERROR] Provisioned administrator isActive mismatch: expected true, got "${verifiedAdmin.isActive}".`
    );
  }

  if (String(verifiedAdmin.email || '').trim().toLowerCase() !== credentials.email) {
    throw new Error(
      `[VERIFICATION ERROR] Provisioned administrator email mismatch: expected "${credentials.maskedEmail}", got "${maskEmail(verifiedAdmin.email)}".`
    );
  }

  const writeAudit = typeof store.getWriteAudit === 'function' ? store.getWriteAudit() : null;
  if (writeAudit) {
    if (
      writeAudit.nonAdminUserWrites > 0 ||
      writeAudit.userProgressWrites > 0 ||
      writeAudit.adminUserIds.length !== 1 ||
      String(writeAudit.adminUserIds[0]) !== String(created._id)
    ) {
      throw new Error(
        `[DATA BOUNDARY VIOLATION] Unexpected non-admin or UserProgress writes recorded during admin provisioning (nonAdminUserWrites=${writeAudit.nonAdminUserWrites}, userProgressWrites=${writeAudit.userProgressWrites}).`
      );
    }
  }

  const postLearnerCount = await store.countLearners();
  const postProgressCount = await store.countUserProgress();

  return {
    status: 'PROVISIONED_AND_VERIFIED',
    database: targetDb,
    host: targetHost,
    maskedEmail: maskEmail(verifiedAdmin.email),
    role: verifiedAdmin.role,
    isActive: verifiedAdmin.isActive,
    adminCount: postAdmins.length,
    existingLearnersPreserved: postLearnerCount,
    userProgressPreserved: postProgressCount,
    verification: 'PASSED'
  };
}

module.exports = {
  REQUIRED_STAGING_DB_NAME,
  REQUIRED_STAGING_HOST,
  BCRYPT_WORK_FACTOR,
  MIN_PASSWORD_LENGTH,
  DEFAULT_ADMIN_FULL_NAME,
  DISALLOWED_PLACEHOLDER_PASSWORDS,
  maskEmail,
  validateStagingAdminCredentials,
  validateStagingAdminEnvironment,
  verifyConnectedStagingTarget,
  createMongooseAdminUserStore,
  provisionStagingAdmin
};

