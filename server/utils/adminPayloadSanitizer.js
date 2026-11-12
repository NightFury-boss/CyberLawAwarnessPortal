/**
 * Admin Payload Allowlist & Mass-Assignment Protection Utility
 *
 * Enforces explicit field allowlists, strict primitive/array/ObjectId type validation,
 * prototype-pollution / Mongo-operator key rejection, and immutable identifier
 * protection across all administrative content create/update endpoints.
 */

const mongoose = require('mongoose');

const GLOBAL_PROTECTED_FIELDS = new Set([
  'userId',
  'ownerId',
  'adminId',
  'authorId',
  'createdBy',
  'updatedBy',
  'role',
  'isActive',
  'isAdmin',
  'passwordHash',
  'status',
  'approved',
  'isVerified',
  'attemptsWithQuestion',
  'attemptCount'
]);

// Benign serialized document metadata that UI edit forms echo verbatim on PUT
const BENIGN_SERIALIZED_METADATA = new Set([
  '__v',
  'createdAt',
  'updatedAt',
  'lastReviewed'
]);

const INACTIVE_HISTORICAL_LAW_STATUSES = new Set([
  'OMITTED',
  'REPEALED',
  'HISTORICAL'
]);

function isSection66AReference(sectionNumber) {
  if (typeof sectionNumber !== 'string') return false;
  return /^(?:(?:section|sec\.?)\s*)?66\s*-?\s*a\b/i.test(sectionNumber.trim()) ||
    /\bsection\s*66\s*-?\s*a\b/i.test(sectionNumber);
}

function createValidationError(message, code = 'INVALID_ADMIN_PAYLOAD') {
  const err = new Error(message);
  err.status = 400;
  err.code = code;
  return err;
}

/**
 * Strictly parses booleans from native booleans or `'true'` / `'false'` strings.
 */
function parseStrictBoolean(rawValue, fieldName = 'boolean') {
  if (typeof rawValue === 'boolean') return rawValue;
  if (typeof rawValue === 'string') {
    const normalized = rawValue.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  throw createValidationError(`Field "${fieldName}" must be a boolean.`);
}

/**
 * Strips ASCII control characters and strictly permits HTTP, HTTPS, or single-leading-slash relative paths.
 */
function validateSafeUrl(rawValue, { fieldName = 'url', allowEmpty = false } = {}) {
  if (typeof rawValue !== 'string') {
    throw createValidationError(`Field "${fieldName}" must be a valid URL string.`);
  }

  // eslint-disable-next-line no-control-regex
  const cleaned = rawValue.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!cleaned) {
    if (allowEmpty) return '';
    throw createValidationError(`Field "${fieldName}" must be a non-empty URL string.`);
  }

  if (cleaned.startsWith('/')) {
    if (cleaned.startsWith('//') || cleaned.startsWith('/\\') || /[\s\\]/.test(cleaned)) {
      throw createValidationError(`Field "${fieldName}" uses a disallowed relative or protocol-relative URL.`);
    }
    try {
      const parsedRel = new URL(cleaned, 'https://portal.invalid');
      if (parsedRel.origin !== 'https://portal.invalid' || !parsedRel.pathname.startsWith('/')) {
        throw createValidationError(`Field "${fieldName}" is not a valid relative URL path.`);
      }
    } catch (err) {
      if (err.status === 400) throw err;
      throw createValidationError(`Field "${fieldName}" is not a valid relative URL path.`);
    }
    return cleaned;
  }

  if (/\s/.test(cleaned)) {
    throw createValidationError(`Field "${fieldName}" must not contain whitespace.`);
  }

  let parsed;
  try {
    parsed = new URL(cleaned);
  } catch (_e) {
    throw createValidationError(`Field "${fieldName}" must be a valid HTTP/HTTPS URL or relative path.`);
  }

  if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !parsed.hostname) {
    throw createValidationError(`Field "${fieldName}" uses an unsafe or unsupported URL scheme.`);
  }

  return cleaned;
}

/**
 * Recursively detects MongoDB $-prefixed operators and prototype pollution keys.
 */
