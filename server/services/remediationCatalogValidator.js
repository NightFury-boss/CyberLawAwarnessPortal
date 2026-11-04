/**
 * Remediation Catalog Validator
 * Phase 3: Integrity and Schema Verification
 */

const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const LawSection = require('../models/LawSection');
const LearningModule = require('../models/LearningModule');

const APPROVED_STATUSES = ['IN_FORCE', 'ENACTED_FUTURE_COMMENCEMENT', 'STRUCK_DOWN_HISTORICAL'];
const APPROVED_RELATIONSHIPS = ['DIRECT', 'CONTEXTUAL', 'EDUCATIONAL_ONLY'];

function validateCatalogStructure(catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error('Remediation catalog must be a non-empty array');
  }

  const pathwayIds = new Set();

  for (const pathway of catalog) {
    if (!pathway.pathwayId || pathwayIds.has(pathway.pathwayId)) {
      throw new Error(`Duplicate or missing pathwayId: ${pathway.pathwayId}`);
    }
    pathwayIds.add(pathway.pathwayId);

    const requiredFields = [
      'metricKey',
      'dimensionCode',
      'dimensionName',
      'dimensionShortName',
      'habitTitle',
      'pedagogicalFocus',
      'observedBehaviorExplanation',
      'whyItMatters',
      'whatYouWillPractice',
      'coreRule',
      'difficulty',
      'estimatedMinutes',
      'crimeSlug',
      'caseStudySlug',
      'preventionAnchor',
      'actionLabel',
      'actionRoute',
      'defensivePillars',
      'curriculumLesson'
    ];

    for (const field of requiredFields) {
      if (pathway[field] === undefined || pathway[field] === null || pathway[field] === '') {
        throw new Error(`Pathway ${pathway.pathwayId} missing required field: ${field}`);
      }
    }

    const VALID_DIMENSIONS = ['UA', 'VB', 'TR', 'SI', 'DQ', 'FP', 'ALL'];
    if (!VALID_DIMENSIONS.includes(pathway.dimensionCode)) {
      throw new Error(`Pathway ${pathway.pathwayId} has invalid dimensionCode: ${pathway.dimensionCode}`);
    }

    if (!pathway.curriculumLesson.slug || !pathway.curriculumLesson.title) {
      throw new Error(`Pathway ${pathway.pathwayId} curriculumLesson missing slug or title`);
    }

    if (!Array.isArray(pathway.defensivePillars?.whatToDo) || !Array.isArray(pathway.defensivePillars?.whatToAvoid)) {
      throw new Error(`Pathway ${pathway.pathwayId} defensivePillars must include whatToDo and whatToAvoid arrays`);
    }

    if (!pathway.defensivePillars?.howToVerify || !pathway.defensivePillars?.ifMistakeOccurs) {
      throw new Error(`Pathway ${pathway.pathwayId} defensivePillars must include howToVerify and ifMistakeOccurs`);
    }

    if (!Array.isArray(pathway.legalReferences)) {
      throw new Error(`Pathway ${pathway.pathwayId} legalReferences must be an array`);
    }

    // Specific Rule: DQ and FP must not have forced statutes
    if (pathway.metricKey === 'decisionQuality') {
      const has43A = pathway.legalReferences.some(r => r.section && r.section.includes('43A'));
      if (has43A) {
        throw new Error(`Decision Quality pathway must not cite Section 43A (corporate liability)`);
      }
    }

    if (pathway.metricKey === 'falsePositive') {
      const has72A = pathway.legalReferences.some(r => r.section && r.section.includes('72A'));
      if (has72A) {
        throw new Error(`False Positive pathway must not cite Section 72A`);
      }
    }

    // Validate legal references
    for (const ref of pathway.legalReferences) {
      if (!ref.act || !ref.section || !ref.officialTitle) {
        throw new Error(`Incomplete legal reference in pathway ${pathway.pathwayId}`);
      }

      if (!APPROVED_STATUSES.includes(ref.status)) {
        throw new Error(`Invalid status "${ref.status}" in pathway ${pathway.pathwayId}`);
      }

      if (!APPROVED_RELATIONSHIPS.includes(ref.relationshipType)) {
        throw new Error(`Invalid relationshipType "${ref.relationshipType}" in pathway ${pathway.pathwayId}`);
      }

      // Non-accusatory wording enforcement
      if (ref.educationalContext && ref.educationalContext.toLowerCase().includes('this behaviour violates')) {
        throw new Error(`Educational context in ${pathway.pathwayId} must not accuse user of violating statute`);
      }

      // Specific DPDP Act Section 6 status enforcement under Notification G.S.R. 843(E)
      if (ref.act.includes('Digital Personal Data Protection') && (/\bsection\s*6\b/i.test(ref.section) || /\b6\(/i.test(ref.section))) {
        const is6_9 = ref.section.includes('6(9)');
        const is6_9InForce = Date.now() >= new Date('2026-11-13T00:00:00.000Z').getTime();
        const isGeneralInForce = Date.now() >= new Date('2027-05-13T00:00:00.000Z').getTime();
        const expectedStatus = is6_9
          ? (is6_9InForce ? 'IN_FORCE' : 'ENACTED_FUTURE_COMMENCEMENT')
          : (isGeneralInForce ? 'IN_FORCE' : 'ENACTED_FUTURE_COMMENCEMENT');

        if (ref.status !== expectedStatus) {
          throw new Error(`DPDP Act Section 6 must be marked ${expectedStatus}, found: ${ref.status}`);
        }
        if (!ref.commencementNote || !ref.commencementNote.includes('G.S.R. 843(E)')) {
          throw new Error(`DPDP Act Section 6 must cite Notification G.S.R. 843(E)`);
        }
        if (ref.commencementNote.includes('S.O. 4932(E)')) {
          throw new Error(`DPDP Act Section 6 must not retain obsolete S.O. 4932(E)`);
        }
        if (is6_9) {
          if (!ref.commencementNote.includes('one year') && !ref.commencementNote.includes('1 year') && !ref.commencementNote.includes('13 November 2026')) {
            throw new Error(`DPDP Act Section 6(9) must specify one-year commencement timeline`);
          }
        } else {
          if (!ref.commencementNote.includes('eighteen months') && !ref.commencementNote.includes('18 months') && !ref.commencementNote.includes('13 May 2027')) {
            throw new Error(`DPDP Act Section 6(1)–(8) & 6(10) must specify 18-month commencement notification timeline`);
          }
        }
      }
    }

    // If primaryLawSectionNumber is specified, it must be documented in legalReferences
    if (pathway.primaryLawSectionNumber !== null) {
      const hasMatch = pathway.legalReferences.some(r => {
        const pNum = pathway.primaryLawSectionNumber.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
        const rNum = r.section.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
        const pDigits = pathway.primaryLawSectionNumber.match(/\d+/);
        const rDigits = r.section.match(/\d+/);
        return pNum.includes(rNum) || rNum.includes(pNum) || (pDigits && rDigits && pDigits[0] === rDigits[0]);
      });
      if (!hasMatch) {
        throw new Error(
          `Primary law section "${pathway.primaryLawSectionNumber}" in pathway ${pathway.pathwayId} must be documented in legalReferences`
        );
      }
    }
  }

  return true;
}

