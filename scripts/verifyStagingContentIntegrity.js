#!/usr/bin/env node

/**
 * Cyber Law Awareness Portal — Staging Content & Integrity Verifier
 *
 * Strictly read-only audit utility verifying initialized staging database
 * completeness, Mongoose schema validity, unique identifiers, foreign-key
 * relationships, scenario decision graphs, and remediation catalog linkage.
 *
 * Usage:
 *   node scripts/verifyStagingContentIntegrity.js --offline
 *     -> Validates canonical seed content offline without DB connection
 *
 *   node scripts/verifyStagingContentIntegrity.js [--api-url https://your-backend.onrender.com]
 *     -> Enforces staging guards, audits live staging Atlas collections read-only,
 *        and optionally verifies live HTTP API catalog contracts
 */

const {
  mongoose,
  ALL_MODELS,
  assertModelsBoundToConnection
} = require('../server/config/stagingInitializerEngine');
const { assertStrictStagingInitEnvironment } = require('../server/config/stagingInitGuard');
const {
  EXPECTED_CANONICAL_COUNTS,
  loadCanonicalSeedCatalog,
  validateCanonicalCatalogOffline
} = require('../server/config/canonicalSeedLoader');
const { auditScenario } = require('../server/services/scenarioIntegrityService');
const { validateCatalogDatabaseIntegrity } = require('../server/services/remediationCatalogValidator');
const remediationCatalog = require('../server/config/remediationCatalog');
const { supplementaryLawsSeedData } = require('../server/config/supplementaryLawsSeed');

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
  ScenarioDecision,
  User,
  UserProgress,
  AssessmentSession,
  AssessmentDecision,
  QuizAttempt,
  AdminAuditLog
} = ALL_MODELS;

async function verifyLiveHttpCatalogs(apiBaseUrl) {
  const base = apiBaseUrl.replace(/\/$/, '').replace(/\/api$/, '');
  const checks = [
    { path: '/api/health', validate: (d) => d && d.status === 'healthy' && d.database === 'connected', label: 'health=healthy' },
    { path: '/api/crimes/crimes', validate: (d) => Array.isArray(d) && d.length >= EXPECTED_CANONICAL_COUNTS.CyberCrime, label: `>=${EXPECTED_CANONICAL_COUNTS.CyberCrime} crimes` },
    { path: '/api/crimes/cases', validate: (d) => Array.isArray(d) && d.length >= EXPECTED_CANONICAL_COUNTS.CaseStudy, label: `>=${EXPECTED_CANONICAL_COUNTS.CaseStudy} cases` },
    { path: '/api/laws', validate: (d) => Array.isArray(d) && d.length >= EXPECTED_CANONICAL_COUNTS.LawSection, label: `>=${EXPECTED_CANONICAL_COUNTS.LawSection} laws` },
    { path: '/api/quizzes', validate: (d) => Array.isArray(d) && d.length >= EXPECTED_CANONICAL_COUNTS.Quiz, label: `>=${EXPECTED_CANONICAL_COUNTS.Quiz} quizzes` },
    { path: '/api/crimes/resources', validate: (d) => Array.isArray(d) && d.length >= EXPECTED_CANONICAL_COUNTS.Resource, label: `>=${EXPECTED_CANONICAL_COUNTS.Resource} resources` }
  ];

  const failures = [];
  for (const c of checks) {
    const res = await fetch(`${base}${c.path}`);
    if (!res.ok) {
      failures.push(`HTTP ${res.status} on GET ${c.path}`);
      continue;
    }
    const body = await res.json();
    if (!c.validate(body)) {
      failures.push(`Contract assertion failed on GET ${c.path} (expected ${c.label}, got ${Array.isArray(body) ? `${body.length} items` : JSON.stringify(body)})`);
    } else {
      console.log(`  [PASS] GET ${c.path} -> HTTP 200 (${c.label})`);
    }
  }
  return failures;
}