function assertNoOperatorOrPrototypePollution(value, seen = new Set()) {
  if (value === null || value === undefined || typeof value !== 'object') {
    return;
  }
  if (seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      assertNoOperatorOrPrototypePollution(item, seen);
    }
    return;
  }

  for (const key of Object.getOwnPropertyNames(value)) {
    if (key.startsWith('$') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw createValidationError(`Unsafe or disallowed payload key "${key}".`, 'UNSAFE_PAYLOAD_KEY');
    }
    assertNoOperatorOrPrototypePollution(value[key], seen);
  }
}

function normalizeComparable(val) {
  if (val === undefined || val === null) return '';
  return String(val).trim().toLowerCase();
}

function validateAndCoerceField(fieldName, rawValue, typeSpec) {
  if (rawValue === undefined) return undefined;

  switch (typeSpec) {
    case 'string': {
      if (rawValue === null) return '';
      if (typeof rawValue !== 'string') {
        throw createValidationError(`Field "${fieldName}" must be a text string.`);
      }
      return rawValue;
    }

    case 'trimmedString': {
      if (typeof rawValue !== 'string') {
        throw createValidationError(`Field "${fieldName}" must be a text string.`);
      }
      return rawValue.trim();
    }

    case 'trimmedStringOrNull': {
      if (rawValue === null) return null;
      if (typeof rawValue !== 'string') {
        throw createValidationError(`Field "${fieldName}" must be a string or null.`);
      }
      return rawValue.trim();
    }

    case 'boolean': {
      return parseStrictBoolean(rawValue, fieldName);
    }

    case 'number': {
      if (typeof rawValue === 'number' && Number.isFinite(rawValue)) return rawValue;
      if (typeof rawValue === 'string' && rawValue.trim() !== '') {
        const parsed = Number(rawValue);
        if (Number.isFinite(parsed)) return parsed;
      }
      throw createValidationError(`Field "${fieldName}" must be a valid finite number.`);
    }

    case 'stringArray': {
      if (!Array.isArray(rawValue)) {
        throw createValidationError(`Field "${fieldName}" must be an array of strings.`);
      }
      return rawValue.map((item) => {
        if (typeof item !== 'string') {
          throw createValidationError(`All elements in "${fieldName}" must be text strings.`);
        }
        return item.trim();
      });
    }

    case 'array': {
      if (!Array.isArray(rawValue)) {
        throw createValidationError(`Field "${fieldName}" must be an array.`);
      }
      return rawValue;
    }

    case 'object': {
      if (rawValue === null) return null;
      if (typeof rawValue !== 'object' || Array.isArray(rawValue)) {
        throw createValidationError(`Field "${fieldName}" must be a plain object.`);
      }
      return rawValue;
    }

    case 'objectId': {
      let idVal = rawValue;
      if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue) && rawValue._id !== undefined) {
        idVal = rawValue._id;
      }
      if (idVal === null || idVal === '') return null;
      const idStr = String(idVal).trim();
      if (!mongoose.Types.ObjectId.isValid(idStr)) {
        throw createValidationError(`Field "${fieldName}" must be a valid ObjectId.`);
      }
      return idStr;
    }

    case 'safeUrl': {
      return validateSafeUrl(rawValue, { fieldName, allowEmpty: false });
    }

    case 'caseSources': {
      if (!Array.isArray(rawValue)) {
        throw createValidationError(`Field "${fieldName}" must be an array.`);
      }
      return rawValue.map((src, idx) => {
        if (!src || typeof src !== 'object' || Array.isArray(src)) {
          throw createValidationError(`Element ${idx} in "${fieldName}" must be a plain object.`);
        }
        const sanitizedSource = { ...src };
        if (Object.prototype.hasOwnProperty.call(src, 'url') && src.url !== undefined && src.url !== null) {
          sanitizedSource.url = validateSafeUrl(src.url, {
            fieldName: `${fieldName}[${idx}].url`,
            allowEmpty: true
          });
        }
        return sanitizedSource;
      });
    }

    default:
      throw createValidationError(`Unsupported validation schema type for "${fieldName}".`);
  }
}

