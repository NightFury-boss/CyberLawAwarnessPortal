/**
 * Post-Seed Live Database Verification Script
 * Milestone 6: Phase B Verification
 */

const fs = require('fs');
const path = require('path');
let dotenv;
try {
  dotenv = require('dotenv');
} catch (e) {
  dotenv = require('../server/node_modules/dotenv');
}
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const mongoose = require('../server/node_modules/mongoose');
const connectDB = require('../server/config/db');
const CaseStudy = require('../server/models/CaseStudy');
const { computeDocumentDigest, TARGET_SLUGS } = require('../server/config/seedJusticeShortcomingsCases');

const BATCH_ID = 'batch_js_1794172933976_96a96a86';

async function runPostSeedVerification() {
  console.log('======================================================================');
  console.log('MILESTONE 6: POST-SEED DATABASE INTEGRITY VERIFICATION');
  console.log('Target Batch ID:', BATCH_ID);
  console.log('======================================================================\n');

  await connectDB();

  // 1. Check Backup Files
  console.log('[1/6] Verifying Pre-Seed Backup and Post-Seed Manifest...');
  const backupDir = path.join(__dirname, '../backups');
  const preSeedPath = path.join(backupDir, `casestudies_preseed_${BATCH_ID}.json`);
  const postSeedPath = path.join(backupDir, `casestudies_postseed_${BATCH_ID}.json`);

  if (!fs.existsSync(preSeedPath)) {
    throw new Error(`Pre-seed snapshot missing: ${preSeedPath}`);
  }
  const preSeed = JSON.parse(fs.readFileSync(preSeedPath, 'utf8'));
  console.log(`  [PASS] Pre-seed snapshot verified: ${preSeedPath} (${preSeed.recordCount} records)`);

  if (!fs.existsSync(postSeedPath)) {
    throw new Error(`Post-seed manifest missing: ${postSeedPath}`);
  }
  const postSeed = JSON.parse(fs.readFileSync(postSeedPath, 'utf8'));
  console.log(`  [PASS] Post-seed manifest verified: ${postSeedPath} (${postSeed.insertedCount} inserted records)`);

  // 2. Total Count & Duplicate Slug Audit
  console.log('\n[2/6] Auditing Total Collection Count & Slug Uniqueness...');
  const allDocs = await CaseStudy.find({}).lean();
  console.log(`  Live Document Count: ${allDocs.length} (Expected: 21)`);
  if (allDocs.length !== 21) {
    throw new Error(`Count mismatch: Expected 21, found ${allDocs.length}`);
  }
  console.log('  [PASS] Total collection count is exactly 21.');

  const slugs = allDocs.map(d => d.slug);
  const slugSet = new Set(slugs);
  if (slugSet.size !== 21) {
    throw new Error(`Duplicate slug detected! Unique slugs: ${slugSet.size}, Total: ${allDocs.length}`);
  }
  console.log('  [PASS] All 21 slugs are distinct with ZERO duplicates.');

  // 3. Confirm 11 Legacy Records are Untouched via SHA-256 Digests
  console.log('\n[3/6] Confirming 11 Legacy Records Against Pre-Seed Baseline Digests...');
  const legacyDocs = allDocs.filter(d => d.seedBatchId !== BATCH_ID);
  console.log(`  Found ${legacyDocs.length} legacy documents (Expected: 11)`);
  if (legacyDocs.length !== 11) {
    throw new Error(`Legacy count mismatch: Expected 11, found ${legacyDocs.length}`);
  }

  let digestMatches = 0;
  for (const b of preSeed.records) {
    const liveDoc = legacyDocs.find(d => d.slug === b.slug);
    if (!liveDoc) {
      throw new Error(`Legacy slug "${b.slug}" missing from live collection!`);
    }
    const currentDigest = computeDocumentDigest(liveDoc);
    if (currentDigest !== b.digest) {
      throw new Error(`Digest mismatch for legacy record "${b.slug}"! Expected ${b.digest}, got ${currentDigest}`);
    }
    digestMatches++;
    console.log(`  [PASS] Intact: "${b.slug}" (SHA-256: ${currentDigest.substring(0, 16)}...)`);
  }
  console.log(`  [PASS] All ${digestMatches}/11 legacy records are bit-for-bit identical to pre-seed baseline.`);

  // 4. Verify 10 Inserted Cases
  console.log('\n[4/6] Verifying 10 Inserted Shortcomings Cases...');
  const batchDocs = allDocs.filter(d => d.seedBatchId === BATCH_ID);
  console.log(`  Found ${batchDocs.length} batch documents (Expected: 10)`);
  if (batchDocs.length !== 10) {
    throw new Error(`Batch doc count mismatch: Expected 10, found ${batchDocs.length}`);
  }

  for (const targetSlug of TARGET_SLUGS) {
    const doc = batchDocs.find(d => d.slug === targetSlug);
    if (!doc) {
      throw new Error(`Target slug "${targetSlug}" missing from batch records!`);
    }
    if (doc.collection !== 'Cases Where Justice Fell Short') {
      throw new Error(`Incorrect collection on "${targetSlug}": ${doc.collection}`);
    }
    console.log(`  [PASS] Inserted: [${doc.caseNumber}] "${doc.title}" (slug: "${doc.slug}")`);
  }
  console.log('  [PASS] All 10 approved cases belong to "Cases Where Justice Fell Short".');

  // 5. Test Rollback Safeguards on Live Batch
  console.log('\n[5/6] Testing Rollback Eligibility Verification...');
  const { evaluateRollbackEligibility } = require('./rollbackJusticeShortcomingsCases');
  const rollbackCheck = evaluateRollbackEligibility({
    targetBatchId: BATCH_ID,
    preSeedSnapshot: preSeed,
    postSeedManifest: postSeed,
    collectionRecords: allDocs
  });
  console.log(`  Rollback Eligibility: ${rollbackCheck.eligible ? 'ELIGIBLE' : 'INELIGIBLE'}`);
  console.log(`  Identified for Rollback: ${rollbackCheck.idsToDelete.length} documents`);
  console.log(`  Recovery Mode: ${rollbackCheck.recoveryMode}`);
  if (!rollbackCheck.eligible || rollbackCheck.idsToDelete.length !== 10) {
    throw new Error('Rollback safeguard failed eligibility check!');
  }
  console.log('  [PASS] Rollback utility correctly identifies the exact 10 inserted documents.');

  console.log('\n======================================================================');
  console.log('VERIFICATION SUMMARY: ALL SAFEGUARDS CONFIRMED');
  console.log('- Total Documents: 21');
  console.log('- Legacy Preserved: 11 (All baseline hashes match 100%)');
  console.log('- New Inserted: 10 (Tagged with batch ID)');
  console.log('- Batch ID: ' + BATCH_ID);
  console.log('- Rollback Ready: YES');
  console.log('======================================================================\n');

  await mongoose.disconnect();
}

runPostSeedVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[VERIFICATION FAILED]:', err.message);
    process.exit(1);
  });
