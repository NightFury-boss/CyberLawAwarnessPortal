#!/usr/bin/env node

/**
 * Cyber Law Awareness Portal — Staging Initialization Rollback Utility
 *
 * Scoped exclusively to reverting documents created during a specific
 * `staging_init_<id>` run manifest stored in `backups/<runId>.json`.
 *
 * Safeguards:
 * - Dry-runs by default (zero DB connection or deletion without --confirm --execute).
 * - Requires strict staging safeguards (ASSERT_STAGING_DB=true, cyber_law_staging, EXPECTED_STAGING_HOST).
 * - Verifies manifest targetDatabase and targetHost match the active staging guard.
 * - Never deletes pre-existing documents or any Class B/C/D collections.
 *
 * Usage:
 *   node scripts/rollbackStagingInitialization.js --run-id staging_init_<id>
 *   node scripts/rollbackStagingInitialization.js --run-id staging_init_<id> --confirm --execute
 */

const fs = require('fs');
const path = require('path');

const { assertStrictStagingInitEnvironment } = require('../server/config/stagingInitGuard');
const {
  mongoose,
  ALL_MODELS,
  CLASS_A_NAMES,
  PROVENANCE_COLLECTION,
  assertModelsBoundToConnection
} = require('../server/config/stagingInitializerEngine');

const {
  LegalSource,
  LawSection,
  CyberCrime,
  CaseStudy,
  Quiz,
  QuizQuestion,
  LearningModule,
  Resource,
  Scenario,
  ScenarioStage,
  ScenarioDecision
} = ALL_MODELS;

const REVERSE_ORDER_MODELS = [
  ['ScenarioDecision', ScenarioDecision],
  ['ScenarioStage', ScenarioStage],
  ['Scenario', Scenario],
  ['Resource', Resource],
  ['LearningModule', LearningModule],
  ['QuizQuestion', QuizQuestion],
  ['Quiz', Quiz],
  ['CaseStudy', CaseStudy],
  ['CyberCrime', CyberCrime],
  ['LawSection', LawSection],
  ['LegalSource', LegalSource]
];

function loadAndValidateManifest(runId, backupsDir = path.join(__dirname, '../backups')) {
  if (!runId || !/^staging_init_[a-z0-9_-]+$/i.test(runId)) {
    throw new Error(`Invalid or missing --run-id. Expected format: staging_init_<id>, got "${runId || '<none>'}"`);
  }

  const manifestPath = path.join(backupsDir, `${runId}.json`);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Initialization manifest not found at: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.targetDatabase !== 'cyber_law_staging') {
    throw new Error(
      `Manifest targetDatabase "${manifest.targetDatabase}" is not "cyber_law_staging". Rollback aborted.`
    );
  }

  const allowedSet = new Set(CLASS_A_NAMES);
  for (const colName of Object.keys(manifest.insertedIds || {})) {
    if (!allowedSet.has(colName)) {
      throw new Error(`Manifest references non-Class-A collection "${colName}". Rollback refused.`);
    }
  }

  return { manifest, manifestPath };
}

function getArgValue(argv, flag) {
  const eq = argv.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const idx = argv.indexOf(flag);
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith('--')) return argv[idx + 1];
  return null;
}