const RESOURCE_SPECS = Object.freeze({
  law: {
    allowlist: {
      sectionNumber: 'trimmedString',
      slug: 'trimmedString',
      actName: 'trimmedString',
      officialTitle: 'trimmedString',
      role: 'trimmedString',
      plainLanguageExplanation: 'string',
      officialText: 'string',
      whyItMatters: 'string',
      exampleScenario: 'string',
      relatedCyberCrimes: 'stringArray',
      relatedCaseStudies: 'stringArray',
      relatedModules: 'stringArray',
      penaltyOrLegalEffect: 'string',
      legalStatus: 'trimmedString',
      commencementStatus: 'string',
      amendmentStatus: 'string',
      keywords: 'stringArray',
      officialSourceId: 'objectId'
    },
    immutableOnUpdate: ['slug'],
    forbiddenAlways: ['published'],
    forbiddenOnCreate: [],
    setServerLastReviewedOnUpdate: true
  },

  crime: {
    allowlist: {
      title: 'trimmedString',
      slug: 'trimmedString',
      category: 'trimmedString',
      shortDescription: 'string',
      whatIsIt: 'string',
      howItWorks: 'string',
      attackerObjective: 'stringArray',
      attackLifecycle: 'array',
      warningSigns: 'stringArray',
      attackerTactics: 'array',
      actionSteps: 'stringArray',
      avoidSteps: 'stringArray',
      ifTargetedSteps: 'stringArray',
      mythFacts: 'array',
      redFlagLevel: 'trimmedString',
      attackVectors: 'stringArray',
      legalContext: 'stringArray',
      relatedModules: 'stringArray',
      relatedCaseStudies: 'stringArray',
      relatedCrimes: 'stringArray',
      spotTheFlags: 'object',
      whatWouldYouDo: 'object',
      quickCheckQuestions: 'array',
      published: 'boolean',
      difficulty: 'string'
    },
    immutableOnUpdate: ['slug'],
    forbiddenOnCreate: []
  },

  case: {
    allowlist: {
      title: 'trimmedString',
      slug: 'trimmedString',
      caseNumber: 'trimmedString',
      caseType: 'trimmedString',
      incidentType: 'trimmedString',
      attackVector: 'trimmedString',
      shortDescription: 'string',
      incidentDate: 'string',
      publishedDate: 'string',
      difficulty: 'trimmedString',
      featured: 'boolean',
      officialCaseName: 'trimmedStringOrNull',
      collection: 'trimmedString',
      collectionCategory: 'trimmedString',
      evidentiaryClassification: 'trimmedString',
      seedBatchId: 'trimmedStringOrNull',
      sourceSummary: 'string',
      narrativeSections: 'array',
      timeline: 'array',
      decisionPoints: 'array',
      warningSigns: 'array',
      attackerObjectives: 'stringArray',
      impact: 'object',
      response: 'stringArray',
      preventionLessons: 'stringArray',
      legalContext: 'stringArray',
      relatedCrimes: 'stringArray',
      relatedModules: 'stringArray',
      sources: 'caseSources',
      published: 'boolean'
    },
    immutableOnUpdate: ['slug', 'caseNumber', 'seedBatchId'],
    forbiddenOnCreate: ['seedBatchId']
  },

  resource: {
    allowlist: {
      title: 'trimmedString',
      category: 'trimmedString',
      description: 'string',
      link: 'safeUrl',
      downloadable: 'boolean'
    },
    immutableOnUpdate: [],
    forbiddenAlways: ['published'],
    forbiddenOnCreate: ['published']
  },

  module: {
    allowlist: {
      title: 'trimmedString',
      slug: 'trimmedString',
      category: 'trimmedString',
      summary: 'string',
      content: 'string',
      difficulty: 'trimmedString',
      estimatedMinutes: 'number',
      order: 'number',
      icon: 'string',
      keyTakeaways: 'stringArray',
      sections: 'array',
      quickCheck: 'object',
      quickChecks: 'array',
      actionSteps: 'stringArray',
      relatedLawSections: 'stringArray',
      relatedCyberCrimes: 'stringArray',
      relatedScenarios: 'stringArray',
      relatedCaseStudies: 'stringArray',
      relatedResources: 'stringArray',
      published: 'boolean'
    },
    immutableOnUpdate: ['slug'],
    forbiddenOnCreate: []
  }
});

