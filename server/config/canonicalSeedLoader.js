/**
 * Cyber Law Awareness Portal — Canonical Seed Loader & Offline Validator
 *
 * Reads canonical educational and simulation content directly from the
 * repository's authoritative sources (without executing seed.js or opening
 * any database connection):
 *  - server/config/seed.js (LegalSource, LawSection, CyberCrime, CaseStudy [Landmark], Quiz, Resource)
 *  - server/config/seedJusticeShortcomingsCases.js (CaseStudy [Cases Where Justice Fell Short])
 *  - server/config/seedModulesData.js (LearningModule)
 *  - server/config/quizQuestions_part1..3.json + seedQuestionsExpanded.js (QuizQuestion)
 *  - server/config/scenarios.json (Scenario, ScenarioStage, ScenarioDecision)
 *  - server/config/remediationCatalog.js (cross-reference validation)
 *  - server/config/supplementaryLawsSeed.js (supplementary legalContext awareness)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mongoose = require('mongoose');

const LegalSource = require('../models/LegalSource');
const LawSection = require('../models/LawSection');
const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const LearningModule = require('../models/LearningModule');
const Resource = require('../models/Resource');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

const learningModulesData = require('./seedModulesData');
const seedQuestionsExpanded = require('./seedQuestionsExpanded');
const remediationCatalog = require('./remediationCatalog');
const { supplementaryLawsSeedData } = require('./supplementaryLawsSeed');

const CONFIG_DIR = __dirname;
const SOURCE_KEY_PREFIX = '__SOURCE_KEY__:';

const EXPECTED_CANONICAL_COUNTS = Object.freeze({
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

/**
 * Extracts a balanced JS literal ([...] or {...}) starting at openIndex,
 * safely skipping string literals and escaped quotes.
 */
function extractBalancedLiteral(source, openIndex, openChar, closeChar) {
  if (openIndex < 0 || source[openIndex] !== openChar) {
    throw new Error(`Expected '${openChar}' at index ${openIndex}`);
  }

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return source.slice(openIndex, i + 1);
      }
    }
  }

  throw new Error(`Unclosed '${openChar}' starting at index ${openIndex}`);
}

function evaluateArrayFromSeed(seedContent, marker, sandbox = {}) {
  const idx = seedContent.indexOf(marker);
  if (idx === -1) {
    throw new Error(`Canonical array marker not found in seed.js: ${marker}`);
  }
  const bracketIdx = seedContent.indexOf('[', idx);
  const literal = extractBalancedLiteral(seedContent, bracketIdx, '[', ']');
  return vm.runInNewContext(`(${literal})`, sandbox);
}

/**
 * Extracts all 13 LegalSource definitions in canonical order from seed.js.
 */
