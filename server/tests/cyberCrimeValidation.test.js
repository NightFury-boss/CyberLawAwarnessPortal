/**
 * Comprehensive Validation Test Suite for CyberCrime Schema & Threat-Level Enums
 * 
 * Validates:
 * 1. CyberCrime schema redFlagLevel enum contains all five supported values:
 *    ['Low', 'Moderate', 'High', 'Very High', 'Critical'].
 * 2. Documents instantiated with each of the 5 supported values validate successfully offline.
 * 3. Unsupported threat level (e.g. 'Extreme') produces a Mongoose ValidationError.
 * 4. All 29 authoritative crime records extracted from seed.js validate against
 *    the CyberCrime Mongoose schema with 0 validation errors.
 * 5. Supplementary law seed definitions in supplementaryLawsSeed.js validate
 *    against LawSection Mongoose schema with 0 validation errors.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const CyberCrime = require('../models/CyberCrime');
const LawSection = require('../models/LawSection');
const { supplementaryLawsSeedData } = require('../config/supplementaryLawsSeed');

// Extract crimesData array directly from seed.js for offline schema verification
function extractCrimesDataFromSeed() {
  const seedFilePath = path.join(__dirname, '../config/seed.js');
  const seedContent = fs.readFileSync(seedFilePath, 'utf8');

  const startMarker = 'const crimesData = [';
  const startIndex = seedContent.indexOf(startMarker);
  assert(startIndex !== -1, 'crimesData not found in seed.js');

  const arrayStart = startIndex + 'const crimesData = '.length;
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
  assert(endIndex !== -1, 'Could not parse crimesData closing bracket');

  const arrayCode = seedContent.substring(arrayStart, endIndex);
  // Safely evaluate static array
  // eslint-disable-next-line no-eval
  return eval(arrayCode);
}

describe('CyberCrime Schema & Threat-Level Enum Verification', () => {
  it('should define all five supported redFlagLevel enum values in CyberCrime schema', () => {
    const enumValues = CyberCrime.schema.path('redFlagLevel').enumValues;
    assert.deepEqual(
      enumValues,
      ['Low', 'Moderate', 'High', 'Very High', 'Critical'],
      'redFlagLevel enum must strictly contain Low, Moderate, High, Very High, Critical'
    );
  });

  it('should validate documents instantiated with each of the five supported threat levels', async () => {
    const supportedLevels = ['Low', 'Moderate', 'High', 'Very High', 'Critical'];

    for (const level of supportedLevels) {
      const doc = new CyberCrime({
        title: `Test Crime ${level}`,
        slug: `test-crime-${level.toLowerCase().replace(/\s+/g, '-')}`,
        category: 'Test Category',
        shortDescription: 'Short description for testing',
        whatIsIt: 'What is it explanation for testing',
        howItWorks: 'How it works explanation for testing',
        redFlagLevel: level
      });

      const err = doc.validateSync();
      assert.equal(
        err,
        undefined,
        `Document with redFlagLevel='${level}' should validate without errors, got: ${err?.message}`
      );
    }
  });

  it('should reject documents instantiated with an unsupported threat level (e.g. Extreme)', () => {
    const doc = new CyberCrime({
      title: 'Invalid Threat Crime',
      slug: 'invalid-threat-crime',
      category: 'Test Category',
      shortDescription: 'Short description for testing',
      whatIsIt: 'What is it explanation for testing',
      howItWorks: 'How it works explanation for testing',
      redFlagLevel: 'Extreme'
    });

    const err = doc.validateSync();
    assert.ok(err, 'Validation error must be raised for invalid redFlagLevel');
    assert.ok(
      err.errors['redFlagLevel'],
      'Validation error must be on redFlagLevel field'
    );
    assert.match(
      err.errors['redFlagLevel'].message,
      /`Extreme` is not a valid enum value/
    );
  });

  it('should validate all 29 authoritative seed crimes against CyberCrime schema offline', () => {
    const crimes = extractCrimesDataFromSeed();
    assert.equal(crimes.length, 29, 'Exact 29 cybercrime records expected in seed.js');

    const levelCounts = {};
    for (const crime of crimes) {
      const doc = new CyberCrime(crime);
      const err = doc.validateSync();
      assert.equal(
        err,
        undefined,
        `Crime '${crime.slug}' failed Mongoose schema validation: ${err?.message}`
      );
      levelCounts[crime.redFlagLevel] = (levelCounts[crime.redFlagLevel] || 0) + 1;
    }

    assert.equal(levelCounts['High'], 12, 'Expected 12 High threat crimes');
    assert.equal(levelCounts['Critical'], 9, 'Expected 9 Critical threat crimes');
    assert.equal(levelCounts['Very High'], 6, 'Expected 6 Very High threat crimes');
    assert.equal(levelCounts['Moderate'], 2, 'Expected 2 Moderate threat crimes');
  });

  it('should validate supplementary law seed definitions against LawSection schema offline', () => {
    assert.equal(
      supplementaryLawsSeedData.length,
      2,
      'Expected exactly 2 supplementary law definitions (Section 67A & BNS Section 351)'
    );

    for (const law of supplementaryLawsSeedData) {
      const doc = new LawSection(law);
      const err = doc.validateSync();
      assert.equal(
        err,
        undefined,
        `Supplementary law '${law.sectionNumber}' failed LawSection validation: ${err?.message}`
      );
    }

    const s67a = supplementaryLawsSeedData.find(l => l.sectionNumber === 'Section 67A');
    assert.ok(s67a, 'Section 67A must be present');
    assert.equal(s67a.role, 'Core Cyber Law');
    assert.equal(s67a.legalStatus, 'CURRENT');

    const bns351 = supplementaryLawsSeedData.find(l => l.sectionNumber === 'BNS Section 351');
    assert.ok(bns351, 'BNS Section 351 must be present');
    assert.equal(bns351.role, 'Related Criminal Law');
    assert.equal(bns351.legalStatus, 'CURRENT');
  });
});

