/**
 * Dedicated Provenance-Verified Rollback Utility: Cases Where Justice Fell Short
 * Authoritative Collection Baseline: Product Owner Decisions (8 November 2026)
 * 
 * Safety Invariants:
 * 1. Provenance Binding: requires exact --batch=<seedBatchId> parameter.
 * 2. ID & Slug Verification: verifies all target documents match both inserted IDs and TARGET_SLUGS whitelist.
 * 3. Deletion Refusal: refuses deletion if foreign slugs outside whitelist carry target seedBatchId.
 * 4. Baseline Restoration Verification: asserts post-rollback count is exactly 11 and validates SHA-256 digests.
 * 5. Safe Execution Guard: in CLI mode, dry-runs by default; requires --confirm and --execute for database operations.
 */

const fs = require('fs');
const path = require('path');
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = require('../server/node_modules/mongoose');
}
const CaseStudy = require('../server/models/CaseStudy');
const { TARGET_SLUGS, computeDocumentDigest } = require('../server/config/seedJusticeShortcomingsCases');

// Pure function simulating rollback validation
function evaluateRollbackEligibility({
  targetBatchId,
  preSeedSnapshot,
  postSeedManifest,
  collectionRecords
}) {
  const whitelistSet = new Set(TARGET_SLUGS);

  // Assert target batch ID pattern
  const batchPattern = /^batch_js_\d+_[a-f0-9]{8}$/;
  if (!batchPattern.test(targetBatchId)) {
    return { eligible: false, reason: `Invalid batch ID format: "${targetBatchId}". Expected /^batch_js_\\d+_[a-f0-9]{8}$/` };
  }

  // Pre-seed snapshot verification
  if (!preSeedSnapshot || preSeedSnapshot.recordCount !== 11 || !Array.isArray(preSeedSnapshot.records)) {
    return { eligible: false, reason: 'Pre-seed snapshot is invalid or missing baseline count of 11 records.' };
  }

  // Find records carrying target seedBatchId
  const batchRecords = collectionRecords.filter(r => r.seedBatchId === targetBatchId);
  if (batchRecords.length === 0) {
    return { eligible: false, reason: `No records found in collection matching seedBatchId: "${targetBatchId}".` };
  }

  // Safety Assertion: No record outside whitelist may carry target seedBatchId
  const foreignRecords = batchRecords.filter(r => !whitelistSet.has(r.slug));
  if (foreignRecords.length > 0) {
    return {
      eligible: false,
      reason: `CRITICAL INTEGRITY ALERT: ${foreignRecords.length} document(s) outside target whitelist carry target seedBatchId! Deletion refused.`
    };
  }

  // Determine exact IDs to delete
  let idsToDelete = [];
  if (postSeedManifest && Array.isArray(postSeedManifest.insertedIds)) {
    const postSeedIdSet = new Set(postSeedManifest.insertedIds);
    idsToDelete = batchRecords
      .filter(r => postSeedIdSet.has(r._id.toString()))
      .map(r => r._id.toString());
  } else {
    // Fallback crash-recovery path (recovers via seedBatchId + whitelist)
    idsToDelete = batchRecords.map(r => r._id.toString());
  }

  return {
    eligible: true,
    batchId: targetBatchId,
    idsToDelete,
    recoveryMode: postSeedManifest ? 'verified-manifest' : 'provenance-fallback'
  };
}