async function runRollback(argv = process.argv.slice(2), options = {}) {
  const {
    backupsDir = path.join(__dirname, '../backups'),
    provenanceStore = null,
    models = ALL_MODELS
  } = options;
  const runId = getArgValue(argv, '--run-id');
  const isExecute = argv.includes('--confirm') && argv.includes('--execute');

  console.log('======================================================================');
  console.log('CYBER LAW AWARENESS PORTAL — STAGING INITIALIZATION ROLLBACK');
  console.log(`Mode: ${isExecute ? 'LIVE_ROLLBACK' : 'DRY_RUN'}`);
  console.log('======================================================================');

  const { manifest, manifestPath } = loadAndValidateManifest(runId, backupsDir);
  console.log(`Manifest verified: ${manifestPath}`);
  console.log(`Recorded target  : ${manifest.targetDatabase} @ ${manifest.targetHost}`);

  let totalIds = 0;
  for (const [colName] of REVERSE_ORDER_MODELS) {
    const ids = manifest.insertedIds?.[colName] || [];
    totalIds += ids.length;
    console.log(`  - ${colName.padEnd(20)}: ${ids.length} inserted ID(s) scoped for removal`);
  }

  if (!isExecute) {
    console.log(`\n[DRY-RUN] Ready to roll back ${totalIds} document(s). Pass --confirm --execute to run against staging.`);
    return { status: 'DRY_RUN_READY', totalScoped: totalIds };
  }

  // Enforce strict staging guard before connecting
  const guardResult = assertStrictStagingInitEnvironment(process.env);
  if (manifest.targetHost && guardResult.host.toLowerCase() !== manifest.targetHost.toLowerCase()) {
    throw new Error(
      `Manifest targetHost "${manifest.targetHost}" does not match active guard host "${guardResult.host}". Aborting.`
    );
  }

  const rawUri = (process.env.MONGODB_URI || process.env.MONGO_URI).trim();
  const deletedCounts = {};
  const skippedUnownedCounts = {};
  const shouldManageConnection = !provenanceStore;

  try {
    if (shouldManageConnection) {
      await mongoose.connect(rawUri, { family: 4, serverSelectionTimeoutMS: 10000 });
      assertModelsBoundToConnection(mongoose);
    }

    const provenanceRecord = provenanceStore
      ? await provenanceStore.getRunProvenance(runId)
      : await mongoose.connection.collection(PROVENANCE_COLLECTION).findOne({ _id: runId });

    if (!provenanceRecord || !Array.isArray(provenanceRecord.entries)) {
      throw new Error(
        `[ROLLBACK PROVENANCE ERROR] No persistent database provenance found for runId "${runId}". Refusing manifest-only deletion.`
      );
    }
    if (provenanceRecord.targetDatabase && provenanceRecord.targetDatabase !== 'cyber_law_staging') {
      throw new Error(
        `[ROLLBACK PROVENANCE ERROR] Provenance targetDatabase "${provenanceRecord.targetDatabase}" is not "cyber_law_staging".`
      );
    }

    const verifiedOwnedByCol = new Map();
    for (const entry of provenanceRecord.entries) {
      if (!entry || !entry.collection || !entry.docId) continue;
      if (!verifiedOwnedByCol.has(entry.collection)) {
        verifiedOwnedByCol.set(entry.collection, new Set());
      }
      verifiedOwnedByCol.get(entry.collection).add(String(entry.docId));
    }

    for (const [colName] of REVERSE_ORDER_MODELS) {
      const Model = models[colName];
      const validIds = (manifest.insertedIds?.[colName] || []).filter((id) => mongoose.Types.ObjectId.isValid(id));
      const ownedSet = verifiedOwnedByCol.get(colName) || new Set();
      const confirmedOwnedIds = validIds.filter((id) => ownedSet.has(String(id)));
      const skippedCount = validIds.length - confirmedOwnedIds.length;
      skippedUnownedCounts[colName] = skippedCount;

      if (skippedCount > 0) {
        console.warn(
          `  [PROVENANCE SKIP] ${colName.padEnd(20)}: skipped ${skippedCount} ID(s) lacking persistent provenance for runId "${runId}"`
        );
      }

      if (confirmedOwnedIds.length === 0) {
        deletedCounts[colName] = 0;
        continue;
      }
      const res = await Model.deleteMany({ _id: { $in: confirmedOwnedIds } });
      deletedCounts[colName] = res.deletedCount || 0;
      console.log(`  [DELETED] ${colName.padEnd(20)}: ${deletedCounts[colName]} document(s)`);
    }

    console.log('\n[ROLLBACK COMPLETE] Scoped Class A documents reverted cleanly.');
    return { status: 'ROLLBACK_COMPLETE', deletedCounts, skippedUnownedCounts };
  } catch (err) {
    console.error(`\n[ROLLBACK ERROR] ${err.message}`);
    err._loggedBeforeTeardown = true;
    throw err;
  } finally {
    if (shouldManageConnection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Database] Disconnected cleanly.');
    }
  }
}

if (require.main === module) {
  runRollback()
    .then(() => process.exit(0))
    .catch((err) => {
      if (!err?._loggedBeforeTeardown) {
        console.error(`\n[ROLLBACK ERROR] ${err.message}`);
      }
      process.exit(1);
    });
}

module.exports = { mongoose, loadAndValidateManifest, runRollback };