async function validateCatalogDatabaseIntegrity(catalog) {
  validateCatalogStructure(catalog);

  for (const pathway of catalog) {
    const crime = await CyberCrime.findOne({ slug: pathway.crimeSlug });
    if (!crime) {
      throw new Error(`Referenced CyberCrime slug not found in DB: ${pathway.crimeSlug} (Pathway: ${pathway.pathwayId})`);
    }

    const caseStudy = await CaseStudy.findOne({ slug: pathway.caseStudySlug });
    if (!caseStudy) {
      throw new Error(`Referenced CaseStudy slug not found in DB: ${pathway.caseStudySlug} (Pathway: ${pathway.pathwayId})`);
    }

    if (pathway.primaryLawSectionNumber !== null) {
      const lawSection = await LawSection.findOne({ sectionNumber: pathway.primaryLawSectionNumber });
      if (!lawSection) {
        throw new Error(`Referenced LawSection not found in DB: ${pathway.primaryLawSectionNumber} (Pathway: ${pathway.pathwayId})`);
      }
    }

    if (pathway.curriculumLesson && pathway.curriculumLesson.slug) {
      const moduleDoc = await LearningModule.findOne({ slug: pathway.curriculumLesson.slug });
      if (!moduleDoc) {
        throw new Error(`Referenced LearningModule slug not found in DB: ${pathway.curriculumLesson.slug} (Pathway: ${pathway.pathwayId})`);
      }
    }
  }

  return true;
}

module.exports = {
  validateCatalogStructure,
  validateCatalogDatabaseIntegrity
};