async function runVerification(argv = process.argv.slice(2)) {
  const isOffline = argv.includes('--offline');
  const apiUrlArgIdx = argv.indexOf('--api-url');
  const apiBaseUrl = apiUrlArgIdx !== -1 && argv[apiUrlArgIdx + 1] ? argv[apiUrlArgIdx + 1] : null;

  console.log('======================================================================');
  console.log('CYBER LAW AWARENESS PORTAL — STAGING CONTENT INTEGRITY VERIFIER');
  console.log(`Mode: ${isOffline ? 'OFFLINE' : 'LIVE_READ_ONLY'}`);
  console.log('======================================================================');

  const catalog = loadCanonicalSeedCatalog();
  const offlineRes = validateCanonicalCatalogOffline(catalog);
  if (!offlineRes.valid) {
    console.error('[FAIL] Canonical catalog offline check failed:', offlineRes.errors);
    process.exit(1);
  }
  console.log('[1/6] Canonical Baseline Structure: PASS (0 schema/ref errors offline)');

  if (isOffline) {
    console.log('[Database] Skipped live check (--offline mode, readyState=0).');
    return { valid: true, offline: true, counts: offlineRes.counts };
  }

  // Enforce mandatory staging guard prior to connecting
  const guardResult = assertStrictStagingInitEnvironment(process.env);
  console.log(`[2/6] Staging Guard Verified: PASS (db=${guardResult.dbName}, host=${guardResult.host})`);

  const rawUri = (process.env.MONGODB_URI || process.env.MONGO_URI).trim();
  const errors = [];
  try {
    await mongoose.connect(rawUri, { family: 4, serverSelectionTimeoutMS: 10000 });
    assertModelsBoundToConnection(mongoose);
    // 1. Collection Counts
    const classAModels = {
      LegalSource, LawSection, CyberCrime, CaseStudy, Quiz,
      QuizQuestion, LearningModule, Resource, Scenario, ScenarioStage, ScenarioDecision
    };
    const classBcdModels = { User, UserProgress, AssessmentSession, AssessmentDecision, QuizAttempt, AdminAuditLog };

    console.log('\n[3/6] Collection Counts Audit (Read-Only):');
    const liveCounts = {};
    for (const [name, Model] of Object.entries(classAModels)) {
      const cnt = await Model.countDocuments({});
      liveCounts[name] = cnt;
      const expected = EXPECTED_CANONICAL_COUNTS[name];
      if (cnt < expected) {
        errors.push(`Collection ${name} underpopulated: found ${cnt}, expected >= ${expected}`);
        console.log(`  [FAIL] ${name.padEnd(20)}: ${cnt} (expected >= ${expected})`);
      } else {
        console.log(`  [PASS] ${name.padEnd(20)}: ${cnt} (expected >= ${expected})`);
      }
    }

    console.log('\n  Protected Boundary Collections:');
    for (const [name, Model] of Object.entries(classBcdModels)) {
      const cnt = await Model.countDocuments({});
      liveCounts[name] = cnt;
      console.log(`  [INFO] ${name.padEnd(20)}: ${cnt}`);
    }

    // 2. Load Docs for Schema, Uniqueness & Reference Integrity
    const [
      sources, laws, crimes, cases, quizzes, questions, modules, resources, scenarios, stages, decisions
    ] = await Promise.all([
      LegalSource.find({}).lean(),
      LawSection.find({}).lean(),
      CyberCrime.find({}).lean(),
      CaseStudy.find({}).lean(),
      Quiz.find({}).lean(),
      QuizQuestion.find({}).lean(),
      LearningModule.find({}).lean(),
      Resource.find({}).lean(),
      Scenario.find({}).lean(),
      ScenarioStage.find({}).lean(),
      ScenarioDecision.find({}).lean()
    ]);

    console.log('\n[4/6] Schema Validation & Unique Identifier Checks:');
    const checkSchemasAndUnique = (docs, Model, label, keyFn) => {
      const seen = new Set();
      for (const doc of docs) {
        const vErr = new Model(doc).validateSync();
        if (vErr) errors.push(`${label} schema violation (${doc._id}): ${vErr.message}`);
        const k = keyFn(doc);
        if (k !== undefined && k !== null && k !== '') {
          if (seen.has(k)) errors.push(`Duplicate ${label} key "${k}"`);
          seen.add(k);
        }
      }
    };

    checkSchemasAndUnique(sources, LegalSource, 'LegalSource', (d) => d.title);
    checkSchemasAndUnique(laws, LawSection, 'LawSection', (d) => d.sectionNumber);
    checkSchemasAndUnique(crimes, CyberCrime, 'CyberCrime', (d) => d.slug);
    checkSchemasAndUnique(cases, CaseStudy, 'CaseStudy', (d) => d.slug);
    checkSchemasAndUnique(quizzes, Quiz, 'Quiz', (d) => d.title);
    checkSchemasAndUnique(questions, QuizQuestion, 'QuizQuestion', (d) => d.questionId);
    checkSchemasAndUnique(modules, LearningModule, 'LearningModule', (d) => d.slug);
    checkSchemasAndUnique(resources, Resource, 'Resource', (d) => d.title);
    checkSchemasAndUnique(scenarios, Scenario, 'Scenario', (d) => `${d.slug}@v${d.version}`);

    // CaseStudy dual-collection check (11 Landmark + 10 Justice Fell Short)
    const landmarkCount = cases.filter((c) => (c.collection || 'Landmark Precedents') === 'Landmark Precedents').length;
    const shortcomingsCount = cases.filter((c) => c.collection === 'Cases Where Justice Fell Short').length;
    if (landmarkCount < 11) errors.push(`Expected >= 11 Landmark Precedents cases, found ${landmarkCount}`);
    if (shortcomingsCount < 10) errors.push(`Expected >= 10 Cases Where Justice Fell Short cases, found ${shortcomingsCount}`);
    console.log(`  [INFO] CaseStudy Split -> Landmark Precedents: ${landmarkCount}, Justice Fell Short: ${shortcomingsCount}`);

    // 3. Cross-Collection Relationships & Scenario Graph Audit
    console.log('\n[5/6] Relationship & Scenario Graph Verification:');
    const sourceIdSet = new Set(sources.map((s) => s._id.toString()));
    const quizIdSet = new Set(quizzes.map((q) => q._id.toString()));
    const scenarioIdSet = new Set(scenarios.map((s) => s._id.toString()));
    const stageIdSet = new Set(stages.map((st) => st._id.toString()));
    const lawRefSet = new Set([...laws.map((l) => l.sectionNumber), ...laws.map((l) => l.slug).filter(Boolean)]);
    const suppLawRefSet = new Set(supplementaryLawsSeedData.map((l) => l.sectionNumber));
    const crimeSlugSet = new Set(crimes.map((c) => c.slug));
    const caseSlugSet = new Set(cases.map((c) => c.slug));
    const moduleSlugSet = new Set(modules.map((m) => m.slug));

    for (const law of laws) {
      if (law.officialSourceId && !sourceIdSet.has(law.officialSourceId.toString())) {
        errors.push(`Orphaned LawSection.officialSourceId on ${law.sectionNumber}`);
      }
      for (const cs of (law.relatedCaseStudies || [])) {
        if (!caseSlugSet.has(cs)) errors.push(`LawSection ${law.sectionNumber} links missing CaseStudy "${cs}"`);
      }
    }

    for (const q of questions) {
      if (!q.quizId || !quizIdSet.has(q.quizId.toString())) {
        errors.push(`Orphaned QuizQuestion ${q.questionId || q._id}: invalid quizId`);
      }
    }

    for (const stg of stages) {
      if (!stg.scenarioId || !scenarioIdSet.has(stg.scenarioId.toString())) {
        errors.push(`Orphaned ScenarioStage ${stg._id}: missing scenarioId`);
      }
    }

    for (const dec of decisions) {
      if (!dec.stageId || !stageIdSet.has(dec.stageId.toString())) {
        errors.push(`Orphaned ScenarioDecision ${dec._id}: missing stageId`);
      }
      if (dec.nextStageId && !stageIdSet.has(dec.nextStageId.toString())) {
        errors.push(`Orphaned ScenarioDecision ${dec._id}: missing nextStageId`);
      }
    }

    for (const mod of modules) {
      for (const lr of (mod.relatedLawSections || [])) {
        if (!lawRefSet.has(lr)) errors.push(`LearningModule ${mod.slug} links missing LawSection "${lr}"`);
      }
      for (const cr of (mod.relatedCyberCrimes || [])) {
        if (!crimeSlugSet.has(cr)) errors.push(`LearningModule ${mod.slug} links missing CyberCrime "${cr}"`);
      }
      for (const cs of (mod.relatedCaseStudies || [])) {
        if (!caseSlugSet.has(cs)) errors.push(`LearningModule ${mod.slug} links missing CaseStudy "${cs}"`);
      }
    }

    for (const cr of crimes) {
      for (const cs of (cr.relatedCaseStudies || [])) {
        if (!caseSlugSet.has(cs)) errors.push(`CyberCrime ${cr.slug} links missing CaseStudy "${cs}"`);
      }
      for (const m of (cr.relatedModules || [])) {
        if (!moduleSlugSet.has(m)) errors.push(`CyberCrime ${cr.slug} links missing LearningModule "${m}"`);
      }
      for (const rc of (cr.relatedCrimes || [])) {
        if (!crimeSlugSet.has(rc)) errors.push(`CyberCrime ${cr.slug} links missing related CyberCrime "${rc}"`);
      }
      for (const lc of (cr.legalContext || [])) {
        if (!lawRefSet.has(lc) && !suppLawRefSet.has(lc)) {
          errors.push(`CyberCrime ${cr.slug} legalContext references missing LawSection "${lc}"`);
        }
      }
    }

    // Scenario integrity service on all scenarios
    for (const sc of scenarios) {
      const sRes = await auditScenario(sc._id);
      if (!sRes.valid) {
        sRes.errors.forEach((e) => errors.push(`Scenario ${sc.slug}@v${sc.version}: ${e}`));
      } else {
        console.log(`  [PASS] Scenario Graph "${sc.slug}@v${sc.version}" audited clean.`);
      }
    }

    // Remediation catalog DB link validation
    try {
      await validateCatalogDatabaseIntegrity(remediationCatalog);
      console.log('  [PASS] Remediation Catalog DB references validated cleanly.');
    } catch (remErr) {
      errors.push(`Remediation Catalog validation failed: ${remErr.message}`);
    }

    // Optional live HTTP smoke checks
    if (apiBaseUrl) {
      console.log(`\n[6/6] Live HTTP API Contract Smoke Checks (${apiBaseUrl}):`);
      const httpFailures = await verifyLiveHttpCatalogs(apiBaseUrl);
      errors.push(...httpFailures);
    } else {
      console.log('\n[6/6] Live HTTP API Contract Smoke Checks: SKIPPED (pass --api-url <url> to verify)');
    }

    if (errors.length > 0) {
      console.error(`\n[VERIFICATION FAILED] ${errors.length} integrity issue(s) found:`);
      errors.forEach((e) => console.error(`  - ${e}`));
      throw new Error(`Staging content integrity verification failed with ${errors.length} error(s).`);
    }

    console.log('\n======================================================================');
    console.log('STAGING CONTENT INTEGRITY VERIFICATION: 100% PASSED');
    console.log('======================================================================');
    return { valid: true, liveCounts };
  } catch (err) {
    console.error(`\n[VERIFY ERROR] ${err.message}`);
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
  runVerification()
    .then(() => process.exit(0))
    .catch((err) => {
      if (!err?._loggedBeforeTeardown) {
        console.error(`\n[VERIFY ERROR] ${err.message}`);
      }
      process.exit(1);
    });
}

module.exports = { mongoose, runVerification, verifyLiveHttpCatalogs };

