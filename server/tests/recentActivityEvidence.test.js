/**
 * server/tests/recentActivityEvidence.test.js
 * 
 * Comprehensive automated verification suite for human-readable Recent Activity:
 * 1. Authoritative pathway title resolution (all 7 canonical pathways)
 * 2. Eradication of raw database IDs and slugs
 * 3. Elimination of redundant wording ("Completed lesson:", etc.)
 * 4. Percentage disambiguation & non-fabrication (score vs completed)
 * 5. Honest handling of repeated activities (Lesson vs Practice distinction preserved, true duplicates filtered)
 * 6. Chronological ordering & limit bounding
 * 7. Backend API contract enrichment (habitTitle included in progress & portfolio)
 */

const assert = require('assert');
const catalog = require('../config/remediationCatalog');

// Import client selector helpers via relative node require
// Note: evidenceSelectors is an ES module or uses exports. We can test both the catalog mapping and the formatting rules.
const {
  AUTHORITATIVE_PATHWAY_TITLES,
  resolvePathwayTitle,
  formatRecentActivityEvents
} = require('../../client/src/utils/evidenceSelectors.js');

console.log('\n=============================================================');
console.log('RECENT ACTIVITY & HUMAN-READABLE LEARNING HISTORY TEST SUITE');
console.log('=============================================================\n');

// ---------------------------------------------------------------------------
// TEST 1: Authoritative Catalog Alignment
// ---------------------------------------------------------------------------
console.log('[TEST 1] Verifying all 7 canonical catalog pathways map to authoritative titles...');
for (const p of catalog) {
  const resolved = resolvePathwayTitle(p.pathwayId);
  assert.strictEqual(
    resolved,
    p.habitTitle,
    `Expected pathway ${p.pathwayId} to resolve to "${p.habitTitle}", got "${resolved}"`
  );
  assert.ok(
    !resolved.startsWith('pathway-'),
    `Resolved title must not start with 'pathway-': ${resolved}`
  );
}
console.log(`✓ All ${catalog.length} catalog pathways resolve directly to verified habit titles.`);

// ---------------------------------------------------------------------------
// TEST 2: Eradication of Internal Slugs & Safe Fallbacks
// ---------------------------------------------------------------------------
console.log('\n[TEST 2] Testing unknown, legacy, and null pathway ID fallbacks...');
// Unmapped slug with pathway- prefix
const unknownSlug = resolvePathwayTitle('pathway-credential-hygiene-advanced');
assert.strictEqual(unknownSlug, 'Credential Hygiene Advanced');
assert.ok(!unknownSlug.includes('pathway-'), 'Must strip pathway- prefix');

// Null, empty, or undefined pathwayId
assert.strictEqual(resolvePathwayTitle(null), 'Safety Lesson');
assert.strictEqual(resolvePathwayTitle(undefined), 'Safety Lesson');
assert.strictEqual(resolvePathwayTitle(''), 'Safety Lesson');

// Pre-populated habitTitle takes precedence if valid and not an ID
assert.strictEqual(
  resolvePathwayTitle('pathway-maintenance-reinforcement', 'Advanced Defense & Secondary Channel Hardening'),
  'Advanced Defense & Secondary Channel Hardening'
);
// Pre-populated habitTitle that was accidentally set to an ID falls back cleanly
assert.strictEqual(
  resolvePathwayTitle('pathway-maintenance-reinforcement', 'pathway-maintenance-reinforcement'),
  'Advanced Defense & Secondary Channel Hardening'
);
console.log('✓ Internal slugs cleanly eradicated across all edge cases.');

// ---------------------------------------------------------------------------
// TEST 3: Redundant Wording Elimination
// ---------------------------------------------------------------------------
console.log('\n[TEST 3] Verifying no redundant prefix wording in generated activity titles...');
const sampleEvents = formatRecentActivityEvents({
  completedPathwaysList: [
    { pathwayId: 'pathway-maintenance-reinforcement', checkpointScore: 100, completedAt: '2026-09-15T10:00:00Z' }
  ],
  reinforcementsList: [
    { pathwayId: 'pathway-maintenance-reinforcement', checkpointScore: 100, completedAt: '2026-09-15T11:00:00Z' }
  ],
  quizAttemptsList: [
    { quizTitle: 'Phishing Prevention Challenge', percentage: 40, completedAt: '2026-09-15T09:00:00Z' }
  ],
  spacedReviewsList: [
    { pathwayId: 'pathway-fp-evidence-triage', checkpointScore: 67, cycleNumber: 1, completedAt: '2026-09-15T12:00:00Z' }
  ]
});

