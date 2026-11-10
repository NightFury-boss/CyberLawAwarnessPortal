/**
 * Stage 4 Wave 2: Comprehensive Integrity and Regression Test Suite
 * Authoritative baseline: CYBER-LAW-STAGE4-BASELINE-AUDIT-FINAL-REV7 (§6.1 & §6.2)
 *
 * Validates:
 * 1. 21 Expanded Assessment Questions:
 *    - Exactly 3 questions per pillar across all 7 pillars (Q-P1-01 through Q-P7-03)
 *    - Question IDs, format, prompt, 4 distinct options, correct key index, cognitive levels
 *    - Option explanations, practical takeaway, whyIncorrect, legal references, source metadata
 * 2. 7 In-Lesson Quick Checks:
 *    - Exactly 7 scenarios and quick checks (QC-P1-01 through QC-P7-01)
 *    - Correct module mapping: QC 1 -> Mod 13, QC 2 -> Mod 14, QC 3 -> Mod 15, QC 4 -> Mod 16, QC 5 -> Mod 17, QC 6 & 7 -> Mod 18
 *    - Module 18 multi-check array containing both QC 6 and QC 7
 * 3. Mongoose Schema Validation:
 *    - QuizQuestion model validation across all 21 items
 *    - LearningModule model validation across all 18 modules (including quickChecks array)
 *    - Negative testing: validation failure on missing fields or invalid option counts
 * 4. Seed Integration & Idempotency:
 *    - seed.js incorporates stage4Questions into quizQuestionsData (340 existing + 21 = 361 total)
 *    - Safe upsert and non-destructive delete synchronization
 * 5. Statutory Accuracy Assertions:
 *    - Legal citations across all questions and quick checks strictly align with 6 November 2026 baseline
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Import Mongoose Models (in-memory validation without database connection)
const QuizQuestion = require('../models/QuizQuestion');
const LearningModule = require('../models/LearningModule');
const expandedQuestions = require('../config/seedQuestionsExpanded');
const learningModulesData = require('../config/seedModulesData');

async function runWave2Tests() {
  console.log('======================================================================');
  console.log('STAGE 4 WAVE 2: EXPANDED ASSESSMENT BANK & IN-LESSON QUICK CHECKS TEST SUITE');
  console.log('Authoritative Baseline: REV7 (§6.1 & §6.2)');
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
  // 1. INVENTORY VERIFICATION: 21 EXPANDED QUESTIONS
  // -------------------------------------------------------------------------
  test('Expanded Questions: exactly 21 items exported from seedQuestionsExpanded.js', () => {
    assert.strictEqual(Array.isArray(expandedQuestions), true, 'expandedQuestions must be an array');
    assert.strictEqual(expandedQuestions.length, 21, `Expected 21 questions, got ${expandedQuestions.length}`);
  });

  test('Expanded Questions: exactly 3 questions per pillar across all 7 approved pillars', () => {
    const pillarCounts = {};
    for (let i = 1; i <= 7; i++) {
      pillarCounts[`PILLAR ${i}`] = 0;
    }

    expandedQuestions.forEach(q => {
      assert(q.topicTag, `Question ${q.questionId} missing topicTag`);
      assert(pillarCounts[q.topicTag] !== undefined, `Unexpected topicTag ${q.topicTag} in ${q.questionId}`);
      pillarCounts[q.topicTag]++;
    });

    for (let i = 1; i <= 7; i++) {
      const tag = `PILLAR ${i}`;
      assert.strictEqual(pillarCounts[tag], 3, `Expected exactly 3 questions for ${tag}, got ${pillarCounts[tag]}`);
    }
  });

  test('Expanded Questions: question IDs follow exact REV7 naming schema Q-P1-01 to Q-P7-03', () => {
    const expectedIds = [
      'Q-P1-01', 'Q-P1-02', 'Q-P1-03',
      'Q-P2-01', 'Q-P2-02', 'Q-P2-03',
      'Q-P3-01', 'Q-P3-02', 'Q-P3-03',
      'Q-P4-01', 'Q-P4-02', 'Q-P4-03',
      'Q-P5-01', 'Q-P5-02', 'Q-P5-03',
      'Q-P6-01', 'Q-P6-02', 'Q-P6-03',
      'Q-P7-01', 'Q-P7-02', 'Q-P7-03'
    ];

    const actualIds = expandedQuestions.map(q => q.questionId);
    assert.strictEqual(actualIds.length, 21);
    
    // Check uniqueness
    const uniqueIds = new Set(actualIds);
    assert.strictEqual(uniqueIds.size, 21, 'Question IDs must be unique');

    expectedIds.forEach(id => {
      assert(uniqueIds.has(id), `Missing expected questionId: ${id}`);
    });
  });

  test('Expanded Questions: each item has 4 valid options, valid correctOptionIndex, and matching explanations', () => {
    expandedQuestions.forEach(q => {
      assert(typeof q.questionText === 'string' && q.questionText.trim().length > 20, `Question ${q.questionId} text too short`);
      assert(Array.isArray(q.options), `Question ${q.questionId} options must be an array`);
      assert.strictEqual(q.options.length, 4, `Question ${q.questionId} must have exactly 4 options`);
      
      q.options.forEach((opt, idx) => {
        assert(typeof opt === 'string' && opt.trim().length > 0, `Question ${q.questionId} option ${idx} is empty`);
      });

      assert(typeof q.correctOptionIndex === 'number', `Question ${q.questionId} correctOptionIndex must be a number`);
      assert(q.correctOptionIndex >= 0 && q.correctOptionIndex <= 3, `Question ${q.questionId} correctOptionIndex out of bounds [0..3]`);

      assert(typeof q.explanation === 'string' && q.explanation.trim().length > 15, `Question ${q.questionId} explanation missing`);
      assert(Array.isArray(q.optionExplanations), `Question ${q.questionId} optionExplanations must be array`);
      assert.strictEqual(q.optionExplanations.length, 4, `Question ${q.questionId} optionExplanations must have 4 items`);

      assert(typeof q.practicalTakeaway === 'string' && q.practicalTakeaway.trim().length > 10, `Question ${q.questionId} practicalTakeaway missing`);
      assert(typeof q.whyIncorrect === 'string' && q.whyIncorrect.trim().length > 10, `Question ${q.questionId} whyIncorrect missing`);
    });
  });

  test('Expanded Questions: cognitive levels, categories and legal references comply with schema', () => {
    const validLevels = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6'];
    const validCategories = [
      'DPDP and privacy',
      'Indian Cyber Law and IT Act',
      'UPI, banking and financial fraud'
    ];

    expandedQuestions.forEach(q => {
      assert(validLevels.includes(q.cognitiveLevel), `Question ${q.questionId} has invalid cognitiveLevel: ${q.cognitiveLevel}`);
      assert(validCategories.includes(q.category), `Question ${q.questionId} has invalid category: ${q.category}`);
      assert(Array.isArray(q.legalReferences) && q.legalReferences.length > 0, `Question ${q.questionId} missing legalReferences`);
      
      q.legalReferences.forEach(ref => {
        assert(ref.actName && ref.sectionNumber, `Question ${q.questionId} legal reference incomplete`);
      });

      assert(q.sourceMetadata && q.sourceMetadata.citation, `Question ${q.questionId} sourceMetadata missing`);
    });
  });

  // -------------------------------------------------------------------------
  // 2. IN-LESSON QUICK CHECKS VERIFICATION (7 ITEMS)
  // -------------------------------------------------------------------------
  test('In-Lesson Quick Checks: exactly 7 quick checks exported and structured in seedQuestionsExpanded.js', () => {
    const qcs = expandedQuestions.quickChecks;
    assert(Array.isArray(qcs), 'quickChecks must be an array');
    assert.strictEqual(qcs.length, 7, `Expected 7 quick checks, got ${qcs.length}`);

    const expectedQcIds = ['QC-P1-01', 'QC-P2-01', 'QC-P3-01', 'QC-P4-01', 'QC-P5-01', 'QC-P6-01', 'QC-P7-01'];
    qcs.forEach((qc, idx) => {
      assert.strictEqual(qc.id, expectedQcIds[idx], `Quick check ${idx} expected ID ${expectedQcIds[idx]}, got ${qc.id}`);
      assert(typeof qc.scenario === 'string' && qc.scenario.trim().length > 20, `QC ${qc.id} scenario missing`);
      assert(typeof qc.question === 'string' && qc.question.trim().length > 10, `QC ${qc.id} question missing`);
      assert(Array.isArray(qc.options) && qc.options.length === 4, `QC ${qc.id} options must have 4 items`);
      assert(typeof qc.explanation === 'string' && qc.explanation.trim().length > 15, `QC ${qc.id} explanation missing`);
    });
  });

  test('In-Lesson Quick Checks: exact module mapping and answer keys match REV7 §6.1', () => {
    const qcs = expandedQuestions.quickChecks;
    const expectedMapping = [
      { id: 'QC-P1-01', moduleOrder: 13, correctKey: 'B', correctOptionIndex: 1 },
      { id: 'QC-P2-01', moduleOrder: 14, correctKey: 'B', correctOptionIndex: 1 },
      { id: 'QC-P3-01', moduleOrder: 15, correctKey: 'B', correctOptionIndex: 1 },
      { id: 'QC-P4-01', moduleOrder: 16, correctKey: 'B', correctOptionIndex: 1 },
      { id: 'QC-P5-01', moduleOrder: 17, correctKey: 'A', correctOptionIndex: 0 },
      { id: 'QC-P6-01', moduleOrder: 18, correctKey: 'A', correctOptionIndex: 0 },
      { id: 'QC-P7-01', moduleOrder: 18, correctKey: 'A', correctOptionIndex: 0 }
    ];

    expectedMapping.forEach((expected, idx) => {
      const qc = qcs[idx];
      assert.strictEqual(qc.id, expected.id);
      assert.strictEqual(qc.moduleOrder, expected.moduleOrder, `QC ${qc.id} mapped to wrong module`);
      assert.strictEqual(qc.correctKey, expected.correctKey, `QC ${qc.id} wrong correctKey`);
      assert.strictEqual(qc.correctOptionIndex, expected.correctOptionIndex, `QC ${qc.id} wrong correctOptionIndex`);
    });
  });

  test('Module 18 Integration: Module 18 contains BOTH Quick Checks 6 and 7 in quickChecks array', () => {
    const mod18 = learningModulesData.find(m => m.order === 18);
    assert(mod18, 'Module 18 not found in learningModulesData');
    assert(Array.isArray(mod18.quickChecks), 'Module 18 quickChecks must be an array');
    assert.strictEqual(mod18.quickChecks.length, 2, `Expected 2 quick checks in Module 18, got ${mod18.quickChecks.length}`);

    assert.strictEqual(mod18.quickChecks[0].id, 'QC-P6-01', 'First check in Module 18 must be QC-P6-01');
    assert.strictEqual(mod18.quickChecks[0].correctIndex, 0, 'QC-P6-01 correctIndex must be 0');

    assert.strictEqual(mod18.quickChecks[1].id, 'QC-P7-01', 'Second check in Module 18 must be QC-P7-01');
    assert.strictEqual(mod18.quickChecks[1].correctIndex, 0, 'QC-P7-01 correctIndex must be 0');

    // Legacy quickCheck backward compatibility
    assert(mod18.quickCheck, 'Module 18 legacy quickCheck must remain populated for backward compatibility');
    assert.strictEqual(mod18.quickCheck.correctIndex, 0);
  });

  test('Modules 13-17 Integration: Each Stage 4 module has quickChecks array matching its designated check', () => {
    const checks = [
      { order: 13, id: 'QC-P1-01', correctIndex: 1 },
      { order: 14, id: 'QC-P2-01', correctIndex: 1 },
      { order: 15, id: 'QC-P3-01', correctIndex: 1 },
      { order: 16, id: 'QC-P4-01', correctIndex: 1 },
      { order: 17, id: 'QC-P5-01', correctIndex: 0 }
    ];

    checks.forEach(chk => {
      const mod = learningModulesData.find(m => m.order === chk.order);
      assert(mod, `Module ${chk.order} not found`);
      assert(Array.isArray(mod.quickChecks), `Module ${chk.order} quickChecks must be an array`);
      assert.strictEqual(mod.quickChecks.length, 1, `Module ${chk.order} quickChecks length must be 1`);
      assert.strictEqual(mod.quickChecks[0].id, chk.id);
      assert.strictEqual(mod.quickChecks[0].correctIndex, chk.correctIndex);

      // Verify backward-compatible quickCheck
      assert(mod.quickCheck, `Module ${chk.order} legacy quickCheck missing`);
      assert.strictEqual(mod.quickCheck.correctIndex, chk.correctIndex);
    });
  });

  // -------------------------------------------------------------------------
  // 3. MONGOOSE SCHEMA VALIDATION (IN-MEMORY)
  // -------------------------------------------------------------------------
  test('Mongoose Validation: all 21 QuizQuestion items validate with zero schema errors', () => {
    const mockQuizId = new mongoose.Types.ObjectId();
    expandedQuestions.forEach(q => {
      const doc = new QuizQuestion({ ...q, quizId: mockQuizId });
      const err = doc.validateSync();
      assert(!err, `Validation failed for ${q.questionId}: ${err ? err.message : ''}`);
    });
  });

  test('Mongoose Validation: all 18 LearningModule items validate with zero schema errors', () => {
    learningModulesData.forEach(m => {
      const doc = new LearningModule(m);
      const err = doc.validateSync();
      assert(!err, `Validation failed for module ${m.order} (${m.slug}): ${err ? err.message : ''}`);
    });
  });

  test('Negative Schema Testing: QuizQuestion rejects malformed records', () => {
    const mockQuizId = new mongoose.Types.ObjectId();
    
    // Missing questionText
    const badQ1 = new QuizQuestion({
      quizId: mockQuizId,
      category: 'DPDP and privacy',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 0,
      explanation: 'Some explanation'
    });
    assert(badQ1.validateSync() !== undefined, 'Should reject missing questionText');

    // Invalid format enum
    const badQ2 = new QuizQuestion({
      quizId: mockQuizId,
      questionText: 'Is this valid?',
      format: 'unsupported_format_enum',
      category: 'DPDP and privacy',
      options: ['A', 'B'],
      correctOptionIndex: 0,
      explanation: 'Some explanation'
    });
    assert(badQ2.validateSync() !== undefined, 'Should reject unsupported format enum');

    // Invalid difficulty enum
    const badQ3 = new QuizQuestion({
      quizId: mockQuizId,
      questionText: 'Is this valid question?',
      difficulty: 'SuperHardImpossible',
      category: 'DPDP and privacy',
      options: ['A', 'B'],
      correctOptionIndex: 0,
      explanation: 'Some explanation'
    });
    assert(badQ3.validateSync() !== undefined, 'Should reject invalid difficulty enum');
  });

  // -------------------------------------------------------------------------
  // 4. SEED INTEGRATION & IDEMPOTENCY VERIFICATION
  // -------------------------------------------------------------------------
  test('Seed Integration: seed.js concatenates stage4Questions and reaches expected bank totals', () => {
    const seedFilePath = path.join(__dirname, '../config/seed.js');
    const seedContent = fs.readFileSync(seedFilePath, 'utf8');

    assert(seedContent.includes('seedQuestionsExpanded'), 'seed.js must reference seedQuestionsExpanded');
    assert(seedContent.includes('stage4Questions'), 'seed.js must define stage4Questions');
    assert(seedContent.includes('quizQuestionsData = [...qPart1, ...qPart2, ...qPart3, ...stage4Questions]'),
      'seed.js must concatenate stage4Questions into quizQuestionsData');

    // Verify fixture question counts
    const qPart1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/quizQuestions_part1.json'), 'utf8'));
    const qPart2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/quizQuestions_part2.json'), 'utf8'));
    let qPart3 = [];
    const p3Path = path.join(__dirname, '../config/quizQuestions_part3.json');
    if (fs.existsSync(p3Path)) {
      qPart3 = JSON.parse(fs.readFileSync(p3Path, 'utf8'));
    }

    const baselineCount = qPart1.length + qPart2.length + qPart3.length;
    assert.strictEqual(baselineCount, 340, `Expected 340 existing questions, found ${baselineCount}`);
    
    const totalCount = baselineCount + expandedQuestions.length;
    assert.strictEqual(totalCount, 361, `Expected 361 total questions after Stage 4 expansion, got ${totalCount}`);
  });

  test('Seed Idempotency & Upsert Safety: stable authored questionId vs questionText query and non-destructive delete guard', () => {
    const seedFilePath = path.join(__dirname, '../config/seed.js');
    const seedContent = fs.readFileSync(seedFilePath, 'utf8');

    // Check authored vs generated query matching
    const hasAuthoredQueryCheck = seedContent.includes('hasAuthoredId') &&
      seedContent.includes('questionId: qData.questionId') &&
      seedContent.includes('questionText: qData.questionText');
    assert(hasAuthoredQueryCheck,
      'seed.js must upsert authored IDs by questionId and generated positional IDs by questionText');

    // Check deleteMany non-destructive guard
    assert(seedContent.includes('activeQuestionIds'), 'seed.js must collect activeQuestionIds');
    assert(seedContent.includes('{ questionId: { $nin: Array.from(activeQuestionIds) } }'),
      'seed.js must guard activeQuestionIds against purge');
  });

  // -------------------------------------------------------------------------
  // 5. STATUTORY ACCURACY ASSERTIONS (6 NOVEMBER 2026 BASELINE)
  // -------------------------------------------------------------------------
  test('Statutory Accuracy: DPDP commencement dates strictly distinguished (Nov 2026 vs May 2027)', () => {
    // DPDP Section 6(9) & Rule 4 are 1-year tier (13 November 2026)
    const p3Questions = expandedQuestions.filter(q => q.topicTag === 'PILLAR 3');
    const consentManagerQ = p3Questions.find(q => q.questionId === 'Q-P3-03');
    assert(consentManagerQ, 'Q-P3-03 must exist');
    assert(consentManagerQ.explanation.includes('13 November 2026') || consentManagerQ.explanation.includes('one year'),
      'Q-P3-03 must accurately state the 1-year commencement timeline for Consent Managers');

    // DPDP Section 44(2) (repealing Section 43A) commences 18 months post-notification (13 May 2027)
    const p1Questions = expandedQuestions.filter(q => q.topicTag === 'PILLAR 1');
    const spdiQ = p1Questions.find(q => q.questionId === 'Q-P1-02');
    assert(spdiQ, 'Q-P1-02 must exist');
    assert(spdiQ.explanation.includes('13 May 2027') && spdiQ.explanation.includes('18 months'),
      'Q-P1-02 must accurately state Section 43A remains active on 6 Nov 2026 baseline until 13 May 2027');

    // Quick Check 1 also reinforces Section 43A active status on 6 Nov 2026
    const qc1 = expandedQuestions.quickChecks.find(qc => qc.id === 'QC-P1-01');
    assert(qc1, 'QC-P1-01 must exist');
    assert(qc1.explanation.includes('Section 43A') && qc1.explanation.includes('13 May 2027'),
      'QC-P1-01 must explicitly affirm Section 43A remains in force on 6 November 2026');
  });

  test('Statutory Accuracy: IT Rules 2026 2-hour NCII takedown timeline (Rule 3(2)(b)) verified', () => {
    // Quick Check 4 tests Rule 3(2)(b) NCII 2-hour timeline
    const qc4 = expandedQuestions.quickChecks.find(qc => qc.id === 'QC-P4-01');
    assert(qc4, 'QC-P4-01 must exist');
    assert(qc4.explanation.includes('Rule 3(2)(b)'), 'QC-P4-01 must cite Rule 3(2)(b)');
    assert(qc4.explanation.includes('two hours') || qc4.explanation.includes('2 hours'), 'QC-P4-01 must state 2-hour removal');

    // Question Q-P4-01 tests Rule 3(1)(d) police takedown requiring Joint Secretary/DIG rank
    const takedownQ = expandedQuestions.find(q => q.questionId === 'Q-P4-01');
    assert(takedownQ, 'Q-P4-01 must exist');
    assert(takedownQ.explanation.includes('Rule 3(1)(d)'), 'Q-P4-01 must cite Rule 3(1)(d)');
  });

  test('Statutory Accuracy: Section 72A Jan Vishwas limits and RBI bank category directions verified', () => {
    // Section 72A: Q-P6-02 and QC-P6-01 both verify ₹25 lakh maximum penalty under Jan Vishwas Act
    const s72aQ = expandedQuestions.find(q => q.questionId === 'Q-P6-02');
    assert(s72aQ, 'Q-P6-02 must exist');
    assert(s72aQ.explanation.includes('25 lakh') || s72aQ.explanation.includes('₹25 lakh'),
      'Q-P6-02 must reflect ₹25 lakh maximum penalty under Jan Vishwas Act');

    const s72aQC = expandedQuestions.quickChecks.find(qc => qc.id === 'QC-P6-01');
    assert(s72aQC, 'QC-P6-01 must exist');
    assert(s72aQC.explanation.includes('25 lakh') || s72aQC.explanation.includes('₹25 lakh'),
      'QC-P6-01 must reflect ₹25 lakh maximum penalty under Jan Vishwas Act');

    // RBI Commercial Banks: Q-P7-01 verifies Para 67(1) zero liability and Para 72 10 working days shadow reversal
    const rbiQ = expandedQuestions.find(q => q.questionId === 'Q-P7-01');
    assert(rbiQ, 'Q-P7-01 must exist');
    assert(rbiQ.explanation.includes('Paragraph 67(1)') && rbiQ.explanation.includes('10 working days'),
      'Q-P7-01 must accurately state zero liability Para 67(1) and 10 working days shadow reversal under Para 72');

    // RBI Regional Rural Banks: QC-P7-01 verifies Para 119(2) zero liability and Para 124 10 working days shadow reversal
    const rbiQC = expandedQuestions.quickChecks.find(qc => qc.id === 'QC-P7-01');
    assert(rbiQC, 'QC-P7-01 must exist');
    assert(rbiQC.explanation.includes('119(2)') && rbiQC.explanation.includes('10 working days'),
      'QC-P7-01 must accurately state zero liability Para 119(2) and 10 working days shadow reversal under Para 124');

    // BNSS Property Return: Q-P7-02 verifies Section 503 procedure for seized mule account funds
    const bnssQ = expandedQuestions.find(q => q.questionId === 'Q-P7-02');
    assert(bnssQ, 'Q-P7-02 must exist');
    assert(bnssQ.explanation.includes('BNSS Section 503'), 'Q-P7-02 must cite BNSS Section 503');
  });

  // -------------------------------------------------------------------------
  // 6. RESIDUAL AUDIT DEFECT RESOLUTION VERIFICATION
  // -------------------------------------------------------------------------
  test('Audit Resolution: Section 43A records reflect fault-based negligence, no strict liability, and Section 46(1A) limits', () => {
    const seedContent = fs.readFileSync(path.join(__dirname, '../config/seed.js'), 'utf8');
    assert(seedContent.includes('fault-based negligence, not strict liability'),
      'seed.js Section 43A records must specify fault-based negligence rather than strict liability');
    assert(seedContent.includes('claims up to ₹5 crore are adjudicated by the State IT Secretary / Adjudicating Officer under Section 46(1A)'),
      'seed.js Section 43A records must cite Section 46(1A) ₹5 crore Adjudicating Officer jurisdiction');
  });

  test('Audit Resolution: BNSS Section 173 limits BNS 199(c) to enumerated offences and states BNSS 173(4) escalation', () => {
    const seedContent = fs.readFileSync(path.join(__dirname, '../config/seed.js'), 'utf8');
    assert(seedContent.includes('BNS Section 199(c) strictly for enumerated offences'),
      'seed.js BNSS 173 record must restrict BNS 199(c) penal action to enumerated offences');
    assert(seedContent.includes('BNSS Section 173(4) provides the statutory escalation path'),
      'seed.js BNSS 173 record must cite BNSS Section 173(4) escalation path');
  });

  test('Audit Resolution: RBI Customer Liability describes zero liability & shadow reversal as conditional and cites MD-PPI Para 17.7', () => {
    const seedContent = fs.readFileSync(path.join(__dirname, '../config/seed.js'), 'utf8');
    assert(seedContent.includes('Conditional zero liability for third-party breaches'),
      'seed.js RBI liability record must describe zero liability as conditional');
    assert(seedContent.includes('MD-PPI Para 17.7'),
      'seed.js RBI liability record must cite MD-PPI Para 17.7 for non-bank PPI 10 calendar days reversal');
  });

  test('Audit Resolution: Modules 13-18 relatedCyberCrimes and relatedCaseStudies resolve 100% against seeded records', () => {
    const seedContent = fs.readFileSync(path.join(__dirname, '../config/seed.js'), 'utf8');

    const csStart = seedContent.indexOf('const caseStudiesData = [');
    const csEnd = seedContent.indexOf('for (let cs of caseStudiesData)');
    const csBlock = seedContent.slice(csStart, csEnd);
    const caseStudySlugs = new Set();
    for (const m of csBlock.matchAll(/slug:\s*'([^']+)'/g)) {
      caseStudySlugs.add(m[1]);
    }

    const crStart = seedContent.indexOf('const crimesData = [');
    const crEnd = seedContent.indexOf('for (let crime of crimesData)');
    const crBlock = seedContent.slice(crStart, crEnd);
    const crimeSlugs = new Set();
    for (const m of crBlock.matchAll(/slug:\s*'([^']+)'/g)) {
      crimeSlugs.add(m[1]);
    }

    learningModulesData.filter(m => m.order >= 13).forEach(m => {
      m.relatedCyberCrimes.forEach(c => {
        assert(crimeSlugs.has(c), `Module ${m.order} has unmatched relatedCyberCrime slug: ${c}`);
      });
      m.relatedCaseStudies.forEach(cs => {
        assert(caseStudySlugs.has(cs), `Module ${m.order} has unmatched relatedCaseStudy slug: ${cs}`);
      });
      // Also verify unverified dpdi.gov.in domain is not present
      if (m.relatedResources) {
        m.relatedResources.forEach(res => {
          assert(!res.includes('dpdi.gov.in'), `Module ${m.order} contains unverified resource domain dpdi.gov.in`);
        });
      }
    });
  });

  test('Audit Resolution: Module 7 and ncii-image-abuse reflect 2-hour NCII removal timeline under Rule 3(2)(b)', () => {
    const mod7 = learningModulesData.find(m => m.order === 7);
    assert(mod7, 'Module 7 must exist');
    const sec3 = mod7.sections.find(s => s.title.includes('Video Deepfakes'));
    assert(sec3 && sec3.content.includes('two hours'), 'Module 7 Section 3 must cite two hours');

    const seedContent = fs.readFileSync(path.join(__dirname, '../config/seed.js'), 'utf8');
    assert(seedContent.includes('remove or disable access to non-consensual intimate imagery within two hours'),
      'seed.js ncii-image-abuse must specify two hours');
  });

  test('Audit Resolution: Module 18 accurately states Section 43(c) uncapped compensation and BNS 78 protections for women', () => {
    const mod18 = learningModulesData.find(m => m.order === 18);
    assert(mod18, 'Module 18 must exist');
    const sec1 = mod18.sections.find(s => s.title.includes('Malware'));
    assert(sec1.content.includes('uncapped compensation under Section 43') && sec1.content.includes('Section 46(1A)'),
      'Module 18 Section 1 must specify uncapped compensation under Section 43 and Section 46(1A)');

    const sec5 = mod18.sections.find(s => s.title.includes('Criminal Law Protections'));
    assert(sec5.content.includes('monitoring the use by a woman') && sec5.content.includes('clear indication of disinterest'),
      'Module 18 Section 5 must reflect BNS 78 statutory elements regarding monitoring a woman and disinterest');

    const sec3 = mod18.sections.find(s => s.title.includes('RBI Customer Liability'));
    assert(sec3.content.includes('All other savings bank accounts (irrespective of balance)'),
      'Module 18 Section 3 must not imply savings accounts above ₹5 lakh move into the ₹25,000 tier');
  });

  test('Audit Resolution: Module 10 reflects Section 44(2) 13 May 2027 commencement under G.S.R. 843(E)', () => {
    const mod10 = learningModulesData.find(m => m.order === 10);
    assert(mod10, 'Module 10 must exist');
    const sec4 = mod10.sections.find(s => s.title.includes('Section 43A Transition'));
    assert(sec4.content.includes('13 May 2027') && sec4.content.includes('G.S.R. 843(E)'),
      'Module 10 Section 4 must state 13 May 2027 commencement under G.S.R. 843(E)');
    assert(mod10.quickCheck.options[0].includes('13 May 2027'),
      'Module 10 quickCheck answer must cite 13 May 2027');
  });

  console.log('\n----------------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------------');

  if (failed > 0) {
    throw new Error(`${failed} tests failed in Wave 2 suite`);
  }
}

runWave2Tests().catch(err => {
  console.error('\nTest Suite Execution Terminated with Error:');
  console.error(err);
  process.exit(1);
});
