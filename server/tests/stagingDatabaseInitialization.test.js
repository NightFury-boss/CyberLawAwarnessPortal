/**
 * Cyber Law Awareness Portal — Staging Database Initialization Verification Suite
 *
 * Strictly OFFLINE test suite (zero live MongoDB connections, readyState === 0).
 * Validates canonical dataset loading, Mongoose schema compliance across all 651
 * canonical records, cross-collection references, strict staging guards, conflict &
 * duplicate abort logic, idempotency, partial-run recovery, and data boundaries.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const mongoose = require('mongoose');

const {
  assertStrictStagingInitEnvironment,
  redactMongoUri
} = require('../config/stagingInitGuard');
const {
  EXPECTED_CANONICAL_COUNTS,
  resolveQuizQuestionCategory,
  loadCanonicalSeedCatalog,
  validateCanonicalCatalogOffline
} = require('../config/canonicalSeedLoader');
const {
  mongoose: engineMongoose,
  ALL_MODELS,
  CLASS_A_NAMES,
  PROTECTED_CLASS_NAMES,
  assertModelsBoundToConnection,
  materializeCanonical,
  normalizeExistingDoc,
  auditFlatCollection,
  runStagingInitialization
} = require('../config/stagingInitializerEngine');
const initCli = require('../../scripts/initializeStagingDatabase');
const verifyCli = require('../../scripts/verifyStagingContentIntegrity');
const rollbackCli = require('../../scripts/rollbackStagingInitialization');
const { loadAndValidateManifest } = rollbackCli;

// Models strictly for offline Mongoose schema default materialization & validation
const modelsByName = {
  LegalSource: require('../models/LegalSource'),
  LawSection: require('../models/LawSection'),
  CyberCrime: require('../models/CyberCrime'),
  CaseStudy: require('../models/CaseStudy'),
  Quiz: require('../models/Quiz'),
  QuizQuestion: require('../models/QuizQuestion'),
  LearningModule: require('../models/LearningModule'),
  Resource: require('../models/Resource'),
  Scenario: require('../models/Scenario'),
  ScenarioStage: require('../models/ScenarioStage'),
  ScenarioDecision: require('../models/ScenarioDecision'),
  User: require('../models/User'),
  UserProgress: require('../models/UserProgress'),
  AssessmentSession: require('../models/AssessmentSession'),
  AssessmentDecision: require('../models/AssessmentDecision'),
  QuizAttempt: require('../models/QuizAttempt'),
  AdminAuditLog: require('../models/AdminAuditLog')
};

/**
 * In-memory Mongoose-parity store simulator (zero DB sockets).
 * Materializes schema defaults, ObjectIds, timestamps, and subdoc _ids on write.
 */
function createSimulatedStore(initialSeed = {}) {
  const db = {};
  for (const name of [...CLASS_A_NAMES, ...PROTECTED_CLASS_NAMES]) {
    db[name] = (initialSeed[name] || []).map((doc) => ({ ...doc }));
  }
  let writeCount = 0;

  return {
    db,
    getWriteCount: () => writeCount,
    async countAllCollections() {
      const counts = {};
      for (const name of Object.keys(db)) {
        counts[name] = db[name].length;
      }
      return counts;
    },
    async findAll(name) {
      return db[name].map((d) => {
        const out = { ...d };
        for (const [k, v] of Object.entries(out)) {
          if (v instanceof Map) out[k] = Object.fromEntries(v);
        }
        return out;
      });
    },
    async createOne(name, payload) {
      writeCount++;
      const Model = modelsByName[name];
      const materialized = new Model(payload).toObject({ depopulate: true });
      const err = new Model(payload).validateSync();
      if (err) throw new Error(`Simulated schema validation failed on ${name}: ${err.message}`);
      materialized.createdAt = new Date();
      materialized.updatedAt = new Date();
      db[name].push(materialized);
      return { ...materialized };
    },
    async updateOneById(name, id, fields) {
      writeCount++;
      const idx = db[name].findIndex((d) => d._id.toString() === id.toString());
      if (idx === -1) throw new Error(`Doc ${id} not found in ${name}`);
      db[name][idx] = { ...db[name][idx], ...fields, updatedAt: new Date() };
      return { ...db[name][idx] };
    }
  };
}