function extractLegalSourcesFromSeed(seedContent) {
  const regex = /(\w+)\s*=\s*await\s+LegalSource\.create\(/g;
  const sources = [];
  let match;

  while ((match = regex.exec(seedContent)) !== null) {
    const varName = match[1];
    const openBrace = seedContent.indexOf('{', match.index + match[0].length - 1);
    const objLiteral = extractBalancedLiteral(seedContent, openBrace, '{', '}');
    const doc = vm.runInNewContext(`(${objLiteral})`, {});
    sources.push({ key: varName, doc });
  }

  return sources;
}

/**
 * Loads all 11 canonical educational/simulation datasets cleanly offline.
 */
function loadCanonicalSeedCatalog() {
  const seedContent = fs.readFileSync(path.join(CONFIG_DIR, 'seed.js'), 'utf8');

  // 1. LegalSources (13)
  const legalSources = extractLegalSourcesFromSeed(seedContent);

  // 2. LawSections (32) with symbolic officialSourceKey resolution
  const sourceSandbox = {};
  for (const src of legalSources) {
    sourceSandbox[src.key] = { _id: `${SOURCE_KEY_PREFIX}${src.key}` };
  }
  const rawLaws = evaluateArrayFromSeed(seedContent, 'const lawSectionsData =', sourceSandbox);
  const lawSections = rawLaws.map((law) => {
    const copy = { ...law };
    if (typeof copy.officialSourceId === 'string' && copy.officialSourceId.startsWith(SOURCE_KEY_PREFIX)) {
      copy._officialSourceKey = copy.officialSourceId.slice(SOURCE_KEY_PREFIX.length);
      delete copy.officialSourceId;
    } else {
      copy._officialSourceKey = null;
    }
    return copy;
  });

  // 3. CyberCrimes (29)
  const cyberCrimes = evaluateArrayFromSeed(seedContent, 'const crimesData =');

  // 4. CaseStudies (11 Landmark Precedents + 10 Cases Where Justice Fell Short = 21)
  const legacyCases = evaluateArrayFromSeed(seedContent, 'const caseStudiesData =').map((cs) => ({
    collection: 'Landmark Precedents',
    collectionCategory: 'Judicial Precedents',
    evidentiaryClassification: 'Documented Judicial Precedent',
    ...cs
  }));
  const jsCasesContent = fs.readFileSync(path.join(CONFIG_DIR, 'seedJusticeShortcomingsCases.js'), 'utf8');
  const collMatch = jsCasesContent.match(/const\s+COLLECTION_NAME\s*=\s*(['"])(.*?)\1\s*;/);
  const shortcomingsCollectionName = collMatch ? collMatch[2] : 'Cases Where Justice Fell Short';
  const shortcomingsCases = evaluateArrayFromSeed(
    jsCasesContent,
    'const justiceShortcomingsCasesData =',
    { COLLECTION_NAME: shortcomingsCollectionName }
  ).map((cs) => ({ ...cs }));
  const caseStudies = [...legacyCases, ...shortcomingsCases];

  // 5. Quizzes (12)
  const quizzes = evaluateArrayFromSeed(seedContent, 'const quizzesData =');

  // 6. QuizQuestions (361)
  const qPart1 = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'quizQuestions_part1.json'), 'utf8'));
  const qPart2 = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'quizQuestions_part2.json'), 'utf8'));
  const p3Path = path.join(CONFIG_DIR, 'quizQuestions_part3.json');
  const qPart3 = fs.existsSync(p3Path) ? JSON.parse(fs.readFileSync(p3Path, 'utf8')) : [];
  const stage4Qs = Array.isArray(seedQuestionsExpanded)
    ? seedQuestionsExpanded
    : (seedQuestionsExpanded.expandedQuestions || []);

  const quizCategorySet = new Set(quizzes.map((q) => q.category));
  const rawQuestions = [...qPart1, ...qPart2, ...qPart3, ...stage4Qs];

  const quizQuestions = rawQuestions.map((raw, idx) => {
    const qData = { ...raw };
    let targetCategory = qData.category;
    if (!quizCategorySet.has(targetCategory)) {
      if (targetCategory === 'Phishing and social engineering') targetCategory = 'Phishing';
      else if (targetCategory === 'UPI, banking and financial fraud') targetCategory = 'Financial Safety';
      else if (targetCategory === 'Identity theft and account security') targetCategory = 'Account Security';
    }
    const targetQuizCategory = quizCategorySet.has(targetCategory) ? targetCategory : 'Cyber Law Basics';

    const hasAuthoredId = Boolean(qData.questionId);
    if (!hasAuthoredId) {
      const catPrefix = qData.category.replace(/[^A-Za-z]/g, '').substring(0, 5).toUpperCase();
      qData.questionId = `QZ-${catPrefix}-${String(idx + 1).padStart(3, '0')}`;
    }
    if (!qData.format) qData.format = 'single_choice';
    if (!qData.practicalTakeaway) {
      qData.practicalTakeaway = 'Remember: Always verify digital requests through trusted secondary channels and keep credentials private.';
    }
    if (!qData.whyIncorrect) {
      qData.whyIncorrect = 'This answer does not align with established statutory provisions or digital security guidelines.';
    }
    if (!qData.legalReferences || qData.legalReferences.length === 0) {
      const sec = qData.relatedLawSection ? qData.relatedLawSection.replace(/^section\s*/i, '').trim() : '66D';
      qData.legalReferences = [{ actName: 'Information Technology Act, 2000', sectionNumber: sec || '66D' }];
    }

    return {
      ...qData,
      _targetQuizCategory: targetQuizCategory,
      _matchStrategy: hasAuthoredId ? 'questionId' : 'questionText'
    };
  });

  // 7. LearningModules (18)
  const learningModules = learningModulesData.map((m) => ({ ...m }));

  // 8. Resources (7)
  const resources = evaluateArrayFromSeed(seedContent, 'const resourcesData =');

  // 9. Scenarios (4), ScenarioStages (43), ScenarioDecisions (111)
  const rawScenarios = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'scenarios.json'), 'utf8'));
  const scenarios = rawScenarios.map((entry) => ({
    scenario: { ...entry.scenario },
    stages: (entry.stages || []).map((stg) => ({
      stageOrder: stg.stageOrder,
      title: stg.title,
      description: stg.description,
      mockInterfaceType: stg.mockInterfaceType,
      mockInterfaceData: stg.mockInterfaceData,
      eventClassification: stg.eventClassification,
      measurementFocus: stg.measurementFocus || [],
      targetSignals: stg.targetSignals || [],
      hasSignalProbe: Boolean(stg.hasSignalProbe),
      signalProbes: stg.signalProbes || [],
      terminal: Boolean(stg.terminal),
      decisions: (stg.decisions || []).map((dec) => ({
        optionText: dec.optionText,
        scoreChange: dec.scoreChange || 0,
        categoryScoreWeights: dec.categoryScoreWeights || {},
        identifiedSignals: dec.identifiedSignals || [],
        behaviorEffects: dec.behaviorEffects || {
          recognition: 0,
          signalIdentification: 0,
          verification: 0,
          decisionQuality: 0,
          falsePositive: 0,
          unreviewedAcceptance: 0
        },
        riskLevel: dec.riskLevel || 'safe',
        isCriticalMistake: Boolean(dec.isCriticalMistake),
        nextStageOrder: dec.nextStageOrder !== undefined ? dec.nextStageOrder : null,
        explanation: dec.explanation,
        outcomeType: dec.outcomeType || 'neutral'
      }))
    }))
  }));

  const stageCount = scenarios.reduce((sum, s) => sum + s.stages.length, 0);
  const decisionCount = scenarios.reduce(
    (sum, s) => sum + s.stages.reduce((stSum, st) => stSum + st.decisions.length, 0),
    0
  );

  return {
    legalSources,
    lawSections,
    cyberCrimes,
    caseStudies,
    quizzes,
    quizQuestions,
    learningModules,
    resources,
    scenarios,
    remediationCatalog,
    counts: {
      LegalSource: legalSources.length,
      LawSection: lawSections.length,
      CyberCrime: cyberCrimes.length,
      CaseStudy: caseStudies.length,
      Quiz: quizzes.length,
      QuizQuestion: quizQuestions.length,
      LearningModule: learningModules.length,
      Resource: resources.length,
      Scenario: scenarios.length,
      ScenarioStage: stageCount,
      ScenarioDecision: decisionCount
    }
  };
}

