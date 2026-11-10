// @ts-check
const { test } = require('@playwright/test');
const path = require('path');

const SCREENSHOT_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\2a38735a-7985-4d0c-9744-999cb0b89167\\screenshots\\stage6-acceptance';

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

    if (url.includes('/progress/pathways/spaced-retrieval/due') || url.includes('/api/progress/spaced-retrieval/due')) {
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

test('Capture BEFORE Screenshots (Desktop, Mobile 390, Mobile 375)', async ({ page }) => {
  await setupMockApi(page);

  // 1. Desktop 1280x800
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/dashboard');
  await page.waitForSelector('.atelier-dashboard-canvas', { timeout: 15000 });
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01_before_desktop_1280.png'),
    fullPage: true
  });

  // Milestone Map closeup
  const masthead = page.locator('.atelier-masthead');
  if (await masthead.isVisible()) {
    await masthead.screenshot({
      path: path.join(SCREENSHOT_DIR, '02_before_masthead_milestones_desktop.png')
    });
  }

  // Scenarios Section closeup
  const scenarioSection = page.locator('.editorial-story-section');
  if (await scenarioSection.isVisible()) {
    await scenarioSection.screenshot({
      path: path.join(SCREENSHOT_DIR, '03_before_scenarios_desktop.png')
    });
  }

  // 2. Mobile iPhone 13/14/15 (390px)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  await page.waitForSelector('.atelier-dashboard-canvas', { timeout: 15000 });
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '04_before_mobile_390.png'),
    fullPage: true
  });

  // 3. Mobile iPhone SE / Compact (375px)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/dashboard');
  await page.waitForSelector('.atelier-dashboard-canvas', { timeout: 15000 });
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '05_before_mobile_375.png'),
    fullPage: true
  });

  console.log('All BEFORE screenshots captured successfully in:', SCREENSHOT_DIR);
});