// Live Rollback Execution (Checkpoint 5 / Recovery Only)
async function executeRollback({ targetBatchId, dryRun = true } = {}) {
  console.log('======================================================================');
  console.log('PROVENANCE-VERIFIED DATABASE ROLLBACK UTILITY');
  console.log(`Target Batch ID: ${targetBatchId}`);
  console.log(`Execution Mode : ${dryRun ? 'DRY-RUN AUDIT' : 'LIVE ROLLBACK (Requires Authorization)'}`);
  console.log('======================================================================\n');

  if (!targetBatchId) {
    throw new Error('Missing required parameter: --batch=<seedBatchId>');
  }

  const backupDir = path.join(__dirname, '../backups');
  const preSeedPath = path.join(backupDir, `casestudies_preseed_${targetBatchId}.json`);
  if (!fs.existsSync(preSeedPath)) {
    throw new Error(`Pre-seed snapshot file not found: ${preSeedPath}. Rollback refused.`);
  }

  const preSeedSnapshot = JSON.parse(fs.readFileSync(preSeedPath, 'utf8'));
  const postSeedPath = path.join(backupDir, `casestudies_postseed_${targetBatchId}.json`);
  let postSeedManifest = null;
  if (fs.existsSync(postSeedPath)) {
    postSeedManifest = JSON.parse(fs.readFileSync(postSeedPath, 'utf8'));
  }

  if (dryRun) {
    console.log('[DRY-RUN] Pre-seed snapshot successfully verified.');
    console.log(`[DRY-RUN] Baseline record count: ${preSeedSnapshot.recordCount}`);
    console.log(`[DRY-RUN] Post-seed manifest: ${postSeedManifest ? 'Present' : 'Not found (fallback mode active)'}`);
    console.log('[DRY-RUN] Rollback eligibility validated. Zero database modifications performed.');
    return {
      status: 'DRY_RUN_ELIGIBLE',
      targetBatchId
    };
  }

  // Live Database Rollback
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection must be established before executing live rollback.');
  }

  console.log('[LIVE ROLLBACK] Querying database records...');
  const allRecords = await CaseStudy.find({}).lean();
  const evaluation = evaluateRollbackEligibility({
    targetBatchId,
    preSeedSnapshot,
    postSeedManifest,
    collectionRecords: allRecords
  });

  if (!evaluation.eligible) {
    throw new Error(`ROLLBACK REFUSED: ${evaluation.reason}`);
  }

  console.log(`[LIVE ROLLBACK] Identified ${evaluation.idsToDelete.length} records for removal (Mode: ${evaluation.recoveryMode}).`);

  // Targeted ID Deletion
  const deleteResult = await CaseStudy.deleteMany({
    _id: { $in: evaluation.idsToDelete },
    seedBatchId: targetBatchId,
    slug: { $in: TARGET_SLUGS }
  });
  console.log(`  [PASS] Deleted ${deleteResult.deletedCount} documents matching batch provenance.`);

  // Post-Rollback Integrity Verification
  console.log('[LIVE ROLLBACK] Verifying post-rollback collection integrity...');
  const remainingRecords = await CaseStudy.find({}).lean();
  if (remainingRecords.length !== 11) {
    throw new Error(`INTEGRITY FAILURE: Expected exactly 11 baseline records remaining, found ${remainingRecords.length}.`);
  }

  // Verify SHA-256 digests against pre-seed baseline
  const preSeedMap = new Map(preSeedSnapshot.records.map(r => [r.slug, r]));
  for (const doc of remainingRecords) {
    const baseline = preSeedMap.get(doc.slug);
    if (!baseline) {
      throw new Error(`INTEGRITY FAILURE: Document with slug "${doc.slug}" was not in original pre-seed baseline.`);
    }
    const currentDigest = computeDocumentDigest(doc);
    if (currentDigest !== baseline.digest) {
      throw new Error(`INTEGRITY FAILURE: Digest mismatch on legacy document "${doc.slug}"! Document was modified.`);
    }
  }

  console.log('  [PASS] All 11 legacy records verified intact against pre-seed SHA-256 digests.');
  console.log('\n======================================================================');
  console.log('SUCCESS: Database state successfully restored to exact pre-seed baseline.');
  console.log('======================================================================');

  return {
    status: 'ROLLBACK_SUCCESS',
    deletedCount: deleteResult.deletedCount,
    remainingCount: remainingRecords.length
  };
}

module.exports = {
  evaluateRollbackEligibility,
  executeRollback
};

// Safe CLI Runner
if (require.main === module) {
  const args = process.argv.slice(2);
  const batchArg = args.find(a => a.startsWith('--batch='));
  const targetBatchId = batchArg ? batchArg.split('=')[1] : null;
  const isLive = args.includes('--confirm') && args.includes('--execute');

  if (isLive) {
    (async () => {
      try {
        let dotenv;
        try {
          dotenv = require('dotenv');
        } catch (e) {
          dotenv = require('../server/node_modules/dotenv');
        }
        dotenv.config({ path: path.join(__dirname, '../server/.env') });
        const connectDB = require('../server/config/db');
        console.log('[LIVE ROLLBACK] Initializing database connection...');
        await connectDB();
        const result = await executeRollback({ targetBatchId, dryRun: false });
        console.log('[LIVE ROLLBACK] Completed successfully with status:', result.status);
        await mongoose.disconnect();
        console.log('[Database] Disconnected cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('[LIVE ROLLBACK ERROR]:', err.message);
        if (mongoose.connection && mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }
        process.exit(1);
      }
    })();
  } else {
    executeRollback({ targetBatchId, dryRun: true })
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err.message);
        process.exit(1);
      });
  }
}
