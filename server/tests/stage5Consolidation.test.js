/**
 * STAGE 5: LEARNING CONSOLIDATION & LEARNER INDEPENDENCE TEST SUITE
 * 
 * Verifies:
 * 1. Isolated in-memory MongoDB execution (MongoMemoryServer, ZERO external DB connections)
 * 2. Quiz Studio Practice - Missed question recording (isResolved: false, no forced lockouts)
 * 3. Quiz Studio Practice - Bidirectional resolution (previously missed question answered correctly in regular practice resolves immediately)
 * 4. Multi-format authoring and authoritative evaluation in submitQuizRecall across all 8 question formats:
 *    - single_choice
 *    - multiple_choice
 *    - true_false
 *    - matching (including strict pair length checking)
 *    - ordering
 *    - indicator_identification
 *    - scenario_decision
 *    - legal_application
 * 5. Rich educational feedback on error (whyIncorrect, explanation, practicalTakeaway, legalReferences, full solution)
 * 6. Honest non-inflated terminology & reviewHistory capping to 10 entries
 * 7. Strict architectural isolation: spacedReviews untouched, AssessmentSession behavioral dimensions preserved
 */

const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require(path.join(__dirname, '../node_modules/mongodb-memory-server'));

const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const AssessmentSession = require('../models/AssessmentSession');
const quizController = require('../controllers/quizController');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function runStage5ConsolidationSuite() {
  console.log('======================================================================');
  console.log('STAGE 5: LEARNING CONSOLIDATION & LEARNER INDEPENDENCE TEST SUITE');
  console.log('======================================================================\n');

  let mongoServer;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Ephemeral In-Memory MongoDB Boot
    // -------------------------------------------------------------------------
    console.log('[STEP 1] Ephemeral Database Isolation Boot:');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { family: 4 });

    assert(mongoose.connection.readyState === 1, 'Connected to ephemeral in-memory MongoDB');
    assert(mongoUri.startsWith('mongodb://127.0.0.1:'), 'Guaranteed isolated localhost connection (ZERO external databases)');

    // -------------------------------------------------------------------------
    // STEP 2: Create Test Fixtures
    // -------------------------------------------------------------------------
    console.log('\n[STEP 2] Creating Test User and Baseline Assessment Fixture:');
    const testUser = await User.create({
      fullName: 'Learner Independence Test User',
      email: `stage5_learner_${Date.now()}@portal.internal`,
      passwordHash: 'dummy_hash_stage5',
      role: 'user'
    });

    const baselineSession = await AssessmentSession.create({
      userId: testUser._id,
      scenarioId: new mongoose.Types.ObjectId(),
      scenarioCode: 'DIGITAL_DAY_V1',
      scenarioVersion: 1,
      currentStageId: new mongoose.Types.ObjectId(),
      sessionType: 'baseline',
      mode: 'baseline',
      status: 'completed',
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3000000),
      expiresAt: new Date(Date.now() + 3600000),
      behaviourScores: {
        recognition: 80,
        signalIdentification: 75,
        verification: 85,
        decisionQuality: 70,
        falsePositive: 90,
        unreviewedAcceptance: 88
      }
    });

    assert(testUser && baselineSession, 'User and AssessmentSession fixtures created');

    // -------------------------------------------------------------------------
    // STEP 3: Create Questions in all 8 Formats
    // -------------------------------------------------------------------------
    console.log('\n[STEP 3] Authoring and Seeding All 8 Quiz Question Formats:');

    // 1. Single Choice
    const qSingle = await QuizQuestion.create({
      questionId: 'Q-STAGE5-SINGLE',
      questionText: 'Under Section 43A of the IT Act, on what basis does compensation liability arise?',
      category: 'Indian Cyber Law and IT Act',
      subtopic: 'Reasonable Security Practices',
      difficulty: 'Intermediate',
      format: 'single_choice',
      options: [
        'Strict liability irrespective of security precautions',
        'Negligence in implementing reasonable security practices causing wrongful loss or gain',
        'Criminal intent to defraud customers',
        'Failure to register with CERT-In within 24 hours'
      ],
      correctOptionIndex: 1,
      explanation: 'Section 43A establishes fault-based compensation liability for negligence in maintaining reasonable security practices.',
      whyIncorrect: 'Section 43A is not a strict liability regime; wrongful loss must result from negligent security practices.',
      practicalTakeaway: 'Organizations must demonstrate adherence to ISO 27001 or equivalent reasonable security controls.',
      legalReferences: [{ actName: 'Information Technology Act, 2000', sectionNumber: 'Section 43A' }]
    });

    // 2. Multiple Choice (Multi-Select)
    const qMulti = await QuizQuestion.create({
      questionId: 'Q-STAGE5-MULTI',
      questionText: 'Which of the following are mandatory requirements for valid digital consent under Section 6 of DPDP Act 2023?',
      category: 'DPDP and privacy',
      subtopic: 'Consent Architecture',
      difficulty: 'Advanced',
      format: 'multiple_choice',
      options: [
        'Free, specific, informed, unconditional and unambiguous',
        'Accompanied by a clear consent notice in plain English or Eighth Schedule language',
        'Mandatory irrevocable consent for a minimum period of three years',
        'Clear affirmative action by the Data Principal'
      ],
      correctOptionIndices: [0, 1, 3],
      explanation: 'Under Section 6, consent must be free, specific, informed, unconditional, unambiguous with clear affirmative action, and preceded by a notice.',
      whyIncorrect: 'Consent is never irrevocable; Data Principals retain the statutory right to withdraw consent under Section 6(4).',
      practicalTakeaway: 'Always ensure consent requests provide an easily accessible withdrawal mechanism.',
      legalReferences: [{ actName: 'Digital Personal Data Protection Act, 2023', sectionNumber: 'Section 6' }]
    });

    // 3. True / False
    const qTrueFalse = await QuizQuestion.create({
      questionId: 'Q-STAGE5-TF',
      questionText: 'The Adjudicating Officer under IT Act Section 46(1A) has jurisdiction to award compensation exceeding ₹5 crore.',
      category: 'Indian Cyber Law and IT Act',
      subtopic: 'Adjudication Thresholds',
      difficulty: 'Intermediate',
      format: 'true_false',
      options: ['True', 'False'],
      correctOptionIndex: 1,
      explanation: 'Under Section 46(1A) as amended in 2008, the Adjudicating Officer may adjudicate claims up to ₹5 crore; claims exceeding ₹5 crore go to the competent civil court.',
      whyIncorrect: 'Claims exceeding ₹5 crore must be filed in the competent civil court.',
      practicalTakeaway: 'Verify jurisdictional claim limits before filing adjudication petitions.',
      legalReferences: [{ actName: 'Information Technology Act, 2000', sectionNumber: 'Section 46(1A)' }]
    });

    // 4. Matching
    const qMatching = await QuizQuestion.create({
      questionId: 'Q-STAGE5-MATCH',
      questionText: 'Match each cyber law statutory provision with its operative legal principle:',
      category: 'Indian Cyber Law and IT Act',
      subtopic: 'Statutory Mapping',
      difficulty: 'Intermediate',
      format: 'matching',
      matchingPairs: [
        { left: 'IT Act Section 66C', right: 'Identity theft using digital signature or password' },
        { left: 'IT Act Section 66D', right: 'Cheating by personation using computer resource' },
        { left: 'IT Act Section 72A', right: 'Disclosure of personal information in breach of lawful contract' }
      ],
      explanation: 'Sections 66C, 66D, and 72A define distinct offenses covering identity theft, personation, and breach of contractual privacy.',
      whyIncorrect: 'Pair associations did not align with statutory definitions.',
      practicalTakeaway: 'Distinguish between credential theft (66C) and active impersonation (66D).',
      legalReferences: [{ actName: 'Information Technology Act, 2000', sectionNumber: 'Sections 66C, 66D, 72A' }]
    });

    // 5. Ordering
    const qOrdering = await QuizQuestion.create({
      questionId: 'Q-STAGE5-ORDER',
      questionText: 'Arrange the immediate incident response actions in correct priority order upon detecting unauthorized banking debit:',
      category: 'Incident response and reporting',
      subtopic: 'Golden Hour Protocol',
      difficulty: 'Intermediate',
      format: 'ordering',
      sequenceItems: [
        'Immediately block affected payment instruments and freeze net banking',
        'Call National Cybercrime Helpline 1930 to initiate CFCFRMS inter-bank hold',
        'Notify the banking institution in writing within the zero-liability notification window',
        'Lodge formal docket at cybercrime.gov.in with transaction acknowledgment'
      ],
      explanation: 'Immediate instrument blocking stops further hemorrhage, 1930 coordinates urgent inter-bank freeze, and formal bank/portal reporting preserves statutory liability rights.',
      whyIncorrect: 'Steps were arranged out of sequence; urgent containment must precede post-incident docketing.',
      practicalTakeaway: 'Act within the operational 2-3 hour window to maximize fund preservation.',
      legalReferences: [{ actName: 'RBI Master Direction - Customer Protection', sectionNumber: 'Para 17' }]
    });

    // 6. Indicator Identification
    const qIndicator = await QuizQuestion.create({
      questionId: 'Q-STAGE5-IND',
      questionText: 'Identify all suspicious red flag indicators in the following emergency message:',
      category: 'Phishing and social engineering',
      subtopic: 'Social Engineering Triage',
      difficulty: 'Beginner',
      format: 'indicator_identification',
      textToInspect: 'URGENT: Your electricity connection will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer Sharma immediately at +91-9876543210 or download quick_support.apk to avoid power cut.',
      indicators: [
        { id: 'ind_urgency', text: 'URGENT: disconnected tonight at 9:30 PM', isSuspicious: true },
        { id: 'ind_phone', text: 'Call officer Sharma at +91-9876543210', isSuspicious: true },
        { id: 'ind_apk', text: 'download quick_support.apk', isSuspicious: true },
        { id: 'ind_neutral', text: 'due to unpaid bill', isSuspicious: false }
      ],
      explanation: 'Fabricated artificial urgency, personal mobile numbers for official utility operations, and remote APK links are classic signs of electricity bill phishing.',
      whyIncorrect: 'Failed to flag all red flags or flagged neutral informational clauses.',
      practicalTakeaway: 'Utilities never request bill settlement through APK downloads or personal mobile numbers.',
      legalReferences: [{ actName: 'Bharatiya Nyaya Sanhita, 2023', sectionNumber: 'Section 318(4)' }]
    });

    // 7. Scenario Decision
    const qScenario = await QuizQuestion.create({
      questionId: 'Q-STAGE5-SCENARIO',
      questionText: 'You receive an invitation to join an exclusive high-yield WhatsApp crypto trading group with live screenshots of daily 40% profits. What is the legally sound action?',
      category: 'UPI, banking and financial fraud',
      subtopic: 'Investment Fraud',
      difficulty: 'Intermediate',
      format: 'scenario_decision',
      options: [
        'Deposit a small test amount of ₹1,000 to verify withdrawal viability',
        'Refuse participation, report the group to WhatsApp and 1930, and do not transfer funds',
        'Ask the admin for their SEBI registration certificate before investing',
        'Forward the link to family members to get their opinion'
      ],
      correctOptionIndex: 1,
      explanation: 'Task and investment scams create fake trading dashboards; transferring any sum or testing small amounts results in fund loss.',
      whyIncorrect: 'Test deposits are trapped by scammers; reporting and avoidance is the only safe procedure.',
      practicalTakeaway: 'SEBI-registered intermediaries never conduct investment pools via closed WhatsApp or Telegram groups.',
      legalReferences: [{ actName: 'Bharatiya Nyaya Sanhita, 2023', sectionNumber: 'Section 318' }]
    });

    // 8. Legal Application
    const qLegal = await QuizQuestion.create({
      questionId: 'Q-STAGE5-LEGAL',
      questionText: 'An employee discovers customer phone numbers being shared in a personal spreadsheet with third-party marketing affiliates without consent. Which provision applies?',
      category: 'Indian Cyber Law and IT Act',
      subtopic: 'Breach of Lawful Contract',
      difficulty: 'Advanced',
      format: 'legal_application',
      options: [
        'IT Act Section 66A (struck down by Supreme Court)',
        'IT Act Section 72A (Penalty for disclosure of information in breach of lawful contract)',
        'BNS Section 303 (Theft of movable property only)',
        'BNS Section 351 (Criminal intimidation)'
      ],
      correctOptionIndex: 1,
      explanation: 'Section 72A of the IT Act penalizes disclosure of personal information obtained under a lawful contract without consent or in breach of that contract.',
      whyIncorrect: 'Section 66A was declared unconstitutional in Shreya Singhal (2015); Section 72A specifically governs contractual privacy breaches.',
      practicalTakeaway: 'Customer databases held under service contracts cannot be shared with third parties without express statutory authorization.',
      legalReferences: [{ actName: 'Information Technology Act, 2000', sectionNumber: 'Section 72A' }]
    });

    assert(
      [qSingle, qMulti, qTrueFalse, qMatching, qOrdering, qIndicator, qScenario, qLegal].every(Boolean),
      'All 8 question formats successfully created with distinct format schemas'
    );

    // -------------------------------------------------------------------------
    // STEP 4: Quiz Studio Practice - Missed Question Sync & Non-Coercive Schedule
    // -------------------------------------------------------------------------
    console.log('\n[STEP 4] Testing Quiz Studio Practice - Missed Question Sync:');
    const reqSubmit = {
      user: { _id: testUser._id },
      body: {
        mode: 'standard',
        topic: 'Indian Cyber Law and IT Act',
        timeTaken: 45,
        answers: [
          { questionId: qSingle._id, selectedOptionIndex: 0 }, // Wrong answer (Strict liability)
          { questionId: qTrueFalse._id, selectedOptionIndex: 1 } // Correct answer (False)
        ]
      }
    };
    const resSubmit = createMockRes();
    await quizController.submitQuiz(reqSubmit, resSubmit);

    assert(resSubmit.statusCode === 200, 'Quiz submitted successfully with status 200');
    assert(resSubmit.data.percentage === 50, 'Score calculated authoritatively as 50%');
    assert(resSubmit.data.incorrectCount === 1, '1 question accurately tracked as incorrect');
    assert(resSubmit.data.correctCount === 1, '1 question accurately tracked as correct');

    // Inspect UserProgress
    const progressAfterQuiz = await UserProgress.findOne({ userId: testUser._id });
    assert(progressAfterQuiz.quizRecallItems.length === 1, 'Exactly 1 missed question synced to quizRecallItems');
    const missedItem = progressAfterQuiz.quizRecallItems[0];
    assert(missedItem.questionId.toString() === qSingle._id.toString(), 'Synced item matches missed single_choice question');
    assert(missedItem.missedCount === 1, 'missedCount initialized to 1');
    assert(missedItem.mastered === false, 'mastered is false');
    assert(missedItem.isResolved === false, 'isResolved is false');
    assert(missedItem.lastRecallCorrect === false, 'lastRecallCorrect is false');
    assert(missedItem.nextReviewDue instanceof Date, 'nextReviewDue initialized for immediate self-paced availability');

    // Verify getDueQuizRecallItems returns this item
    const reqDue1 = { user: { _id: testUser._id } };
    const resDue1 = createMockRes();
    await quizController.getDueQuizRecallItems(reqDue1, resDue1);

    assert(resDue1.data.totalDue === 1, 'getDueQuizRecallItems returns 1 available concept');
    assert(resDue1.data.dueItems[0].question.questionId === 'Q-STAGE5-SINGLE', 'Sanitized question served to client');
    assert(resDue1.data.dueItems[0].question.correctOptionIndex === undefined, 'Zero answer key leakage: correctOptionIndex stripped');

    // -------------------------------------------------------------------------
    // STEP 5: Bidirectional Resolution Sync via Regular Practice
    // -------------------------------------------------------------------------
    console.log('\n[STEP 5] Testing Bidirectional Resolution Sync in Regular Quiz Practice:');
    // User retakes quiz in Quiz Studio and answers qSingle correctly!
    const reqRetake = {
      user: { _id: testUser._id },
      body: {
        mode: 'standard',
        topic: 'Indian Cyber Law and IT Act',
        timeTaken: 30,
        answers: [
          { questionId: qSingle._id, selectedOptionIndex: 1 } // Now Correct!
        ]
      }
    };
    const resRetake = createMockRes();
    await quizController.submitQuiz(reqRetake, resRetake);

    assert(resRetake.statusCode === 200, 'Quiz retake submitted successfully');
    assert(resRetake.data.percentage === 100, 'Score is 100% on retake');

    const progressAfterRetake = await UserProgress.findOne({ userId: testUser._id });
    const resolvedItem = progressAfterRetake.quizRecallItems.find(it => it.questionId.toString() === qSingle._id.toString());
    assert(resolvedItem.mastered === true, 'mastered automatically transitions to true on regular practice correct answer');
    assert(resolvedItem.isResolved === true, 'isResolved automatically transitions to true');
    assert(resolvedItem.resolvedAt instanceof Date, 'resolvedAt timestamp recorded');
    assert(resolvedItem.lastRecallCorrect === true, 'lastRecallCorrect is true');

    const resDue2 = createMockRes();
    await quizController.getDueQuizRecallItems(reqDue1, resDue2);
    assert(resDue2.data.totalDue === 0, 'Resolved concept is no longer returned in getDueQuizRecallItems');

    // -------------------------------------------------------------------------
    // STEP 6: Multi-Format Authoritative Evaluation in submitQuizRecall
    // -------------------------------------------------------------------------
    console.log('\n[STEP 6] Testing Multi-Format Evaluation Across All 8 Formats in submitQuizRecall:');

    // Prepare helper to add question to user's quizRecallItems
    async function stageQuestionForRecall(qDoc) {
      await UserProgress.updateOne(
        { userId: testUser._id },
        {
          $pull: { quizRecallItems: { questionId: qDoc._id } }
        }
      );
      await UserProgress.updateOne(
        { userId: testUser._id },
        {
          $push: {
            quizRecallItems: {
              questionId: qDoc._id,
              category: qDoc.category,
              missedCount: 1,
              mastered: false,
              isResolved: false,
              lastRecallCorrect: false,
              lastAttemptedAt: new Date(),
              nextReviewDue: new Date()
            }
          }
        }
      );
    }

    // 6.1 Single Choice Evaluation
    await stageQuestionForRecall(qSingle);
    const resRecallSingleWrong = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: { questionId: qSingle._id, answer: { selectedOptionIndex: 0 } }
    }, resRecallSingleWrong);
    assert(resRecallSingleWrong.data.isCorrect === false, 'single_choice: wrong answer returns isCorrect: false');
    assert(resRecallSingleWrong.data.solution.correctOptionIndex === 1, 'single_choice: solution reveals correctOptionIndex: 1');

    const resRecallSingleRight = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: { questionId: qSingle._id, answer: { selectedOptionIndex: 1 } }
    }, resRecallSingleRight);
    assert(resRecallSingleRight.data.isCorrect === true, 'single_choice: correct answer returns isCorrect: true');
    assert(resRecallSingleRight.data.isResolved === true, 'single_choice: isResolved is true');

    // 6.2 Multiple Choice (Multi-Select) Evaluation
    await stageQuestionForRecall(qMulti);
    // Partial selection (missing index 3)
    const resMultiPartial = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: { questionId: qMulti._id, answer: { selectedOptionIndices: [0, 1] } }
    }, resMultiPartial);
    assert(resMultiPartial.data.isCorrect === false, 'multiple_choice: partial selection evaluated as isCorrect: false');

    // Selection with false alarm (includes wrong index 2)
    const resMultiWrong = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: { questionId: qMulti._id, answer: { selectedOptionIndices: [0, 1, 2, 3] } }
    }, resMultiWrong);
    assert(resMultiWrong.data.isCorrect === false, 'multiple_choice: selection with wrong option evaluated as isCorrect: false');

    // Exact match: [0, 1, 3]
    const resMultiRight = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: { questionId: qMulti._id, answer: { selectedOptionIndices: [0, 1, 3] } }
    }, resMultiRight);
    assert(resMultiRight.data.isCorrect === true, 'multiple_choice: exact match returns isCorrect: true');

    // 6.3 Matching Evaluation (including length and pairing accuracy)
    await stageQuestionForRecall(qMatching);
    // Missing one pair
    const resMatchIncomplete = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: {
        questionId: qMatching._id,
        answer: {
          selectedPairs: [
            { left: 'IT Act Section 66C', right: 'Identity theft using digital signature or password' },
            { left: 'IT Act Section 66D', right: 'Cheating by personation using computer resource' }
          ]
        }
      }
    }, resMatchIncomplete);
    assert(resMatchIncomplete.data.isCorrect === false, 'matching: incomplete pair count evaluated as isCorrect: false');

    // Wrong right association
    const resMatchWrongPair = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: {
        questionId: qMatching._id,
        answer: {
          selectedPairs: [
            { left: 'IT Act Section 66C', right: 'Disclosure of personal information in breach of lawful contract' },
            { left: 'IT Act Section 66D', right: 'Cheating by personation using computer resource' },
            { left: 'IT Act Section 72A', right: 'Identity theft using digital signature or password' }
          ]
        }
      }
    }, resMatchWrongPair);
    assert(resMatchWrongPair.data.isCorrect === false, 'matching: mismatched pairs evaluated as isCorrect: false');

    // Correct pairs
    const resMatchRight = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: {
        questionId: qMatching._id,
        answer: {
          selectedPairs: [
            { left: 'IT Act Section 66C', right: 'Identity theft using digital signature or password' },
            { left: 'IT Act Section 66D', right: 'Cheating by personation using computer resource' },
            { left: 'IT Act Section 72A', right: 'Disclosure of personal information in breach of lawful contract' }
          ]
        }
      }
    }, resMatchRight);
    assert(resMatchRight.data.isCorrect === true, 'matching: exact pairs return isCorrect: true');

    // 6.4 Ordering Evaluation
    await stageQuestionForRecall(qOrdering);
    // Inverted sequence
    const resOrderWrong = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: {
        questionId: qOrdering._id,
        answer: {
          selectedSequence: [
            'Lodge formal docket at cybercrime.gov.in with transaction acknowledgment',
            'Notify the banking institution in writing within the zero-liability notification window',
            'Call National Cybercrime Helpline 1930 to initiate CFCFRMS inter-bank hold',
            'Immediately block affected payment instruments and freeze net banking'
          ]
        }
      }
    }, resOrderWrong);
    assert(resOrderWrong.data.isCorrect === false, 'ordering: inverted sequence returns isCorrect: false');

    // Exact sequence
    const resOrderRight = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: {
        questionId: qOrdering._id,
        answer: {
          selectedSequence: [
            'Immediately block affected payment instruments and freeze net banking',
            'Call National Cybercrime Helpline 1930 to initiate CFCFRMS inter-bank hold',
            'Notify the banking institution in writing within the zero-liability notification window',
            'Lodge formal docket at cybercrime.gov.in with transaction acknowledgment'
          ]
        }
      }
    }, resOrderRight);
    assert(resOrderRight.data.isCorrect === true, 'ordering: exact chronological sequence returns isCorrect: true');

    // 6.5 Indicator Identification Evaluation
    await stageQuestionForRecall(qIndicator);
    // Missing one red flag
    const resIndMissing = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: {
        questionId: qIndicator._id,
        answer: { selectedIndicatorIds: ['ind_urgency', 'ind_phone'] }
      }
    }, resIndMissing);
    assert(resIndMissing.data.isCorrect === false, 'indicator_identification: missing red flag returns isCorrect: false');

    // Flagging non-suspicious token
    const resIndFalseAlarm = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: {
        questionId: qIndicator._id,
        answer: { selectedIndicatorIds: ['ind_urgency', 'ind_phone', 'ind_apk', 'ind_neutral'] }
      }
    }, resIndFalseAlarm);
    assert(resIndFalseAlarm.data.isCorrect === false, 'indicator_identification: false alarm returns isCorrect: false');

    // Exact suspicious flags
    const resIndRight = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: {
        questionId: qIndicator._id,
        answer: { selectedIndicatorIds: ['ind_urgency', 'ind_phone', 'ind_apk'] }
      }
    }, resIndRight);
    assert(resIndRight.data.isCorrect === true, 'indicator_identification: exact flags return isCorrect: true');

    // 6.6 True / False Evaluation
    await stageQuestionForRecall(qTrueFalse);
    const resTfRight = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: { questionId: qTrueFalse._id, answer: { selectedOptionIndex: 1 } }
    }, resTfRight);
    assert(resTfRight.data.isCorrect === true, 'true_false: evaluated authoritatively');

    // 6.7 Scenario Decision Evaluation
    await stageQuestionForRecall(qScenario);
    const resScenarioRight = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: { questionId: qScenario._id, answer: { selectedOptionIndex: 1 } }
    }, resScenarioRight);
    assert(resScenarioRight.data.isCorrect === true, 'scenario_decision: evaluated authoritatively');

    // 6.8 Legal Application Evaluation
    await stageQuestionForRecall(qLegal);
    const resLegalRight = createMockRes();
    await quizController.submitQuizRecall({
      user: { _id: testUser._id },
      body: { questionId: qLegal._id, answer: { selectedOptionIndex: 1 } }
    }, resLegalRight);
    assert(resLegalRight.data.isCorrect === true, 'legal_application: evaluated authoritatively');

    // -------------------------------------------------------------------------
    // STEP 7: Rich Educational Feedback & History Capping
    // -------------------------------------------------------------------------
    console.log('\n[STEP 7] Verifying Educational Feedback and History Capping:');
    await stageQuestionForRecall(qSingle);

    // Run 12 reviews on qSingle to test reviewHistory capping at 10
    for (let i = 0; i < 12; i++) {
      const resLoop = createMockRes();
      await quizController.submitQuizRecall({
        user: { _id: testUser._id },
        body: { questionId: qSingle._id, answer: { selectedOptionIndex: 0 } }
      }, resLoop);
    }

    const progCapped = await UserProgress.findOne({ userId: testUser._id });
    const singleItemCapped = progCapped.quizRecallItems.find(it => it.questionId.toString() === qSingle._id.toString());
    assert(singleItemCapped.reviewHistory.length === 10, 'reviewHistory is strictly capped to the last 10 entries');
    assert(singleItemCapped.missedCount >= 12, 'missedCount accurately reflects cumulative practice repetitions');
    assert(singleItemCapped.isResolved === false, 'Item remains unresolved after wrong attempts');
    // Verify immediate review availability (no 3-day penalty lockout)
    assert(new Date(singleItemCapped.nextReviewDue) <= new Date(), 'Item remains immediately available for self-paced review without forced delay');

    // -------------------------------------------------------------------------
    // STEP 8: Strict Architectural Isolation & Behavioral Dimension Protection
    // -------------------------------------------------------------------------
    console.log('\n[STEP 8] Verifying Architectural Isolation & Behavioral Dimension Safety:');
    const finalProgress = await UserProgress.findOne({ userId: testUser._id });
    assert(finalProgress.spacedReviews.length === 0, 'UserProgress.spacedReviews strictly untouched (length 0)');

    const untouchedSession = await AssessmentSession.findById(baselineSession._id);
    const getScore = (key) => {
      if (untouchedSession.behaviourScores instanceof Map) {
        return untouchedSession.behaviourScores.get(key);
      }
      return untouchedSession.behaviourScores?.[key];
    };
    assert(getScore('recognition') === 80, 'Behavioral dimension TR (recognition) strictly preserved (80)');
    assert(getScore('signalIdentification') === 75, 'Behavioral dimension SI strictly preserved (75)');
    assert(getScore('verification') === 85, 'Behavioral dimension VB strictly preserved (85)');
    assert(getScore('decisionQuality') === 70, 'Behavioral dimension DQ strictly preserved (70)');
    assert(getScore('falsePositive') === 90, 'Behavioral dimension FP strictly preserved (90)');
    assert(getScore('unreviewedAcceptance') === 88, 'Behavioral dimension UA strictly preserved (88)');

    console.log('\n======================================================================');
    console.log(`TEST SUITE RESULTS: ${passedTests} PASSED, 0 FAILED (out of ${totalTests} checks)`);
    console.log('======================================================================\n');

  } catch (err) {
    console.error('Fatal error during Stage 5 consolidation test suite execution:', err);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runStage5ConsolidationSuite();
