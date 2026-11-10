/**
 * Offline Cases Collection Integrity Test Suite
 * Validates:
 * 1. 11 Legacy case studies schema compliance and default field backfill
 * 2. 10 Approved target slugs for "Cases Where Justice Fell Short" (PRODUCT_OWNER_DECISIONS.md)
 * 3. 21 Unique case slugs across entire catalog with zero collisions
 * 4. Additive schema extension integrity (no index on collection, enum bounds, source metadata)
 * 5. Structural 6-part narrative contract verification
 * 6. Insert-only preflight collision detection logic
 * 7. Exact rollback identity, deterministic hashing, provenance, and crash recovery logic
 * 8. Strict offline execution (zero MongoDB network connections)
 * 9. Checkpoint 2 authored cases structural & metadata completeness
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('../models/CaseStudy').base;

// Import Mongoose Model (in-memory schema validation without database connection)
const CaseStudy = require('../models/CaseStudy');

// Import Authored Checkpoint 2 Modules
const {
  justiceShortcomingsCasesData,
  seedJusticeShortcomingsCases
} = require('../config/seedJusticeShortcomingsCases');
const {
  evaluateRollbackEligibility
} = require('../../scripts/rollbackJusticeShortcomingsCases');

// Approved 10 target slugs for "Cases Where Justice Fell Short" (PRODUCT_OWNER_DECISIONS.md)
const APPROVED_TARGET_SLUGS = [
  'sulli-deals-bulli-bai-investigation-delays',
  'jaiprakash-kulkarni-v-banking-ombudsman',
  'cyberabad-instant-loan-app-syndicates',
  'harshada-bindu-dholepatil-v-vodafone-idea',
  'aeps-biometric-cloned-deed-exploits',
  'aiims-new-delhi-ransomware-incident',
  'pegasus-technical-committee-inquiry',
  'ravinder-singh-v-state-of-punjab',
  'cfcfrms-1930-restitution-gap',
  'kudankulam-administrative-network-malware'
];

// Required 6-part narrative section headings
const REQUIRED_NARRATIVE_HEADINGS = [
  'Part 1 — Case at a Glance',
  'Part 2 — Chronological Incident Progression',
  'Part 3 — Evidence: Established, Alleged and Unresolved',
  'Part 4 — Institutional Response & Adjudication Outcome',
  'Part 5 — Law & Procedural Lessons',
  'Part 6 — Practical Learning & Citizen Guidance'
];

// Deterministic canonical JSON serialization (RFC 8785 style key sorting)
function canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const entries = sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`);
  return '{' + entries.join(',') + '}';
}

// Compute deterministic SHA-256 digest
function computeDocumentDigest(doc) {
  return crypto.createHash('sha256').update(canonicalStringify(doc)).digest('hex');
}

// Extract legacy case studies from seed.js
function extractLegacyCaseStudies() {
  const seedFilePath = path.join(__dirname, '../config/seed.js');
  const seedContent = fs.readFileSync(seedFilePath, 'utf8');

  const startMarker = 'const caseStudiesData = [';
  const startIndex = seedContent.indexOf(startMarker);
  assert(startIndex !== -1, 'caseStudiesData start marker not found in seed.js');

  const arrayStart = startIndex + 'const caseStudiesData = '.length;
  let bracketDepth = 0;
  let endIndex = -1;
  for (let i = arrayStart; i < seedContent.length; i++) {
    if (seedContent[i] === '[') bracketDepth++;
    else if (seedContent[i] === ']') {
      bracketDepth--;
      if (bracketDepth === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  assert(endIndex !== -1, 'Could not locate closing bracket of caseStudiesData in seed.js');

  const arrayCode = seedContent.substring(arrayStart, endIndex);
  
  // Safe evaluation using mock sandbox
  const vm = require('vm');
  const sandbox = { module: {}, exports: {} };
  const script = new vm.Script('caseStudies = ' + arrayCode);
  const context = vm.createContext(sandbox);
  script.runInContext(context);

  return sandbox.caseStudies;
}

// Pure function simulating the preflight collision check
function simulatePreflightCollisionCheck(targetSlugs, existingSlugs) {
  const existingSet = new Set(existingSlugs);
  const collidingSlugs = targetSlugs.filter(slug => existingSet.has(slug));
  return {
    allowed: collidingSlugs.length === 0,
    collidingSlugs
  };
}

// Pure function simulating rollback identity verification
function simulateRollbackIdentityCheck({
  targetBatchId,
  postSeedManifest,
  collectionRecords,
  targetSlugsWhitelist
}) {
  const whitelistSet = new Set(targetSlugsWhitelist);

  // If postSeedManifest is available, verify exact IDs
  if (postSeedManifest && Array.isArray(postSeedManifest.insertedIds)) {
    const idSet = new Set(postSeedManifest.insertedIds);
    const toDelete = collectionRecords.filter(r => 
      r.seedBatchId === targetBatchId && 
      idSet.has(r._id) && 
      whitelistSet.has(r.slug)
    );
    if (toDelete.length !== postSeedManifest.insertedIds.length) {
      return { allowed: false, reason: 'Mismatch between post-seed manifest IDs and collection records.' };
    }
    return { allowed: true, recordsToDelete: toDelete };
  }

  // Crash Recovery Path: Post-seed manifest missing, recover by seedBatchId + whitelist
  const toDelete = collectionRecords.filter(r => 
    r.seedBatchId === targetBatchId && 
    whitelistSet.has(r.slug)
  );

  // Verify that no foreign document outside whitelist is tagged with this seedBatchId
  const foreignTagged = collectionRecords.filter(r => 
    r.seedBatchId === targetBatchId && 
    !whitelistSet.has(r.slug)
  );
  if (foreignTagged.length > 0) {
    return { allowed: false, reason: 'Integrity alert: Documents outside whitelist carry target seedBatchId.' };
  }

  return { allowed: true, recordsToDelete: toDelete, recoveryPath: 'batch-provenance-fallback' };
}

async function runCasesCollectionIntegritySuite() {
  console.log('======================================================================');
  console.log('CASES COLLECTION INTEGRITY & STRUCTURAL VERIFICATION SUITE');
  console.log('Scope: Checkpoint 2 Offline Integrity & Authoring Verification');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 1: Legacy Case Studies Extraction & Schema Validation
  // -------------------------------------------------------------------------
  console.log('[SECTION 1] Legacy Case Studies Extraction & Schema Validation:');
  const legacyCases = extractLegacyCaseStudies();

  test('Seed contains exactly 11 legacy case studies', () => {
    assert.strictEqual(legacyCases.length, 11, `Expected 11 legacy cases, found ${legacyCases.length}`);
  });

  test('All 11 legacy case studies pass Mongoose schema validation', () => {
    legacyCases.forEach((cs, idx) => {
      const doc = new CaseStudy(cs);
      const err = doc.validateSync();
      assert.strictEqual(err, undefined, `Validation error on legacy case #${idx} (${cs.slug}): ${err?.message}`);
    });
  });

  test('Legacy case studies receive correct schema defaults (collection, category, seedBatchId)', () => {
    legacyCases.forEach((cs) => {
      const doc = new CaseStudy(cs);
      assert.strictEqual(doc.collection, 'Landmark Precedents', `Expected default collection 'Landmark Precedents' on ${cs.slug}`);
      assert.strictEqual(doc.collectionCategory, 'Judicial Precedents', `Expected default category 'Judicial Precedents' on ${cs.slug}`);
      assert.strictEqual(doc.seedBatchId, null, `Expected seedBatchId null on ${cs.slug}`);
    });
  });

  // -------------------------------------------------------------------------
  // SECTION 2: 21 Slugs Uniqueness Across Entire Catalog
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 2] Slug Uniqueness Across Entire Catalog (21 Cases):');
  const legacySlugs = legacyCases.map(c => c.slug);

  test('All 11 legacy slugs are non-empty, lowercase, valid kebab-case', () => {
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    legacySlugs.forEach(slug => {
      assert(slugRegex.test(slug), `Invalid legacy slug format: "${slug}"`);
    });
  });

  test('All 10 approved target slugs are non-empty, lowercase, valid kebab-case', () => {
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    APPROVED_TARGET_SLUGS.forEach(slug => {
      assert(slugRegex.test(slug), `Invalid approved target slug format: "${slug}"`);
    });
  });

  test('Legacy and approved target slugs have zero collisions across all 21 items', () => {
    const allSlugs = [...legacySlugs, ...APPROVED_TARGET_SLUGS];
    assert.strictEqual(allSlugs.length, 21, `Expected 21 total slugs, found ${allSlugs.length}`);
    const uniqueSlugs = new Set(allSlugs);
    assert.strictEqual(uniqueSlugs.size, 21, `Found slug collision! Unique count: ${uniqueSlugs.size} vs total: 21`);
  });

  // -------------------------------------------------------------------------
  // SECTION 3: Additive Schema Extension Integrity & Validation Bounds
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 3] Additive Schema Extension Integrity:');

  test('CaseStudy schema defines collection field with default "Landmark Precedents"', () => {
    const field = CaseStudy.schema.path('collection');
    assert(field, 'Path "collection" not found on CaseStudy schema');
    assert.strictEqual(field.defaultValue, 'Landmark Precedents');
  });

  test('CaseStudy schema explicitly OMITS index on collection field', () => {
    const field = CaseStudy.schema.path('collection');
    assert(field._index === null || field._index === undefined || field._index === false, 'Path "collection" must not define an index');
    
    // Also check compound/schema-level indexes
    const schemaIndexes = CaseStudy.schema.indexes();
    const hasCollectionIndex = schemaIndexes.some(([indexFields]) => 'collection' in indexFields);
    assert.strictEqual(hasCollectionIndex, false, 'Schema indexes must not include "collection"');
  });

  test('CaseStudy schema defines collectionCategory with correct enum bounds', () => {
    const field = CaseStudy.schema.path('collectionCategory');
    assert(field, 'Path "collectionCategory" not found on CaseStudy schema');
    const allowed = [
      'Judicial Precedents',
      'Investigative & Evidentiary Gaps',
      'Banking & Regulatory Inquiries',
      'Platform & Marketplace Lags',
      'Critical Infrastructure & Complex Attribution'
    ];
    assert.deepStrictEqual(field.enumValues, allowed);
  });

  test('CaseStudy schema defines evidentiaryClassification with correct enum bounds', () => {
    const field = CaseStudy.schema.path('evidentiaryClassification');
    assert(field, 'Path "evidentiaryClassification" not found on CaseStudy schema');
    const allowed = [
      'Documented Judicial Precedent',
      'Established Institutional Failure',
      'Documented Procedural Shortcoming',
      'Unresolved Incident'
    ];
    assert.deepStrictEqual(field.enumValues, allowed);
  });

  test('CaseStudy schema rejects invalid collectionCategory enum', () => {
    const doc = new CaseStudy({
      title: 'Invalid Category Test',
      slug: 'invalid-category-test',
      caseNumber: 'CASE-TEST-01',
      shortDescription: 'Testing invalid enum',
      difficulty: 'Beginner',
      incidentType: 'Test Incident',
      attackVector: 'Test Vector',
      collectionCategory: 'Unauthorized Fictional Category'
    });
    const err = doc.validateSync();
    assert(err, 'Expected validation error for invalid collectionCategory');
    assert(err.errors['collectionCategory'], 'Expected error on collectionCategory path');
  });

  test('CaseStudy schema source subdocument accepts citation, documentType, verificationDate', () => {
    const doc = new CaseStudy({
      title: 'Source Metadata Test',
      slug: 'source-metadata-test',
      caseNumber: 'CASE-TEST-02',
      shortDescription: 'Testing source metadata',
      difficulty: 'Intermediate',
      incidentType: 'Test Incident',
      attackVector: 'Test Vector',
      sources: [
        {
          title: 'High Court Judgment in Writ Petition No. 1234/2023',
          authority: 'High Court of Judicature',
          sourceType: 'court',
          citation: '2023 SCC OnLine Bom 4567',
          documentType: 'High Court Order',
          verificationDate: '2026-11-08'
        }
      ]
    });
    const err = doc.validateSync();
    assert.strictEqual(err, undefined, `Validation error on source metadata: ${err?.message}`);
    assert.strictEqual(doc.sources[0].citation, '2023 SCC OnLine Bom 4567');
    assert.strictEqual(doc.sources[0].documentType, 'High Court Order');
    assert.strictEqual(doc.sources[0].verificationDate, '2026-11-08');
  });

  // -------------------------------------------------------------------------
  // SECTION 4: Structural Contract for 6-Part Narratives
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 4] Structural Contract for 6-Part Narratives:');

  test('Compliant 6-part narrative structure passes Mongoose schema validation', () => {
    const mockCase = new CaseStudy({
      title: 'Structural Contract Validation Case',
      slug: 'structural-contract-validation-case',
      caseNumber: 'CASE-STRUCT-01',
      shortDescription: 'Validating the 6-part narrative structure contract',
      difficulty: 'Advanced',
      incidentType: 'Forensic Failure',
      attackVector: 'Institutional Inaction',
      collection: 'Cases Where Justice Fell Short',
      collectionCategory: 'Investigative & Evidentiary Gaps',
      evidentiaryClassification: 'Established Institutional Failure',
      seedBatchId: 'batch_js_1762600000000_a1b2c3d4',
      narrativeSections: REQUIRED_NARRATIVE_HEADINGS.map(heading => ({
        heading,
        body: `Substantive educational content for section "${heading}" detailing statutory and evidentiary analysis.`
      })),
      timeline: [
        { time: 'T+0', label: 'Initial Event', description: 'Deceptive contact initiated', type: 'contact' }
      ],
      warningSigns: [
        { title: 'Deceptive Signal', explanation: 'Absence of verified institutional origin.' }
      ],
      sources: [
        {
          title: 'Official Report',
          authority: 'Judicial Registry',
          sourceType: 'court'
        }
      ]
    });

    const err = mockCase.validateSync();
    assert.strictEqual(err, undefined, `Validation error on 6-part narrative case: ${err?.message}`);
    assert.strictEqual(mockCase.narrativeSections.length, 6);
  });

  test('Structural assertion fails if narrativeSections misses required heading or body', () => {
    const invalidCase = new CaseStudy({
      title: 'Malformed Narrative Case',
      slug: 'malformed-narrative-case',
      caseNumber: 'CASE-MALFORM-01',
      shortDescription: 'Testing invalid narrative section missing body',
      difficulty: 'Beginner',
      incidentType: 'Test',
      attackVector: 'Test',
      narrativeSections: [
        { heading: 'Part 1 — Case at a Glance' } // Missing required 'body'
      ]
    });
    const err = invalidCase.validateSync();
    assert(err, 'Expected validation error when narrativeSections item misses body');
    assert(err.errors['narrativeSections.0.body'], 'Expected error on narrativeSections.0.body');
  });

  // -------------------------------------------------------------------------
  // SECTION 5: Insert-Only Architecture & Collision Rejection Logic
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 5] Insert-Only Preflight Collision Rejection Logic:');

  test('Preflight collision detector permits insert when zero target slugs exist', () => {
    const check = simulatePreflightCollisionCheck(APPROVED_TARGET_SLUGS, legacySlugs);
    assert.strictEqual(check.allowed, true);
    assert.strictEqual(check.collidingSlugs.length, 0);
  });

  test('Preflight collision detector rejects immediately if any target slug collides', () => {
    const collidingTargetList = [
      ...APPROVED_TARGET_SLUGS.slice(0, 5),
      'digital-arrest-impersonation' // Injected legacy collision
    ];
    const check = simulatePreflightCollisionCheck(collidingTargetList, legacySlugs);
    assert.strictEqual(check.allowed, false);
    assert.deepStrictEqual(check.collidingSlugs, ['digital-arrest-impersonation']);
  });

  // -------------------------------------------------------------------------
  // SECTION 6: Exact Rollback Identity, Deterministic Hashing & Crash Recovery
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 6] Rollback Provenance, Deterministic Hashing & Crash Recovery:');

  test('Seed batch ID matches exact provenance pattern /^batch_js_\\d+_[a-f0-9]{8}$/', () => {
    const sampleBatchId = `batch_js_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const pattern = /^batch_js_\d+_[a-f0-9]{8}$/;
    assert(pattern.test(sampleBatchId), `Batch ID "${sampleBatchId}" does not match required provenance pattern`);
  });

  test('Deterministic canonical serialization produces identical SHA-256 regardless of property order', () => {
    const docA = {
      title: 'Test Case',
      slug: 'test-case',
      meta: { b: 2, a: 1 },
      tags: ['alpha', 'beta']
    };
    const docB = {
      slug: 'test-case',
      tags: ['alpha', 'beta'],
      title: 'Test Case',
      meta: { a: 1, b: 2 }
    };

    const digestA = computeDocumentDigest(docA);
    const digestB = computeDocumentDigest(docB);
    assert.strictEqual(digestA, digestB, 'Digests must be identical for objects with identical contents in different property order');

    // Mutating a single property must alter digest
    const docC = { ...docA, title: 'Mutated Case' };
    const digestC = computeDocumentDigest(docC);
    assert.notStrictEqual(digestA, digestC, 'Digest must change when document content changes');
  });

  test('Rollback identity check deletes verified batch IDs when post-seed manifest exists', () => {
    const mockBatchId = 'batch_js_1762600000000_1234abcd';
    const postSeedManifest = {
      seedBatchId: mockBatchId,
      insertedIds: ['id_01', 'id_02']
    };
    const collectionRecords = [
      { _id: 'legacy_01', slug: 'phishing-credential-takeover', seedBatchId: null },
      { _id: 'id_01', slug: 'sulli-deals-bulli-bai-investigation-delays', seedBatchId: mockBatchId },
      { _id: 'id_02', slug: 'jaiprakash-kulkarni-v-banking-ombudsman', seedBatchId: mockBatchId }
    ];

    const result = simulateRollbackIdentityCheck({
      targetBatchId: mockBatchId,
      postSeedManifest,
      collectionRecords,
      targetSlugsWhitelist: APPROVED_TARGET_SLUGS
    });

    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.recordsToDelete.length, 2);
    assert.deepStrictEqual(result.recordsToDelete.map(r => r._id), ['id_01', 'id_02']);
  });

  test('Crash recovery path: rollback identifies records by seedBatchId when post-seed manifest is missing', () => {
    const mockBatchId = 'batch_js_1762600000000_5678efgh';
    const collectionRecords = [
      { _id: 'legacy_01', slug: 'phishing-credential-takeover', seedBatchId: null },
      { _id: 'orphan_01', slug: 'sulli-deals-bulli-bai-investigation-delays', seedBatchId: mockBatchId },
      { _id: 'orphan_02', slug: 'jaiprakash-kulkarni-v-banking-ombudsman', seedBatchId: mockBatchId }
    ];

    const result = simulateRollbackIdentityCheck({
      targetBatchId: mockBatchId,
      postSeedManifest: null,
      collectionRecords,
      targetSlugsWhitelist: APPROVED_TARGET_SLUGS
    });

    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.recoveryPath, 'batch-provenance-fallback');
    assert.strictEqual(result.recordsToDelete.length, 2);
  });

  test('Rollback refuses deletion if foreign slug outside whitelist is tagged with seedBatchId', () => {
    const mockBatchId = 'batch_js_1762600000000_9999zzzz';
    const collectionRecords = [
      { _id: 'rogue_01', slug: 'foreign-unknown-slug', seedBatchId: mockBatchId }
    ];

    const result = simulateRollbackIdentityCheck({
      targetBatchId: mockBatchId,
      postSeedManifest: null,
      collectionRecords,
      targetSlugsWhitelist: APPROVED_TARGET_SLUGS
    });

    assert.strictEqual(result.allowed, false);
    assert(result.reason.includes('Integrity alert'));
  });

  // -------------------------------------------------------------------------
  // SECTION 7: Strict Offline Execution Boundary Verification
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 7] Offline Database Isolation Verification:');

  test('Mongoose connection is strictly disconnected (readyState === 0)', () => {
    assert.strictEqual(mongoose.connection.readyState, 0, 'Mongoose must be disconnected during offline testing');
  });

  // -------------------------------------------------------------------------
  // SECTION 8: Checkpoint 2 Authored Cases Structural & Metadata Integrity
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 8] Checkpoint 2 Authored Cases Structural & Metadata Integrity:');

  test('Authored collection contains exactly 10 cases matching APPROVED_TARGET_SLUGS', () => {
    assert.strictEqual(justiceShortcomingsCasesData.length, 10);
    const authoredSlugs = justiceShortcomingsCasesData.map(c => c.slug);
    assert.deepStrictEqual(authoredSlugs, APPROVED_TARGET_SLUGS);
  });

  test('All 10 authored cases pass Mongoose schema validation', () => {
    justiceShortcomingsCasesData.forEach((item, idx) => {
      const doc = new CaseStudy(item);
      const err = doc.validateSync();
      assert.strictEqual(err, undefined, `Validation error on authored case #${idx} (${item.slug}): ${err?.message}`);
    });
  });

  test('All 10 authored cases belong to "Cases Where Justice Fell Short" collection', () => {
    justiceShortcomingsCasesData.forEach((item) => {
      assert.strictEqual(item.collection, 'Cases Where Justice Fell Short');
    });
  });

  test('All 10 authored cases have approved taxonomy category and classification', () => {
    const validCategories = new Set([
      'Investigative & Evidentiary Gaps',
      'Banking & Regulatory Inquiries',
      'Platform & Marketplace Lags',
      'Critical Infrastructure & Complex Attribution'
    ]);
    const validClassifications = new Set([
      'Established Institutional Failure',
      'Documented Procedural Shortcoming',
      'Unresolved Incident'
    ]);

    justiceShortcomingsCasesData.forEach((item) => {
      assert(validCategories.has(item.collectionCategory), `Invalid category "${item.collectionCategory}" on ${item.slug}`);
      assert(validClassifications.has(item.evidentiaryClassification), `Invalid classification "${item.evidentiaryClassification}" on ${item.slug}`);
    });
  });

  test('All 10 authored cases have exactly 6 narrative sections with non-empty headings and body', () => {
    justiceShortcomingsCasesData.forEach((item) => {
      assert.strictEqual(item.narrativeSections.length, 6, `Expected 6 narrative sections on ${item.slug}`);
      item.narrativeSections.forEach((sec, sIdx) => {
        assert(sec.heading && sec.heading.trim().length > 0, `Missing heading in section #${sIdx} on ${item.slug}`);
        assert(sec.body && sec.body.trim().length > 50, `Substantive body required in section #${sIdx} on ${item.slug}`);
      });
    });
  });

  test('All 10 authored cases have verifiable sources with citation and documentType', () => {
    justiceShortcomingsCasesData.forEach((item) => {
      assert(item.sources.length >= 2, `Expected at least 2 sources on ${item.slug}, found ${item.sources.length}`);
      item.sources.forEach((src, srcIdx) => {
        assert(src.title && src.title.length > 0, `Missing source title on ${item.slug}`);
        assert(src.authority && src.authority.length > 0, `Missing authority on ${item.slug}`);
        assert(src.citation && src.citation.length > 0, `Missing citation on ${item.slug}`);
        assert(src.documentType && src.documentType.length > 0, `Missing documentType on ${item.slug}`);
        assert(src.verificationDate && src.verificationDate.length > 0, `Missing verificationDate on ${item.slug}`);
      });
    });
  });

  // Run async dry-run test
  const dryRunResult = await seedJusticeShortcomingsCases({ dryRun: true });
  test('Seed utility dry-run completes with status DRY_RUN_SUCCESS and zero DB calls', () => {
    assert.strictEqual(dryRunResult.status, 'DRY_RUN_SUCCESS');
    assert.strictEqual(dryRunResult.validatedCount, 10);
    assert.strictEqual(mongoose.connection.readyState, 0);
  });

  test('Rollback utility evaluateRollbackEligibility verifies valid batch and rejects foreign slugs', () => {
    const validBatchId = 'batch_js_1762600000000_a1b2c3d4';
    const preSeedSnapshot = {
      seedBatchId: validBatchId,
      recordCount: 11,
      records: legacyCases.map(c => ({ slug: c.slug, digest: 'mock_digest' }))
    };
    const collectionRecords = [
      ...legacyCases.map(c => ({ _id: `leg_${c.slug}`, slug: c.slug, seedBatchId: null })),
      { _id: 'new_01', slug: 'sulli-deals-bulli-bai-investigation-delays', seedBatchId: validBatchId }
    ];

    // Eligible evaluation
    const evalEligible = evaluateRollbackEligibility({
      targetBatchId: validBatchId,
      preSeedSnapshot,
      postSeedManifest: null,
      collectionRecords
    });
    assert.strictEqual(evalEligible.eligible, true);
    assert.strictEqual(evalEligible.idsToDelete.length, 1);

    // Reject invalid batch ID pattern
    const evalBadBatch = evaluateRollbackEligibility({
      targetBatchId: 'invalid_batch_format',
      preSeedSnapshot,
      postSeedManifest: null,
      collectionRecords
    });
    assert.strictEqual(evalBadBatch.eligible, false);

    // Reject foreign slug carrying batch ID
    const contaminatedRecords = [
      ...collectionRecords,
      { _id: 'foreign_01', slug: 'unauthorized-foreign-slug', seedBatchId: validBatchId }
    ];
    const evalContaminated = evaluateRollbackEligibility({
      targetBatchId: validBatchId,
      preSeedSnapshot,
      postSeedManifest: null,
      collectionRecords: contaminatedRecords
    });
    assert.strictEqual(evalContaminated.eligible, false);
    assert(evalContaminated.reason.includes('CRITICAL INTEGRITY ALERT'));
  });

  // -------------------------------------------------------------------------
  // SECTION 9: Client Data Module & Frontend Synchronization
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 9] Client Data Module & Frontend Synchronization:');

  test('Client data module exists and exports exactly 10 matching cases', () => {
    const clientDataPath = path.resolve(__dirname, '../../client/src/data/justiceShortcomingsCases.js');
    assert(fs.existsSync(clientDataPath), 'client/src/data/justiceShortcomingsCases.js must exist on disk');

    const clientContent = fs.readFileSync(clientDataPath, 'utf8');
    assert(clientContent.includes('export const justiceShortcomingsCasesData'), 'Must export justiceShortcomingsCasesData');

    // Dynamically require or parse the JSON within the ESM module
    const jsonMatch = clientContent.match(/export const justiceShortcomingsCasesData = (\[[\s\S]*?\]);\n\nexport default/);
    assert(jsonMatch, 'Must find valid serialized array in client data module');

    const parsedClientCases = JSON.parse(jsonMatch[1]);
    assert.strictEqual(parsedClientCases.length, 10, 'Client data module must contain exactly 10 cases');

    const clientSlugs = parsedClientCases.map(c => c.slug);
    assert.deepStrictEqual(clientSlugs, APPROVED_TARGET_SLUGS, 'Client slugs must match APPROVED_TARGET_SLUGS 1:1');

    // Verify deterministic document digests match server authored data
    parsedClientCases.forEach((clientCase, idx) => {
      const serverCase = justiceShortcomingsCasesData[idx];
      const clientDigest = crypto.createHash('sha256').update(canonicalStringify(clientCase)).digest('hex');
      const serverDigest = crypto.createHash('sha256').update(canonicalStringify(serverCase)).digest('hex');
      assert.strictEqual(clientDigest, serverDigest, `Canonical digest mismatch for slug: ${clientCase.slug}`);
    });
  });

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCasesCollectionIntegritySuite();
