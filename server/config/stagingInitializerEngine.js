/**
 * Cyber Law Awareness Portal — Idempotent Staging Initialization Engine
 *
 * Orchestrates conflict-aware, non-destructive initialization of all 11 Class A
 * canonical collections while enforcing strict boundaries against Class B/C/D
 * (User, UserProgress, AssessmentSession, AssessmentDecision, QuizAttempt, AdminAuditLog).
 *
 * Design Guarantees:
 * - Zero deleteMany / deleteOne / drop operations during initialization.
 * - Pre-flight conflict & duplicate audit completes BEFORE any write occurs.
 * - Supports live Mongoose stores and in-memory mock stores for offline tests.
 * - Preserves unrelated records and existing object IDs (plus signalProbe sub-IDs).
 * - Recovers safely from partial runs and completes Scenario -> Stage -> Decision graphs.
 */

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

const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');
const QuizAttempt = require('../models/QuizAttempt');
const AdminAuditLog = require('../models/AdminAuditLog');

const CLASS_A_NAMES = [
  'LegalSource',
  'LawSection',
  'CyberCrime',
  'CaseStudy',
  'Quiz',
  'QuizQuestion',
  'LearningModule',
  'Resource',
  'Scenario',
  'ScenarioStage',
  'ScenarioDecision'
];

const PROTECTED_CLASS_NAMES = [
  'User',
  'UserProgress',
  'AssessmentSession',
  'AssessmentDecision',
  'QuizAttempt',
  'AdminAuditLog'
];

const TRANSIENT_KEYS = new Set([
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
  'lastReviewed',
  'lastVerified',
  'lastReviewedAt',
  'seedBatchId'
]);

/**
 * Normalizes any value (Mongoose subdocs, Maps, ObjectIds, Dates, Arrays) into
 * deterministic JSON-comparable form with transient metadata removed.
 */