describe('Staging Database Initialization Architecture (Offline Suite)', () => {
  const catalog = loadCanonicalSeedCatalog();

  it('1. Strictly avoids any live MongoDB socket connection (readyState === 0)', () => {
    assert.equal(mongoose.connection.readyState, 0);
  });

  it('2. Extracts exact expected counts across all 11 canonical Class A collections', () => {
    assert.deepEqual(catalog.counts, {
      LegalSource: 13,
      LawSection: 32,
      CyberCrime: 29,
      CaseStudy: 21,
      Quiz: 12,
      QuizQuestion: 361,
      LearningModule: 18,
      Resource: 7,
      Scenario: 4,
      ScenarioStage: 43,
      ScenarioDecision: 111
    });
    const total = Object.values(catalog.counts).reduce((a, b) => a + b, 0);
    assert.equal(total, 651);
    assert.deepEqual(catalog.counts, EXPECTED_CANONICAL_COUNTS);

    const landmark = catalog.caseStudies.filter((c) => c.collection === 'Landmark Precedents');
    const shortcomings = catalog.caseStudies.filter((c) => c.collection === 'Cases Where Justice Fell Short');
    assert.equal(landmark.length, 11);
    assert.equal(shortcomings.length, 10);
  });

  it('3. Passes Mongoose schema validation, uniqueness, and cross-collection reference checks offline', () => {
    const check = validateCanonicalCatalogOffline(catalog);
    assert.equal(check.valid, true, `Offline validation errors: ${check.errors.join('; ')}`);
    assert.equal(check.errors.length, 0);
  });

  it('4. Source boundaries: zero deleteMany/deleteOne, zero .env loading, zero Class B/C/D writes', () => {
    const engineSrc = fs.readFileSync(path.join(__dirname, '../config/stagingInitializerEngine.js'), 'utf8');
    const cliSrc = fs.readFileSync(path.join(__dirname, '../../scripts/initializeStagingDatabase.js'), 'utf8');
    const verifySrc = fs.readFileSync(path.join(__dirname, '../../scripts/verifyStagingContentIntegrity.js'), 'utf8');
    const rollbackSrc = fs.readFileSync(path.join(__dirname, '../../scripts/rollbackStagingInitialization.js'), 'utf8');
    const guardSrc = fs.readFileSync(path.join(__dirname, '../config/stagingInitGuard.js'), 'utf8');
    const loaderSrc = fs.readFileSync(path.join(__dirname, '../config/canonicalSeedLoader.js'), 'utf8');

    for (const src of [engineSrc, cliSrc, verifySrc, guardSrc, loaderSrc]) {
      assert.equal(/\.deleteMany\s*\(/.test(src), false, 'Must not contain deleteMany');
      assert.equal(/\.deleteOne\s*\(/.test(src), false, 'Must not contain deleteOne');
      assert.equal(/\.drop\s*\(/.test(src), false, 'Must not contain collection drop');
      assert.equal(/require\(['"]dotenv['"]\)/.test(src), false, 'Must never import dotenv/.env fallback');
    }
    assert.equal(/require\(['"]dotenv['"]\)/.test(rollbackSrc), false, 'Rollback must never import dotenv');

    assert.equal(/createOne\(['"](?:User|UserProgress|AssessmentSession|AssessmentDecision|QuizAttempt|AdminAuditLog)['"]/.test(engineSrc), false);
    assert.equal(/admin@cyberlawportal\.test|user@example\.com|AdminPass123!/.test(engineSrc + cliSrc), false);
  });

  it('5. Strict Staging Init Guard fails closed on unsafe/incomplete envs and masks secrets', () => {
    const validEnv = {
      NODE_ENV: 'production',
      ASSERT_STAGING_DB: 'true',
      EXPECTED_STAGING_DB_NAME: 'cyber_law_staging',
      EXPECTED_STAGING_HOST: 'cluster0.stage123.mongodb.net',
      MONGODB_URI: 'mongodb+srv://stage_user:UltraSecretPass99!@cluster0.stage123.mongodb.net/cyber_law_staging?retryWrites=true&w=majority'
    };

    const ok = assertStrictStagingInitEnvironment(validEnv);
    assert.equal(ok.approved, true);
    assert.equal(ok.dbName, 'cyber_law_staging');
    assert.equal(ok.host, 'cluster0.stage123.mongodb.net');
    assert.equal(ok.redactedUri.includes('UltraSecretPass99'), false);
    assert.equal(ok.redactedUri.includes('stage_user'), false);

    // Reject missing flags, prod targets, localhost, non-SRV, host mismatch, reset flag
    assert.throws(() => assertStrictStagingInitEnvironment({ ...validEnv, ASSERT_STAGING_DB: 'false' }), /ASSERT_STAGING_DB/);
    assert.throws(() => assertStrictStagingInitEnvironment({ ...validEnv, EXPECTED_STAGING_DB_NAME: 'cyberlaw_staging' }), /cyber_law_staging/);
    assert.throws(() => assertStrictStagingInitEnvironment({ ...validEnv, EXPECTED_STAGING_HOST: '' }), /EXPECTED_STAGING_HOST/);
    assert.throws(() => assertStrictStagingInitEnvironment({ ...validEnv, EXPECTED_STAGING_HOST: 'localhost' }), /local host/);
    assert.throws(() => assertStrictStagingInitEnvironment({ ...validEnv, MONGODB_URI: '' }), /MONGODB_URI/);
    assert.throws(() => assertStrictStagingInitEnvironment({ ...validEnv, MONGODB_URI: 'mongodb://user:SecretPW@cluster0.stage123.mongodb.net/cyber_law_staging' }), /SRV/);
    assert.throws(() => assertStrictStagingInitEnvironment({ ...validEnv, MONGODB_URI: 'mongodb+srv://user:SecretPW@otherhost.mongodb.net/cyber_law_staging' }), /cluster/);
    assert.throws(() => assertStrictStagingInitEnvironment({ ...validEnv, MONGODB_URI: 'mongodb+srv://user:SecretPW@cluster0.stage123.mongodb.net/cyber_law_portal', EXPECTED_STAGING_DB_NAME: 'cyber_law_staging' }), /production/i);
    assert.throws(() => assertStrictStagingInitEnvironment({ ...validEnv, ALLOW_DB_RESET: 'true' }), /ALLOW_DB_RESET/);

    // Ensure thrown error never leaks credential strings
    try {
      assertStrictStagingInitEnvironment({
        ...validEnv,
        MONGODB_URI: 'mongodb+srv://leakedUser:SuperSecretXYZ123@cluster0.stage123.mongodb.net/cyber_law_portal'
      });
      assert.fail('Expected error');
    } catch (err) {
      assert.equal(err.message.includes('SuperSecretXYZ123'), false);
      assert.equal(err.message.includes('leakedUser'), false);
    }

    assert.equal(redactMongoUri('mongodb+srv://admin:pass@my.cluster.net/cyber_law_staging?w=majority'), 'mongodb+srv://****:****@my.cluster.net/cyber_law_staging');
  });

  it('6. Fresh DB Initialization + Boundary Preservation + Dry-Run Verification (Simulated Store)', async () => {
    const existingUser = { _id: new mongoose.Types.ObjectId(), fullName: 'Existing Tester', email: 'real@staging.org', passwordHash: 'x', role: 'user' };
    const existingSession = { _id: new mongoose.Types.ObjectId(), userId: existingUser._id, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', currentStageId: new mongoose.Types.ObjectId(), expiresAt: new Date() };
    const store = createSimulatedStore({ User: [existingUser], AssessmentSession: [existingSession] });

    // Dry-run first -> 0 writes, exact planned counts
    const dryRes = await runStagingInitialization({ catalog, store, dryRun: true, runId: 'staging_init_test1' });
    assert.equal(dryRes.status, 'DRY_RUN_READY');
    assert.equal(store.getWriteCount(), 0);
    for (const name of CLASS_A_NAMES) {
      assert.equal(dryRes.beforeCounts[name], 0);
      assert.equal(dryRes.afterCounts[name], EXPECTED_CANONICAL_COUNTS[name]);
    }

    // Live initialization on simulated store
    const execRes = await runStagingInitialization({ catalog, store, dryRun: false, runId: 'staging_init_test1' });
    assert.equal(execRes.status, 'INITIALIZATION_SUCCEEDED');
    assert.deepEqual(
      Object.fromEntries(CLASS_A_NAMES.map((n) => [n, execRes.afterCounts[n]])),
      EXPECTED_CANONICAL_COUNTS
    );
    // Protected Class B/C/D collections strictly unchanged
    assert.equal(execRes.beforeCounts.User, 1);
    assert.equal(execRes.afterCounts.User, 1);
    assert.equal(execRes.beforeCounts.AssessmentSession, 1);
    assert.equal(execRes.afterCounts.AssessmentSession, 1);

    // Verify all foreign keys resolved cleanly
    assert.equal(store.db.LawSection.every((l) => l.officialSourceId && store.db.LegalSource.some((s) => s._id.equals(l.officialSourceId))), true);
    assert.equal(store.db.QuizQuestion.every((q) => q.quizId && store.db.Quiz.some((qz) => qz._id.equals(q.quizId))), true);
    assert.equal(store.db.ScenarioStage.every((st) => st.scenarioId && store.db.Scenario.some((s) => s._id.equals(st.scenarioId))), true);
    for (const st of store.db.ScenarioStage) {
      const decs = store.db.ScenarioDecision.filter((d) => d.stageId.equals(st._id));
      assert.deepEqual(st.availableDecisionIds.map((id) => id.toString()), decs.map((d) => d._id.toString()));
    }
    const stageIdSet = new Set(store.db.ScenarioStage.map((s) => s._id.toString()));
    for (const dec of store.db.ScenarioDecision) {
      if (dec.nextStageId) assert.equal(stageIdSet.has(dec.nextStageId.toString()), true);
    }

    // Re-run (Idempotency) -> zero writes!
    const writesBeforeRerun = store.getWriteCount();
    const rerunRes = await runStagingInitialization({ catalog, store, dryRun: false, runId: 'staging_init_test2' });
    assert.equal(rerunRes.status, 'INITIALIZATION_SUCCEEDED');
    assert.equal(store.getWriteCount(), writesBeforeRerun, 'Idempotent re-run must perform 0 DB writes');
    for (const name of CLASS_A_NAMES) {
      assert.equal(rerunRes.summary[name].toInsert, 0);
      assert.equal(rerunRes.summary[name].toRepairLinks, 0);
      assert.equal(rerunRes.summary[name].alreadyCanonical, EXPECTED_CANONICAL_COUNTS[name]);
    }
  });

  it('7. Partial Execution Recovery & Preservation of Unrelated Records (Simulated Store)', async () => {
    const store = createSimulatedStore();
    // Seed 5 sources, 10 crimes, 1 unrelated crime, and 1 partial ScenarioStage lacking availableDecisionIds
    const srcModel = modelsByName.LegalSource;
    for (const s of catalog.legalSources.slice(0, 5)) {
      const d = new srcModel(s.doc).toObject({ depopulate: true });
      store.db.LegalSource.push(d);
    }
    for (const cr of catalog.cyberCrimes.slice(0, 10)) {
      store.db.CyberCrime.push(new modelsByName.CyberCrime(cr).toObject({ depopulate: true }));
    }
    const customCrime = new modelsByName.CyberCrime({
      ...catalog.cyberCrimes[0],
      title: 'Custom Staging Test Threat',
      slug: 'custom-staging-test-threat'
    }).toObject({ depopulate: true });
    store.db.CyberCrime.push(customCrime);

    // Partial scenario@baseline v1 with stage 1 missing availableDecisionIds
    const baselineV1 = catalog.scenarios[0];
    const sDoc = new modelsByName.Scenario(baselineV1.scenario).toObject({ depopulate: true });
    store.db.Scenario.push(sDoc);
    const stg1 = baselineV1.stages[0];
    const stg1Doc = new modelsByName.ScenarioStage({
      ...stg1,
      scenarioId: sDoc._id,
      availableDecisionIds: []
    }).toObject({ depopulate: true });
    const originalProbeIds = (stg1Doc.signalProbes || []).map((p) => p._id?.toString());
    store.db.ScenarioStage.push(stg1Doc);
    const dec1Doc = new modelsByName.ScenarioDecision({
      ...stg1.decisions[0],
      stageId: stg1Doc._id,
      nextStageId: null
    }).toObject({ depopulate: true });
    store.db.ScenarioDecision.push(dec1Doc);

    const res = await runStagingInitialization({ catalog, store, dryRun: false, runId: 'staging_init_recovery' });
    assert.equal(res.status, 'INITIALIZATION_SUCCEEDED');
    assert.equal(res.summary.CyberCrime.alreadyCanonical, 10);
    assert.equal(res.summary.CyberCrime.toInsert, 19);
    assert.equal(res.summary.CyberCrime.preservedUnrelated, 1);
    assert.equal(res.afterCounts.CyberCrime, 30); // 29 canonical + 1 unrelated preserved
    assert.equal(store.db.CyberCrime.some((c) => c.slug === 'custom-staging-test-threat'), true);
    assert.equal(res.afterCounts.ScenarioStage, 43);
    assert.equal(res.afterCounts.ScenarioDecision, 111);
    assert.ok(res.repairedIds.ScenarioStage.includes(stg1Doc._id.toString()));
    assert.ok(res.repairedIds.ScenarioDecision.includes(dec1Doc._id.toString()));
    const updatedDec1 = store.db.ScenarioDecision.find((d) => d._id.equals(dec1Doc._id));
    assert.ok(updatedDec1.nextStageId, 'Broken nextStageId must be repaired after recovery');
    const updatedStg1 = store.db.ScenarioStage.find((st) => st._id.equals(stg1Doc._id));
    assert.deepEqual((updatedStg1.signalProbes || []).map((p) => p._id?.toString()), originalProbeIds);
  });

  it('8. Aborts BEFORE writes on duplicates, cross-key collisions, and divergent content', async () => {
    // A. Duplicate primary key
    const dupStore = createSimulatedStore({
      CyberCrime: [
        new modelsByName.CyberCrime(catalog.cyberCrimes[0]).toObject({ depopulate: true }),
        new modelsByName.CyberCrime(catalog.cyberCrimes[0]).toObject({ depopulate: true })
      ]
    });
    const dupRes = await runStagingInitialization({ catalog, store: dupStore, dryRun: false });
    assert.equal(dupRes.status, 'ABORTED_CONFLICTS');
    assert.equal(dupRes.conflicts[0].type, 'DUPLICATE_PRIMARY_KEY');
    assert.equal(dupStore.getWriteCount(), 0);

    // B. Divergent content on canonical key
    const modCrime = { ...catalog.cyberCrimes[0], whatIsIt: 'Modified non-canonical description' };
    const divStore = createSimulatedStore({
      CyberCrime: [new modelsByName.CyberCrime(modCrime).toObject({ depopulate: true })]
    });
    const divRes = await runStagingInitialization({ catalog, store: divStore, dryRun: false });
    assert.equal(divRes.status, 'ABORTED_CONFLICTS');
    assert.equal(divRes.conflicts[0].type, 'CONTENT_CONFLICT');
    assert.equal(divStore.getWriteCount(), 0);

    // C. Cross-key collision (matching title under a different slug)
    const crossCrime = { ...catalog.cyberCrimes[0], slug: 'hijacked-phishing-slug' };
    const crossStore = createSimulatedStore({
      CyberCrime: [new modelsByName.CyberCrime(crossCrime).toObject({ depopulate: true })]
    });
    const crossRes = await runStagingInitialization({ catalog, store: crossStore, dryRun: false });
    assert.equal(crossRes.status, 'ABORTED_CONFLICTS');
    assert.equal(crossRes.conflicts[0].type, 'CROSS_KEY_COLLISION');
    assert.equal(crossStore.getWriteCount(), 0);
  });

  it('9. Rollback manifest loader rejects invalid run IDs, non-staging targets, and protected collections', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-rollback-test-'));
    try {
      assert.throws(() => loadAndValidateManifest('../evil', tmpDir), /Invalid or missing/);

      const badTargetPath = path.join(tmpDir, 'staging_init_bad_db.json');
      fs.writeFileSync(badTargetPath, JSON.stringify({ targetDatabase: 'cyber_law_portal', insertedIds: {} }));
      assert.throws(() => loadAndValidateManifest('staging_init_bad_db', tmpDir), /cyber_law_staging/);

      const badColPath = path.join(tmpDir, 'staging_init_bad_col.json');
      fs.writeFileSync(badColPath, JSON.stringify({ targetDatabase: 'cyber_law_staging', insertedIds: { User: ['abc'] } }));
      assert.throws(() => loadAndValidateManifest('staging_init_bad_col', tmpDir), /non-Class-A/);

      const okPath = path.join(tmpDir, 'staging_init_ok_123.json');
      fs.writeFileSync(okPath, JSON.stringify({ targetDatabase: 'cyber_law_staging', insertedIds: { CyberCrime: ['id1'] } }));
      const loaded = loadAndValidateManifest('staging_init_ok_123', tmpDir);
      assert.equal(loaded.manifest.targetDatabase, 'cyber_law_staging');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('10. Single Mongoose Singleton Contract across engine, all 3 CLI scripts, and all 17 models', () => {
    assert.strictEqual(initCli.mongoose, engineMongoose, 'initializeStagingDatabase must share engine mongoose singleton');
    assert.strictEqual(verifyCli.mongoose, engineMongoose, 'verifyStagingContentIntegrity must share engine mongoose singleton');
    assert.strictEqual(rollbackCli.mongoose, engineMongoose, 'rollbackStagingInitialization must share engine mongoose singleton');

    const modelNames = Object.keys(ALL_MODELS);
    assert.equal(modelNames.length, 17);
    for (const [name, Model] of Object.entries(ALL_MODELS)) {
      assert.strictEqual(Model.base, engineMongoose, `Model ${name}.base must strictly equal engine mongoose`);
      assert.strictEqual(Model.db, engineMongoose.connection, `Model ${name}.db must strictly equal engine mongoose.connection`);
    }

    // Verify CLI scripts never independently try/require('mongoose')
    for (const file of ['initializeStagingDatabase.js', 'verifyStagingContentIntegrity.js', 'rollbackStagingInitialization.js']) {
      const src = fs.readFileSync(path.join(__dirname, '../../scripts', file), 'utf8');
      assert.equal(/require\(['"]mongoose['"]\)/.test(src), false, `${file} must not directly require('mongoose')`);
    }
  });

  it('11. Fail-fast assertModelsBoundToConnection rejects mismatch/unopened connections in <10ms', () => {
    const start = Date.now();

    // Disconnected default models must fail immediately
    assert.throws(
      () => assertModelsBoundToConnection(engineMongoose),
      /\[CONNECTION STATE ERROR\].*readyState is 0/
    );

    // Mismatched Mongoose singleton (Model.base !== activeMongoose)
    const fakeMongoose = { connection: { readyState: 1 } };
    assert.throws(
      () => assertModelsBoundToConnection(fakeMongoose),
      /\[CONNECTION OWNERSHIP ERROR\].*separate Mongoose singleton/
    );

    // Mismatched Model.db (Model.db !== activeMongoose.connection)
    const mockModelSameBase = {
      MockModel: { base: fakeMongoose, db: { readyState: 1 }, collection: { buffer: false } }
    };
    assert.throws(
      () => assertModelsBoundToConnection(fakeMongoose, mockModelSameBase),
      /\[CONNECTION OWNERSHIP ERROR\].*default connection/
    );

    // Connected db but collection still buffering commands
    const mockBufferingModel = {
      MockModel: { base: fakeMongoose, db: fakeMongoose.connection, collection: { buffer: true } }
    };
    assert.throws(
      () => assertModelsBoundToConnection(fakeMongoose, mockBufferingModel),
      /\[CONNECTION STATE ERROR\].*still buffering commands/
    );

    // Valid connected non-buffering state passes cleanly
    const mockReadyModel = {
      MockModel: { base: fakeMongoose, db: fakeMongoose.connection, collection: { buffer: false } }
    };
    assert.doesNotThrow(() => assertModelsBoundToConnection(fakeMongoose, mockReadyModel));

    const elapsedMs = Date.now() - start;
    assert.ok(elapsedMs < 200, `Expected fail-fast verification, took ${elapsedMs}ms`);
  });

  it('12. Error is logged BEFORE connection teardown and avoids 10s buffering wait (mocked connection)', () => {
    const childCode = `
      const emittedOrder = [];
      const origErr = console.error;
      const origLog = console.log;
      console.error = (...args) => {
        emittedOrder.push(args.join(' '));
        origErr.apply(console, args);
      };
      console.log = (...args) => {
        emittedOrder.push(args.join(' '));
        origLog.apply(console, args);
      };
      const cli = require('./scripts/initializeStagingDatabase');
      const eng = require('./server/config/stagingInitializerEngine');
      cli.mongoose.connect = async () => {
        Object.defineProperty(eng.mongoose.connection, 'readyState', { value: 1, configurable: true });
        return eng.mongoose;
      };
      cli.mongoose.disconnect = async () => {
        Object.defineProperty(eng.mongoose.connection, 'readyState', { value: 0, configurable: true });
      };
      cli.runCli(['--live-dry-run']).catch(() => {
        origLog('__EMITTED_ORDER__:' + JSON.stringify(emittedOrder));
        process.exit(2);
      });
    `;

    let output = '';
    let exitStatus = 0;
    const start = Date.now();
    try {
      execFileSync(process.execPath, ['-e', childCode], {
        cwd: path.resolve(__dirname, '../..'),
        env: {
          PATH: process.env.PATH,
          SystemRoot: process.env.SystemRoot,
          TEMP: process.env.TEMP,
          TMP: process.env.TMP,
          ASSERT_STAGING_DB: 'true',
          EXPECTED_STAGING_DB_NAME: 'cyber_law_staging',
          EXPECTED_STAGING_HOST: 'mock.cluster.mongodb.net',
          MONGODB_URI: 'mongodb+srv://mockuser:MockPass123@mock.cluster.mongodb.net/cyber_law_staging?retryWrites=true'
        },
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (err) {
      exitStatus = err.status;
      output = `${err.stdout || ''}\n${err.stderr || ''}`;
    }
    const elapsed = Date.now() - start;

    assert.equal(exitStatus, 2);
    assert.ok(elapsed < 5000, `Fail-fast error should not wait 10s buffer timeout (took ${elapsed}ms)`);
    const markerLine = output.split(/\r?\n/).find((l) => l.startsWith('__EMITTED_ORDER__:'));
    assert.ok(markerLine, `Missing __EMITTED_ORDER__ trace in output:\n${output}`);
    const emitted = JSON.parse(markerLine.slice('__EMITTED_ORDER__:'.length));
    const errIdx = emitted.findIndex((line) => line.includes('[INITIALIZATION ERROR]'));
    const discIdx = emitted.findIndex((line) => line.includes('[Database] Disconnected cleanly.'));
    assert.ok(errIdx !== -1, `Expected [INITIALIZATION ERROR] in emitted events:\n${emitted.join('\n')}`);
    assert.ok(discIdx !== -1, `Expected [Database] Disconnected cleanly. in emitted events:\n${emitted.join('\n')}`);
    assert.ok(errIdx < discIdx, `Error must be emitted BEFORE disconnect! Events:\n${emitted.join('\n')}`);
  });

  it('13. Canonical seed extraction triggers zero implicit dotenv or server/.env side-effects', () => {
    const loaderSrc = fs.readFileSync(path.join(__dirname, '../config/canonicalSeedLoader.js'), 'utf8');
    assert.equal(/require\(['"]\.\/seedJusticeShortcomingsCases['"]\)/.test(loaderSrc), false, 'Must not require seedJusticeShortcomingsCases at module load');

    const childCode = `
      const { loadCanonicalSeedCatalog } = require('./server/config/canonicalSeedLoader');
      const { assertStrictStagingInitEnvironment } = require('./server/config/stagingInitGuard');
      const { assertModelsBoundToConnection } = require('./server/config/stagingInitializerEngine');
      const cli = require('./scripts/initializeStagingDatabase');
      loadCanonicalSeedCatalog();
      const dotenvLoaded = Object.keys(require.cache).some((k) => k.toLowerCase().includes('dotenv'));
      console.log(JSON.stringify({
        dotenvLoaded,
        hasMongoUri: Boolean(process.env.MONGODB_URI || process.env.MONGO_URI),
        hasJwtSecret: Boolean(process.env.JWT_SECRET),
        hasAssertStaging: Boolean(process.env.ASSERT_STAGING_DB)
      }));
    `;

    // Run in isolated child with scrubbed env (none of MONGODB_URI/JWT_SECRET/etc. present)
    const cleanEnv = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot };
    const stdout = execFileSync(process.execPath, ['-e', childCode], {
      cwd: path.resolve(__dirname, '../..'),
      env: cleanEnv,
      encoding: 'utf8'
    }).trim();

    const parsed = JSON.parse(stdout);
    assert.equal(parsed.dotenvLoaded, false, 'dotenv must NEVER be loaded by canonicalSeedLoader/staging CLI imports');
    assert.equal(parsed.hasMongoUri, false, 'MONGODB_URI must NOT leak from server/.env');
    assert.equal(parsed.hasJwtSecret, false, 'JWT_SECRET must NOT leak from server/.env');
    assert.equal(parsed.hasAssertStaging, false, 'ASSERT_STAGING_DB must NOT leak from server/.env');
  });

  it('14. #42 canonicalSeedLoader records validation error with source category on unmapped quiz category', () => {
    const resolved = resolveQuizQuestionCategory('NonExistent Authored Topic', new Set(['Cyber Law Basics']));
    assert.equal(resolved.targetQuizCategory, null);
    assert.equal(resolved.sourceCategory, 'NonExistent Authored Topic');

    const catalog = loadCanonicalSeedCatalog();
    const mutated = {
      ...catalog,
      quizQuestions: catalog.quizQuestions.map((q, i) => (
        i === 0
          ? { ...q, category: 'NonExistent Authored Topic', _sourceQuizCategory: 'NonExistent Authored Topic', _targetQuizCategory: null }
          : q
      ))
    };
    const report = validateCanonicalCatalogOffline(mutated);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('NonExistent Authored Topic')));
  });

  it('15. #50 & #51 normalizeExistingDoc materializes missing schema defaults and getSecondaryKeys ignores empty/null keys', () => {
    const sampleQuestion = loadCanonicalSeedCatalog().quizQuestions[0];
    const cleanCanon = { ...sampleQuestion, quizId: new mongoose.Types.ObjectId() };
    delete cleanCanon._sourceQuizCategory;
    delete cleanCanon._targetQuizCategory;
    delete cleanCanon._matchStrategy;
    delete cleanCanon.published;
    delete cleanCanon.reviewStatus;

    // Older DB record stored before defaulted fields (`published`, `reviewStatus`, `sequenceItems`, `indicators`) were added
    const legacyStored = { ...cleanCanon, _id: new mongoose.Types.ObjectId() };
    delete legacyStored.published;
    delete legacyStored.reviewStatus;
    delete legacyStored.sequenceItems;
    delete legacyStored.indicators;

    const canonNorm = materializeCanonical(modelsByName.QuizQuestion, cleanCanon);
    const dbNorm = normalizeExistingDoc(modelsByName.QuizQuestion, legacyStored);
    assert.deepEqual(dbNorm, canonNorm);

    // #51 Empty/null/undefined secondary keys must never collide across unrelated docs
    const items = [
      { sectionNumber: 'Sec 1', slug: '' },
      { sectionNumber: 'Sec 2', slug: null }
    ];
    const existingDocs = [
      { _id: new mongoose.Types.ObjectId(), sectionNumber: 'Sec 1', slug: '' },
      { _id: new mongoose.Types.ObjectId(), sectionNumber: 'Sec 2', slug: null },
      { _id: new mongoose.Types.ObjectId(), sectionNumber: 'Sec 3', slug: null }
    ];
    const audit = auditFlatCollection({
      collectionName: 'LawSection',
      Model: modelsByName.LawSection,
      items,
      existingDocs,
      getPrimaryKey: (d) => ({ field: 'sectionNumber', value: d.sectionNumber }),
      getSecondaryKeys: (d) => [{ field: 'slug', value: d.slug }]
    });
    assert.equal(audit.conflicts.length, 0);
  });

  it('16. #43 canonicalSeedLoader preserves Adaptive Segment while rejecting unreachable stages & non-completing cycles', () => {
    const baseCatalog = loadCanonicalSeedCatalog();
    assert.equal(validateCanonicalCatalogOffline(baseCatalog).valid, true);

    // Unreachable stage injected into baseline@v1
    const withUnreachable = {
      ...baseCatalog,
      scenarios: baseCatalog.scenarios.map((entry, idx) => (
        idx !== 0
          ? entry
          : {
              ...entry,
              stages: [
                ...entry.stages,
                {
                  ...entry.stages[1],
                  stageOrder: 99,
                  title: 'Orphaned Unreachable Stage',
                  terminal: true,
                  decisions: []
                }
              ]
            }
      )),
      counts: {
        ...baseCatalog.counts,
        ScenarioStage: baseCatalog.counts.ScenarioStage + 1
      }
    };
    const unreachableReport = validateCanonicalCatalogOffline(withUnreachable);
    assert.equal(unreachableReport.valid, false);
    assert.ok(unreachableReport.errors.some((e) => e.includes('Unreachable stage') && e.includes('#99')));

    // Non-completing cycle (stage 2 <-> stage 3 with no terminal exit)
    const withCycle = {
      ...baseCatalog,
      scenarios: baseCatalog.scenarios.map((entry, idx) => {
        if (idx !== 0) return entry;
        const stagesClone = JSON.parse(JSON.stringify(entry.stages));
        stagesClone[1].decisions[0].nextStageOrder = 3;
        stagesClone[1].decisions[1].nextStageOrder = 3;
        stagesClone[2].decisions[0].nextStageOrder = 2;
        stagesClone[2].decisions[1].nextStageOrder = 2;
        return { ...entry, stages: stagesClone };
      })
    };
    const cycleReport = validateCanonicalCatalogOffline(withCycle);
    assert.equal(cycleReport.valid, false);
    assert.ok(cycleReport.errors.some((e) => e.includes('Non-completing cycle')));
  });

  it('17. #40 & #41 staging initialization records pre-mutation manifest & DB provenance and rollback enforces DB ownership', async () => {
    // A. Failure to persist pre-mutation manifest aborts BEFORE any Class A write
    const failManifestStore = createSimulatedStore();
    await assert.rejects(
      () => runStagingInitialization({
        catalog,
        store: failManifestStore,
        dryRun: false,
        runId: 'staging_init_fail_manifest',
        onBeforeMutation: async () => { throw new Error('Disk read-only manifest failure'); }
      }),
      /Disk read-only manifest failure/
    );
    assert.equal(failManifestStore.getWriteCount(), 0);

    // B. Simulate live run capturing provenance BEFORE writes and rollback verifying DB provenance
    const provenanceRecords = new Map();
    const simStore = createSimulatedStore();
    const seenBeforeFirstCreate = [];
    const origCreateOne = simStore.createOne;
    simStore.createRunProvenance = async (doc) => {
      provenanceRecords.set(doc.runId, { ...doc });
      return doc;
    };
    simStore.finalizeRunProvenance = async (rId, fields) => {
      provenanceRecords.set(rId, { ...provenanceRecords.get(rId), ...fields });
    };
    simStore.createOne = async (col, doc) => {
      if (seenBeforeFirstCreate.length === 0) {
        const prov = provenanceRecords.get('staging_init_prov_ok');
        seenBeforeFirstCreate.push(Boolean(prov && prov.entries.length > 0 && prov.status === 'IN_PROGRESS'));
      }
      return origCreateOne(col, doc);
    };

    const runManifestSnapshots = [];
    const execRes = await runStagingInitialization({
      catalog,
      store: simStore,
      dryRun: false,
      runId: 'staging_init_prov_ok',
      onBeforeMutation: async (meta) => {
        runManifestSnapshots.push(meta);
      }
    });
    assert.equal(seenBeforeFirstCreate[0], true, 'DB provenance must exist BEFORE first createOne');
    assert.equal(runManifestSnapshots.length, 1);
    assert.equal(runManifestSnapshots[0].entries.length, execRes.insertedIds.LegalSource.length + execRes.insertedIds.LawSection.length + execRes.insertedIds.CyberCrime.length + execRes.insertedIds.CaseStudy.length + execRes.insertedIds.Quiz.length + execRes.insertedIds.QuizQuestion.length + execRes.insertedIds.LearningModule.length + execRes.insertedIds.Resource.length + execRes.insertedIds.Scenario.length + execRes.insertedIds.ScenarioStage.length + execRes.insertedIds.ScenarioDecision.length);

    // C. Rollback skips unowned IDs not present in persistent DB provenance & fails closed if provenance missing
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-prov-rb-'));
    const ownedId = new mongoose.Types.ObjectId().toString();
    const unownedId = new mongoose.Types.ObjectId().toString();
    fs.writeFileSync(
      path.join(tmpDir, 'staging_init_rb_check.json'),
      JSON.stringify({
        runId: 'staging_init_rb_check',
        targetDatabase: 'cyber_law_staging',
        targetHost: 'cluster0.stage123.mongodb.net',
        insertedIds: { CyberCrime: [ownedId, unownedId] }
      })
    );

    const prevEnv = {
      ASSERT_STAGING_DB: process.env.ASSERT_STAGING_DB,
      EXPECTED_STAGING_DB_NAME: process.env.EXPECTED_STAGING_DB_NAME,
      EXPECTED_STAGING_HOST: process.env.EXPECTED_STAGING_HOST,
      MONGODB_URI: process.env.MONGODB_URI,
      ALLOW_DB_RESET: process.env.ALLOW_DB_RESET
    };
    process.env.ASSERT_STAGING_DB = 'true';
    process.env.EXPECTED_STAGING_DB_NAME = 'cyber_law_staging';
    process.env.EXPECTED_STAGING_HOST = 'cluster0.stage123.mongodb.net';
    process.env.MONGODB_URI = 'mongodb+srv://stage:Secret!@cluster0.stage123.mongodb.net/cyber_law_staging';
    delete process.env.ALLOW_DB_RESET;

    try {
      // Missing DB provenance must refuse deletion
      await assert.rejects(
        () => rollbackCli.runRollback(['--run-id', 'staging_init_rb_check', '--confirm', '--execute'], {
          backupsDir: tmpDir,
          provenanceStore: { async getRunProvenance() { return null; } }
        }),
        /ROLLBACK PROVENANCE ERROR/
      );

      // Present provenance filters deleteMany strictly to ownedId
      const deletedFilters = [];
      const mockModels = Object.fromEntries(CLASS_A_NAMES.map((name) => [
        name,
        {
          async deleteMany(filter) {
            deletedFilters.push({ name, ids: filter._id.$in });
            return { deletedCount: filter._id.$in.length };
          }
        }
      ]));

      const rbRes = await rollbackCli.runRollback(['--run-id', 'staging_init_rb_check', '--confirm', '--execute'], {
        backupsDir: tmpDir,
        provenanceStore: {
          async getRunProvenance() {
            return {
              runId: 'staging_init_rb_check',
              targetDatabase: 'cyber_law_staging',
              entries: [{ collection: 'CyberCrime', docId: ownedId }]
            };
          }
        },
        models: mockModels
      });

      assert.equal(rbRes.status, 'ROLLBACK_COMPLETE');
      assert.equal(rbRes.deletedCounts.CyberCrime, 1);
      assert.equal(rbRes.skippedUnownedCounts.CyberCrime, 1);
      assert.deepEqual(deletedFilters, [{ name: 'CyberCrime', ids: [ownedId] }]);
    } finally {
      for (const [k, v] of Object.entries(prevEnv)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
