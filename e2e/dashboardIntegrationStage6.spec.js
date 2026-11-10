// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * e2e/dashboardIntegrationStage6.spec.js
 * 
 * Focused E2E Verification Suite for Stage 6 Dashboard Acceptance:
 * 1. All five Practice Center cards deep-link and auto-activate their intended Quiz Studio modes.
 * 2. Scenario navigation preserves the authenticated workspace shell (/workspace/cases, /workspace/prevention, /workspace/crimes, /quizzes?mode=scenario).
 * 3. Invalid pathway launch conditions display the intended accessible error banner without crashing.
 * 4. Curriculum loading displays non-zero placeholder ("—" / "Synchronizing...") while catalog data is loading.
 */

test.describe('Stage 6: Dashboard Integration & Acceptance Verification', () => {
  const mockQuizQuestions = [
    {
      id: 'q_demo_1',
      questionId: 'Q-DEMO-01',
      format: 'single_choice',
      questionText: 'Under Section 66C of the IT Act, which act is punishable?',
      category: 'Indian Cyber Law and IT Act',
      options: [
        'Identity theft using stolen passwords or electronic signatures',
        'Commercial spam with opt-out links',
        'Operating a computer without antivirus software',
        'Refusing to accept digital payments'
      ]
    },
    {
      id: 'q_demo_2',
      questionId: 'Q-DEMO-02',
      format: 'single_choice',
      questionText: 'What is the Golden Rule for receiving funds via UPI?',
      category: 'UPI, banking and financial fraud',
      options: [
        'A UPI PIN is never entered to receive money, only to send money',
        'Enter UPI PIN within 5 minutes of request',
        'Scan QR code and enter banking password',
        'Verify caller ID before entering UPI PIN'
      ]
    }
  ];

  const setupMockApi = async (page, customLessons = null) => {
    // Seed mock authentication in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock_jwt_s6_acceptance_token');
      window.localStorage.setItem('user', JSON.stringify({
        _id: 'usr_s6_acceptance',
        fullName: 'Aarav Sharma',
        email: 'aarav.sharma@cyberlawportal.test',
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

      // 1. Auth Profile
      if (url.includes('/api/auth/me')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              _id: 'usr_s6_acceptance',
              fullName: 'Aarav Sharma',
              email: 'aarav.sharma@cyberlawportal.test',
              role: 'user'
            }
          })
        });
        return;
      }

      // 2. Progress Data
      if (url.includes('/api/progress') && method === 'GET' && !url.includes('/portfolio')) {
        const defaultLessons = {
          completedCount: 4,
          totalPublished: 18,
          inProgressCount: 1,
          recentlyAccessed: {
            slug: 'digital-identity-foundations',
            title: 'Understanding Your Digital Identity',
            estimatedMinutes: 6,
            difficulty: 'Beginner',
            status: 'knowledge_check_passed'
          }
        };

        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            userId: 'usr_s6_acceptance',
            fullName: 'Aarav Sharma',
            currentStreak: 4,
            completedModules: ['digital-identity-foundations', 'phishing-social-engineering'],
            lessons: customLessons !== null ? customLessons : defaultLessons,
            completedPathways: [
              {
                pathwayId: 'pathway-ua-upi-consent',
                habitTitle: 'Unreviewed Acceptance & UPI PIN Safety',
                completedAt: new Date(Date.now() - 86400000).toISOString(),
                checkpointScore: 100,
                stepsCompleted: { caseStudy: true, prevention: true, checkpointQuiz: true }
              }
            ],
            reinforcementsCompleted: [],
            quizRecallItems: [],
            latestSessionId: 'sess_baseline_s6',
            baselineScore: 78,
            finalScore: null
          })
        });
        return;
      }

      // 3. Assessment Status
      if (url.includes('/api/assessments/status/baseline') || url.includes('/api/simulation/assessment-status/baseline')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            hasCompletedSession: true,
            hasActiveSession: false,
            stage: null,
            sessionId: 'sess_baseline_s6'
          })
        });
        return;
      }

      if (url.includes('/api/assessments/status/final') || url.includes('/api/simulation/assessment-status/final')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            hasCompletedSession: false,
            hasActiveSession: false,
            stage: null
          })
        });
        return;
      }

      // 4. Remediation Recommendations
      if (url.includes('/api/assessments/remediation/') || url.includes('/api/simulation/remediation/')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            recommendations: [
              {
                pathwayId: 'pathway-tr-lure-detection',
                habitTitle: 'Threat Lure Spotting in Routine Contacts',
                pedagogicalFocus: 'Spot urgency markers and unsolicited attachment lures in daily messages.',
                coreRule: 'Verify identity before clicking links or forwarding codes.',
                estimatedMinutes: 3,
                habitShiftState: 'continued_practice'
              }
            ]
          })
        });
        return;
      }

      // 5. Portfolio Data
      if (url.includes('/api/progress/portfolio')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            interventions: {
              completedPathways: [
                {
                  pathwayId: 'pathway-ua-upi-consent',
                  habitTitle: 'Unreviewed Acceptance & UPI PIN Safety',
                  completedAt: new Date().toISOString(),
                  checkpointScore: 100
                }
              ],
              reinforcementsCompleted: [],
              spacedReviews: [],
              summary: {
                totalPathwaysCompleted: 1,
                totalReinforcementsCompleted: 0,
                totalSpacedReviews: 0,
                passedSpacedReviews: 0
              }
            },
            knowledgePractice: {
              quizAttempts: [
                {
                  quizTitle: 'UPI & Payment Safety',
                  category: 'UPI, banking and financial fraud',
                  percentage: 85,
                  attemptNumber: 1,
                  completedAt: new Date().toISOString()
                }
              ]
            },
            behavioralEvolution: {
              dimensions: {
                TR: { baseline: 75, final: null },
                SI: { baseline: 80, final: null },
                VB: { baseline: 70, final: null },
                DQ: { baseline: 85, final: null },
                FP: { baseline: 90, final: null },
                UA: { baseline: 65, final: null }
              }
            }
          })
        });
        return;
      }

      // 6. Trajectory Data
      if (url.includes('/api/assessments/trajectory') || url.includes('/api/simulation/trajectory')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            hasReassessment: false,
            dimensions: {
              TR: { baseline: 75, final: null },
              SI: { baseline: 80, final: null },
              VB: { baseline: 70, final: null },
              DQ: { baseline: 85, final: null },
              FP: { baseline: 90, final: null },
              UA: { baseline: 65, final: null }
            }
          })
        });
        return;
      }

      // 7. Spaced Retrievals
      if (url.includes('/progress/pathways/spaced-retrieval/due') || url.includes('/api/progress/spaced-retrieval/due')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({ dueReviews: [] })
        });
        return;
      }

      // 8. Quiz History
      if (url.includes('/api/quizzes/history')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            totalAttempts: 6,
            overallAccuracyPercent: 84,
            recentAttempts: [
              { quizTitle: 'UPI & Banking Safeguards', percentage: 90, completedAt: new Date().toISOString() }
            ],
            frequentlyMissedTopics: [
              { topic: 'UPI, banking and financial fraud', accuracy: 48 }
            ]
          })
        });
        return;
      }

      // 9. Due Quiz Recalls
      if (url.includes('/api/quizzes/due-recalls') || url.includes('/api/quizzes/recall/due')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({ dueItems: [], totalDue: 0 })
        });
        return;
      }

      // 10. Quiz Modes
      if (url.includes('/api/quizzes/modes')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            modes: [
              { id: 'quick_practice', title: 'Quick Practice', badge: '5 Questions', timed: false },
              { id: 'topic_wise', title: 'Topic-wise Practice', badge: '10 Questions', timed: false },
              { id: 'scenario', title: 'Real-world Scenarios', badge: '8 Dilemmas', timed: false },
              { id: 'challenge', title: 'Challenge Quiz', badge: 'Timed Challenge', timed: true, defaultDurationSeconds: 600 },
              { id: 'case_based', title: 'Case-based & Legal Application', badge: 'Evidence & Law', timed: false }
            ]
          })
        });
        return;
      }

      // 11. Quiz Topics
      if (url.includes('/api/quizzes/topics')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            topics: [
              { topic: 'UPI, banking and financial fraud', totalQuestions: 15, beginnerCount: 5, intermediateCount: 5, advancedCount: 5 }
            ]
          })
        });
        return;
      }

      // 12. Quiz Session Start (Mode Auto-Activation)
      if (url.includes('/api/quizzes/start')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            questions: mockQuizQuestions
          })
        });
        return;
      }

      // 13. Quizzes Directory Catalog
      if (url.includes('/api/quizzes') && method === 'GET') {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'quiz_1', title: 'IT Act Foundations Quiz', category: 'Indian Cyber Law and IT Act', difficulty: 'Beginner', questionCount: 10 }
          ])
        });
        return;
      }

      // Default fallback
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
  };

  test('Gap 1: All five Practice Center cards deep-link and auto-activate their intended Quiz Studio modes', async ({ page }) => {
    await setupMockApi(page);

    // 1. Card 1: Quick Practice
    await page.goto('/dashboard');
    const quickCard = page.locator('a.atelier-mode-card.mode-quick');
    await expect(quickCard).toBeVisible({ timeout: 15000 });
    await expect(quickCard).toHaveAttribute('href', '/quizzes?mode=quick_practice');

    await quickCard.click();
    await page.waitForURL('**/quizzes?mode=quick_practice');
    await expect(page.locator('.quiz-studio-shell')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.quiz-studio-title-group h2')).toHaveText('Quick Practice');

    // 2. Card 2: Topic Practice
    await page.goto('/dashboard');
    const topicCard = page.locator('a.atelier-mode-card.mode-topic');
    await expect(topicCard).toBeVisible();
    await expect(topicCard).toHaveAttribute('href', '/quizzes?mode=topic_wise');

    await topicCard.click();
    await page.waitForURL('**/quizzes?mode=topic_wise');
    await expect(page.locator('.quiz-studio-shell')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.quiz-studio-title-group h2')).toHaveText('Topic-wise Practice');

    // 3. Card 3: Real-World Scenarios
    await page.goto('/dashboard');
    const scenarioCard = page.locator('a.atelier-mode-card.mode-scenario');
    await expect(scenarioCard).toBeVisible();
    await expect(scenarioCard).toHaveAttribute('href', '/quizzes?mode=scenario');

    await scenarioCard.click();
    await page.waitForURL('**/quizzes?mode=scenario');
    await expect(page.locator('.quiz-studio-shell')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.quiz-studio-title-group h2')).toHaveText('Real-world Scenarios');

    // 4. Card 4: Timed Challenge Quiz
    await page.goto('/dashboard');
    const challengeCard = page.locator('a.atelier-mode-card.mode-challenge');
    await expect(challengeCard).toBeVisible();
    await expect(challengeCard).toHaveAttribute('href', '/quizzes?mode=challenge');

    await challengeCard.click();
    await page.waitForURL('**/quizzes?mode=challenge');
    await expect(page.locator('.quiz-studio-shell')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.quiz-studio-title-group h2')).toHaveText('Challenge Quiz');

    // 5. Card 5: Case Law & Evidence
    await page.goto('/dashboard');
    const legalCard = page.locator('a.atelier-mode-card.mode-legal');
    await expect(legalCard).toBeVisible();
    await expect(legalCard).toHaveAttribute('href', '/quizzes?mode=case_based');

    await legalCard.click();
    await page.waitForURL('**/quizzes?mode=case_based');
    await expect(page.locator('.quiz-studio-shell')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.quiz-studio-title-group h2')).toHaveText('Case-based & Legal Application');

    // 6. Weak Topic Spotlight Deep-Link
    await page.goto('/dashboard');
    const weakLink = page.locator('a.atelier-weak-link');
    await expect(weakLink).toBeVisible();
    await expect(weakLink).toHaveAttribute('href', /mode=topic_wise/);
    await weakLink.click();
    await page.waitForURL(/quizzes\?mode=topic_wise/);
    await expect(page.locator('.quiz-studio-shell')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.quiz-studio-title-group h2')).toHaveText('Topic-wise Practice');
  });

  test('Gap 2: Scenario navigation preserves the authenticated workspace shell', async ({ page }) => {
    await setupMockApi(page);
    await page.goto('/dashboard');

    // Scenario 1: Utility Urgency -> /workspace/cases
    const tab1 = page.locator('#scenario-tab-power-cut');
    await tab1.click();
    const cta1 = page.locator('a.story-action-link:has-text("Examine Case Study")');
    await expect(cta1).toBeVisible();
    await expect(cta1).toHaveAttribute('href', '/workspace/cases');
    await cta1.click();
    await page.waitForURL('**/workspace/cases');
    // Verify authenticated workspace shell is active
    await expect(page.locator('.app-container')).toBeVisible();
    await expect(page.locator('nav.workspace-topbar, .workspace-sidebar')).toBeVisible();

    // Scenario 2: Courier Re-Route -> /workspace/prevention
    await page.goto('/dashboard');
    const tab2 = page.locator('#scenario-tab-parcel-fee');
    await tab2.click();
    const cta2 = page.locator('a.story-action-link:has-text("Read Prevention Protocol")');
    await expect(cta2).toBeVisible();
    await expect(cta2).toHaveAttribute('href', '/workspace/prevention');
    await cta2.click();
    await page.waitForURL('**/workspace/prevention');
    await expect(page.locator('.app-container')).toBeVisible();
    await expect(page.locator('nav.workspace-topbar, .workspace-sidebar')).toBeVisible();

    // Scenario 3: Digital Arrest -> /workspace/crimes
    await page.goto('/dashboard');
    const tab3 = page.locator('#scenario-tab-digital-arrest');
    await tab3.click();
    const cta3 = page.locator('a.story-action-link:has-text("Explore Threat Pattern")');
    await expect(cta3).toBeVisible();
    await expect(cta3).toHaveAttribute('href', '/workspace/crimes');
    await cta3.click();
    await page.waitForURL('**/workspace/crimes');
    await expect(page.locator('.app-container')).toBeVisible();
    await expect(page.locator('nav.workspace-topbar, .workspace-sidebar')).toBeVisible();

    // Scenario 4: Reverse QR Code -> /quizzes?mode=scenario
    await page.goto('/dashboard');
    const tab4 = page.locator('#scenario-tab-qr-scam');
    await tab4.click();
    const cta4 = page.locator('a.story-action-link:has-text("Test UPI Knowledge in Quiz")');
    await expect(cta4).toBeVisible();
    await expect(cta4).toHaveAttribute('href', '/quizzes?mode=scenario');
    await cta4.click();
    await page.waitForURL('**/quizzes?mode=scenario');
    await expect(page.locator('.app-container')).toBeVisible();
  });

  test('Gap 3: Invalid pathway launch condition displays accessible error without crashing', async ({ page }) => {
    // Mock user progress with null latestSessionId to trigger the safety guard
    await setupMockApi(page);

    // Override /api/progress so latestSessionId is null
    await page.route('**/api/progress', async (route) => {
      const method = route.request().method();
      if (method === 'GET' && !route.request().url().includes('/portfolio')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            userId: 'usr_s6_acceptance',
            fullName: 'Aarav Sharma',
            currentStreak: 1,
            completedModules: [],
            lessons: { completedCount: 0, totalPublished: 18, inProgressCount: 0 },
            completedPathways: [],
            reinforcementsCompleted: [],
            quizRecallItems: [],
            latestSessionId: null, // missing session
            baselineScore: 50,
            finalScore: null
          })
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/dashboard');

    // Click "Start Lesson →" on primary focus card
    const launchBtn = page.locator('.atelier-dossier-btn:has-text("Start Lesson")');
    await expect(launchBtn).toBeVisible({ timeout: 15000 });
    await launchBtn.click();

    // Expect accessible error banner
    const alertBanner = page.locator('div[role="alert"]:has-text("To start a pathway, please complete your First Check first")');
    await expect(alertBanner).toBeVisible();

    // Ensure dismiss button works cleanly
    const dismissBtn = alertBanner.locator('button[aria-label="Dismiss notice"]');
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();
    await expect(alertBanner).not.toBeVisible();
  });

  test('Gap 4: Curriculum loading displays non-zero placeholder ("—" / "Synchronizing...") when catalog is unresolved', async ({ page }) => {
    // Mock progress with totalPublished = 0 (simulating catalog loading/unresolved)
    await setupMockApi(page, { completedCount: 0, totalPublished: 0, inProgressCount: 0 });

    await page.goto('/dashboard');

    // 1. In CurriculumLessonsSection: Must NOT say "0 of 0" or "0 chapters read"
    const sectionHeading = page.locator('h2#curriculum-heading');
    await expect(sectionHeading).toBeVisible({ timeout: 15000 });

    const card = page.locator('.curriculum-codex-card');
    await expect(card.locator('text=0 of 0')).not.toBeVisible();
    await expect(card.locator('text=Synchronizing…')).toBeVisible();
    await expect(card.locator('text=Synchronizing curriculum catalog…')).toBeVisible();

    // 2. In AtelierMasthead: Ledger column 1 must NOT display "0 / 0"
    const mastheadLedger = page.locator('.atelier-orientation-ledger');
    await expect(mastheadLedger.locator('text=0 / 0')).not.toBeVisible();
    await expect(mastheadLedger.locator('text=Synchronizing catalog…')).toBeVisible();
  });
});