/**
 * Validates and builds an explicit allowlisted payload for admin create/update mutations.
 *
 * - Rejects Mongo operators ($...) and prototype pollution keys recursively.
 * - Rejects protected ownership/privilege/status fields.
 * - Rejects immutable identifier creation/modification while safely stripping unchanged
 *   UI clone values matching `existingDoc`.
 * - Ignores unknown fields so mass assignment into MongoDB is impossible.
 * - Rejects empty updates containing zero allowlisted fields.
 *
 * @param {string} resourceType - 'law' | 'crime' | 'case' | 'resource' | 'module'
 * @param {Object} rawBody - Express req.body
 * @param {Object} options - { mode: 'create' | 'update', existingDoc?: Object }
 * @returns {{ payload: Object, updateDoc: { $set: Object } }}
 */
function sanitizeAdminMutationPayload(resourceType, rawBody, { mode = 'update', existingDoc = null } = {}) {
  const spec = RESOURCE_SPECS[resourceType];
  if (!spec) {
    throw new Error(`Unknown admin resource specification "${resourceType}".`);
  }

  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    throw createValidationError('Request payload must be a JSON object.');
  }

  assertNoOperatorOrPrototypePollution(rawBody);

  const ownKeys = Object.getOwnPropertyNames(rawBody);

  // 1. Reject globally protected fields unless explicitly allowlisted for this resource type (e.g. LawSection.role)
  for (const key of ownKeys) {
    const isAllowlistedForResource = Object.prototype.hasOwnProperty.call(spec.allowlist, key);
    if (GLOBAL_PROTECTED_FIELDS.has(key) && !isAllowlistedForResource) {
      throw createValidationError(`Protected field "${key}" cannot be specified or modified.`, 'PROTECTED_FIELD_FORBIDDEN');
    }
    if (Array.isArray(spec.forbiddenAlways) && spec.forbiddenAlways.includes(key) && rawBody[key] !== undefined) {
      throw createValidationError(`Unauthorized field "${key}" is not supported on this resource.`, 'PROTECTED_FIELD_FORBIDDEN');
    }
    if (mode === 'create' && spec.forbiddenOnCreate.includes(key) && rawBody[key] !== undefined && rawBody[key] !== null) {
      throw createValidationError(`Protected field "${key}" cannot be supplied on creation.`, 'PROTECTED_FIELD_FORBIDDEN');
    }
  }

  // 2. Enforce _id / id protection
  for (const idField of ['_id', 'id']) {
    if (Object.prototype.hasOwnProperty.call(rawBody, idField) && rawBody[idField] !== undefined) {
      if (mode === 'create') {
        throw createValidationError(`Immutable identifier "${idField}" cannot be assigned on creation.`, 'IMMUTABLE_FIELD_FORBIDDEN');
      }
      if (existingDoc && String(rawBody[idField]) !== String(existingDoc._id)) {
        throw createValidationError(`Attempted modification of immutable identifier "${idField}".`, 'IMMUTABLE_FIELD_FORBIDDEN');
      }
    }
  }

  // 3. Enforce per-resource immutable identifier protection on update
  const immutableSet = new Set(spec.immutableOnUpdate || []);
  if (mode === 'update') {
    for (const immField of immutableSet) {
      if (Object.prototype.hasOwnProperty.call(rawBody, immField) && rawBody[immField] !== undefined) {
        const incomingNorm = normalizeComparable(rawBody[immField]);
        const existingNorm = normalizeComparable(existingDoc ? existingDoc[immField] : undefined);
        if (incomingNorm !== existingNorm) {
          throw createValidationError(
            `Attempted modification of immutable identifier "${immField}".`,
            'IMMUTABLE_FIELD_FORBIDDEN'
          );
        }
      }
    }
  }

  // 4. Build explicit allowlisted payload (unknown and benign metadata fields omitted)
  const payload = {};
  for (const [fieldName, typeSpec] of Object.entries(spec.allowlist)) {
    if (BENIGN_SERIALIZED_METADATA.has(fieldName)) continue;
    if (mode === 'update' && immutableSet.has(fieldName)) continue;
    if (!Object.prototype.hasOwnProperty.call(rawBody, fieldName)) continue;

    const value = rawBody[fieldName];
    if (value === undefined) continue;

    payload[fieldName] = validateAndCoerceField(fieldName, value, typeSpec);
  }

  if (mode === 'update') {
    if (Object.keys(payload).length === 0) {
      throw createValidationError('No valid updatable fields provided.', 'EMPTY_VALID_UPDATE');
    }
    if (spec.setServerLastReviewedOnUpdate) {
      payload.lastReviewed = new Date();
    }
  }

  if (resourceType === 'law') {
    const effectiveSectionNumber = payload.sectionNumber !== undefined
      ? payload.sectionNumber
      : (mode === 'update' ? existingDoc?.sectionNumber : undefined);
    const effectiveLegalStatus = payload.legalStatus !== undefined
      ? payload.legalStatus
      : (mode === 'update' && existingDoc?.legalStatus ? existingDoc.legalStatus : 'CURRENT');

    if (
      isSection66AReference(effectiveSectionNumber) &&
      !INACTIVE_HISTORICAL_LAW_STATUSES.has(String(effectiveLegalStatus).trim().toUpperCase())
    ) {
      throw createValidationError(
        'IT Act Section 66A was struck down in Shreya Singhal v. Union of India (2015) and cannot be stored with an active legalStatus; mark it OMITTED, REPEALED, or HISTORICAL.',
        'UNCONSTITUTIONAL_SECTION_66A'
      );
    }
  }

  return {
    payload,
    updateDoc: { $set: payload }
  };
}

