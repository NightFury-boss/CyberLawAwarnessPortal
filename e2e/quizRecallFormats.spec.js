// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Stage 5: Multi-Format Concept Recall & Learner Independence E2E Suite', () => {
  let submittedRecallAnswers = [];

  const mockQuestions = [
    // 1. Single Choice
    {
      recallItemId: 'rec_01',
      questionId: 'q_single_43a',
      category: 'Indian Cyber Law and IT Act',
      missedCount: 1,
      lastAttemptedAt: new Date().toISOString(),
      question: {
        id: 'q_single_43a',
        questionId: 'Q-STAGE5-SINGLE',
        format: 'single_choice',
        questionText: 'Under Section 43A of the IT Act, on what basis does compensation liability arise?',
        category: 'Indian Cyber Law and IT Act',
        subtopic: 'Reasonable Security Practices',
        difficulty: 'Intermediate',
        cognitiveLevel: 'Level 2',
        options: [
          'Strict liability irrespective of security precautions',
          'Negligence in implementing reasonable security practices causing wrongful loss or gain',
          'Criminal intent to defraud customers',
          'Failure to register with CERT-In within 24 hours'
        ]
      }
    },
    // 2. Multiple Choice (Multi-select)
    {
      recallItemId: 'rec_02',
      questionId: 'q_multi_dpdp',
      category: 'DPDP and privacy',
      missedCount: 2,
      lastAttemptedAt: new Date().toISOString(),
      question: {
        id: 'q_multi_dpdp',
        questionId: 'Q-STAGE5-MULTI',
        format: 'multiple_choice',
        questionText: 'Which of the following are mandatory requirements for valid digital consent under Section 6 of DPDP Act 2023?',
        category: 'DPDP and privacy',
        subtopic: 'Consent Architecture',
        difficulty: 'Advanced',
        cognitiveLevel: 'Level 3',
        options: [
          'Free, specific, informed, unconditional and unambiguous',
          'Accompanied by a clear consent notice in plain English or Eighth Schedule language',
          'Mandatory irrevocable consent for a minimum period of three years',
          'Clear affirmative action by the Data Principal'
        ]
      }
    },
    // 3. Matching
    {
      recallItemId: 'rec_03',
      questionId: 'q_match_itact',
      category: 'Indian Cyber Law and IT Act',
      missedCount: 1,
      lastAttemptedAt: new Date().toISOString(),
      question: {
        id: 'q_match_itact',
        questionId: 'Q-STAGE5-MATCH',
        format: 'matching',
        questionText: 'Match each cyber law statutory provision with its operative legal principle:',
        category: 'Indian Cyber Law and IT Act',
        subtopic: 'Statutory Mapping',
        difficulty: 'Intermediate',
        cognitiveLevel: 'Level 3',
        leftItems: [
          'IT Act Section 66C',
          'IT Act Section 66D',
          'IT Act Section 72A'
        ],
        rightItems: [
          'Identity theft using digital signature or password',
          'Cheating by personation using computer resource',
          'Disclosure of personal information in breach of lawful contract'
        ]
      }
    },
    // 4. Ordering
    {
      recallItemId: 'rec_04',
      questionId: 'q_order_incident',
      category: 'Incident response and reporting',
      missedCount: 1,
      lastAttemptedAt: new Date().toISOString(),
      question: {
        id: 'q_order_incident',
        questionId: 'Q-STAGE5-ORDER',
        format: 'ordering',
        questionText: 'Arrange the immediate incident response actions in correct priority order upon detecting unauthorized banking debit:',
        category: 'Incident response and reporting',
        subtopic: 'Golden Hour Protocol',
        difficulty: 'Intermediate',
        cognitiveLevel: 'Level 4',
        sequenceItems: [
          'Call National Cybercrime Helpline 1930 to initiate CFCFRMS inter-bank hold',
          'Immediately block affected payment instruments and freeze net banking',
          'Notify the banking institution in writing within the zero-liability notification window',
          'Lodge formal docket at cybercrime.gov.in with transaction acknowledgment'
        ]
      }
    },
    // 5. Indicator Identification
    {
      recallItemId: 'rec_05',
      questionId: 'q_ind_phish',
      category: 'Phishing and social engineering',
      missedCount: 1,
      lastAttemptedAt: new Date().toISOString(),
      question: {
        id: 'q_ind_phish',
        questionId: 'Q-STAGE5-IND',
        format: 'indicator_identification',
        questionText: 'Identify all suspicious red flag indicators in the following emergency message:',
        category: 'Phishing and social engineering',
        subtopic: 'Social Engineering Triage',
        difficulty: 'Beginner',
        cognitiveLevel: 'Level 2',
        textToInspect: 'URGENT: Your electricity connection will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer Sharma immediately at +91-9876543210 or download quick_support.apk to avoid power cut.',
        indicators: [
          { id: 'ind_urgency', text: 'URGENT: disconnected tonight at 9:30 PM' },
          { id: 'ind_phone', text: 'Call officer Sharma at +91-9876543210' },
          { id: 'ind_apk', text: 'download quick_support.apk' },
          { id: 'ind_neutral', text: 'due to unpaid bill' }
        ]
      }
    },
    // 6. True / False
    {
      recallItemId: 'rec_06',
      questionId: 'q_tf_threshold',
      category: 'Indian Cyber Law and IT Act',
      missedCount: 1,
      lastAttemptedAt: new Date().toISOString(),
      question: {
        id: 'q_tf_threshold',
        questionId: 'Q-STAGE5-TF',
        format: 'true_false',
        questionText: 'The Adjudicating Officer under IT Act Section 46(1A) has jurisdiction to award compensation exceeding ₹5 crore.',
        category: 'Indian Cyber Law and IT Act',
        subtopic: 'Adjudication Thresholds',
        difficulty: 'Intermediate',
        cognitiveLevel: 'Level 2',
        options: ['True', 'False']
      }
    },
    // 7. Scenario Decision
    {
      recallItemId: 'rec_07',
      questionId: 'q_scen_crypto',
      category: 'UPI, banking and financial fraud',
      missedCount: 1,
      lastAttemptedAt: new Date().toISOString(),
      question: {
        id: 'q_scen_crypto',
        questionId: 'Q-STAGE5-SCENARIO',
        format: 'scenario_decision',
        questionText: 'You receive an invitation to join an exclusive high-yield WhatsApp crypto trading group with live screenshots of daily 40% profits. What is the legally sound action?',
        category: 'UPI, banking and financial fraud',
        subtopic: 'Investment Fraud',
        difficulty: 'Intermediate',
        cognitiveLevel: 'Level 3',
        options: [
          'Deposit a small test amount of ₹1,000 to verify withdrawal viability',
          'Refuse participation, report the group to WhatsApp and 1930, and do not transfer funds',
          'Ask the admin for their SEBI registration certificate before investing',
          'Forward the link to family members to get their opinion'
        ]
      }
    },
    // 8. Legal Application
    {
      recallItemId: 'rec_08',
      questionId: 'q_legal_72a',
      category: 'Indian Cyber Law and IT Act',
      missedCount: 1,
      lastAttemptedAt: new Date().toISOString(),
      question: {
        id: 'q_legal_72a',
        questionId: 'Q-STAGE5-LEGAL',
        format: 'legal_application',
        questionText: 'An employee discovers customer phone numbers being shared in a personal spreadsheet with third-party marketing affiliates without consent. Which provision applies?',
        category: 'Indian Cyber Law and IT Act',
        subtopic: 'Breach of Lawful Contract',
        difficulty: 'Advanced',
        cognitiveLevel: 'Level 4',
        options: [
          'IT Act Section 66A (struck down by Supreme Court)',
          'IT Act Section 72A (Penalty for disclosure of information in breach of lawful contract)',
          'BNS Section 303 (Theft of movable property only)',
          'BNS Section 351 (Criminal intimidation)'
        ]
      }
    }
  ];

  test.beforeEach(async ({ page }) => {
    submittedRecallAnswers = [];

    // Seed mock authentication in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock_jwt_stage5_token');
      window.localStorage.setItem('user', JSON.stringify({
        _id: 'usr_stage5_tester',
        fullName: 'Stage 5 Learner Independence Tester',
        email: 'stage5@cyberlawportal.test',
        role: 'user'
      }));
    });

    // Intercept all API calls
    await page.route('**/api/**', async (route) => {
      const req = route.request();
      const url = req.url();
      const method = req.method();

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      };

      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }

      // 1. Auth check
      if (url.includes('/api/auth/me')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              _id: 'usr_stage5_tester',
              fullName: 'Stage 5 Learner Independence Tester',
              email: 'stage5@cyberlawportal.test',
              role: 'user'
            }
          })
        });
        return;
      }

      // 2. User Progress
      if (url.includes('/api/progress') && method === 'GET') {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            userId: 'usr_stage5_tester',
            currentStreak: 3,
            completedModules: ['it-act-2000-essentials'],
            badgesEarned: ['First Step'],
            quizRecallItems: mockQuestions.map(m => ({
              questionId: m.questionId,
              missedCount: m.missedCount,
              mastered: false,
              isResolved: false
            }))
          })
        });
        return;
      }

      // 3. Assessment status
      if (url.includes('/api/assessments/status/')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            hasTaken: true,
            completed: true,
            sessionId: 'sess_baseline_001'
          })
        });
        return;
      }

      // 4. Secondary enrichment endpoints
      if (url.includes('/api/assessments/portfolio') || url.includes('/api/assessments/trajectory')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, items: [] })
        });
        return;
      }

      if (url.includes('/api/assessments/spaced-retrieval/due')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({ dueReviews: [] })
        });
        return;
      }

      if (url.includes('/api/quizzes/history')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            totalAttempts: 5,
            highScores: 3,
            dueRecallCount: 8,
            overallAccuracyPercent: 78,
            recentAttempts: []
          })
        });
        return;
      }

      // 5. GET /api/quizzes/recall/due
      if (url.includes('/api/quizzes/recall/due')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            totalDue: mockQuestions.length,
            dueItems: mockQuestions
          })
        });
        return;
      }

      // 6. POST /api/quizzes/recall/submit
      if (url.includes('/api/quizzes/recall/submit') && method === 'POST') {
        const postData = JSON.parse(req.postData() || '{}');
        submittedRecallAnswers.push(postData);

        const { questionId, answer } = postData;
        let isCorrect = false;
        let whyIncorrect = 'This selection does not align with established statutory provisions.';
        let explanation = 'Authoritative statutory reasoning confirms the correct procedure.';
        let practicalTakeaway = 'Always verify communications through trusted primary channels.';
        let solution = {};

        // Mock authoritative evaluation
        if (questionId === 'q_single_43a') {
          isCorrect = (answer?.selectedOptionIndex === 1);
          solution = { correctOptionIndex: 1 };
        } else if (questionId === 'q_multi_dpdp') {
          const sel = answer?.selectedOptionIndices || [];
          isCorrect = (sel.length === 3 && [0, 1, 3].every(idx => sel.includes(idx)));
          solution = { correctOptionIndices: [0, 1, 3] };
        } else if (questionId === 'q_match_itact') {
          const pairs = answer?.selectedPairs || [];
          const authMap = {
            'IT Act Section 66C': 'Identity theft using digital signature or password',
            'IT Act Section 66D': 'Cheating by personation using computer resource',
            'IT Act Section 72A': 'Disclosure of personal information in breach of lawful contract'
          };
          isCorrect = pairs.length === 3 && pairs.every(p => authMap[p.left] === p.right);
          solution = {
            matchingPairs: [
              { left: 'IT Act Section 66C', right: 'Identity theft using digital signature or password' },
              { left: 'IT Act Section 66D', right: 'Cheating by personation using computer resource' },
              { left: 'IT Act Section 72A', right: 'Disclosure of personal information in breach of lawful contract' }
            ]
          };
        } else if (questionId === 'q_order_incident') {
          const seq = answer?.selectedSequence || [];
          isCorrect = (
            seq.length === 4 &&
            seq[0] === 'Immediately block affected payment instruments and freeze net banking'
          );
          solution = {
            sequenceItems: [
              'Immediately block affected payment instruments and freeze net banking',
              'Call National Cybercrime Helpline 1930 to initiate CFCFRMS inter-bank hold',
              'Notify the banking institution in writing within the zero-liability notification window',
              'Lodge formal docket at cybercrime.gov.in with transaction acknowledgment'
            ]
          };
        } else if (questionId === 'q_ind_phish') {
          const flags = answer?.selectedIndicatorIds || [];
          isCorrect = (flags.length === 3 && ['ind_urgency', 'ind_phone', 'ind_apk'].every(id => flags.includes(id)));
          solution = {
            indicators: [
              { id: 'ind_urgency', text: 'URGENT: disconnected tonight at 9:30 PM', isSuspicious: true },
              { id: 'ind_phone', text: 'Call officer Sharma at +91-9876543210', isSuspicious: true },
              { id: 'ind_apk', text: 'download quick_support.apk', isSuspicious: true }
            ]
          };
        } else if (questionId === 'q_tf_threshold') {
          isCorrect = (answer?.selectedOptionIndex === 1);
          solution = { correctOptionIndex: 1 };
        } else if (questionId === 'q_scen_crypto') {
          isCorrect = (answer?.selectedOptionIndex === 1);
          solution = { correctOptionIndex: 1 };
        } else if (questionId === 'q_legal_72a') {
          isCorrect = (answer?.selectedOptionIndex === 1);
          solution = { correctOptionIndex: 1 };
        }

        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            isCorrect,
            mastered: isCorrect,
            isResolved: isCorrect,
            explanation,
            whyIncorrect: isCorrect ? null : whyIncorrect,
            practicalTakeaway,
            legalReferences: [{ act: 'Information Technology Act, 2000', section: 'Section 43A' }],
            solution
          })
        });
        return;
      }

      await route.continue();
    });
  });

  // ---------------------------------------------------------------------------
  // TEST 1: Full Desktop Journey Covering All Eight Formats & Neutral Feedback
  // ---------------------------------------------------------------------------
  test('Desktop: renders all eight recall formats, supports submissions, and presents neutral feedback', async ({ page }) => {
    await page.goto('/dashboard');

    // 1. Verify dashboard practice card shows optional non-coercive concept review
    const practiceHeading = page.locator('h2:has-text("Practice Atelier")');
    await expect(practiceHeading).toBeVisible({ timeout: 15000 });

    const recallTag = page.locator('.atelier-recall-tag');
    await expect(recallTag).toHaveText('Optional Concept Practice');

    const recallCount = page.locator('.atelier-recall-count');
    await expect(recallCount).toHaveText('8 Missed Concepts');

    // Launch the recall modal
    const reviewBtn = page.locator('button.atelier-recall-btn:has-text("Review Missed Concepts")');
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    // Verify modal container with accessible ARIA dialog attributes
    const modalDialog = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modalDialog).toBeVisible();
    await expect(page.locator('#recall-modal-title')).toHaveText('Indian Cyber Law and IT Act');

    // FORMAT 1: Single Choice (Incorrect submission first, then inspect feedback)
    console.log('[Playwright] Testing Format 1: single_choice');
    await expect(page.locator('text=Under Section 43A of the IT Act')).toBeVisible();

    const radioOptionsF1 = modalDialog.locator('[role="radio"]');
    await expect(radioOptionsF1).toHaveCount(4);

    // Click Option A (Strict liability - incorrect)
    await radioOptionsF1.nth(0).click();
    await expect(radioOptionsF1.nth(0)).toHaveAttribute('aria-checked', 'true');

    const checkBtn = modalDialog.locator('button:has-text("Check Answer")');
    await expect(checkBtn).toBeEnabled();
    await checkBtn.click();

    // Verify neutral feedback on incorrect submission
    await expect(modalDialog.locator('text=⚠️ Incorrect')).toBeVisible();
    const solutionBox = modalDialog.locator('text=Authoritative Correct Answer:').locator('..');
    await expect(solutionBox).toBeVisible();
    await expect(solutionBox.locator('text=Negligence in implementing reasonable security practices')).toBeVisible();

    // Advance to next question
    await modalDialog.locator('button:has-text("Next Concept →")').click();

    // FORMAT 2: Multiple Choice (Multi-Select)
    console.log('[Playwright] Testing Format 2: multiple_choice');
    await expect(modalDialog.locator('text=Select all options that apply')).toBeVisible();
    await expect(modalDialog.locator('text=Section 6 of DPDP Act 2023')).toBeVisible();

    const checkboxes = modalDialog.locator('[role="checkbox"]');
    await expect(checkboxes).toHaveCount(4);

    // Check options A, B, and D
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(3).click();
    await expect(checkboxes.nth(0)).toHaveAttribute('aria-checked', 'true');
    await expect(checkboxes.nth(1)).toHaveAttribute('aria-checked', 'true');
    await expect(checkboxes.nth(3)).toHaveAttribute('aria-checked', 'true');

    await modalDialog.locator('button:has-text("Check Answer")').click();

    // Verify neutral feedback: "✓ Correct answer" (DO NOT imply permanent mastery)
    await expect(modalDialog.locator('text=✓ Correct answer')).toBeVisible();
    await expect(modalDialog.locator('text=Your answer matches the statutory principle.')).toBeVisible();
    await expect(modalDialog.locator('text=Concept Mastered')).not.toBeVisible();
    await expect(modalDialog.locator('text=Concept Clarified & Understood')).not.toBeVisible();

    await modalDialog.locator('button:has-text("Next Concept →")').click();

    // FORMAT 3: Matching Pairs
    console.log('[Playwright] Testing Format 3: matching');
    await expect(modalDialog.locator('text=Pair each provision or vector with its corresponding definition:')).toBeVisible();
    const selects = modalDialog.locator('.quiz-matching-select');
    await expect(selects).toHaveCount(3);

    // Pair each item
    await selects.nth(0).selectOption('Identity theft using digital signature or password');
    await selects.nth(1).selectOption('Cheating by personation using computer resource');
    await selects.nth(2).selectOption('Disclosure of personal information in breach of lawful contract');

    await expect(modalDialog.locator('button:has-text("Check Answer")')).toBeEnabled();
    await modalDialog.locator('button:has-text("Check Answer")').click();
    await expect(modalDialog.locator('text=✓ Correct answer')).toBeVisible();
    await modalDialog.locator('button:has-text("Next Concept →")').click();

    // FORMAT 4: Ordering (Sequence)
    console.log('[Playwright] Testing Format 4: ordering');
    await expect(modalDialog.locator('text=Arrange the steps in the correct chronological order:')).toBeVisible();
    const orderItems = modalDialog.locator('.quiz-ordering-item');
    await expect(orderItems).toHaveCount(4);

    // Click "Up" button on item 2 to move it to position 1
    const upBtn = orderItems.nth(1).locator('button:has-text("▲ Up")');
    await upBtn.click();

    await expect(modalDialog.locator('button:has-text("Check Answer")')).toBeEnabled();
    await modalDialog.locator('button:has-text("Check Answer")').click();
    await expect(modalDialog.locator('text=✓ Correct answer')).toBeVisible();
    await modalDialog.locator('button:has-text("Next Concept →")').click();

    // FORMAT 5: Indicator Identification
    console.log('[Playwright] Testing Format 5: indicator_identification');
    await expect(modalDialog.locator('text=Inspect the passage below and click on the elements that indicate a potential threat')).toBeVisible();
    const tokens = modalDialog.locator('.quiz-indicator-token');
    await expect(tokens).toHaveCount(4);

    // Flag the 3 suspicious tokens
    await tokens.nth(0).click(); // Urgency
    await tokens.nth(1).click(); // Phone
    await tokens.nth(2).click(); // APK

    // Verify token flagging UI
    await expect(tokens.nth(0)).toHaveClass(/flagged/);

    await expect(modalDialog.locator('button:has-text("Check Answer")')).toBeEnabled();
    await modalDialog.locator('button:has-text("Check Answer")').click();
    await expect(modalDialog.locator('text=✓ Correct answer')).toBeVisible();
    await modalDialog.locator('button:has-text("Next Concept →")').click();

    // FORMAT 6: True / False
    console.log('[Playwright] Testing Format 6: true_false');
    await expect(modalDialog.locator('text=Adjudicating Officer under IT Act Section 46(1A)')).toBeVisible();
    const tfOptions = modalDialog.locator('[role="radio"]');
    await tfOptions.nth(1).click(); // False
    await expect(tfOptions.nth(1)).toHaveAttribute('aria-checked', 'true');

    await modalDialog.locator('button:has-text("Check Answer")').click();
    await expect(modalDialog.locator('text=✓ Correct answer')).toBeVisible();
    await modalDialog.locator('button:has-text("Next Concept →")').click();

    // FORMAT 7: Scenario Decision
    console.log('[Playwright] Testing Format 7: scenario_decision');
    await expect(modalDialog.locator('text=WhatsApp crypto trading group')).toBeVisible();
    const scenOptions = modalDialog.locator('[role="radio"]');
    await scenOptions.nth(1).click(); // Refuse participation
    await expect(scenOptions.nth(1)).toHaveAttribute('aria-checked', 'true');

    await modalDialog.locator('button:has-text("Check Answer")').click();
    await expect(modalDialog.locator('text=✓ Correct answer')).toBeVisible();
    await modalDialog.locator('button:has-text("Next Concept →")').click();

    // FORMAT 8: Legal Application
    console.log('[Playwright] Testing Format 8: legal_application');
    await expect(modalDialog.locator('text=An employee discovers customer phone numbers being shared')).toBeVisible();
    const legalOptions = modalDialog.locator('[role="radio"]');
    await legalOptions.nth(1).click(); // Section 72A
    await expect(legalOptions.nth(1)).toHaveAttribute('aria-checked', 'true');

    await modalDialog.locator('button:has-text("Check Answer")').click();
    await expect(modalDialog.locator('text=✓ Correct answer')).toBeVisible();

    // Complete review & close
    const completeBtn = modalDialog.locator('button:has-text("Complete Review & Close")');
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Modal closes
    await expect(modalDialog).not.toBeVisible();
    console.log('[Playwright] All 8 question formats verified cleanly on desktop.');
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Mobile Viewport Interaction (390px iPhone Viewport)
  // ---------------------------------------------------------------------------
  test('Mobile: modal and multi-format controls fit viewport and function without overflow', async ({ page }) => {
    // Set 390px iPhone mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');

    // Verify practice card renders in mobile view
    const reviewBtn = page.locator('button.atelier-recall-btn:has-text("Review Missed Concepts")');
    await expect(reviewBtn).toBeVisible({ timeout: 15000 });
    await reviewBtn.click();

    const modalDialog = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modalDialog).toBeVisible();

    // Verify modal content fits within viewport without exceeding window width
    const modalBox = await modalDialog.locator('.quiz-modal-content').boundingBox();
    expect(modalBox).not.toBeNull();
    if (modalBox) {
      expect(modalBox.width).toBeLessThanOrEqual(390);
    }

    // Verify option card interaction on mobile touch viewport
    const radioOption = modalDialog.locator('[role="radio"]').nth(1);
    await radioOption.click();
    await expect(radioOption).toHaveAttribute('aria-checked', 'true');

    const checkBtn = modalDialog.locator('button:has-text("Check Answer")');
    await expect(checkBtn).toBeEnabled();
    await checkBtn.click();

    // Verify neutral feedback banner appears cleanly on mobile
    await expect(modalDialog.locator('text=✓ Correct answer')).toBeVisible();

    // Close modal via close button
    const closeBtn = modalDialog.locator('button[aria-label="Close practice modal"]');
    await closeBtn.click();
    await expect(modalDialog).not.toBeVisible();

    console.log('[Playwright] Mobile viewport interaction verified cleanly at 390px width.');
  });
});
