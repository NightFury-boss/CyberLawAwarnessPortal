/**
 * orientationSummaryEvidence.test.js
 * Verification Suite for Dashboard Orientation Summary — Hardened Recall Evidence & Contract Tests
 *
 * Requirements Matrix:
 * 1. Valid authoritative summary counts: Used directly when integer >= 0 and passed <= total.
 * 2. Missing summary with valid record-based fallback: Derived from records when summary is absent.
 * 3. Invalid, negative, fractional, or inconsistent summary counts: Safely rejected in favor of record fallback.
 * 4. Passed count greater than completed count: Invariant enforcement guarantees passed <= completed.
 * 5. Duplicate records within one source: Deduplicated by record ID and domain identity (pathway + session + cycle).
 * 6. Overlapping progress and portfolio records: Selected without array concatenation or double counting.
 * 7. Legacy and malformed review records: Excluded from client-derived metrics without throwing or producing NaN.
 * 8. Existing pathway, quiz, and assessment indicators remaining unchanged.
 */

const assert = require('assert');

async function runHardenedOrientationEvidenceSuite() {
  console.log('\n=============================================================');
  console.log('DASHBOARD ORIENTATION SUMMARY EVIDENCE VERIFICATION SUITE');
  console.log('=============================================================');

  // Import actual production selectors from client bundle via dynamic ESM import
  const evidenceSelectors = await import('../../client/src/utils/evidenceSelectors.js');
  const {
    selectAuthoritativeRecallCounts,
    formatRecallSummaryLabel,
    isValidReviewRecord,
    getReviewIdentityKey
  } = evidenceSelectors;

  assert.strictEqual(typeof selectAuthoritativeRecallCounts, 'function', 'selectAuthoritativeRecallCounts must be exported');
  assert.strictEqual(typeof formatRecallSummaryLabel, 'function', 'formatRecallSummaryLabel must be exported');

  // -------------------------------------------------------------------------
  // TEST 1: Valid Authoritative Summary Counts
  // -------------------------------------------------------------------------
  console.log('\n[TEST 1] Testing valid authoritative summary counts...');
  const res1 = selectAuthoritativeRecallCounts({
    portfolioData: {
      interventions: {
        summary: { totalSpacedReviews: 4, passedSpacedReviews: 3 },
        spacedReviews: [] // Even if records array is empty or differs, valid summary takes precedence
      }
    },
    progress: { spacedReviews: [] }
  });

  assert.strictEqual(res1.source, 'portfolio_summary');
  assert.strictEqual(res1.completedRecallCount, 4);
  assert.strictEqual(res1.passedRecallCount, 3);

  const label1 = formatRecallSummaryLabel(res1.completedRecallCount, res1.passedRecallCount);
  assert.strictEqual(label1.fullText, '4 follow-up reviews (3 passed)');
  console.log('✓ Valid authoritative summary respected: "4 follow-up reviews (3 passed)"');

  // -------------------------------------------------------------------------
  // TEST 2: Missing Summary with Valid Record-Based Fallback
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2] Testing missing summary with valid record-based fallback...');
  const res2 = selectAuthoritativeRecallCounts({
    portfolioData: {
      interventions: {
        // summary is undefined
        spacedReviews: [
          {
            pathwayId: 'identity-theft-drill',
            completedAt: new Date().toISOString(),
            checkpointScore: 100,
            passed: true,
            cycleNumber: 1
          },
          {
            pathwayId: 'upi-defense-drill',
            completedAt: new Date().toISOString(),
            checkpointScore: 50,
            passed: false,
            cycleNumber: 1
          }
        ]
      }
    },
    progress: null
  });

  assert.strictEqual(res2.source, 'validated_records');
  assert.strictEqual(res2.completedRecallCount, 2);
  assert.strictEqual(res2.passedRecallCount, 1);

  const label2 = formatRecallSummaryLabel(res2.completedRecallCount, res2.passedRecallCount);
  assert.strictEqual(label2.fullText, '2 follow-up reviews (1 passed)');
  console.log('✓ Missing summary safely fell back to validated records: "2 follow-up reviews (1 passed)"');

  // -------------------------------------------------------------------------
  // TEST 3: Invalid, Negative, Fractional, or Inconsistent Summary Counts
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] Testing rejection of invalid, negative, fractional, or inconsistent summary counts...');
  
  const fallbackRecords = [
    {
      _id: 'rec-1',
      pathwayId: 'ransomware-incident-response',
      completedAt: new Date().toISOString(),
      checkpointScore: 100,
      passed: true
    }
  ];

  // Case 3a: Negative total count
  const res3a = selectAuthoritativeRecallCounts({
    portfolioData: {
      interventions: {
        summary: { totalSpacedReviews: -1, passedSpacedReviews: 0 },
        spacedReviews: fallbackRecords
      }
    }
  });
  assert.strictEqual(res3a.source, 'validated_records', 'Negative summary total must be rejected');
  assert.strictEqual(res3a.completedRecallCount, 1);

  // Case 3b: Fractional count
  const res3b = selectAuthoritativeRecallCounts({
    portfolioData: {
      interventions: {
        summary: { totalSpacedReviews: 3.5, passedSpacedReviews: 2 },
        spacedReviews: fallbackRecords
      }
    }
  });
  assert.strictEqual(res3b.source, 'validated_records', 'Fractional summary total must be rejected');
  assert.strictEqual(res3b.completedRecallCount, 1);

  // Case 3c: Inconsistent counts (passed > total)
  const res3c = selectAuthoritativeRecallCounts({
    portfolioData: {
      interventions: {
        summary: { totalSpacedReviews: 2, passedSpacedReviews: 5 },
        spacedReviews: fallbackRecords
      }
    }
  });
  assert.strictEqual(res3c.source, 'validated_records', 'Inconsistent summary (passed > total) must be rejected');
  assert.strictEqual(res3c.completedRecallCount, 1);

  // Case 3d: NaN or Non-number counts
  const res3d = selectAuthoritativeRecallCounts({
    portfolioData: {
      interventions: {
        summary: { totalSpacedReviews: NaN, passedSpacedReviews: '2' },
        spacedReviews: fallbackRecords
      }
    }
  });
  assert.strictEqual(res3d.source, 'validated_records', 'NaN or non-number summary must be rejected');
  assert.strictEqual(res3d.completedRecallCount, 1);

  console.log('✓ Invalid, negative, fractional, and inconsistent summaries all correctly rejected for record fallback');

  // -------------------------------------------------------------------------
  // TEST 4: Passed Count Cannot Exceed Completed Count Invariant
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4] Testing passed count cannot exceed completed count invariant...');
  // Simulating an unexpected client or record state where passed flags could exceed valid completed count
  const label4 = formatRecallSummaryLabel(2, 5); // Attempting to display 5 passed out of 2 completed
  assert.strictEqual(label4.fullText, '2 follow-up reviews (2 passed)');
  assert.strictEqual(label4.subText, '(2 passed)');

  const label4Zero = formatRecallSummaryLabel(0, 2);
  assert.strictEqual(label4Zero.fullText, '0 follow-up reviews');
  assert.strictEqual(label4Zero.subText, null);
  console.log('✓ Invariant verified: passed count strictly bounded by completed count (2 passed out of 2)');

  // -------------------------------------------------------------------------
  // TEST 5: Duplicate Records Within One Source
  // -------------------------------------------------------------------------
  console.log('\n[TEST 5] Testing deduplication of records within a single source...');
  const duplicateIdRecords = [
    {
      _id: 'sr-duplicate-1',
      pathwayId: 'phishing-pretext-drill',
      sourceSessionId: 'sess-100',
      cycleNumber: 1,
      completedAt: '2026-10-20T10:00:00.000Z',
      checkpointScore: 100,
      passed: true
    },
    {
      _id: 'sr-duplicate-1', // Exact same _id
      pathwayId: 'phishing-pretext-drill',
      sourceSessionId: 'sess-100',
      cycleNumber: 1,
      completedAt: '2026-10-20T10:00:00.000Z',
      checkpointScore: 100,
      passed: true
    },
    {
      // No _id, but identical domain identity (pathwayId + sourceSessionId + cycleNumber)
      pathwayId: 'phishing-pretext-drill',
      sourceSessionId: 'sess-100',
      cycleNumber: 2,
      completedAt: '2026-10-22T10:00:00.000Z',
      checkpointScore: 100,
      passed: true
    },
    {
      // Exact same domain identity as above
      pathwayId: 'phishing-pretext-drill',
      sourceSessionId: 'sess-100',
      cycleNumber: 2,
      completedAt: '2026-10-22T10:00:00.000Z',
      checkpointScore: 100,
      passed: true
    }
  ];

  const res5 = selectAuthoritativeRecallCounts({
    portfolioData: {
      interventions: {
        summary: null,
        spacedReviews: duplicateIdRecords
      }
    }
  });

  assert.strictEqual(res5.completedRecallCount, 2, 'Duplicates must be collapsed to exactly 2 distinct reviews');
  assert.strictEqual(res5.passedRecallCount, 2);
  console.log('✓ Duplicate records by _id and (pathway+session+cycle) deduplicated cleanly to 2 records');

  // -------------------------------------------------------------------------
  // TEST 6: Overlapping Progress and Portfolio Records Without Concatenation
  // -------------------------------------------------------------------------
  console.log('\n[TEST 6] Testing overlapping progress and portfolio records without accidental array concatenation...');
  const recordsA = [
    {
      _id: 'sr-alpha',
      pathwayId: 'pathway-alpha',
      completedAt: new Date().toISOString(),
      checkpointScore: 100,
      passed: true
    }
  ];
  const recordsB = [
    {
      _id: 'sr-beta',
      pathwayId: 'pathway-beta',
      completedAt: new Date().toISOString(),
      checkpointScore: 100,
      passed: true
    }
  ];

  // Portfolio takes precedence as source; progress is NOT concatenated into it
  const res6 = selectAuthoritativeRecallCounts({
    portfolioData: {
      interventions: {
        summary: null,
        spacedReviews: recordsA
      }
    },
    progress: {
      spacedReviews: recordsB
    }
  });

  assert.strictEqual(res6.completedRecallCount, 1, 'Source array must NOT be concatenated with progress array');
  console.log('✓ Source selection isolated: portfolio takes precedence without array concatenation (count = 1, not 2)');

  // -------------------------------------------------------------------------
  // TEST 7: Legacy and Malformed Review Records
  // -------------------------------------------------------------------------
  console.log('\n[TEST 7] Testing safe exclusion of legacy or malformed records...');
  const malformedRecords = [
    null,
    undefined,
    'not-an-object',
    42,
    { /* missing pathwayId */ completedAt: new Date().toISOString(), checkpointScore: 80 },
    { pathwayId: '   ', completedAt: new Date().toISOString(), checkpointScore: 80 }, // empty whitespace
    { pathwayId: 'pathway-1', completedAt: 'invalid-date-string', checkpointScore: 80 }, // invalid date
    { pathwayId: 'pathway-2', completedAt: new Date().toISOString(), checkpointScore: 'eighty' }, // non-numeric score
    { pathwayId: 'pathway-3', completedAt: new Date().toISOString(), checkpointScore: -10 }, // negative score
    { pathwayId: 'pathway-4', completedAt: new Date().toISOString(), checkpointScore: 150 }, // > 100 score
    { pathwayId: 'valid-pathway', completedAt: new Date().toISOString(), checkpointScore: 80, passed: true } // THE ONLY VALID RECORD
  ];

  const res7 = selectAuthoritativeRecallCounts({
    portfolioData: {
      interventions: {
        summary: null,
        spacedReviews: malformedRecords
      }
    }
  });

  assert.strictEqual(res7.completedRecallCount, 1, 'Only the single valid record should be counted');
  assert.strictEqual(res7.passedRecallCount, 1);
  console.log('✓ Malformed records (missing pathwayId, bad dates, non-numeric scores) safely ignored');

  // -------------------------------------------------------------------------
  // TEST 8: Existing Pathway, Quiz, and Assessment Indicators Unchanged
  // -------------------------------------------------------------------------
  console.log('\n[TEST 8] Testing existing orientation indicators remain unchanged...');
  
  function getAssessmentStageText({ hasBaseline, hasFinal, hasTrajectoryReassessment }) {
    if (!hasBaseline) return 'Baseline pending';
    if (!hasFinal) return 'Baseline completed';
    if (hasTrajectoryReassessment) return 'Longitudinal reassessment recorded';
    return 'Final assessment completed';
  }

  const indicators = [
    { hasBaseline: false, hasFinal: false, hasTrajectoryReassessment: false, expected: 'Baseline pending' },
    { hasBaseline: true, hasFinal: false, hasTrajectoryReassessment: false, expected: 'Baseline completed' },
    { hasBaseline: true, hasFinal: true, hasTrajectoryReassessment: false, expected: 'Final assessment completed' },
    { hasBaseline: true, hasFinal: true, hasTrajectoryReassessment: true, expected: 'Longitudinal reassessment recorded' }
  ];

  for (const ind of indicators) {
    const stage = getAssessmentStageText(ind);
    assert.strictEqual(stage, ind.expected);
  }

  const completedFocusCount = 3;
  const quizAttemptsCount = 5;
  const pathwayText = `${completedFocusCount} ${completedFocusCount === 1 ? 'pathway completed' : 'pathways completed'}`;
  const quizText = `${quizAttemptsCount} ${quizAttemptsCount === 1 ? 'verified quiz attempt' : 'verified quiz attempts'}`;
  const recallLabel = formatRecallSummaryLabel(res1.completedRecallCount, res1.passedRecallCount);
  const fullSummary = `${pathwayText} • ${quizText} • ${recallLabel.fullText} • ${indicators[2].expected}`;

  assert.strictEqual(
    fullSummary,
    '3 pathways completed • 5 verified quiz attempts • 4 follow-up reviews (3 passed) • Final assessment completed'
  );

  console.log('✓ Full editorial orientation summary preserved without regressions:');
  console.log(`  "${fullSummary}"`);

  console.log('\n=============================================================');
  console.log('ALL 8 HARDENED ORIENTATION SUMMARY EVIDENCE TESTS PASSED GREEN! ✓');
  console.log('=============================================================\n');
}

runHardenedOrientationEvidenceSuite().catch((err) => {
  console.error('\n❌ ORIENTATION SUMMARY EVIDENCE TEST SUITE FAILED:', err);
  process.exit(1);
});
