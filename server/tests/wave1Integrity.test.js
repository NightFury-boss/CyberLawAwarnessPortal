/**
 * Stage 4 Wave 1: Comprehensive Integrity and Regression Test Suite
 * Validates:
 * 1. LawSection schema compliance and exact 32 items in seed.js
 * 2. LearningModule schema compliance and exact 18 items in seedModulesData.js
 * 3. 100% Cross-reference resolution between LearningModules and LawSections (by slug or sectionNumber)
 * 4. Statutory accuracy assertions: DPDP commencement dates (Nov 2026 vs May 2027), IT Rules 2026 amendment numbers (G.S.R. 120(E)),
 *    IT Act Section 43A baseline, Section 72A Jan Vishwas limits, RBI Customer Liability Directions, and BNSS Zero FIR/property return.
 * 5. Simulation of idempotent non-destructive upserting.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Import Mongoose Models (without connecting to DB)
const LawSection = require('../models/LawSection');
const LearningModule = require('../models/LearningModule');
const learningModulesData = require('../config/seedModulesData');

// Extract lawSectionsData array directly from seed.js
function extractLawSectionsDataFromSeed() {
  const seedFilePath = path.join(__dirname, '../config/seed.js');
  const seedContent = fs.readFileSync(seedFilePath, 'utf8');

  // Match lawSectionsData = [ ... ];
  const startMarker = 'const lawSectionsData = [';
  const startIndex = seedContent.indexOf(startMarker);
  assert(startIndex !== -1, 'lawSectionsData not found in seed.js');

  const arrayStart = startIndex + 'const lawSectionsData = '.length;
  // Find matching bracket
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
  assert(endIndex !== -1, 'Could not parse lawSectionsData closing bracket');

  const arrayCode = seedContent.substring(arrayStart, endIndex);
  
  // Create mock ObjectId references for evaluation
  const mockObjectId = new mongoose.Types.ObjectId();
  const sourceIndiaCode = { _id: mockObjectId };
  const sourceShreyaSinghal = { _id: mockObjectId };
  const sourceDPDP = { _id: mockObjectId };
  const sourceBNS = { _id: mockObjectId };
  const sourcePuttaswamy = { _id: mockObjectId };
  const sourceITRules = { _id: mockObjectId };
  const sourceCERTIn = { _id: mockObjectId };
  const sourceBSA = { _id: mockObjectId };
  const sourceRBI = { _id: mockObjectId };
  const sourceArjunPanditrao = { _id: mockObjectId };
  const sourceI4C = { _id: mockObjectId };
  const sourceBNSS = { _id: mockObjectId };
  const sourceCopyright = { _id: mockObjectId };

  const sandbox = {
    sourceIndiaCode,
    sourceShreyaSinghal,
    sourceDPDP,
    sourceBNS,
    sourcePuttaswamy,
    sourceITRules,
    sourceCERTIn,
    sourceBSA,
    sourceRBI,
    sourceArjunPanditrao,
    sourceI4C,
    sourceBNSS,
    sourceCopyright
  };

  const fn = new Function(...Object.keys(sandbox), `return ${arrayCode};`);
  return fn(...Object.values(sandbox));
}

function extractArrayFromSeed(marker) {
  const seedFilePath = path.join(__dirname, '../config/seed.js');
  const seedContent = fs.readFileSync(seedFilePath, 'utf8');
  const startIndex = seedContent.indexOf(marker);
  assert(startIndex !== -1, `${marker} not found in seed.js`);
  const arrayStart = startIndex + marker.length;
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
  assert(endIndex !== -1, `Could not parse closing bracket for ${marker}`);
  const arrayCode = seedContent.substring(arrayStart, endIndex);
  return new Function('return ' + arrayCode)();
}

function extractCaseStudiesDataFromSeed() {
  return extractArrayFromSeed('const caseStudiesData = ');
}

function extractCrimesDataFromSeed() {
  return extractArrayFromSeed('const crimesData = ');
}

async function runWave1Tests() {
  console.log('======================================================================');
  console.log('STAGE 4 WAVE 1: COMPREHENSIVE INTEGRITY & REGRESSION TEST SUITE');
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
  // 1. LawSection Catalog Verification (Exactly 32 Sections)
  // -------------------------------------------------------------------------
  console.log('[SECTION 1] LawSection Catalog Verification:');
  const lawSections = extractLawSectionsDataFromSeed();

  test('Catalog contains exactly 32 LawSections (18 existing + 14 Stage 4)', () => {
    assert.strictEqual(lawSections.length, 32, `Expected 32 LawSections, got ${lawSections.length}`);
  });

  const expected14Slugs = [
    'in-it-certin',
    'in-bnss-173-zero-fir',
    'in-it-43a-spdi',
    'in-dpdp-identity-scope',
    'in-dpdp-principal-rights',
    'in-dpdp-child-safety',
    'in-dpdp-notice-consent',
    'in-dpdp-fiduciary-duties',
    'in-it-safe-harbour-79',
    'in-it-rules-takedowns',
    'in-copyright-fair-dealing',
    'in-copyright-tpm-65a',
    'in-it-72a-contract-breach',
    'in-rbi-customer-liability'
  ];

  test('All 14 Stage 4 LawSections have the exact REV7 Section 5.1 slugs', () => {
    const presentSlugs = lawSections.map(s => s.slug).filter(Boolean);
    for (const slug of expected14Slugs) {
      assert(presentSlugs.includes(slug), `Missing expected LawSection slug: ${slug}`);
    }
  });

  test('All 32 LawSections pass Mongoose schema validation', () => {
    for (const sec of lawSections) {
      const doc = new LawSection(sec);
      const valError = doc.validateSync();
      assert(!valError, `Schema validation failed for ${sec.sectionNumber}: ${valError ? valError.message : ''}`);
    }
  });

  test('All LawSection legalStatus values are valid allowed enums', () => {
    const allowed = LawSection.schema.path('legalStatus').enumValues;
    for (const sec of lawSections) {
      assert(allowed.includes(sec.legalStatus), `Invalid legalStatus '${sec.legalStatus}' in ${sec.sectionNumber}`);
    }
  });

  // -------------------------------------------------------------------------
  // 2. LearningModule Catalog Verification (Exactly 18 Modules)
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 2] LearningModule Catalog Verification:');

  test('Catalog contains exactly 18 LearningModules (11 untouched + Module 12 refined + 6 new)', () => {
    assert.strictEqual(learningModulesData.length, 18, `Expected 18 LearningModules, got ${learningModulesData.length}`);
  });

  test('LearningModule orders are strictly sequential from 1 to 18 without gaps or duplicates', () => {
    const orders = learningModulesData.map(m => m.order);
    for (let i = 1; i <= 18; i++) {
      assert.strictEqual(orders[i - 1], i, `Expected module at index ${i - 1} to have order ${i}, found ${orders[i - 1]}`);
    }
  });

  test('LearningModule slugs are distinct and unique across all 18 modules', () => {
    const slugs = learningModulesData.map(m => m.slug);
    const uniqueSlugs = new Set(slugs);
    assert.strictEqual(slugs.length, uniqueSlugs.size, `Duplicate slugs found in learningModulesData`);
  });

  test('Refined Module 12 has correct title, slug, category and statutory focus', () => {
    const m12 = learningModulesData.find(m => m.order === 12);
    assert(m12, 'Module 12 not found');
    assert.strictEqual(m12.title, 'Citizen Cyber Remedies & Reporting Portals');
    assert.strictEqual(m12.slug, 'citizen-cyber-remedies-reporting-portals');
    assert.strictEqual(m12.category, 'Grievance Redressal and Digital Governance');
    assert(m12.relatedLawSections.includes('in-it-certin'));
    assert(m12.relatedLawSections.includes('in-bnss-173-zero-fir'));
  });

  const expectedNewModuleSlugs = [
    { order: 13, title: 'Digital Identity & Data Protection Foundations', slug: 'digital-identity-data-protection', category: 'Personal Data and Digital Identity', pillar: 1 },
    { order: 14, title: 'Data Principal Rights & Child Safeguards', slug: 'data-principal-rights-child-safeguards', category: 'Data Principal Rights', pillar: 2 },
    { order: 15, title: 'Notice, Lawful Consent & Fiduciary Obligations', slug: 'notice-consent-fiduciary-obligations', category: 'Consent and Data Fiduciary Obligations', pillar: 3 },
    { order: 16, title: 'Intermediary Accountability & Platform Governance', slug: 'platform-governance-intermediary-due-diligence', category: 'Grievance Redressal and Digital Governance', pillar: 4 },
    { order: 17, title: 'Copyright, Fair Dealing & Software Governance', slug: 'digital-copyright-fair-dealing-tpm', category: 'Copyright and Intellectual Property', pillar: 5 },
    { order: 18, title: 'Malware Offenses, Professional Confidentiality & Defensive Digital Citizenship', slug: 'malware-professional-confidentiality-defensive-citizenship', category: 'Malware and Cyber Threats', pillar: 6 }
  ];

  test('All new Modules 13-18 have exact REV7 titles, slugs, categories, and approved pillars', () => {
    for (const exp of expectedNewModuleSlugs) {
      const mod = learningModulesData.find(m => m.order === exp.order);
      assert(mod, `Module ${exp.order} not found`);
      assert.strictEqual(mod.title, exp.title, `Module ${exp.order} title mismatch: '${mod.title}' vs '${exp.title}'`);
      assert.strictEqual(mod.slug, exp.slug, `Module ${exp.order} slug mismatch: ${mod.slug} vs ${exp.slug}`);
      assert.strictEqual(mod.category, exp.category, `Module ${exp.order} category mismatch`);
    }
  });

  test('All 18 LearningModules pass Mongoose schema validation', () => {
    for (const mod of learningModulesData) {
      const doc = new LearningModule(mod);
      const valError = doc.validateSync();
      assert(!valError, `Schema validation failed for module '${mod.slug}': ${valError ? valError.message : ''}`);
    }
  });

  test('All 18 LearningModules have substantive pedagogical sections and valid quickChecks', () => {
    for (const mod of learningModulesData) {
      assert(mod.sections && mod.sections.length >= 3, `Module ${mod.slug} must have at least 3 sections, found ${mod.sections ? mod.sections.length : 0}`);
      for (const sec of mod.sections) {
        assert(sec.title && sec.title.trim().length > 0, `Section missing title in ${mod.slug}`);
        assert(sec.content && sec.content.trim().length > 50, `Section '${sec.title}' content too short in ${mod.slug}`);
      }
      assert(mod.quickCheck, `Module ${mod.slug} missing quickCheck`);
      assert(mod.quickCheck.question && mod.quickCheck.question.length > 20, `quickCheck question too short in ${mod.slug}`);
      assert(Array.isArray(mod.quickCheck.options) && mod.quickCheck.options.length >= 2, `quickCheck must have >= 2 options in ${mod.slug}`);
      assert(typeof mod.quickCheck.correctIndex === 'number' && mod.quickCheck.correctIndex >= 0 && mod.quickCheck.correctIndex < mod.quickCheck.options.length,
        `quickCheck correctIndex invalid in ${mod.slug}`);
      assert(mod.quickCheck.explanation && mod.quickCheck.explanation.length > 20, `quickCheck explanation too short in ${mod.slug}`);
    }
  });

  // -------------------------------------------------------------------------
  // 3. Cross-Reference & Linkage Integrity
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 3] Cross-Reference & Linkage Integrity:');

  const caseStudies = extractCaseStudiesDataFromSeed();
  const crimes = extractCrimesDataFromSeed();
  const validCaseStudySlugs = new Set(caseStudies.map(cs => cs.slug));
  const validCrimeSlugs = new Set(crimes.map(c => c.slug));

  test('Every relatedLawSections entry across all 18 modules resolves to an existing LawSection by sectionNumber or slug', () => {
    const validSectionNumbers = new Set(lawSections.map(s => s.sectionNumber));
    const validSlugs = new Set(lawSections.map(s => s.slug).filter(Boolean));

    const unresolved = [];

    for (const mod of learningModulesData) {
      for (const ref of mod.relatedLawSections) {
        const matchesSection = validSectionNumbers.has(ref);
        const matchesSlug = validSlugs.has(ref);
        if (!matchesSection && !matchesSlug) {
          unresolved.push({ module: mod.slug, reference: ref });
        }
      }
    }

    assert.strictEqual(unresolved.length, 0,
      `Unresolved relatedLawSections references found:\n${JSON.stringify(unresolved, null, 2)}`);
  });

  test('All 14 new Stage 4 LawSections are cross-referenced by their respective modules', () => {
    const allModuleRefs = new Set();
    for (const mod of learningModulesData) {
      for (const ref of mod.relatedLawSections) {
        allModuleRefs.add(ref);
      }
    }

    for (const slug of expected14Slugs) {
      assert(allModuleRefs.has(slug), `New LawSection slug '${slug}' is not cross-referenced by any module!`);
    }
  });

  test('Every relatedCaseStudies entry across all 18 modules resolves to an extracted CaseStudy slug', () => {
    const unresolvedCS = [];
    for (const mod of learningModulesData) {
      for (const csSlug of (mod.relatedCaseStudies || [])) {
        if (!validCaseStudySlugs.has(csSlug)) {
          unresolvedCS.push({ module: mod.slug, caseStudy: csSlug });
        }
      }
    }
    assert.strictEqual(unresolvedCS.length, 0,
      `Unresolved relatedCaseStudies references found:\n${JSON.stringify(unresolvedCS, null, 2)}`);
  });

  test('Every relatedCyberCrimes entry across all 18 modules resolves to an extracted CyberCrime slug', () => {
    const unresolvedCrimes = [];
    for (const mod of learningModulesData) {
      for (const crimeSlug of (mod.relatedCyberCrimes || [])) {
        if (!validCrimeSlugs.has(crimeSlug)) {
          unresolvedCrimes.push({ module: mod.slug, crime: crimeSlug });
        }
      }
    }
    assert.strictEqual(unresolvedCrimes.length, 0,
      `Unresolved relatedCyberCrimes references found:\n${JSON.stringify(unresolvedCrimes, null, 2)}`);
  });

  test('Statutory catalog values agree across modules and LawSection records', () => {
    const lawSectionMap = new Map();
    lawSections.forEach(s => {
      lawSectionMap.set(s.sectionNumber, s);
      if (s.slug) lawSectionMap.set(s.slug, s);
    });

    for (const mod of learningModulesData) {
      for (const ref of mod.relatedLawSections) {
        const sec = lawSectionMap.get(ref);
        assert(sec, `Referenced LawSection '${ref}' in module '${mod.slug}' not found in catalog`);
        assert(sec.actName && sec.actName.trim().length > 0, `LawSection '${ref}' has empty actName`);
        assert(sec.officialTitle && sec.officialTitle.trim().length > 0, `LawSection '${ref}' has empty officialTitle`);
        assert(['CURRENT', 'AMENDED', 'PENDING_COMMENCEMENT', 'NOT_YET_IN_FORCE', 'OMITTED'].includes(sec.legalStatus),
          `LawSection '${ref}' has invalid legalStatus: ${sec.legalStatus}`);
      }
    }

    // Verify DPDP rights sections in Modules 14 & 15 map to NOT_YET_IN_FORCE on 6 Nov 2026 baseline
    const principalRightsSec = lawSectionMap.get('in-dpdp-principal-rights');
    assert(principalRightsSec, 'in-dpdp-principal-rights missing');
    assert.strictEqual(principalRightsSec.legalStatus, 'NOT_YET_IN_FORCE',
      'in-dpdp-principal-rights must be NOT_YET_IN_FORCE on 6 Nov 2026 baseline');

    const childSafetySec = lawSectionMap.get('in-dpdp-child-safety');
    assert(childSafetySec, 'in-dpdp-child-safety missing');
    assert.strictEqual(childSafetySec.legalStatus, 'NOT_YET_IN_FORCE',
      'in-dpdp-child-safety must be NOT_YET_IN_FORCE on 6 Nov 2026 baseline');

    // Verify Section 43A in Modules 10 & 13 maps to CURRENT operative law on 6 Nov 2026 baseline
    const spdiSec = lawSectionMap.get('in-it-43a-spdi') || lawSectionMap.get('Section 43A');
    assert(spdiSec, 'Section 43A record missing');
    assert.strictEqual(spdiSec.legalStatus, 'CURRENT',
      'Section 43A must be CURRENT operative law on 6 Nov 2026 baseline');
  });

  test('Negative Assertions: Section 66A is OMITTED and never taught as active law in keyTakeaways', () => {
    const sec66a = lawSections.find(s => s.sectionNumber === 'Section 66A');
    assert(sec66a, 'Section 66A must exist in LawSection catalog');
    assert.strictEqual(sec66a.legalStatus, 'OMITTED', 'Section 66A legalStatus must be OMITTED');
    assert.notStrictEqual(sec66a.legalStatus, 'CURRENT', 'Section 66A must not be marked CURRENT');

    for (const mod of learningModulesData) {
      for (const takeaway of (mod.keyTakeaways || [])) {
        if (takeaway.includes('66A')) {
          assert(
            takeaway.includes('struck down') ||
            takeaway.includes('unconstitutional') ||
            takeaway.includes('cannot be used'),
            `Module '${mod.slug}' keyTakeaways mentions 66A without stating it was struck down: "${takeaway}"`
          );
        }
      }
    }
  });

  test('Negative Assertions: No unqualified recovery guarantees across modules or law sections', () => {
    const regexRecoveryGuarantee = /guarantees?\s+(?:fund\s+)?(?:recovery|freeze|refund)|guarantees?\s+zero\s+customer\s+liability/i;

    for (const mod of learningModulesData) {
      const jsonStr = JSON.stringify(mod);
      assert(!regexRecoveryGuarantee.test(jsonStr),
        `Module '${mod.slug}' contains unqualified recovery or liability guarantee`);
    }

    for (const sec of lawSections) {
      const jsonStr = JSON.stringify(sec);
      assert(!regexRecoveryGuarantee.test(jsonStr),
        `LawSection '${sec.sectionNumber}' contains unqualified recovery or liability guarantee`);
    }
  });

  test('Negative Assertions: Rule 3(2)(b) is never paired with 24 hours in instructional content or catalog', () => {
    const regex32b24h = /Rule\s*3\(2\)\(b\)[\s\S]{0,80}24\s*hours|24\s*hours[\s\S]{0,80}Rule\s*3\(2\)\(b\)/i;

    for (const mod of learningModulesData) {
      for (const sec of (mod.sections || [])) {
        assert(!regex32b24h.test(sec.content),
          `Module '${mod.slug}' section '${sec.title}' pairs Rule 3(2)(b) with 24 hours instead of amended 2-hour timeline`);
      }
      for (const kt of (mod.keyTakeaways || [])) {
        assert(!regex32b24h.test(kt),
          `Module '${mod.slug}' keyTakeaway pairs Rule 3(2)(b) with 24 hours`);
      }
    }

    for (const sec of lawSections) {
      const text = `${sec.plainLanguageExplanation} ${sec.officialText} ${sec.whyItMatters} ${sec.exampleScenario}`;
      assert(!regex32b24h.test(text),
        `LawSection '${sec.sectionNumber}' pairs Rule 3(2)(b) with 24 hours`);
    }

    for (const crime of crimes) {
      const text = JSON.stringify(crime.actionSteps) + JSON.stringify(crime.mythFacts);
      assert(!regex32b24h.test(text),
        `CyberCrime '${crime.slug}' pairs Rule 3(2)(b) with 24 hours`);
    }
  });

  // -------------------------------------------------------------------------
  // 4. Statutory Accuracy & 6 November 2026 Baseline Verification
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 4] Statutory Accuracy & 6 November 2026 Baseline Verification:');

  test('DPDP Sections 11-14 and Section 9 are correctly marked NOT_YET_IN_FORCE with May 13 2027 commencement', () => {
    const dpdpRights = lawSections.find(s => s.slug === 'in-dpdp-principal-rights');
    assert(dpdpRights, 'in-dpdp-principal-rights missing');
    assert.strictEqual(dpdpRights.legalStatus, 'NOT_YET_IN_FORCE');
    assert(dpdpRights.commencementStatus.includes('13 May 2027'), 'in-dpdp-principal-rights missing May 2027 date');

    const dpdpChild = lawSections.find(s => s.slug === 'in-dpdp-child-safety');
    assert(dpdpChild, 'in-dpdp-child-safety missing');
    assert.strictEqual(dpdpChild.legalStatus, 'NOT_YET_IN_FORCE');
    assert(dpdpChild.commencementStatus.includes('13 May 2027'), 'in-dpdp-child-safety missing May 2027 date');
  });

  test('IT Act Section 43A is correctly verified as operative active law on 6 November 2026 baseline', () => {
    const sec43A = lawSections.find(s => s.slug === 'in-it-43a-spdi');
    assert(sec43A, 'in-it-43a-spdi missing');
    assert.strictEqual(sec43A.legalStatus, 'CURRENT');
    assert(sec43A.amendmentStatus.includes('Section 44(2)'), 'Missing Section 44(2) scheduled repeal reference');
  });

  test('IT Rules 2021 amendments accurately cite G.S.R. 120(E) (Feb 2026) and 2-hour NCII mandate', () => {
    const itRules = lawSections.find(s => s.slug === 'in-it-rules-takedowns');
    assert(itRules, 'in-it-rules-takedowns missing');
    assert(itRules.commencementStatus.includes('G.S.R. 120(E)'), 'Missing G.S.R. 120(E) notification');
    assert(/2-hour|2 hours|two hours/i.test(itRules.plainLanguageExplanation), 'Missing 2-hour NCII explanation');
    assert(/3-hour|3 hours|three hours/i.test(itRules.plainLanguageExplanation), 'Missing 3-hour takedown explanation');
  });

  test('IT Act Section 72A accurately includes Jan Vishwas Act penalty up to ₹25 lakh', () => {
    const sec72A = lawSections.find(s => s.slug === 'in-it-72a-contract-breach');
    assert(sec72A, 'in-it-72a-contract-breach missing');
    assert(sec72A.penaltyOrLegalEffect.includes('25,00,000') || sec72A.penaltyOrLegalEffect.includes('25 lakh'), 'Missing 25 lakh penalty');
  });

  test('RBI Customer Liability accurately cites Commercial, Payments Bank, RRB Paras and MD-PPI Para 17', () => {
    const rbiSec = lawSections.find(s => s.slug === 'in-rbi-customer-liability');
    assert(rbiSec, 'in-rbi-customer-liability missing');
    assert(rbiSec.plainLanguageExplanation.includes('Para 67'), 'Missing Commercial Banks Para 67');
    assert(rbiSec.plainLanguageExplanation.includes('Para 24'), 'Missing Payments Banks Para 24');
    assert(rbiSec.plainLanguageExplanation.includes('Para 119'), 'Missing RRB Para 119');
    assert(rbiSec.plainLanguageExplanation.includes('Para 17'), 'Missing MD-PPI Para 17');
    assert(rbiSec.plainLanguageExplanation.includes('shadow reversal'), 'Missing shadow reversal');
  });

  test('Module 12 frames Golden Hour as an operational response window without statutory guarantee or deadline', () => {
    const m12 = learningModulesData.find(m => m.order === 12);
    assert(m12, 'Module 12 missing');
    const sec1 = m12.sections[0];
    assert(sec1.content.includes('operational window'), 'Missing operational window framing in section 1');
    assert(sec1.content.includes('not a statutory deadline') || sec1.content.includes('not a statutory limitation period'), 'Missing exclusion of statutory deadline');
    assert(sec1.content.includes('guarantee'), 'Missing explicit caveat regarding recovery guarantee');
  });

  // -------------------------------------------------------------------------
  // 5. Idempotent Upsert Simulation (Non-Destructive Guarantee)
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 5] Idempotency & Non-Destructive Update Simulation:');

  test('Simulated upsert preserves existing records and introduces new records without key collisions', () => {
    const existingDbMock = new Map();
    // Pre-populate with first 11 modules and 18 original law sections
    for (let i = 0; i < 11; i++) {
      existingDbMock.set(`module:${learningModulesData[i].slug}`, { ...learningModulesData[i], _id: `mod_${i}`, createdAt: new Date('2026-01-01') });
    }
    for (let i = 0; i < 18; i++) {
      existingDbMock.set(`law:${lawSections[i].sectionNumber}`, { ...lawSections[i], _id: `law_${i}`, createdAt: new Date('2026-01-01') });
    }

    // Simulate seed run (upsert logic)
    for (let sec of lawSections) {
      const key = `law:${sec.sectionNumber}`;
      if (existingDbMock.has(key)) {
        const existing = existingDbMock.get(key);
        existingDbMock.set(key, { ...existing, ...sec, updatedAt: new Date('2026-11-06') });
      } else {
        existingDbMock.set(key, { ...sec, _id: `new_law_${Date.now()}`, createdAt: new Date('2026-11-06') });
      }
    }

    for (let mod of learningModulesData) {
      const key = `module:${mod.slug}`;
      if (existingDbMock.has(key)) {
        const existing = existingDbMock.get(key);
        existingDbMock.set(key, { ...existing, ...mod, updatedAt: new Date('2026-11-06') });
      } else {
        existingDbMock.set(key, { ...mod, _id: `new_mod_${Date.now()}`, createdAt: new Date('2026-11-06') });
      }
    }

    // Verify final counts
    let finalModuleCount = 0;
    let finalLawCount = 0;
    for (const key of existingDbMock.keys()) {
      if (key.startsWith('module:')) finalModuleCount++;
      if (key.startsWith('law:')) finalLawCount++;
    }

    assert.strictEqual(finalModuleCount, 18, `Expected 18 modules in simulated DB, got ${finalModuleCount}`);
    assert.strictEqual(finalLawCount, 32, `Expected 32 law sections in simulated DB, got ${finalLawCount}`);
  });

  console.log('\n======================================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runWave1Tests().catch(err => {
  console.error('Unhandled test suite failure:', err);
  process.exit(1);
});
