/**
 * dashboardLearningJourney.test.js
 * 
 * Comprehensive Test Suite for Dashboard Clarity, Plain Language & Learning Journey Consistency:
 * 1. Answering "Where am I in my learning?" (selectJourneyStage across all 4 stages & variants)
 * 2. Answering "What should I do next?" (selectPrimaryNextAction across all supported states)
 * 3. Answering "What have I learned or practiced so far?" (orientation summary sync)
 * 4. Slugs & Internal ID Isolation: Ensuring human-readable titles across all pathways.
 * 5. Full Cross-Component Agreement: Testing consistency across stage, track, card, and secondary notices.
 * 6. Malformed & Resilient Data Handling: Testing negative/NaN counters, missing records, corrupted objects.
 */

const assert = require('assert');

async function runDashboardLearningJourneySuite() {
  console.log('\n=============================================================');
  console.log('DASHBOARD LEARNING JOURNEY & LANGUAGE CONSISTENCY SUITE');
  console.log('=============================================================');

  const { selectPrimaryNextAction, selectJourneyStage } = await import('../../client/src/utils/dashboardJourneySelectors.js');
  const { resolvePathwayTitle, resolveRetentionStatusLabel } = await import('../../client/src/utils/evidenceSelectors.js');

  assert.strictEqual(typeof selectPrimaryNextAction, 'function', 'selectPrimaryNextAction must be exported');
  assert.strictEqual(typeof selectJourneyStage, 'function', 'selectJourneyStage must be exported');

  // -------------------------------------------------------------------------
  // TEST 1: State 1 — Pre-Baseline Learner
  // -------------------------------------------------------------------------
  console.log('\n[TEST 1] Testing Pre-Baseline Learner State...');
  const resPreBaseline = selectPrimaryNextAction({
    hasBaseline: false,
    hasFinal: false
  });
  assert.strictEqual(resPreBaseline.type, 'PRE_BASELINE');
  assert.strictEqual(resPreBaseline.eyebrow, 'Step 1 of Your Journey');
  assert.strictEqual(resPreBaseline.actionType, 'LINK');
  assert.strictEqual(resPreBaseline.destination, '/assessment/baseline');
  assert.strictEqual(resPreBaseline.actionLabel, 'Start First Check →');
  assert.strictEqual(resPreBaseline.estimatedMinutes, 5);

  const stagePreBaseline = selectJourneyStage({ hasBaseline: false, hasFinal: false });
  assert.strictEqual(stagePreBaseline.stageNum, 1);
  assert.strictEqual(stagePreBaseline.stageLabel, 'Stage 1 of 4: First Check Needed');
  assert.strictEqual(stagePreBaseline.summaryTag, 'First check needed');
  console.log('✓ Pre-baseline correctly maps to PRE_BASELINE and Stage 1');

  // -------------------------------------------------------------------------
  // TEST 2A: State 2A — Active In-Progress Pathway Resumption (Step 1 done, Rule pending)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2A] Testing Active In-Progress Pathway (Step 1 done, Rule pending)...');
  const inProgressStep1 = {
    rec: {
      pathwayId: 'pathway-fp-evidence-triage',
      habitTitle: 'Preserving Digital Evidence and Transaction Records',
      pedagogicalFocus: 'Master the proper preservation of digital evidence.'
    },
    isInProgress: true,
    isFullyCompleted: false,
    completedRecord: {
      stepsCompleted: { caseStudy: true, prevention: false, checkpointQuiz: false }
    }
  };

  const resStep1 = selectPrimaryNextAction({
    hasBaseline: true,
    hasFinal: false,
    pathwaysWithStatus: [inProgressStep1],
    completedFocusCount: 0,
    totalFocusCount: 3
  });

  assert.strictEqual(resStep1.type, 'RESUME_PATHWAY');
  assert.strictEqual(resStep1.actionType, 'RUNNER');
  assert.strictEqual(resStep1.eyebrow, 'Resume Where You Left Off');
  assert.strictEqual(resStep1.actionLabel, 'Read Practical Defense Rule →');
  assert.strictEqual(resStep1.steps.step1Done, true);
  assert.strictEqual(resStep1.steps.step2Done, false);
  assert.strictEqual(resStep1.steps.step3Done, false);
  assert.ok(!resStep1.title.includes('pathway-'), 'Title must not contain raw slug');
  console.log(`✓ In-progress step 1 resumes with: "${resStep1.actionLabel}"`);

  // -------------------------------------------------------------------------
  // TEST 2B: State 2B — Active In-Progress Pathway Resumption (Step 2 done, Quiz pending)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2B] Testing Active In-Progress Pathway (Step 2 done, Quiz pending)...');
  const inProgressStep2 = {
    rec: {
      pathwayId: 'pathway-upi-collect',
      habitTitle: 'Identifying UPI Collect Scams',
      pedagogicalFocus: 'Learn how to identify fraudulent collect requests.'
    },
    isInProgress: true,
    isFullyCompleted: false,
    completedRecord: {
      stepsCompleted: { caseStudy: true, prevention: true, checkpointQuiz: false }
    }
  };

  const resStep2 = selectPrimaryNextAction({
    hasBaseline: true,
    hasFinal: false,
    pathwaysWithStatus: [inProgressStep2],
    completedFocusCount: 0,
    totalFocusCount: 3
  });

  assert.strictEqual(resStep2.type, 'RESUME_PATHWAY');
  assert.strictEqual(resStep2.actionType, 'RUNNER');
  assert.strictEqual(resStep2.actionLabel, 'Take Checkpoint Quiz →');
  assert.strictEqual(resStep2.steps.step1Done, true);
  assert.strictEqual(resStep2.steps.step2Done, true);
  assert.strictEqual(resStep2.steps.step3Done, false);
  console.log(`✓ In-progress step 2 resumes with: "${resStep2.actionLabel}"`);

  // -------------------------------------------------------------------------
  // TEST 2C: State 2C — Active In-Progress Resumption takes priority over Due Spaced Review
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2C] Testing Momentum Protection: In-Progress Resumption > Due Spaced Review...');
  const dueReview = {
    pathwayId: 'pathway-cyber-stalking',
    habitTitle: 'Responding to Digital Harassment and Cyberstalking',
    scheduledFor: new Date(Date.now() - 86400000).toISOString()
  };

  const resMomentum = selectPrimaryNextAction({
    hasBaseline: true,
    hasFinal: false,
    pathwaysWithStatus: [inProgressStep1],
    dueSpacedReviews: [dueReview],
    completedFocusCount: 1,
    totalFocusCount: 3
  });

  // Learner is in the middle of a lesson; completing it maintains momentum before doing reviews
  assert.strictEqual(resMomentum.type, 'RESUME_PATHWAY');
  assert.strictEqual(resMomentum.actionLabel, 'Read Practical Defense Rule →');
  console.log('✓ Active in-progress lesson protected from interruption by spaced review');

  // -------------------------------------------------------------------------
  // TEST 3: State 3 — Due Spaced Retrieval Review (When no in-progress lesson)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] Testing Due Spaced Retrieval Review (Plain Language & Priority)...');
  const resSpaced = selectPrimaryNextAction({
    hasBaseline: true,
    hasFinal: false,
    pathwaysWithStatus: [
      {
        rec: { pathwayId: 'pathway-sim-swap', habitTitle: 'SIM Swap Defense' },
        isFullyCompleted: false,
        isInProgress: false
      }
    ],
    dueSpacedReviews: [dueReview],
    completedFocusCount: 1,
    totalFocusCount: 2
  });

  assert.strictEqual(resSpaced.type, 'DUE_SPACED_REVIEW');
  assert.strictEqual(resSpaced.actionType, 'SPACED_MODAL');
  assert.strictEqual(resSpaced.eyebrow, 'A Review is Ready (~2 min)');
  assert.strictEqual(resSpaced.actionLabel, 'Start Quick Review →');
  assert.strictEqual(resSpaced.estimatedMinutes, 2);
  assert.ok(resSpaced.title.startsWith('Quick Review:'), 'Title uses friendly plain English "Quick Review:"');
  console.log(`✓ Due spaced review uses plain language: "${resSpaced.eyebrow}" -> "${resSpaced.title}"`);

  // -------------------------------------------------------------------------
  // TEST 4: State 4 — Start Next Recommended Pathway
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4] Testing Start Next Recommended Pathway...');
  const nextLesson = {
    rec: {
      pathwayId: 'pathway-cyber-stalking',
      habitTitle: 'Responding to Digital Harassment and Cyberstalking',
      pedagogicalFocus: 'Clear evidence gathering and formal reporting pathways.'
    },
    isFullyCompleted: false,
    isInProgress: false
  };

  const resStart = selectPrimaryNextAction({
    hasBaseline: true,
    hasFinal: false,
    pathwaysWithStatus: [nextLesson],
    dueSpacedReviews: [],
    completedFocusCount: 1,
    totalFocusCount: 3
  });

  assert.strictEqual(resStart.type, 'START_PATHWAY');
  assert.strictEqual(resStart.actionType, 'RUNNER');
  assert.strictEqual(resStart.actionLabel, 'Start Lesson →');
  assert.strictEqual(resStart.title, 'Responding to Digital Harassment and Cyberstalking');

  const stageLearning = selectJourneyStage({
    hasBaseline: true,
    hasFinal: false,
    completedFocusCount: 1,
    totalFocusCount: 3
  });
  assert.strictEqual(stageLearning.stageNum, 2);
  assert.strictEqual(stageLearning.stageLabel, 'Stage 2 of 4: Lessons & Practice');
  assert.strictEqual(stageLearning.summaryTag, 'Lessons in progress');
  console.log('✓ Next lesson correctly starts and maps to Stage 2');

  // -------------------------------------------------------------------------
  // TEST 5A: State 5A — Ready for Final Assessment (All recommended lessons complete)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 5A] Testing Ready for Final Assessment State...');
  const resFinal = selectPrimaryNextAction({
    hasBaseline: true,
    hasFinal: false,
    pathwaysWithStatus: [
      { rec: { pathwayId: 'p1', habitTitle: 'H1' }, isFullyCompleted: true },
      { rec: { pathwayId: 'p2', habitTitle: 'H2' }, isFullyCompleted: true }
    ],
    dueSpacedReviews: [],
    completedFocusCount: 2,
    totalFocusCount: 2
  });

  assert.strictEqual(resFinal.type, 'READY_FOR_FINAL');
  assert.strictEqual(resFinal.eyebrow, 'Ready for Your Final Check');
  assert.strictEqual(resFinal.actionType, 'LINK');
  assert.strictEqual(resFinal.destination, '/assessment/final');
  assert.strictEqual(resFinal.actionLabel, 'Start Final Check →');

  const stageReadyFinal = selectJourneyStage({
    hasBaseline: true,
    hasFinal: false,
    completedFocusCount: 2,
    totalFocusCount: 2
  });
  assert.strictEqual(stageReadyFinal.stageNum, 3);
  assert.strictEqual(stageReadyFinal.stageLabel, 'Stage 3 of 4: Ready for Final Check');
  assert.strictEqual(stageReadyFinal.summaryTag, 'Ready for final check');
  console.log('✓ Stage 3 correctly signals readiness for Final Check: "Ready for Your Final Check"');

  // -------------------------------------------------------------------------
  // TEST 5B: State 5B — Final Check Milestone Takes Precedence Even if Spaced Review Due
  // -------------------------------------------------------------------------
  console.log('\n[TEST 5B] Testing Final Check Milestone Precedence Over Spaced Review...');
  const resFinalWithReview = selectPrimaryNextAction({
    hasBaseline: true,
    hasFinal: false,
    pathwaysWithStatus: [
      { rec: { pathwayId: 'p1', habitTitle: 'H1' }, isFullyCompleted: true },
      { rec: { pathwayId: 'p2', habitTitle: 'H2' }, isFullyCompleted: true }
    ],
    dueSpacedReviews: [dueReview],
    completedFocusCount: 2,
    totalFocusCount: 2
  });

  // Stage 3 milestone (Final Check) is the primary focus; review is shown calmly in lessons column
  assert.strictEqual(resFinalWithReview.type, 'READY_FOR_FINAL');
  assert.strictEqual(resFinalWithReview.actionLabel, 'Start Final Check →');
  console.log('✓ Stage 3 milestone consistently directs to Final Check');

  // -------------------------------------------------------------------------
  // TEST 6: State 6 — Targeted Habit Reinforcement (Post-Final Check)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 6] Testing Post-Final Habit Reinforcement State...');
  const reinforceItem = {
    rec: {
      pathwayId: 'pathway-maintenance-reinforcement',
      habitTitle: 'Ongoing Digital Security Hygiene and Alertness',
      pedagogicalFocus: 'Reinforcing daily habits.'
    },
    isReinforcementEligible: true,
    isReinforced: false,
    isFullyCompleted: true
  };

  const resReinforce = selectPrimaryNextAction({
    hasBaseline: true,
    hasFinal: true,
    pathwaysWithStatus: [reinforceItem],
    dueSpacedReviews: [],
    completedFocusCount: 2,
    totalFocusCount: 2
  });

  assert.strictEqual(resReinforce.type, 'REINFORCE_HABIT');
  assert.strictEqual(resReinforce.eyebrow, 'Practice Your Safety Habits');
  assert.strictEqual(resReinforce.actionType, 'RUNNER_REINFORCE');
  assert.strictEqual(resReinforce.actionLabel, 'Practice This Habit →');
  assert.ok(resReinforce.title.includes('Ongoing Digital Security Hygiene'));

  const stageReinforce = selectJourneyStage({
    hasBaseline: true,
    hasFinal: true,
    hasReinforceEligible: true
  });
  assert.strictEqual(stageReinforce.stageNum, 4);
  assert.strictEqual(stageReinforce.stageLabel, 'Stage 4 of 4: Practice Your Safety Habits');
  assert.strictEqual(stageReinforce.summaryTag, 'Practice open');
  console.log('✓ Stage 4 correctly presents: "Stage 4 of 4: Practice Your Safety Habits"');

  // -------------------------------------------------------------------------
  // TEST 7: State 7 — All Caught Up / Longitudinal Evidence & Steady States
  // -------------------------------------------------------------------------
  console.log('\n[TEST 7] Testing All Caught Up & Longitudinal Progress States...');
  const resAllCaughtUp = selectPrimaryNextAction({
    hasBaseline: true,
    hasFinal: true,
    pathwaysWithStatus: [
      {
        rec: { pathwayId: 'p1', habitTitle: 'H1' },
        isFullyCompleted: true,
        isReinforced: true,
        isReinforcementEligible: false
      }
    ],
    dueSpacedReviews: [],
    completedFocusCount: 1,
    totalFocusCount: 1
  });

  assert.strictEqual(resAllCaughtUp.type, 'ALL_CAUGHT_UP');
  assert.strictEqual(resAllCaughtUp.eyebrow, 'All Up to Date');
  assert.strictEqual(resAllCaughtUp.destination, '/quizzes');
  assert.strictEqual(resAllCaughtUp.actionLabel, 'Practice Law Quizzes →');

  // Variant A: Longitudinal Reassessment Recorded
  const stageLongitudinal = selectJourneyStage({
    hasBaseline: true,
    hasFinal: true,
    hasTrajectoryReassessment: true
  });
  assert.strictEqual(stageLongitudinal.stageNum, 4);
  assert.strictEqual(stageLongitudinal.stageLabel, 'Stage 4 of 4: Your Progress Over Time');
  assert.strictEqual(stageLongitudinal.summaryTag, 'Progress recorded');

  // Variant B: Steady Maintenance (Core done, no reassessment yet)
  const stageSteady = selectJourneyStage({
    hasBaseline: true,
    hasFinal: true,
    hasTrajectoryReassessment: false,
    hasReinforceEligible: false
  });
  assert.strictEqual(stageSteady.stageNum, 4);
  assert.strictEqual(stageSteady.stageLabel, 'Stage 4 of 4: Keeping Habits Sharp');
  assert.strictEqual(stageSteady.summaryTag, 'All checks complete');
  console.log('✓ Stage 4 variants use plain language: "Your Progress Over Time" & "Keeping Habits Sharp"');

  // -------------------------------------------------------------------------
  // TEST 8: Slugs & Internal ID Isolation Check
  // -------------------------------------------------------------------------
  console.log('\n[TEST 8] Verifying Zero Raw Slugs in Titles Across Catalog...');
  const slugsToTest = [
    'pathway-fp-evidence-triage',
    'pathway-upi-collect',
    'pathway-maintenance-reinforcement',
    'pathway-cyber-stalking',
    'pathway-sim-swap'
  ];

  for (const slug of slugsToTest) {
    const resolved = resolvePathwayTitle(slug);
    assert.ok(!resolved.startsWith('pathway-'), `Resolved title for "${slug}" must not start with pathway-`);
    assert.ok(resolved.length > 5, `Resolved title for "${slug}" must be meaningful`);
  }
  console.log('✓ All catalog slugs resolve to human-readable titles');

  // -------------------------------------------------------------------------
  // TEST 9: Resilient Error Handling (Null, Undefined, Negative, NaN)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 9] Testing Selectors Resilience with Missing / Corrupted Parameters...');
  assert.doesNotThrow(() => selectPrimaryNextAction(), 'selectPrimaryNextAction must not throw on undefined');
  assert.doesNotThrow(() => selectPrimaryNextAction({}), 'selectPrimaryNextAction must not throw on empty object');
  assert.doesNotThrow(() => selectJourneyStage(), 'selectJourneyStage must not throw on undefined');
  assert.doesNotThrow(() => selectJourneyStage({}), 'selectJourneyStage must not throw on empty object');

  // Corrupted numbers test (NaN, negative)
  const resCorruptedNumbers = selectPrimaryNextAction({
    hasBaseline: true,
    hasFinal: false,
    completedFocusCount: NaN,
    totalFocusCount: -5,
    pathwaysWithStatus: [nextLesson]
  });
  assert.strictEqual(resCorruptedNumbers.type, 'START_PATHWAY');

  const stageCorrupted = selectJourneyStage({
    hasBaseline: true,
    hasFinal: false,
    completedFocusCount: NaN,
    totalFocusCount: -1
  });
  assert.strictEqual(stageCorrupted.stageNum, 2);
  assert.strictEqual(stageCorrupted.stageLabel, 'Stage 2 of 4: Lessons & Practice');
  console.log('✓ Selectors gracefully sanitize NaN and negative numbers to safe bounds');

  // -------------------------------------------------------------------------
  // TEST 10: Complete State-and-Action Consistency Matrix (Table-Driven)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 10] Running Table-Driven State Consistency Matrix...');
  const matrix = [
    {
      stateName: 'Pre-Baseline',
      input: { hasBaseline: false, hasFinal: false },
      expectedStage: 'Stage 1 of 4: First Check Needed',
      expectedActionType: 'PRE_BASELINE',
      expectedActionLabel: 'Start First Check →'
    },
    {
      stateName: 'Lesson In-Progress',
      input: { hasBaseline: true, hasFinal: false, pathwaysWithStatus: [inProgressStep1], totalFocusCount: 2, completedFocusCount: 0 },
      expectedStage: 'Stage 2 of 4: Lessons & Practice',
      expectedActionType: 'RESUME_PATHWAY',
      expectedActionLabel: 'Read Practical Defense Rule →'
    },
    {
      stateName: 'Review Ready (Stage 2)',
      input: { hasBaseline: true, hasFinal: false, pathwaysWithStatus: [nextLesson], dueSpacedReviews: [dueReview], totalFocusCount: 2, completedFocusCount: 0 },
      expectedStage: 'Stage 2 of 4: Lessons & Practice',
      expectedActionType: 'DUE_SPACED_REVIEW',
      expectedActionLabel: 'Start Quick Review →'
    },
    {
      stateName: 'Ready for Final Check',
      input: { hasBaseline: true, hasFinal: false, pathwaysWithStatus: [{ rec: { pathwayId: 'p1', habitTitle: 'H1' }, isFullyCompleted: true }], totalFocusCount: 1, completedFocusCount: 1 },
      expectedStage: 'Stage 3 of 4: Ready for Final Check',
      expectedActionType: 'READY_FOR_FINAL',
      expectedActionLabel: 'Start Final Check →'
    },
    {
      stateName: 'Practice Safety Habits (Stage 4)',
      input: { hasBaseline: true, hasFinal: true, pathwaysWithStatus: [reinforceItem], hasReinforceEligible: true },
      expectedStage: 'Stage 4 of 4: Practice Your Safety Habits',
      expectedActionType: 'REINFORCE_HABIT',
      expectedActionLabel: 'Practice This Habit →'
    },
    {
      stateName: 'Your Progress Over Time (Stage 4)',
      input: { hasBaseline: true, hasFinal: true, hasTrajectoryReassessment: true },
      expectedStage: 'Stage 4 of 4: Your Progress Over Time',
      expectedActionType: 'ALL_CAUGHT_UP',
      expectedActionLabel: 'Practice Law Quizzes →'
    }
  ];

  for (const row of matrix) {
    const stage = selectJourneyStage(row.input);
    const action = selectPrimaryNextAction(row.input);

    assert.strictEqual(stage.stageLabel, row.expectedStage, `Stage mismatch in ${row.stateName}`);
    assert.strictEqual(action.type, row.expectedActionType, `Action type mismatch in ${row.stateName}`);
    assert.strictEqual(action.actionLabel, row.expectedActionLabel, `Action label mismatch in ${row.stateName}`);
    console.log(`  * PASS: ${row.stateName.padEnd(35)} -> ${stage.stageLabel} | ${action.actionLabel}`);
  }

  // -------------------------------------------------------------------------
  // TEST 11: Retention Status Enum Mapping (Pillar 3 Display Labels)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 11] Testing resolveRetentionStatusLabel for Pillar 3 Status Display...');
  assert.strictEqual(resolveRetentionStatusLabel('pending_reassessment'), 'Awaiting reassessment');
  assert.strictEqual(resolveRetentionStatusLabel('pending_data'), 'Awaiting data');
  assert.strictEqual(resolveRetentionStatusLabel('Retained'), 'Retained');
  assert.strictEqual(resolveRetentionStatusLabel('Stable'), 'Steady');
  assert.strictEqual(resolveRetentionStatusLabel('Partially Retained'), 'Partially retained');
  assert.strictEqual(resolveRetentionStatusLabel('Declined'), 'Needs practice');
  assert.strictEqual(resolveRetentionStatusLabel('Delayed Improvement'), 'Delayed gain');
  assert.strictEqual(resolveRetentionStatusLabel('Developing'), 'Developing');
  assert.strictEqual(resolveRetentionStatusLabel('Unimproved'), 'Needs practice');
  assert.strictEqual(resolveRetentionStatusLabel(null, true), 'Awaiting reassessment');
  assert.strictEqual(resolveRetentionStatusLabel(null, false), 'Awaiting final check');
  console.log('✓ All retention states map cleanly to human-readable, unclipped display labels');

  console.log('\n=============================================================');
  console.log('ALL 11 LEARNING JOURNEY CONSISTENCY TESTS PASSED (100% GREEN)');
  console.log('=============================================================\n');
}

runDashboardLearningJourneySuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
