#!/usr/bin/env node

/**
 * Cyber Law Awareness Portal — Safe Smoke-Test Orphan Recovery Utility
 * 
 * Safely inspects and purges synthetic smoke-test records associated with
 * a specific, explicitly declared SMOKE_RUN_ID.
 * 
 * Safety Guarantees:
 * 1. Requires explicit --run-id <ID> (refuses broad deletions).
 * 2. Enforces fail-closed staging database validation (refuses production databases).
 * 3. Defaults to DRY-RUN PREVIEW mode.
 * 4. Requires explicit --confirm flag to execute deletion.
 * 5. Operates strictly on synthetic email patterns matching the run ID.
 * 6. Cascades deletion to associated AssessmentSessions and UserProgress records.
 * 
 * Usage:
 *   Preview: node scripts/safeOrphanRecovery.js --run-id smoke_1731278900_abc123
 *   Execute: node scripts/safeOrphanRecovery.js --run-id smoke_1731278900_abc123 --confirm
 */

const path = require('path');
let dotenv;
try {
  dotenv = require('dotenv');
} catch (_e) {
  dotenv = require('../server/node_modules/dotenv');
}

// Load environment
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const { assertApprovedStagingDatabase } = require('../server/config/stagingDatabaseGuard');
const connectDB = require('../server/config/db');
const User = require('../server/models/User');
const AssessmentSession = require('../server/models/AssessmentSession');
const UserProgress = require('../server/models/UserProgress');

async function runRecovery() {
  const args = process.argv.slice(2);
  const runIdIndex = args.indexOf('--run-id');
  const hasConfirm = args.includes('--confirm');

  if (runIdIndex === -1 || !args[runIdIndex + 1]) {
    console.error('\n=============================================================');
    console.error('[SAFE RECOVERY ERROR] Missing required argument: --run-id <SMOKE_RUN_ID>');
    console.error('Orphan recovery strictly requires an explicit smoke run identifier.');
    console.error('Broad or wildcard database deletions are prohibited.');
    console.error('Example: node scripts/safeOrphanRecovery.js --run-id smoke_1731278900_abc123');
    console.error('=============================================================\n');
    process.exit(1);
  }

  const runId = args[runIdIndex + 1].trim();

  // Validate runId format to prevent regex injection or arbitrary deletions
  if (!/^smoke_\d+_[a-z0-9]+$/i.test(runId)) {
    console.error(`\n[SAFE RECOVERY ERROR] Invalid run ID format: "${runId}". Must match /^smoke_\\d+_[a-z0-9]+$/i\n`);
    process.exit(1);
  }

  // 1. Fail-closed staging database validation
  const targetUri = process.env.MONGODB_URI || process.env.MONGO_URI || '';
  const guard = assertApprovedStagingDatabase(targetUri);
  console.log(`\n[Database Target Verified] Host: ${guard.host}, DB: ${guard.dbName}`);

  // 2. Connect to database
  const mongoose = await connectDB();

  try {
    const emailPattern = new RegExp(`_${runId}@staging\\.test$`, 'i');

    // Find synthetic users matching this specific runId
    const matchingUsers = await User.find({ email: emailPattern }).select('_id fullName email role');
    const userIds = matchingUsers.map(u => u._id);

    // Find associated assessment sessions
    const matchingSessions = userIds.length > 0 
      ? await AssessmentSession.find({ userId: { $in: userIds } }).select('_id userId scenarioCode score status')
      : [];

    // Find associated user progress records
    const matchingProgress = userIds.length > 0
      ? await UserProgress.find({ userId: { $in: userIds } }).select('_id userId baselineScore')
      : [];

    console.log('\n=============================================================');
    console.log(`CYBER LAW PORTAL — SAFE ORPHAN RECOVERY REPORT (Run: ${runId})`);
    console.log('=============================================================');
    console.log(`Matching Synthetic Users:     ${matchingUsers.length}`);
    console.log(`Matching Assessment Sessions: ${matchingSessions.length}`);
    console.log(`Matching Progress Records:    ${matchingProgress.length}`);
    console.log('-------------------------------------------------------------');

    if (matchingUsers.length > 0) {
      console.log('User Accounts Found:');
      matchingUsers.forEach(u => console.log(`  - [${u._id}] ${u.email} (${u.role})`));
    }

    if (!hasConfirm) {
      console.log('\n[MODE: DRY-RUN PREVIEW ONLY] Zero database records were modified or deleted.');
      console.log(`To execute permanent deletion of these ${matchingUsers.length} test accounts, run:`);
      console.log(`  node scripts/safeOrphanRecovery.js --run-id ${runId} --confirm\n`);
      return;
    }

    // Execute deletion with explicit confirmation
    console.log('\n[MODE: LIVE EXECUTION] Purging confirmed smoke run records...');

    let deletedSessions = 0;
    let deletedProgress = 0;
    let deletedUsers = 0;

    if (userIds.length > 0) {
      const sessRes = await AssessmentSession.deleteMany({ userId: { $in: userIds } });
      deletedSessions = sessRes.deletedCount || 0;

      const progRes = await UserProgress.deleteMany({ userId: { $in: userIds } });
      deletedProgress = progRes.deletedCount || 0;

      const userRes = await User.deleteMany({ _id: { $in: userIds } });
      deletedUsers = userRes.deletedCount || 0;
    }

    console.log('✔ Cleanup completed successfully:');
    console.log(`  - Deleted Sessions: ${deletedSessions}`);
    console.log(`  - Deleted Progress: ${deletedProgress}`);
    console.log(`  - Deleted Users:    ${deletedUsers}\n`);
  } finally {
    if (mongoose && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

// Only execute when run directly from CLI
if (require.main === module) {
  runRecovery().catch(err => {
    console.error('\n[FATAL RECOVERY ERROR]:', err.message);
    process.exit(1);
  });
}

module.exports = { runRecovery };