function assertUniqueValues(items, accessor, label, errors) {
  const seen = new Set();
  for (const item of items) {
    const val = accessor(item);
    if (val === undefined || val === null || val === '') continue;
    if (seen.has(val)) {
      errors.push(`Duplicate ${label}: "${val}"`);
    }
    seen.add(val);
  }
}

/**
 * Performs comprehensive offline schema, uniqueness, graph, and cross-reference
 * validation on the loaded canonical catalog without any database connection.
 */
function validateCanonicalCatalogOffline(catalog) {
  const errors = [];
  const notes = [];

  // 1. Exact Expected Canonical Counts
  for (const [key, expected] of Object.entries(EXPECTED_CANONICAL_COUNTS)) {
    const actual = catalog.counts[key];
    if (actual !== expected) {
      errors.push(`Canonical count mismatch for ${key}: expected ${expected}, got ${actual}`);
    }
  }

  // 2. Mongoose Model Schema Validation (.validateSync) with dummy ObjectIds for refs
  const syntheticId = new mongoose.Types.ObjectId();

  catalog.legalSources.forEach(({ doc }, idx) => {
    const err = new LegalSource(doc).validateSync();
    if (err) errors.push(`LegalSource[${idx}] (${doc.title}): ${err.message}`);
  });

  catalog.lawSections.forEach((law) => {
    const payload = { ...law };
    delete payload._officialSourceKey;
    if (law._officialSourceKey) payload.officialSourceId = syntheticId;
    const err = new LawSection(payload).validateSync();
    if (err) errors.push(`LawSection (${law.sectionNumber}): ${err.message}`);
  });

  catalog.cyberCrimes.forEach((crime) => {
    const err = new CyberCrime(crime).validateSync();
    if (err) errors.push(`CyberCrime (${crime.slug}): ${err.message}`);
  });

  catalog.caseStudies.forEach((cs) => {
    const err = new CaseStudy(cs).validateSync();
    if (err) errors.push(`CaseStudy (${cs.slug}): ${err.message}`);
  });

  catalog.quizzes.forEach((qz) => {
    const err = new Quiz(qz).validateSync();
    if (err) errors.push(`Quiz (${qz.title}): ${err.message}`);
  });

  catalog.quizQuestions.forEach((q) => {
    const payload = { ...q, quizId: syntheticId };
    delete payload._targetQuizCategory;
    delete payload._matchStrategy;
    const err = new QuizQuestion(payload).validateSync();
    if (err) errors.push(`QuizQuestion (${q.questionId}): ${err.message}`);
  });

  catalog.learningModules.forEach((mod) => {
    const err = new LearningModule(mod).validateSync();
    if (err) errors.push(`LearningModule (${mod.slug}): ${err.message}`);
  });

  catalog.resources.forEach((res) => {
    const err = new Resource(res).validateSync();
    if (err) errors.push(`Resource (${res.title}): ${err.message}`);
  });

  catalog.scenarios.forEach(({ scenario, stages }) => {
    const sErr = new Scenario(scenario).validateSync();
    if (sErr) errors.push(`Scenario (${scenario.slug}@v${scenario.version}): ${sErr.message}`);

    const stageOrders = new Set();
    for (const stg of stages) {
      stageOrders.add(stg.stageOrder);
      const stgPayload = {
        scenarioId: syntheticId,
        stageOrder: stg.stageOrder,
        title: stg.title,
        description: stg.description,
        mockInterfaceType: stg.mockInterfaceType,
        mockInterfaceData: stg.mockInterfaceData,
        eventClassification: stg.eventClassification,
        measurementFocus: stg.measurementFocus,
        targetSignals: stg.targetSignals,
        hasSignalProbe: stg.hasSignalProbe,
        signalProbes: stg.signalProbes,
        terminal: stg.terminal
      };
      const stgErr = new ScenarioStage(stgPayload).validateSync();
      if (stgErr) errors.push(`ScenarioStage (${scenario.slug}@v${scenario.version}#${stg.stageOrder}): ${stgErr.message}`);

      if (!stg.terminal && (!stg.decisions || stg.decisions.length === 0) && !stg.title.includes('Adaptive Segment')) {
        errors.push(`Non-terminal stage ${scenario.slug}@v${scenario.version}#${stg.stageOrder} has zero decisions`);
      }

      const stageSignals = stg.targetSignals || [];
      const decTexts = new Set();
      for (const dec of stg.decisions) {
        if (decTexts.has(dec.optionText)) {
          errors.push(`Duplicate decision optionText in ${scenario.slug}@v${scenario.version}#${stg.stageOrder}`);
        }
        decTexts.add(dec.optionText);

        for (const sig of (dec.identifiedSignals || [])) {
          if (!stageSignals.includes(sig)) {
            errors.push(
              `Decision "${dec.optionText.slice(0, 30)}" in ${scenario.slug}@v${scenario.version}#${stg.stageOrder} uses signal "${sig}" missing from stage targetSignals`
            );
          }
        }
        if (dec.nextStageOrder !== null && dec.nextStageOrder === stg.stageOrder) {
          errors.push(`Self-loop detected in ${scenario.slug}@v${scenario.version}#${stg.stageOrder}`);
        }

        const decPayload = {
          stageId: syntheticId,
          optionText: dec.optionText,
          scoreChange: dec.scoreChange,
          categoryScoreWeights: dec.categoryScoreWeights,
          identifiedSignals: dec.identifiedSignals,
          behaviorEffects: dec.behaviorEffects,
          riskLevel: dec.riskLevel,
          isCriticalMistake: dec.isCriticalMistake,
          nextStageId: dec.nextStageOrder !== null ? syntheticId : null,
          explanation: dec.explanation,
          outcomeType: dec.outcomeType
        };
        const dErr = new ScenarioDecision(decPayload).validateSync();
        if (dErr) errors.push(`ScenarioDecision (${scenario.slug}@v${scenario.version}#${stg.stageOrder}): ${dErr.message}`);
      }
    }

    if (!stageOrders.has(1)) {
      errors.push(`Scenario ${scenario.slug}@v${scenario.version} lacks starting stageOrder=1`);
    }
    if (stageOrders.size !== stages.length) {
      errors.push(`Scenario ${scenario.slug}@v${scenario.version} has duplicate stageOrder values`);
    }
    for (const stg of stages) {
      for (const dec of stg.decisions) {
        if (dec.nextStageOrder !== null && !stageOrders.has(dec.nextStageOrder)) {
          errors.push(
            `Broken branching link in ${scenario.slug}@v${scenario.version}#${stg.stageOrder}: nextStageOrder=${dec.nextStageOrder} missing`
          );
        }
      }
    }
  });

  // 3. Unique Keys & Identifiers
  assertUniqueValues(catalog.legalSources, (s) => s.key, 'LegalSource key', errors);
  assertUniqueValues(catalog.legalSources, (s) => s.doc.title, 'LegalSource title', errors);
  assertUniqueValues(catalog.lawSections, (l) => l.sectionNumber, 'LawSection sectionNumber', errors);
  assertUniqueValues(catalog.lawSections.filter((l) => l.slug), (l) => l.slug, 'LawSection slug', errors);
  assertUniqueValues(catalog.cyberCrimes, (c) => c.slug, 'CyberCrime slug', errors);
  assertUniqueValues(catalog.cyberCrimes, (c) => c.title, 'CyberCrime title', errors);
  assertUniqueValues(catalog.caseStudies, (c) => c.slug, 'CaseStudy slug', errors);
  assertUniqueValues(catalog.caseStudies, (c) => c.caseNumber, 'CaseStudy caseNumber', errors);
  assertUniqueValues(catalog.quizzes, (q) => q.title, 'Quiz title', errors);
  assertUniqueValues(catalog.quizzes, (q) => q.category, 'Quiz category', errors);
  assertUniqueValues(catalog.quizQuestions, (q) => q.questionId, 'QuizQuestion questionId', errors);
  assertUniqueValues(catalog.quizQuestions, (q) => q.questionText, 'QuizQuestion questionText', errors);
  assertUniqueValues(catalog.learningModules, (m) => m.slug, 'LearningModule slug', errors);
  assertUniqueValues(catalog.learningModules, (m) => m.order, 'LearningModule order', errors);
  assertUniqueValues(catalog.resources, (r) => r.title, 'Resource title', errors);
  assertUniqueValues(catalog.scenarios, (s) => `${s.scenario.slug}@v${s.scenario.version}`, 'Scenario slug+version', errors);

  // 4. Cross-Collection Foreign Key & Reference Checks
  const sourceKeySet = new Set(catalog.legalSources.map((s) => s.key));
  const quizCatSet = new Set(catalog.quizzes.map((q) => q.category));
  const crimeSlugSet = new Set(catalog.cyberCrimes.map((c) => c.slug));
  const caseSlugSet = new Set(catalog.caseStudies.map((c) => c.slug));
  const moduleSlugSet = new Set(catalog.learningModules.map((m) => m.slug));
  const lawRefSet = new Set([
    ...catalog.lawSections.map((l) => l.sectionNumber),
    ...catalog.lawSections.map((l) => l.slug).filter(Boolean)
  ]);
  const suppLawRefSet = new Set(supplementaryLawsSeedData.map((l) => l.sectionNumber));

  for (const law of catalog.lawSections) {
    if (law._officialSourceKey && !sourceKeySet.has(law._officialSourceKey)) {
      errors.push(`LawSection "${law.sectionNumber}" references missing LegalSource key "${law._officialSourceKey}"`);
    }
    for (const csSlug of (law.relatedCaseStudies || [])) {
      if (!caseSlugSet.has(csSlug)) {
        errors.push(`LawSection "${law.sectionNumber}" references missing CaseStudy "${csSlug}"`);
      }
    }
  }

  for (const q of catalog.quizQuestions) {
    if (!quizCatSet.has(q._targetQuizCategory)) {
      errors.push(`QuizQuestion "${q.questionId}" failed Quiz category resolution: "${q._targetQuizCategory}"`);
    }
  }

  for (const mod of catalog.learningModules) {
    for (const lawRef of (mod.relatedLawSections || [])) {
      if (!lawRefSet.has(lawRef)) {
        errors.push(`LearningModule "${mod.slug}" references missing LawSection "${lawRef}"`);
      }
    }
    for (const crimeRef of (mod.relatedCyberCrimes || [])) {
      if (!crimeSlugSet.has(crimeRef)) {
        errors.push(`LearningModule "${mod.slug}" references missing CyberCrime "${crimeRef}"`);
      }
    }
    for (const caseRef of (mod.relatedCaseStudies || [])) {
      if (!caseSlugSet.has(caseRef)) {
        errors.push(`LearningModule "${mod.slug}" references missing CaseStudy "${caseRef}"`);
      }
    }
  }

  for (const crime of catalog.cyberCrimes) {
    for (const csSlug of (crime.relatedCaseStudies || [])) {
      if (!caseSlugSet.has(csSlug)) errors.push(`CyberCrime "${crime.slug}" references missing CaseStudy "${csSlug}"`);
    }
    for (const modSlug of (crime.relatedModules || [])) {
      if (!moduleSlugSet.has(modSlug)) errors.push(`CyberCrime "${crime.slug}" references missing LearningModule "${modSlug}"`);
    }
    for (const relCrime of (crime.relatedCrimes || [])) {
      if (!crimeSlugSet.has(relCrime)) errors.push(`CyberCrime "${crime.slug}" references missing related CyberCrime "${relCrime}"`);
    }
    for (const secRef of (crime.legalContext || [])) {
      if (!lawRefSet.has(secRef)) {
        if (suppLawRefSet.has(secRef)) {
          notes.push(`CyberCrime "${crime.slug}" legalContext "${secRef}" resolves via client supplementaryLawsSeed`);
        } else {
          errors.push(`CyberCrime "${crime.slug}" legalContext references missing LawSection "${secRef}"`);
        }
      }
    }
  }

  for (const pathway of catalog.remediationCatalog) {
    if (!crimeSlugSet.has(pathway.crimeSlug)) {
      errors.push(`Remediation "${pathway.pathwayId}" references missing CyberCrime "${pathway.crimeSlug}"`);
    }
    if (!caseSlugSet.has(pathway.caseStudySlug)) {
      errors.push(`Remediation "${pathway.pathwayId}" references missing CaseStudy "${pathway.caseStudySlug}"`);
    }
    if (pathway.primaryLawSectionNumber && !lawRefSet.has(pathway.primaryLawSectionNumber)) {
      errors.push(`Remediation "${pathway.pathwayId}" references missing LawSection "${pathway.primaryLawSectionNumber}"`);
    }
    if (pathway.curriculumLesson?.slug && !moduleSlugSet.has(pathway.curriculumLesson.slug)) {
      errors.push(`Remediation "${pathway.pathwayId}" references missing LearningModule "${pathway.curriculumLesson.slug}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    notes,
    counts: catalog.counts
  };
}

module.exports = {
  EXPECTED_CANONICAL_COUNTS,
  loadCanonicalSeedCatalog,
  validateCanonicalCatalogOffline,
  extractBalancedLiteral
};
