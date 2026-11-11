#!/usr/bin/env node

/**
 * Cyber Law Awareness Portal — Dedicated Staging Administrator Provisioning CLI
 *
 * Provisions strictly ONE dedicated administrator User account in the staging
 * Atlas database (`cyber_law_staging` on `cluster0.xxeclfp.mongodb.net`).
 *
 * Security & Boundary Guarantees:
 * - Zero implicit `.env` loading; enforces assertStrictStagingInitEnvironment().
 * - Requires explicit staging target (`cyber_law_staging` / `cluster0.xxeclfp.mongodb.net`).
 * - Accepts credentials strictly via ADMIN_EMAIL & ADMIN_PASSWORD env vars.
 * - Never creates UserProgress, never modifies learners, never invokes seed.js.
 * - Verifies post-insert state and prints only masked/non-sensitive metadata.
 *
 * Usage:
 *   node scripts/createStagingAdmin.js [--dry-run]
 */

const {
  mongoose,
  assertModelsBoundToConnection
} = require('../server/config/stagingInitializerEngine');
const {
  validateStagingAdminEnvironment,
  validateStagingAdminCredentials,
  verifyConnectedStagingTarget,
  createMongooseAdminUserStore,
  provisionStagingAdmin
} = require('../server/config/stagingAdminProvisioner');

async function runCli(argv = process.argv.slice(2), deps = {}) {
  const isDryRun = argv.includes('--dry-run');

  console.log('======================================================================');
  console.log('CYBER LAW AWARENESS PORTAL — STAGING ADMIN PROVISIONING');
  console.log(`Mode: ${isDryRun ? 'DRY_RUN' : 'EXECUTE'}`);
  console.log('======================================================================');

  // 1. Fail-closed pre-connection guard & credential validation (never loads .env)
  const guardResult = validateStagingAdminEnvironment(process.env);
  const credPreview = validateStagingAdminCredentials(process.env);

  console.log('\n[1/4] Staging Guards & Credential Format: PASSED');
  console.log(`  Target Database : ${guardResult.dbName}`);
  console.log(`  Target Cluster  : ${guardResult.host}`);
  console.log(`  Sanitized Target: ${guardResult.redactedUri}`);
  console.log(`  Admin Email     : ${credPreview.maskedEmail}`);

  const rawUri = (process.env.MONGODB_URI || process.env.MONGO_URI).trim();

  try {
    // 2. Connect using single shared Mongoose singleton & verify all 17 model bindings
    await mongoose.connect(rawUri, {
      family: 4,
      serverSelectionTimeoutMS: 10000
    });
    assertModelsBoundToConnection(mongoose);

    const verifiedTarget = verifyConnectedStagingTarget(
      mongoose,
      guardResult.dbName,
      guardResult.host
    );

    console.log('\n[2/4] Runtime Database & Model Binding: PASSED');
    console.log(`  Connected DB    : ${verifiedTarget.connectedDbName}`);
    console.log(`  Verified Host   : ${verifiedTarget.srvHost}`);

    // 3. Execute pre-checks, single-admin insert, and post-insert DB verification
    const store = deps.store || createMongooseAdminUserStore();
    const result = await provisionStagingAdmin({
      env: process.env,
      store,
      guardResult,
      dryRun: isDryRun
    });

    console.log('\n[3/4] Provisioning & Verification Summary:');
    console.log(`  Masked Email    : ${result.maskedEmail}`);
    console.log(`  Role            : ${result.role}`);
    console.log(`  Active Status   : ${result.isActive}`);
    console.log(`  Database        : ${result.database}`);
    console.log(`  Verification    : ${result.verification}`);

    if (isDryRun) {
      console.log(`  Existing Users  : ${result.preTotalUsers} (learners=${result.preLearnerCount}, UserProgress=${result.preProgressCount})`);
      console.log('\n[4/4] Status: DRY_RUN_READY (Zero writes executed)');
    } else {
      console.log(`  Admin Count     : ${result.adminCount}`);
      console.log(`  Learners Intact : ${result.existingLearnersPreserved} (UserProgress=${result.userProgressPreserved})`);
      console.log(`\n[4/4] Status: ${result.status}`);
    }

    return result;
  } catch (err) {
    console.error(`\n[ADMIN PROVISION ERROR] ${err.message}`);
    err._loggedBeforeTeardown = true;
    throw err;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Database] Disconnected cleanly.');
    }
  }
}

if (require.main === module) {
  runCli()
    .then(() => process.exit(0))
    .catch((err) => {
      if (!err?._loggedBeforeTeardown) {
        console.error(`\n[ADMIN PROVISION ERROR] ${err.message}`);
      }
      process.exit(1);
    });
}

module.exports = {
  mongoose,
  runCli
};

