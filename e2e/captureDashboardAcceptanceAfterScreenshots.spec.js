// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const setupMockApi = async (page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mock_jwt_s6_acceptance_token');
    window.localStorage.setItem('user', JSON.stringify({
      _id: 'usr_s6_acceptance',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@cyberlawportal.test',
      role: 'user'
    }));
  });

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

    if (url.includes('/api/progress') && method === 'GET' && !url.includes('/portfolio')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          userId: 'usr_s6_acceptance',
          fullName: 'Aarav Sharma',
          currentStreak: 4,
          completedModules: ['digital-identity-foundations', 'phishing-social-engineering'],
          lessons: {
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
          },
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

    if (url.includes('/api/quizzes/due-recalls') || url.includes('/api/quizzes/recall/due')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({ dueItems: [], totalDue: 0 })
      });
      return;
    }

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

    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
};

test.describe('Stage 6 Final Acceptance: AFTER Screenshots & Interaction Verification', () => {

  test('Desktop (1280px): Capture full page, Milestones Journey Map, and Carousel transitions', async ({ page }, testInfo) => {
    await setupMockApi(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForSelector('.atelier-dashboard-canvas', { timeout: 15000 });
    await page.waitForTimeout(500);

    // 1. Full Page Desktop
    await page.screenshot({
      path: testInfo.outputPath('01_after_desktop_1280.png'),
      fullPage: true
    });

    // 2. Redesigned Milestones Journey Map closeup
    const journeyTrack = page.locator('.atelier-journey-track');
    await expect(journeyTrack).toBeVisible();
    await journeyTrack.screenshot({
      path: testInfo.outputPath('02_after_masthead_milestones_desktop.png')
    });

    // Verify 4 stages are rendered and clearly distinguishable
    const stages = page.locator('.atelier-journey-step');
    await expect(stages).toHaveCount(4);
    await expect(stages.nth(0)).toHaveClass(/is-done/);
    await expect(stages.nth(1)).toHaveClass(/is-current/);
    await expect(stages.nth(2)).toHaveClass(/is-upcoming/);
    await expect(stages.nth(3)).toHaveClass(/is-upcoming/);

    // 3. Scenario Carousel Initial State (Scenario 1)
    const storySection = page.locator('.story-atelier-section');
    await expect(storySection).toBeVisible();
    await expect(page.locator('.story-counter-pill')).toHaveText('Scenario 1 of 4');
    await storySection.screenshot({
      path: testInfo.outputPath('03_after_scenarios_desktop_tab1.png')
    });

    // 4. Test Next Scenario Button Click and Directional Transition
    const nextBtn = page.locator('button[aria-label="Next scenario"]');
    await nextBtn.click();
    await expect(page.locator('.story-counter-pill')).toHaveText('Scenario 2 of 4');
    await expect(page.locator('.story-canvas-grid')).toHaveClass(/slide-forward/);
    await page.waitForTimeout(300); // Wait for transition settle
    await storySection.screenshot({
      path: testInfo.outputPath('03b_after_scenarios_desktop_tab2_transitioned.png')
    });

    // 5. Test Keyboard Navigation (ArrowRight to Scenario 3)
    await storySection.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.story-counter-pill')).toHaveText('Scenario 3 of 4');
    await page.waitForTimeout(300);
    await storySection.screenshot({
      path: testInfo.outputPath('03c_after_scenarios_desktop_tab3_keyboard.png')
    });

    // 6. Test Previous Scenario Button Click (Backward transition)
    const prevBtn = page.locator('button[aria-label="Previous scenario"]');
    await prevBtn.click();
    await expect(page.locator('.story-counter-pill')).toHaveText('Scenario 2 of 4');
    await expect(page.locator('.story-canvas-grid')).toHaveClass(/slide-backward/);
  });

  test('Mobile (390px): Viewport rendering and overflow safety', async ({ page }, testInfo) => {
    await setupMockApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');
    await page.waitForSelector('.atelier-dashboard-canvas', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Verify zero horizontal page overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Capture Full Page Mobile 390
    await page.screenshot({
      path: testInfo.outputPath('04_after_mobile_390.png'),
      fullPage: true
    });

    // Capture mobile scenario closeup
    const storySection = page.locator('.story-atelier-section');
    await expect(storySection).toBeVisible();
    await storySection.screenshot({
      path: testInfo.outputPath('04b_after_scenarios_mobile_390.png')
    });
  });

  test('Mobile (375px): Compact screen rendering and touch navigation', async ({ page }, testInfo) => {
    await setupMockApi(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForSelector('.atelier-dashboard-canvas', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Verify zero horizontal page overflow on 375px
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Capture Full Page Mobile 375
    await page.screenshot({
      path: testInfo.outputPath('05_after_mobile_375.png'),
      fullPage: true
    });

    // Test tab switching on mobile 375px
    const tab2 = page.locator('#scenario-tab-parcel-fee');
    await tab2.click();
    await expect(page.locator('.story-counter-pill')).toHaveText('Scenario 2 of 4');

    const storySection = page.locator('.story-atelier-section');
    await storySection.screenshot({
      path: testInfo.outputPath('05b_after_scenarios_mobile_375.png')
    });
  });

});
