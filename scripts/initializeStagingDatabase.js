#!/usr/bin/env node

/**
 * Cyber Law Awareness Portal — Staging Database Initialization CLI
 *
 * Safely initializes all 11 Class A canonical educational and simulation collections
 * on a dedicated MongoDB Atlas staging database (`cyber_law_staging`) without
 * creating demo/admin users or touching Class B/C/D learner/operational collections.
 *
 * Modes:
 *   node scripts/initializeStagingDatabase.js
 *     -> Offline dry-run & canonical integrity validation (Zero DB connections)
 *
 *   node scripts/initializeStagingDatabase.js --live-dry-run
 *     -> Connects read-only to staging Atlas cluster (requires full staging guards),
 *        checks duplicates/conflicts, and outputs exact before/after execution plan
 *
 *   node scripts/initializeStagingDatabase.js --confirm --execute
 *     -> Enforces staging guards, executes non-destructive initialization, writes
 *        manifest to backups/staging_init_<runId>.json, and verifies integrity
 */

const fs = require('fs');
const path = require('path');

const { assertStrictStagingInitEnvironment } = require('../server/config/stagingInitGuard');
const {
  EXPECTED_CANONICAL_COUNTS,
  loadCanonicalSeedCatalog,
  validateCanonicalCatalogOffline
} = require('../server/config/canonicalSeedLoader');
const {
  mongoose,
  CLASS_A_NAMES,
  PROTECTED_CLASS_NAMES,
  assertModelsBoundToConnection,
  createMongooseStore,
  runStagingInitialization
} = require('../server/config/stagingInitializerEngine');

function createEmptyOfflineStore() {
  return {
    async countAllCollections() {
      const counts = {};
      for (const n of [...CLASS_A_NAMES, ...PROTECTED_CLASS_NAMES]) counts[n] = 0;
      return counts;
    },
    async findAll() {
      return [];
    },
    async createOne() {
      throw new Error('Write attempted during offline dry-run');
    },
    async updateOneById() {
      throw new Error('Update attempted during offline dry-run');
    }
  };
}

function formatSummaryTable(result) {
  console.log('\n--- PER-COLLECTION INITIALIZATION SUMMARY ---');
  console.log(
    `${'Collection'.padEnd(20)} | ${'Before'.padStart(6)} | ${'Insert'.padStart(6)} | ${'Match'.padStart(6)} | ${'Repair'.padStart(6)} | ${'After'.padStart(6)}`
  );
  console.log('-'.repeat(68));

  for (const name of CLASS_A_NAMES) {
    const s = result.summary[name];
    const afterVal = result.afterCounts[name] ?? s.plannedAfter;
    console.log(
      `${name.padEnd(20)} | ${String(s.before).padStart(6)} | ${String(s.toInsert).padStart(6)} | ${String(s.alreadyCanonical).padStart(6)} | ${String(s.toRepairLinks).padStart(6)} | ${String(afterVal).padStart(6)}`
    );
  }

  console.log('\n--- PROTECTED BOUNDARY COLLECTIONS (UNTOUCHED) ---');
  for (const pName of PROTECTED_CLASS_NAMES) {
    const b = result.beforeCounts[pName] ?? 0;
    const a = result.afterCounts[pName] ?? b;
    console.log(`  ${pName.padEnd(20)} : before=${b}, after=${a}`);
  }
}