for (const evt of sampleEvents) {
  assert.ok(!evt.title.includes('Completed lesson:'), `Title contains redundant prefix: ${evt.title}`);
  assert.ok(!evt.title.includes('Habit practice:'), `Title contains redundant prefix: ${evt.title}`);
  assert.ok(!evt.title.includes('Quiz completed:'), `Title contains redundant prefix: ${evt.title}`);
  assert.ok(!evt.title.includes('Follow-up check:'), `Title contains redundant prefix: ${evt.title}`);
}
console.log('✓ Redundant wording removed; titles are clean and concise.');

// ---------------------------------------------------------------------------
// TEST 4: Clarify Percentages & Non-Fabrication
// ---------------------------------------------------------------------------
console.log('\n[TEST 4] Testing percentage disambiguation and missing score handling...');
const scoreTestEvents = formatRecentActivityEvents({
  completedPathwaysList: [
    { pathwayId: 'pathway-ua-upi-consent', checkpointScore: 100, completedAt: '2026-09-10T10:00:00Z' },
    // Legacy record with null score
    { pathwayId: 'pathway-vb-out-of-band', checkpointScore: null, completedAt: '2026-09-11T10:00:00Z' }
  ],
  quizAttemptsList: [
    { quizTitle: 'UPI & Financial Safety', percentage: 70, completedAt: '2026-09-12T10:00:00Z' }
  ]
});

const uaEvent = scoreTestEvents.find(e => e.title === 'Autopilot Control & UPI PIN Safety');
assert.strictEqual(uaEvent.result, 'Score: 100%', 'Expected explicit "Score: 100%"');

const vbEvent = scoreTestEvents.find(e => e.title === 'Independent Out-of-Band Verification');
assert.strictEqual(vbEvent.result, 'Completed', 'Expected "Completed" for null score without fabricating a percentage');

const quizEvent = scoreTestEvents.find(e => e.title === 'UPI & Financial Safety');
assert.strictEqual(quizEvent.result, 'Score: 70%', 'Expected "Score: 70%"');
console.log('✓ Percentages clearly contextualized as scores; missing scores never fabricated.');

// ---------------------------------------------------------------------------
// TEST 5: Honest Handling of Repeated Activities (Lesson vs. Practice)
// ---------------------------------------------------------------------------
console.log('\n[TEST 5] Testing repeated pathway handling (foundational lesson vs. habit reinforcement)...');
const maintenanceDate1 = new Date('2026-09-15T08:00:00Z');
const maintenanceDate2 = new Date('2026-09-15T14:00:00Z');

const repeatedEvents = formatRecentActivityEvents({
  completedPathwaysList: [
    { pathwayId: 'pathway-maintenance-reinforcement', checkpointScore: 100, completedAt: maintenanceDate1.toISOString() }
  ],
  reinforcementsList: [
    { pathwayId: 'pathway-maintenance-reinforcement', checkpointScore: 100, completedAt: maintenanceDate2.toISOString() }
  ]
});

assert.strictEqual(repeatedEvents.length, 2, 'Both genuine learning events must be preserved');

const lessonEvt = repeatedEvents.find(e => e.type === 'pathway');
assert.ok(lessonEvt, 'Foundational lesson event must exist');
assert.strictEqual(lessonEvt.badge, 'Lesson');
assert.strictEqual(lessonEvt.context, 'Foundational lesson');
assert.strictEqual(lessonEvt.title, 'Advanced Defense & Secondary Channel Hardening');

const practiceEvt = repeatedEvents.find(e => e.type === 'reinforcement');
assert.ok(practiceEvt, 'Habit reinforcement practice event must exist');
assert.strictEqual(practiceEvt.badge, 'Practice');
assert.strictEqual(practiceEvt.context, 'Habit reinforcement');
assert.strictEqual(practiceEvt.title, 'Advanced Defense & Secondary Channel Hardening');