function normalizeForCompare(val, keyName = '') {
  if (val === undefined) return undefined;
  if (val === null) return null;

  if (val instanceof mongoose.Types.ObjectId || (typeof val === 'object' && val._bsontype === 'ObjectId')) {
    return val.toString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (val instanceof Map) {
    const out = {};
    for (const k of Array.from(val.keys()).sort()) {
      const nv = normalizeForCompare(val.get(k), k);
      if (nv !== undefined) out[k] = nv;
    }
    return out;
  }
  if (Array.isArray(val)) {
    return val.map((item) => normalizeForCompare(item));
  }
  if (typeof val === 'object') {
    const plain = typeof val.toObject === 'function' ? val.toObject({ depopulate: true }) : val;
    const out = {};
    for (const k of Object.keys(plain).sort()) {
      if (TRANSIENT_KEYS.has(k)) continue;
      // Ignore empty Mongoose synthetic subdoc placeholders if undefined elsewhere
      const nv = normalizeForCompare(plain[k], k);
      if (nv !== undefined) {
        out[k] = nv;
      }
    }
    return out;
  }
  return val;
}

/**
 * Materializes Mongoose schema defaults on a canonical document in memory (no DB write)
 * so comparison against stored DB documents ignores schema default discrepancies.
 */
function materializeCanonical(Model, payload, extraExcludeKeys = []) {
  const cleanPayload = { ...payload };
  for (const k of Object.keys(cleanPayload)) {
    if (k.startsWith('_')) delete cleanPayload[k];
  }
  const docObj = new Model(cleanPayload).toObject({ depopulate: true });
  const normalized = normalizeForCompare(docObj);
  for (const k of extraExcludeKeys) {
    delete normalized[k];
  }
  return normalized;
}

function normalizeExistingDoc(Model, dbDoc, extraExcludeKeys = []) {
  const plain = typeof dbDoc.toObject === 'function' ? dbDoc.toObject({ depopulate: true }) : { ...dbDoc };
  const materialized = typeof Model === 'function'
    ? new Model(plain).toObject({ depopulate: true })
    : plain;
  const normalized = normalizeForCompare(materialized);
  for (const k of extraExcludeKeys) {
    delete normalized[k];
  }
  return normalized;
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const ALL_MODELS = Object.freeze({
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
});

/**
 * Fail-fast verification that all registered models share the exact same active
 * Mongoose singleton and opened connection, with collection buffering cleared.
 */
function assertModelsBoundToConnection(activeMongoose = mongoose, modelRegistry = ALL_MODELS) {
  if (!activeMongoose || !activeMongoose.connection) {
    throw new Error('[CONNECTION OWNERSHIP ERROR] Active Mongoose instance or connection is missing.');
  }

  for (const [name, Model] of Object.entries(modelRegistry)) {
    if (Model.base !== activeMongoose) {
      throw new Error(
        `[CONNECTION OWNERSHIP ERROR] Model "${name}" is bound to a separate Mongoose singleton than the active connection.`
      );
    }
    if (Model.db !== activeMongoose.connection) {
      throw new Error(
        `[CONNECTION OWNERSHIP ERROR] Model "${name}" does not reference the active Mongoose default connection.`
      );
    }
    if (Model.db.readyState !== 1) {
      throw new Error(
        `[CONNECTION STATE ERROR] Model "${name}" connection readyState is ${Model.db.readyState} (expected 1=connected). Refusing buffered query.`
      );
    }
    if (!Model.collection || Model.collection.buffer) {
      throw new Error(
        `[CONNECTION STATE ERROR] Model "${name}" collection is still buffering commands (buffer=${Boolean(Model.collection?.buffer)}).`
      );
    }
  }
}

const PROVENANCE_COLLECTION = 'staging_init_provenances';

/**
 * Creates a live Mongoose store adapter bound strictly to the active staging connection.
 */
function createMongooseStore() {
  const models = ALL_MODELS;

  return {
    async countAllCollections() {
      assertModelsBoundToConnection(mongoose, models);
      const counts = {};
      for (const [name, Model] of Object.entries(models)) {
        counts[name] = await Model.countDocuments({});
      }
      return counts;
    },
    async findAll(name) {
      assertModelsBoundToConnection(mongoose, { [name]: models[name] });
      return models[name].find({}).lean();
    },
    async createOne(name, doc) {
      assertModelsBoundToConnection(mongoose, { [name]: models[name] });
      const created = await models[name].create(doc);
      return created.toObject({ depopulate: true });
    },
    async updateOneById(name, id, updateFields) {
      assertModelsBoundToConnection(mongoose, { [name]: models[name] });
      await models[name].updateOne({ _id: id }, { $set: updateFields });
      return models[name].findById(id).lean();
    },
    async createRunProvenance(provenanceDoc) {
      assertModelsBoundToConnection(mongoose, models);
      const col = mongoose.connection.collection(PROVENANCE_COLLECTION);
      await col.insertOne({
        _id: provenanceDoc.runId,
        ...provenanceDoc
      });
      return provenanceDoc;
    },
    async finalizeRunProvenance(runId, fields) {
      assertModelsBoundToConnection(mongoose, models);
      const col = mongoose.connection.collection(PROVENANCE_COLLECTION);
      await col.updateOne({ _id: runId }, { $set: fields });
    },
    async getRunProvenance(runId) {
      assertModelsBoundToConnection(mongoose, models);
      const col = mongoose.connection.collection(PROVENANCE_COLLECTION);
      return col.findOne({ _id: runId });
    }
  };
}

/**
 * Analyzes flat collections against existing DB docs:
 *  - Detects duplicates (>1 matching docs on primary or secondary key)
 *  - Detects cross-key collisions (primary doc != secondary doc)
 *  - Detects content divergence between canonical item and existing DB doc
 */
function auditFlatCollection({
  collectionName,
  Model,
  items,
  existingDocs,
  getPrimaryKey,
  getSecondaryKeys = () => [],
  extraExcludeKeys = [],
  fkField = null,
  resolveExpectedFk = null
}) {
  const conflicts = [];
  const plan = []; // { action: 'insert' | 'unchanged' | 'repair_link', item, existingDoc? }
  const matchedIds = new Set();

  for (const item of items) {
    const pKey = getPrimaryKey(item);
    const primaryMatches = existingDocs.filter((d) => d[pKey.field] === pKey.value);

    if (primaryMatches.length > 1) {
      conflicts.push({
        collection: collectionName,
        type: 'DUPLICATE_PRIMARY_KEY',
        key: `${pKey.field}=${pKey.value}`,
        count: primaryMatches.length
      });
      continue;
    }

    const secKeys = getSecondaryKeys(item).filter(
      (sKey) => sKey && sKey.value !== null && sKey.value !== undefined && sKey.value !== ''
    );
    let hasSecondaryIssue = false;

    for (const sKey of secKeys) {
      const secMatches = existingDocs.filter((d) => d[sKey.field] === sKey.value);
      if (secMatches.length > 1) {
        conflicts.push({
          collection: collectionName,
          type: 'DUPLICATE_SECONDARY_KEY',
          key: `${sKey.field}=${sKey.value}`,
          count: secMatches.length
        });
        hasSecondaryIssue = true;
        break;
      }
      if (secMatches.length === 1) {
        const pId = primaryMatches[0]?._id?.toString();
        const sId = secMatches[0]?._id?.toString();
        if (!pId || pId !== sId) {
          conflicts.push({
            collection: collectionName,
            type: 'CROSS_KEY_COLLISION',
            key: `${pKey.field}=${pKey.value} conflicts with ${sKey.field}=${sKey.value}`,
            existingId: sId
          });
          hasSecondaryIssue = true;
          break;
        }
      }
    }

    if (hasSecondaryIssue) continue;

    if (primaryMatches.length === 0) {
      plan.push({ action: 'insert', item });
    } else {
      const existingDoc = primaryMatches[0];
      matchedIds.add(existingDoc._id.toString());

      const exclude = fkField ? [...extraExcludeKeys, fkField] : extraExcludeKeys;
      const canonNorm = materializeCanonical(Model, item, exclude);
      const dbNorm = normalizeExistingDoc(Model, existingDoc, exclude);

      if (!deepEqual(canonNorm, dbNorm)) {
        conflicts.push({
          collection: collectionName,
          type: 'CONTENT_CONFLICT',
          key: `${pKey.field}=${pKey.value}`,
          existingId: existingDoc._id.toString(),
          reason: 'Existing record content differs from canonical baseline'
        });
        continue;
      }

      if (fkField && resolveExpectedFk) {
        const currentFk = existingDoc[fkField] ? existingDoc[fkField].toString() : null;
        const expectedFk = resolveExpectedFk(item);
        if (currentFk && expectedFk && currentFk !== expectedFk.toString()) {
          conflicts.push({
            collection: collectionName,
            type: 'FOREIGN_KEY_CONFLICT',
            key: `${pKey.field}=${pKey.value}`,
            reason: `${fkField} points to ${currentFk}, expected ${expectedFk}`
          });
          continue;
        }
        if (!currentFk) {
          plan.push({ action: 'repair_link', item, existingDoc });
          continue;
        }
      }

      plan.push({ action: 'unchanged', item, existingDoc });
    }
  }

  const preservedUnrelated = existingDocs.filter((d) => !matchedIds.has(d._id.toString())).length;
  return { plan, conflicts, preservedUnrelated };
}

/**
 * Executes complete pre-flight audit and (unless dryRun=true) applies non-destructive,
 * dependency-ordered initialization against the target store.
 */
async function runStagingInitialization({
  catalog,
  store,
  dryRun = true,
  runId = null,
  targetDatabase = 'cyber_law_staging',
  targetHost = '',
  onBeforeMutation = null
}) {
  const activeRunId = runId || `staging_init_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const beforeCounts = await store.countAllCollections();

  // Fetch current Class A collections in read-only mode
  const existingData = {};
  for (const name of CLASS_A_NAMES) {
    existingData[name] = await store.findAll(name);
  }

  const allConflicts = [];
  const collectionPlans = {};
  const resolvedSourceIdsByKey = new Map(); // sourceKey -> _id string (when existing)
  const resolvedQuizIdsByCategory = new Map(); // category -> _id string (when existing)

  // --- Audit 1: LegalSource ---
  const sourceAudit = auditFlatCollection({
    collectionName: 'LegalSource',
    Model: LegalSource,
    items: catalog.legalSources.map((s) => ({ ...s.doc, _sourceKey: s.key })),
    existingDocs: existingData.LegalSource,
    getPrimaryKey: (s) => ({ field: 'title', value: s.title })
  });
  collectionPlans.LegalSource = sourceAudit;
  allConflicts.push(...sourceAudit.conflicts);
  for (const step of sourceAudit.plan) {
    if (step.existingDoc) {
      resolvedSourceIdsByKey.set(step.item._sourceKey, step.existingDoc._id.toString());
    }
  }

  // --- Audit 2: LawSection ---
  const lawAudit = auditFlatCollection({
    collectionName: 'LawSection',
    Model: LawSection,
    items: catalog.lawSections,
    existingDocs: existingData.LawSection,
    getPrimaryKey: (l) => ({ field: 'sectionNumber', value: l.sectionNumber }),
    getSecondaryKeys: (l) => (l.slug ? [{ field: 'slug', value: l.slug }] : []),
    fkField: 'officialSourceId',
    resolveExpectedFk: (l) => (l._officialSourceKey ? resolvedSourceIdsByKey.get(l._officialSourceKey) || null : null)
  });
  collectionPlans.LawSection = lawAudit;
  allConflicts.push(...lawAudit.conflicts);

  // --- Audit 3: CyberCrime ---
  const crimeAudit = auditFlatCollection({
    collectionName: 'CyberCrime',
    Model: CyberCrime,
    items: catalog.cyberCrimes,
    existingDocs: existingData.CyberCrime,
    getPrimaryKey: (c) => ({ field: 'slug', value: c.slug }),
    getSecondaryKeys: (c) => [{ field: 'title', value: c.title }]
  });
  collectionPlans.CyberCrime = crimeAudit;
  allConflicts.push(...crimeAudit.conflicts);

  // --- Audit 4: CaseStudy ---
  const caseAudit = auditFlatCollection({
    collectionName: 'CaseStudy',
    Model: CaseStudy,
    items: catalog.caseStudies,
    existingDocs: existingData.CaseStudy,
    getPrimaryKey: (c) => ({ field: 'slug', value: c.slug }),
    getSecondaryKeys: (c) => [{ field: 'caseNumber', value: c.caseNumber }]
  });
  collectionPlans.CaseStudy = caseAudit;
  allConflicts.push(...caseAudit.conflicts);

  // --- Audit 5: Quiz ---
  const quizAudit = auditFlatCollection({
    collectionName: 'Quiz',
    Model: Quiz,
    items: catalog.quizzes,
    existingDocs: existingData.Quiz,
    getPrimaryKey: (q) => ({ field: 'title', value: q.title }),
    getSecondaryKeys: (q) => [{ field: 'category', value: q.category }]
  });
  collectionPlans.Quiz = quizAudit;
  allConflicts.push(...quizAudit.conflicts);
  for (const step of quizAudit.plan) {
    if (step.existingDoc) {
      resolvedQuizIdsByCategory.set(step.item.category, step.existingDoc._id.toString());
    }
  }

  // --- Audit 6: QuizQuestion ---
  const questionAudit = auditFlatCollection({
    collectionName: 'QuizQuestion',
    Model: QuizQuestion,
    items: catalog.quizQuestions,
    existingDocs: existingData.QuizQuestion,
    getPrimaryKey: (q) => (
      q._matchStrategy === 'questionId'
        ? { field: 'questionId', value: q.questionId }
        : { field: 'questionText', value: q.questionText }
    ),
    getSecondaryKeys: (q) => (
      q._matchStrategy === 'questionId'
        ? [{ field: 'questionText', value: q.questionText }]
        : [{ field: 'questionId', value: q.questionId }]
    ),
    fkField: 'quizId',
    resolveExpectedFk: (q) => resolvedQuizIdsByCategory.get(q._targetQuizCategory) || null
  });
  collectionPlans.QuizQuestion = questionAudit;
  allConflicts.push(...questionAudit.conflicts);

  // --- Audit 7: LearningModule ---
  const moduleAudit = auditFlatCollection({
    collectionName: 'LearningModule',
    Model: LearningModule,
    items: catalog.learningModules,
    existingDocs: existingData.LearningModule,
    getPrimaryKey: (m) => ({ field: 'slug', value: m.slug }),
    getSecondaryKeys: (m) => [{ field: 'order', value: m.order }]
  });
  collectionPlans.LearningModule = moduleAudit;
  allConflicts.push(...moduleAudit.conflicts);

  // --- Audit 8: Resource ---
  const resourceAudit = auditFlatCollection({
    collectionName: 'Resource',
    Model: Resource,
    items: catalog.resources,
    existingDocs: existingData.Resource,
    getPrimaryKey: (r) => ({ field: 'title', value: r.title })
  });
  collectionPlans.Resource = resourceAudit;
  allConflicts.push(...resourceAudit.conflicts);

  // --- Audit 9-11: Scenario -> ScenarioStage -> ScenarioDecision Graph ---
  const scenarioPlan = [];
  const stagePlan = [];
  const decisionPlan = [];
  const matchedScenarioIds = new Set();
  const matchedStageIds = new Set();
  const matchedDecisionIds = new Set();

  for (const entry of catalog.scenarios) {
    const s = entry.scenario;
    const sMatches = existingData.Scenario.filter(
      (d) => d.slug === s.slug && Number(d.version) === Number(s.version)
    );
    if (sMatches.length > 1) {
      allConflicts.push({
        collection: 'Scenario',
        type: 'DUPLICATE_PRIMARY_KEY',
        key: `${s.slug}@v${s.version}`,
        count: sMatches.length
      });
      continue;
    }

    let existingScenario = null;
    if (sMatches.length === 0) {
      scenarioPlan.push({ action: 'insert', item: s, entry });
    } else {
      existingScenario = sMatches[0];
      matchedScenarioIds.add(existingScenario._id.toString());
      const canonS = materializeCanonical(Scenario, s);
      const dbS = normalizeExistingDoc(Scenario, existingScenario);
      if (!deepEqual(canonS, dbS)) {
        allConflicts.push({
          collection: 'Scenario',
          type: 'CONTENT_CONFLICT',
          key: `${s.slug}@v${s.version}`,
          existingId: existingScenario._id.toString()
        });
        continue;
      }
      scenarioPlan.push({ action: 'unchanged', item: s, existingDoc: existingScenario, entry });
    }

    const stagesForScenario = existingScenario
      ? existingData.ScenarioStage.filter((st) => st.scenarioId?.toString() === existingScenario._id.toString())
      : [];

    const existingStageIdByOrder = new Map(
      stagesForScenario.map((st) => [Number(st.stageOrder), st._id.toString()])
    );
    for (const stg of entry.stages) {
      const stMatches = stagesForScenario.filter((d) => Number(d.stageOrder) === Number(stg.stageOrder));
      if (stMatches.length > 1) {
        allConflicts.push({
          collection: 'ScenarioStage',
          type: 'DUPLICATE_PRIMARY_KEY',
          key: `${s.slug}@v${s.version}#${stg.stageOrder}`,
          count: stMatches.length
        });
        continue;
      }

      let existingStage = null;
      let currentStageStep = null;
      if (stMatches.length === 0) {
        currentStageStep = {
          action: 'insert',
          scenarioKey: `${s.slug}@v${s.version}`,
          item: stg,
          scenarioEntry: s
        };
        stagePlan.push(currentStageStep);
      } else {
        existingStage = stMatches[0];
        matchedStageIds.add(existingStage._id.toString());

        const canonStg = materializeCanonical(ScenarioStage, {
          ...stg,
          scenarioId: existingScenario._id
        }, ['scenarioId', 'availableDecisionIds']);
        const dbStg = normalizeExistingDoc(ScenarioStage, existingStage, ['scenarioId', 'availableDecisionIds']);

        if (!deepEqual(canonStg, dbStg)) {
          allConflicts.push({
            collection: 'ScenarioStage',
            type: 'CONTENT_CONFLICT',
            key: `${s.slug}@v${s.version}#${stg.stageOrder}`,
            existingId: existingStage._id.toString()
          });
          continue;
        }
        currentStageStep = {
          action: 'unchanged',
          scenarioKey: `${s.slug}@v${s.version}`,
          item: stg,
          existingDoc: existingStage
        };
        stagePlan.push(currentStageStep);
      }

      const decisionsForStage = existingStage
        ? existingData.ScenarioDecision.filter((dec) => dec.stageId?.toString() === existingStage._id.toString())
        : [];

      const expectedDecIds = [];
      for (const dec of stg.decisions) {
        const dMatches = decisionsForStage.filter((d) => d.optionText === dec.optionText);
        if (dMatches.length > 1) {
          allConflicts.push({
            collection: 'ScenarioDecision',
            type: 'DUPLICATE_PRIMARY_KEY',
            key: `${s.slug}@v${s.version}#${stg.stageOrder}:${dec.optionText.slice(0, 30)}`,
            count: dMatches.length
          });
          continue;
        }

        if (dMatches.length === 0) {
          decisionPlan.push({
            action: 'insert',
            scenarioKey: `${s.slug}@v${s.version}`,
            stageOrder: stg.stageOrder,
            item: dec
          });
        } else {
          const existingDec = dMatches[0];
          matchedDecisionIds.add(existingDec._id.toString());
          expectedDecIds.push(existingDec._id.toString());

          const canonDec = materializeCanonical(ScenarioDecision, {
            ...dec,
            stageId: existingStage._id
          }, ['stageId', 'nextStageId']);
          const dbDec = normalizeExistingDoc(ScenarioDecision, existingDec, ['stageId', 'nextStageId']);

          if (!deepEqual(canonDec, dbDec)) {
            allConflicts.push({
              collection: 'ScenarioDecision',
              type: 'CONTENT_CONFLICT',
              key: `${s.slug}@v${s.version}#${stg.stageOrder}:${dec.optionText.slice(0, 30)}`,
              existingId: existingDec._id.toString()
            });
            continue;
          }

          const expectedNextId = dec.nextStageOrder !== null && dec.nextStageOrder !== undefined
            ? existingStageIdByOrder.get(Number(dec.nextStageOrder)) || null
            : null;
          const actualNextId = existingDec.nextStageId ? existingDec.nextStageId.toString() : null;

          if (dec.nextStageOrder !== null && actualNextId && expectedNextId && actualNextId !== expectedNextId) {
            allConflicts.push({
              collection: 'ScenarioDecision',
              type: 'FOREIGN_KEY_CONFLICT',
              key: `${s.slug}@v${s.version}#${stg.stageOrder}:${dec.optionText.slice(0, 30)}`,
              reason: `nextStageId points to ${actualNextId}, expected ${expectedNextId}`
            });
            continue;
          }

          const needsNextLink = dec.nextStageOrder !== null && !actualNextId;
          decisionPlan.push({
            action: needsNextLink ? 'repair_link' : 'unchanged',
            scenarioKey: `${s.slug}@v${s.version}`,
            stageOrder: stg.stageOrder,
            item: dec,
            existingDoc: existingDec
          });
        }
      }

      if (existingStage && currentStageStep && currentStageStep.action === 'unchanged') {
        const currentAvail = (existingStage.availableDecisionIds || []).map((id) => id.toString());
        if (expectedDecIds.length !== stg.decisions.length || JSON.stringify(currentAvail) !== JSON.stringify(expectedDecIds)) {
          currentStageStep.action = 'repair_link';
        }
      }
    }
  }

  collectionPlans.Scenario = {
    plan: scenarioPlan,
    conflicts: allConflicts.filter((c) => c.collection === 'Scenario'),
    preservedUnrelated: existingData.Scenario.filter((d) => !matchedScenarioIds.has(d._id.toString())).length
  };
  collectionPlans.ScenarioStage = {
    plan: stagePlan,
    conflicts: allConflicts.filter((c) => c.collection === 'ScenarioStage'),
    preservedUnrelated: existingData.ScenarioStage.filter((d) => !matchedStageIds.has(d._id.toString())).length
  };
  collectionPlans.ScenarioDecision = {
    plan: decisionPlan,
    conflicts: allConflicts.filter((c) => c.collection === 'ScenarioDecision'),
    preservedUnrelated: existingData.ScenarioDecision.filter((d) => !matchedDecisionIds.has(d._id.toString())).length
  };

  // Build readable per-collection plan summary
  const summary = {};
  for (const name of CLASS_A_NAMES) {
    const cp = collectionPlans[name];
    const inserts = cp.plan.filter((p) => p.action === 'insert').length;
    const unchanged = cp.plan.filter((p) => p.action === 'unchanged').length;
    const repairs = cp.plan.filter((p) => p.action === 'repair_link').length;
    summary[name] = {
      before: beforeCounts[name] ?? 0,
      toInsert: inserts,
      alreadyCanonical: unchanged,
      toRepairLinks: repairs,
      preservedUnrelated: cp.preservedUnrelated,
      plannedAfter: (beforeCounts[name] ?? 0) + inserts
    };
  }

  // Fail closed BEFORE any write if ANY conflict or duplicate was detected
  if (allConflicts.length > 0) {
    return {
      status: 'ABORTED_CONFLICTS',
      runId: activeRunId,
      dryRun,
      beforeCounts,
      afterCounts: beforeCounts,
      conflicts: allConflicts,
      summary,
      insertedIds: {}
    };
  }

  if (dryRun) {
    return {
      status: 'DRY_RUN_READY',
      runId: activeRunId,
      dryRun: true,
      beforeCounts,
      afterCounts: Object.fromEntries(
        Object.entries(beforeCounts).map(([k, v]) => [k, summary[k] ? summary[k].plannedAfter : v])
      ),
      conflicts: [],
      summary,
      insertedIds: {}
    };
  }

  // --- LIVE EXECUTION (Non-Destructive, Topological Order) ---
  // Pre-allocate deterministic _ids and persist durable recovery manifest + DB provenance BEFORE any Class A mutation.
  const plannedIds = Object.fromEntries(CLASS_A_NAMES.map((n) => [n, []]));
  const provenanceEntries = [];
  const allocateId = (colName) => {
    const id = new mongoose.Types.ObjectId();
    const idStr = id.toString();
    plannedIds[colName].push(idStr);
    provenanceEntries.push({ collection: colName, docId: idStr });
    return id;
  };

  for (const colName of ['LegalSource', 'LawSection', 'CyberCrime', 'CaseStudy', 'Quiz', 'QuizQuestion', 'LearningModule', 'Resource']) {
    for (const step of collectionPlans[colName].plan) {
      if (step.action === 'insert') {
        step._plannedId = allocateId(colName);
      }
    }
  }
  for (const sStep of scenarioPlan) {
    if (sStep.action === 'insert') sStep._plannedId = allocateId('Scenario');
  }
  for (const stStep of stagePlan) {
    if (stStep.action === 'insert') stStep._plannedId = allocateId('ScenarioStage');
  }
  for (const dStep of decisionPlan) {
    if (dStep.action === 'insert') dStep._plannedId = allocateId('ScenarioDecision');
  }

  if (typeof onBeforeMutation === 'function') {
    await onBeforeMutation({
      runId: activeRunId,
      targetDatabase,
      targetHost,
      beforeCounts,
      insertedIds: plannedIds,
      entries: provenanceEntries
    });
  }

  if (typeof store.createRunProvenance === 'function') {
    await store.createRunProvenance({
      runId: activeRunId,
      targetDatabase,
      targetHost,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      entries: provenanceEntries
    });
  }

  const insertedIds = Object.fromEntries(CLASS_A_NAMES.map((n) => [n, []]));
  const repairedIds = Object.fromEntries(CLASS_A_NAMES.map((n) => [n, []]));

  // Helper to strip loader metadata
  const stripMeta = (obj) => {
    const out = { ...obj };
    for (const k of Object.keys(out)) {
      if (k.startsWith('_')) delete out[k];
    }
    return out;
  };

  // 1. LegalSource
  for (const step of collectionPlans.LegalSource.plan) {
    if (step.action === 'insert') {
      const created = await store.createOne('LegalSource', { ...stripMeta(step.item), _id: step._plannedId });
      insertedIds.LegalSource.push(created._id.toString());
      resolvedSourceIdsByKey.set(step.item._sourceKey, created._id.toString());
    }
  }

  // 2. LawSection
  for (const step of collectionPlans.LawSection.plan) {
    const resolvedSourceId = step.item._officialSourceKey
      ? resolvedSourceIdsByKey.get(step.item._officialSourceKey) || null
      : null;
    if (step.action === 'insert') {
      const payload = { ...stripMeta(step.item), _id: step._plannedId };
      if (resolvedSourceId) payload.officialSourceId = resolvedSourceId;
      const created = await store.createOne('LawSection', payload);
      insertedIds.LawSection.push(created._id.toString());
    } else if (step.action === 'repair_link' && resolvedSourceId) {
      await store.updateOneById('LawSection', step.existingDoc._id, { officialSourceId: resolvedSourceId });
      repairedIds.LawSection.push(step.existingDoc._id.toString());
    }
  }

  // 3. CyberCrime
  for (const step of collectionPlans.CyberCrime.plan) {
    if (step.action === 'insert') {
      const created = await store.createOne('CyberCrime', { ...stripMeta(step.item), _id: step._plannedId });
      insertedIds.CyberCrime.push(created._id.toString());
    }
  }

  // 4. CaseStudy
  for (const step of collectionPlans.CaseStudy.plan) {
    if (step.action === 'insert') {
      const payload = { ...stripMeta(step.item), _id: step._plannedId };
      if (payload.collection === 'Cases Where Justice Fell Short') {
        payload.seedBatchId = activeRunId;
      }
      const created = await store.createOne('CaseStudy', payload);
      insertedIds.CaseStudy.push(created._id.toString());
    }
  }

  // 5. Quiz
  for (const step of collectionPlans.Quiz.plan) {
    if (step.action === 'insert') {
      const created = await store.createOne('Quiz', { ...stripMeta(step.item), _id: step._plannedId });
      insertedIds.Quiz.push(created._id.toString());
      resolvedQuizIdsByCategory.set(step.item.category, created._id.toString());
    }
  }

  // 6. QuizQuestion
  for (const step of collectionPlans.QuizQuestion.plan) {
    const resolvedQuizId = resolvedQuizIdsByCategory.get(step.item._targetQuizCategory);
    if (!resolvedQuizId) {
      throw new Error(`Unable to resolve quizId for category "${step.item._targetQuizCategory}"`);
    }
    if (step.action === 'insert') {
      const payload = { ...stripMeta(step.item), _id: step._plannedId, quizId: resolvedQuizId };
      const created = await store.createOne('QuizQuestion', payload);
      insertedIds.QuizQuestion.push(created._id.toString());
    } else if (step.action === 'repair_link') {
      await store.updateOneById('QuizQuestion', step.existingDoc._id, { quizId: resolvedQuizId });
      repairedIds.QuizQuestion.push(step.existingDoc._id.toString());
    }
  }

  // 7. LearningModule
  for (const step of collectionPlans.LearningModule.plan) {
    if (step.action === 'insert') {
      const created = await store.createOne('LearningModule', { ...stripMeta(step.item), _id: step._plannedId });
      insertedIds.LearningModule.push(created._id.toString());
    }
  }

  // 8. Resource
  for (const step of collectionPlans.Resource.plan) {
    if (step.action === 'insert') {
      const created = await store.createOne('Resource', { ...stripMeta(step.item), _id: step._plannedId });
      insertedIds.Resource.push(created._id.toString());
    }
  }

  // 9-11. Scenario -> ScenarioStage -> ScenarioDecision Graph
  for (const sStep of scenarioPlan) {
    const sKey = `${sStep.item.slug}@v${sStep.item.version}`;
    let scenarioDoc = sStep.existingDoc;
    if (sStep.action === 'insert') {
      scenarioDoc = await store.createOne('Scenario', { ...stripMeta(sStep.item), _id: sStep._plannedId });
      insertedIds.Scenario.push(scenarioDoc._id.toString());
    }

    const stageDocsByOrder = new Map();
    const myStageSteps = stagePlan.filter((st) => st.scenarioKey === sKey);

    for (const stStep of myStageSteps) {
      let stageDoc = stStep.existingDoc;
      if (stStep.action === 'insert') {
        const stPayload = {
          _id: stStep._plannedId,
          scenarioId: scenarioDoc._id,
          stageOrder: stStep.item.stageOrder,
          title: stStep.item.title,
          description: stStep.item.description,
          mockInterfaceType: stStep.item.mockInterfaceType,
          mockInterfaceData: stStep.item.mockInterfaceData,
          eventClassification: stStep.item.eventClassification,
          measurementFocus: stStep.item.measurementFocus,
          targetSignals: stStep.item.targetSignals,
          hasSignalProbe: stStep.item.hasSignalProbe,
          signalProbes: stStep.item.signalProbes,
          terminal: stStep.item.terminal
        };
        stageDoc = await store.createOne('ScenarioStage', stPayload);
        insertedIds.ScenarioStage.push(stageDoc._id.toString());
      }
      stageDocsByOrder.set(stStep.item.stageOrder, stageDoc);
    }

    // Now persist & link decisions per stage
    for (const stStep of myStageSteps) {
      const stageDoc = stageDocsByOrder.get(stStep.item.stageOrder);
      const myDecSteps = decisionPlan.filter(
        (d) => d.scenarioKey === sKey && d.stageOrder === stStep.item.stageOrder
      );
      const decisionIds = [];

      for (const dStep of myDecSteps) {
        const nextStageDoc = dStep.item.nextStageOrder !== null && dStep.item.nextStageOrder !== undefined
          ? stageDocsByOrder.get(dStep.item.nextStageOrder)
          : null;
        const resolvedNextStageId = nextStageDoc ? nextStageDoc._id : null;

        if (dStep.action === 'insert') {
          const decPayload = {
            _id: dStep._plannedId,
            stageId: stageDoc._id,
            optionText: dStep.item.optionText,
            scoreChange: dStep.item.scoreChange,
            categoryScoreWeights: dStep.item.categoryScoreWeights,
            identifiedSignals: dStep.item.identifiedSignals,
            behaviorEffects: dStep.item.behaviorEffects,
            riskLevel: dStep.item.riskLevel,
            isCriticalMistake: dStep.item.isCriticalMistake,
            nextStageId: resolvedNextStageId,
            explanation: dStep.item.explanation,
            outcomeType: dStep.item.outcomeType
          };
          const createdDec = await store.createOne('ScenarioDecision', decPayload);
          insertedIds.ScenarioDecision.push(createdDec._id.toString());
          decisionIds.push(createdDec._id);
        } else {
          if (dStep.action === 'repair_link' && resolvedNextStageId) {
            await store.updateOneById('ScenarioDecision', dStep.existingDoc._id, {
              nextStageId: resolvedNextStageId
            });
            repairedIds.ScenarioDecision.push(dStep.existingDoc._id.toString());
          }
          decisionIds.push(dStep.existingDoc._id);
        }
      }

      const existingAvail = (stageDoc.availableDecisionIds || []).map((id) => id.toString());
      const desiredAvail = decisionIds.map((id) => id.toString());
      if (JSON.stringify(existingAvail) !== JSON.stringify(desiredAvail)) {
        await store.updateOneById('ScenarioStage', stageDoc._id, { availableDecisionIds: decisionIds });
        repairedIds.ScenarioStage.push(stageDoc._id.toString());
      }
    }
  }

  const afterCounts = await store.countAllCollections();

  // Verify Class B/C/D boundary invariance
  for (const pName of PROTECTED_CLASS_NAMES) {
    if (beforeCounts[pName] !== afterCounts[pName]) {
      throw new Error(
        `[DATA BOUNDARY VIOLATION] Protected collection "${pName}" changed count (${beforeCounts[pName]} -> ${afterCounts[pName]})`
      );
    }
  }

  if (typeof store.finalizeRunProvenance === 'function') {
    await store.finalizeRunProvenance(activeRunId, {
      status: 'INITIALIZATION_SUCCEEDED',
      completedAt: new Date().toISOString()
    });
  }

  return {
    status: 'INITIALIZATION_SUCCEEDED',
    runId: activeRunId,
    dryRun: false,
    beforeCounts,
    afterCounts,
    conflicts: [],
    summary,
    insertedIds,
    repairedIds
  };
}

module.exports = {
  mongoose,
  ALL_MODELS,
  CLASS_A_NAMES,
  PROTECTED_CLASS_NAMES,
  PROVENANCE_COLLECTION,
  assertModelsBoundToConnection,
  normalizeForCompare,
  materializeCanonical,
  normalizeExistingDoc,
  auditFlatCollection,
  createMongooseStore,
  runStagingInitialization
};