async function runCli(argv = process.argv.slice(2)) {
  const isLiveDryRun = argv.includes('--live-dry-run');
  const isConfirm = argv.includes('--confirm');
  const isExecute = argv.includes('--execute');

  if (isExecute && !isConfirm) {
    console.error('[ABORT] Live database execution requires BOTH --confirm and --execute flags.');
    process.exit(1);
  }

  const mode = (isConfirm && isExecute)
    ? 'LIVE_EXECUTE'
    : (isLiveDryRun ? 'LIVE_DRY_RUN' : 'OFFLINE_DRY_RUN');

  console.log('======================================================================');
  console.log('CYBER LAW AWARENESS PORTAL — STAGING DATABASE INITIALIZATION');
  console.log(`Mode: ${mode}`);
  console.log('======================================================================');

  // 1. Load & validate canonical catalog cleanly offline first
  const catalog = loadCanonicalSeedCatalog();
  const offlineCheck = validateCanonicalCatalogOffline(catalog);

  if (!offlineCheck.valid) {
    console.error('\n[FAIL] Canonical catalog offline validation failed:');
    offlineCheck.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('\n[1/4] Canonical Catalog Offline Validation: PASSED');
  console.log('  Verified canonical counts:', JSON.stringify(offlineCheck.counts));
  if (offlineCheck.notes.length > 0) {
    console.log('  Reference Notes:');
    offlineCheck.notes.forEach((n) => console.log(`   * ${n}`));
  }

  // Offline Dry-Run exits cleanly without attempting any database connection
  if (mode === 'OFFLINE_DRY_RUN') {
    const emptyStore = createEmptyOfflineStore();
    const dryResult = await runStagingInitialization({
      catalog,
      store: emptyStore,
      dryRun: true
    });

    console.log('\n[2/4] Staging Connection Status: SKIPPED (Offline Dry-Run, readyState=0)');
    console.log('[3/4] Conflict & Boundary Preview (Simulated Fresh Database): PASSED');
    formatSummaryTable(dryResult);
    console.log('\n[4/4] Status:', dryResult.status);
    console.log('Expected Target Counts Verified:', JSON.stringify(EXPECTED_CANONICAL_COUNTS));
    console.log('No database connections or writes were performed.');
    return dryResult;
  }

  // 2. Enforce strict staging-only environment & URI validation BEFORE connecting
  const guardResult = assertStrictStagingInitEnvironment(process.env);
  console.log(`\n[2/4] Staging Safeguards Verified: PASSED`);
  console.log(`  Target Database : ${guardResult.dbName}`);
  console.log(`  Target Cluster  : ${guardResult.host}`);
  console.log(`  Sanitized Target: ${guardResult.redactedUri}`);

  // Connect using explicitly validated MONGODB_URI from environment (never local .env)
  const rawUri = (process.env.MONGODB_URI || process.env.MONGO_URI).trim();

  try {
    await mongoose.connect(rawUri, {
      family: 4,
      serverSelectionTimeoutMS: 10000
    });
    assertModelsBoundToConnection(mongoose);

    const connectedDbName = mongoose.connection.name;
    const connectedHost = mongoose.connection.host || '';
    const clientOpts = mongoose.connection.client?.options || mongoose.connection.client?.s?.options || {};
    const srvHost = clientOpts.srvHost || null;
    const expectedClusterDomain = guardResult.host.includes('.')
      ? guardResult.host.split('.').slice(1).join('.')
      : guardResult.host;

    if (connectedDbName !== guardResult.dbName) {
      throw new Error(
        `[STAGING INIT GUARD] Connected database "${connectedDbName}" does not match expected "${guardResult.dbName}". Aborting before queries.`
      );
    }
    if (srvHost && srvHost.toLowerCase() !== guardResult.host.toLowerCase()) {
      throw new Error(
        `[STAGING INIT GUARD] Connected cluster SRV host "${srvHost}" does not match expected "${guardResult.host}". Aborting before queries.`
      );
    }
    if (!srvHost && !connectedHost.toLowerCase().includes(expectedClusterDomain.toLowerCase())) {
      throw new Error(
        `[STAGING INIT GUARD] Connected node host "${connectedHost}" does not match expected cluster "${guardResult.host}". Aborting before queries.`
      );
    }

    console.log('  Connected cleanly to staging Atlas cluster (all 17 models verified bound).');
    console.log(`  Verified Connected DB : ${connectedDbName}`);
    console.log(`  Verified Cluster Host : ${srvHost || connectedHost} (primary node: ${connectedHost})`);

    const store = createMongooseStore();
    const isDryRun = mode === 'LIVE_DRY_RUN';
    const result = await runStagingInitialization({
      catalog,
      store,
      dryRun: isDryRun
    });

    if (result.status === 'ABORTED_CONFLICTS') {
      console.error(`\n[3/4] Pre-Flight Conflict Audit: ABORTED (${result.conflicts.length} conflict(s))`);
      result.conflicts.forEach((c) => {
        console.error(`  - [${c.collection}] ${c.type}: ${c.key} ${c.reason ? `(${c.reason})` : ''}`);
      });
      formatSummaryTable(result);
      throw new Error('Initialization aborted cleanly before any write due to detected conflicts.');
    }

    console.log('\n[3/4] Pre-Flight Conflict Audit: PASSED (0 conflicts)');
    formatSummaryTable(result);

    if (mode === 'LIVE_EXECUTE') {
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const manifestPath = path.join(backupDir, `${result.runId}.json`);
      const manifest = {
        runId: result.runId,
        timestamp: new Date().toISOString(),
        targetDatabase: guardResult.dbName,
        targetHost: guardResult.host,
        beforeCounts: result.beforeCounts,
        afterCounts: result.afterCounts,
        insertedIds: result.insertedIds,
        repairedIds: result.repairedIds
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`\n[4/4] Status: ${result.status}`);
      console.log(`  Provenance Manifest saved to: ${manifestPath}`);
    } else {
      console.log(`\n[4/4] Status: ${result.status} (Zero writes executed)`);
    }

    return result;
  } catch (err) {
    console.error(`\n[INITIALIZATION ERROR] ${err.message}`);
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
        console.error(`\n[INITIALIZATION ERROR] ${err.message}`);
      }
      process.exit(1);
    });
}

module.exports = { mongoose, runCli, formatSummaryTable };