/**
 * Guards quiz / quizQuestion endpoints against unsafe keys, protected fields,
 * and immutable identifier tampering without breaking existing quiz endpoints.
 */
function assertSafeQuizAdminPayload(rawBody, { mode = 'update', existingDoc = null, immutableFields = [] } = {}) {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    throw createValidationError('Request payload must be a JSON object.');
  }

  assertNoOperatorOrPrototypePollution(rawBody);

  for (const key of Object.getOwnPropertyNames(rawBody)) {
    if (GLOBAL_PROTECTED_FIELDS.has(key)) {
      throw createValidationError(`Protected field "${key}" cannot be specified or modified.`, 'PROTECTED_FIELD_FORBIDDEN');
    }
  }

  for (const idField of ['_id', 'id']) {
    if (Object.prototype.hasOwnProperty.call(rawBody, idField) && rawBody[idField] !== undefined) {
      if (mode === 'create') {
        throw createValidationError(`Immutable identifier "${idField}" cannot be assigned on creation.`, 'IMMUTABLE_FIELD_FORBIDDEN');
      }
      if (existingDoc && String(rawBody[idField]) !== String(existingDoc._id)) {
        throw createValidationError(`Attempted modification of immutable identifier "${idField}".`, 'IMMUTABLE_FIELD_FORBIDDEN');
      }
    }
  }

  if (mode === 'update') {
    for (const immField of immutableFields) {
      if (Object.prototype.hasOwnProperty.call(rawBody, immField) && rawBody[immField] !== undefined) {
        if (normalizeComparable(rawBody[immField]) !== normalizeComparable(existingDoc?.[immField])) {
          throw createValidationError(`Attempted modification of immutable identifier "${immField}".`, 'IMMUTABLE_FIELD_FORBIDDEN');
        }
      }
    }
  }
}

module.exports = {
  GLOBAL_PROTECTED_FIELDS,
  BENIGN_SERIALIZED_METADATA,
  RESOURCE_SPECS,
  parseStrictBoolean,
  validateSafeUrl,
  assertNoOperatorOrPrototypePollution,
  sanitizeAdminMutationPayload,
  assertSafeQuizAdminPayload
};
