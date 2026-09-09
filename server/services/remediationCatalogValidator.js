/**
 * Remediation Catalog Validator
 * Phase 3: Integrity and Schema Verification
 */

const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const LawSection = require('../models/LawSection');

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
      'habitTitle',
      'pedagogicalFocus',
      'coreRule',
      'difficulty',
      'estimatedMinutes',
      'crimeSlug',
      'caseStudySlug',
      'preventionAnchor',
      'actionLabel',
      'actionRoute'
    ];

    for (const field of requiredFields) {
      if (pathway[field] === undefined || pathway[field] === null || pathway[field] === '') {
        throw new Error(`Pathway ${pathway.pathwayId} missing required field: ${field}`);
      }
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

      // Specific DPDP Act Section 6 status enforcement as of 9 Sep 2026
      if (ref.act.includes('Digital Personal Data Protection') && ref.section.includes('6')) {
        if (ref.status !== 'ENACTED_FUTURE_COMMENCEMENT') {
          throw new Error(`DPDP Act Section 6 must be marked ENACTED_FUTURE_COMMENCEMENT as of 9 September 2026`);
        }
        if (!ref.commencementNote || !ref.commencementNote.includes('18 months')) {
          throw new Error(`DPDP Act Section 6 must specify 18-month commencement notification timeline`);
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
  }

  return true;
}

module.exports = {
  validateCatalogStructure,
  validateCatalogDatabaseIntegrity
};