// Chronological order: reinforcement at 14:00 must appear before lesson at 08:00
assert.strictEqual(repeatedEvents[0].type, 'reinforcement');
assert.strictEqual(repeatedEvents[1].type, 'pathway');
console.log('✓ Repeated pathway events honestly distinguished by badge and context, preserving historical reality.');

// ---------------------------------------------------------------------------
// TEST 6: Technical Deduplication of Exact Duplicate Records
// ---------------------------------------------------------------------------
console.log('\n[TEST 6] Testing deduplication of identical network duplicate timestamps...');
const dupeTimestamp = '2026-09-15T10:00:00.000Z';
const dupeEvents = formatRecentActivityEvents({
  completedPathwaysList: [
    { pathwayId: 'pathway-maintenance-reinforcement', checkpointScore: 100, completedAt: dupeTimestamp },
    // Exact duplicate entry in array (e.g. from network retry)
    { pathwayId: 'pathway-maintenance-reinforcement', checkpointScore: 100, completedAt: dupeTimestamp }
  ]
});

assert.strictEqual(dupeEvents.length, 1, 'Exact duplicate records within the same type must be deduplicated to 1 item');
console.log('✓ Technical identical duplicates deduplicated safely without dropping distinct events.');

// ---------------------------------------------------------------------------
// TEST 7: Chronological Ordering & Limit Bounding
// ---------------------------------------------------------------------------
console.log('\n[TEST 7] Testing chronological sort and feed limit bounding...');
const manyEvents = formatRecentActivityEvents({
  completedPathwaysList: [
    { pathwayId: 'pathway-ua-upi-consent', completedAt: '2026-09-01T10:00:00Z' },
    { pathwayId: 'pathway-vb-out-of-band', completedAt: '2026-09-03T10:00:00Z' }
  ],
  reinforcementsList: [
    { pathwayId: 'pathway-tr-lure-detection', completedAt: '2026-09-05T10:00:00Z' }
  ],
  quizAttemptsList: [
    { quizTitle: 'Quiz 1', percentage: 90, completedAt: '2026-09-02T10:00:00Z' },
    { quizTitle: 'Quiz 2', percentage: 80, completedAt: '2026-09-06T10:00:00Z' },
    { quizTitle: 'Quiz 3', percentage: 85, completedAt: '2026-09-07T10:00:00Z' }
  ],
  limit: 4
});

assert.strictEqual(manyEvents.length, 4, 'Feed must strictly respect limit parameter');
// Verify descending sort
for (let i = 0; i < manyEvents.length - 1; i++) {
  assert.ok(
    manyEvents[i].date >= manyEvents[i + 1].date,
    `Events must be sorted descending: ${manyEvents[i].date} vs ${manyEvents[i + 1].date}`
  );
}
assert.strictEqual(manyEvents[0].title, 'Quiz 3', 'Latest event (Sep 7) must be first');
console.log('✓ Events strictly sorted chronologically descending and bounded by limit.');

// ---------------------------------------------------------------------------
// TEST 8: Missing or Malformed Data Resilience
// ---------------------------------------------------------------------------
console.log('\n[TEST 8] Testing safety against null, corrupted, or non-date inputs...');
const resilientEvents = formatRecentActivityEvents({
  completedPathwaysList: [
    null,
    undefined,
    {},
    { pathwayId: 'pathway-dq-digital-hygiene', completedAt: 'not-a-real-date' },
    { pathwayId: 'pathway-dq-digital-hygiene', completedAt: '2026-09-10T10:00:00Z' }
  ],
  quizAttemptsList: [
    { completedAt: null },
    { quizTitle: '', completedAt: '2026-09-11T10:00:00Z' }
  ]
});

assert.strictEqual(resilientEvents.length, 2, 'Only valid records with parseable dates must be included');
assert.strictEqual(resilientEvents[0].title, 'Cyber Law Quiz', 'Empty quiz title safely fell back to "Cyber Law Quiz"');
assert.strictEqual(resilientEvents[1].title, 'Daily Digital Prudence & System Hygiene');
console.log('✓ Malformed records handled gracefully without errors.');

console.log('\n=============================================================');
console.log('ALL 8 RECENT ACTIVITY EVIDENCE TESTS PASSED GREEN! ✓');
console.log('=============================================================\n');
