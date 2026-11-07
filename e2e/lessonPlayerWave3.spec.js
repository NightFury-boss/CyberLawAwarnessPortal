// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Stage 4 Wave 3: Lesson Player & Multi-QuickCheck E2E Suite', () => {
  let submittedRequests = [];

  test.beforeEach(async ({ page }) => {
    submittedRequests = [];

    // Track progress submissions
    page.on('request', (req) => {
      if (req.url().includes('/progress') && req.method() === 'POST') {
        try {
          submittedRequests.push({
            url: req.url(),
            postData: JSON.parse(req.postData() || '{}')
          });
        } catch (e) {
          submittedRequests.push({ url: req.url(), raw: req.postData() });
        }
      }
    });

    // Seed mock auth
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock_jwt_stage4_token');
      window.localStorage.setItem('user', JSON.stringify({
        _id: 'usr_stage4_tester',
        fullName: 'Stage 4 QA Learner',
        email: 'qa@cyberlawportal.test',
        role: 'user'
      }));
    });

    // Mock API routes
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

      // GET /api/auth/me
      if (url.includes('/api/auth/me')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              _id: 'usr_stage4_tester',
              fullName: 'Stage 4 QA Learner',
              email: 'qa@cyberlawportal.test',
              role: 'user'
            }
          })
        });
        return;
      }

      // GET /api/modules/malware-professional-confidentiality-defensive-citizenship
      if (url.includes('/api/modules/malware-professional-confidentiality-defensive-citizenship') && method === 'GET') {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            module: {
              order: 18,
              slug: 'malware-professional-confidentiality-defensive-citizenship',
              title: 'Malware Offenses, Professional Confidentiality & Defensive Digital Citizenship',
              category: 'Emerging Rights & Defenses',
              difficulty: 'Advanced',
              estimatedMinutes: 30,
              summary: 'Comprehensive analysis of malware offenses under IT Act Section 43/66.',
              published: true,
              sections: [
                {
                  title: 'Malware & Unauthorized Alteration',
                  content: 'Statutory provisions governing malicious code and damage under Section 43.'
                },
                {
                  title: 'Professional Confidentiality',
                  content: 'Section 72A disclosure penalties under the Jan Vishwas Act.'
                }
              ],
              quickChecks: [
                {
                  id: 'QC-P6-01',
                  pillar: 'PILLAR 6: MALWARE AND CYBER THREATS',
                  scenario: 'A senior systems administrator extracts spreadsheets containing customer phone numbers.',
                  question: 'What statutory violation has the administrator committed under the IT Act, 2000?',
                  options: [
                    'Violation of IT Act Section 72A, liable to a penalty up to ₹25 lakh.',
                    'Only an internal company disciplinary breach.',
                    'Violation of Section 66A of the IT Act.',
                    'Copyright infringement under Section 63.'
                  ],
                  correctIndex: 0,
                  correctOptionIndex: 0,
                  correctKey: 'A',
                  explanation: 'All statutory elements of Section 72A of the IT Act, 2000 are satisfied.'
                },
                {
                  id: 'QC-P7-01',
                  pillar: 'PILLAR 7: DEFENSIVE DIGITAL CITIZENSHIP',
                  scenario: 'A customer of a Regional Rural Bank discovers an unauthorized debit.',
                  question: 'What is the customer liability and the RRB obligation under RBI Master Directions?',
                  options: [
                    'Zero liability under Paragraph 119(2), and the RRB must credit within 10 working days.',
                    'Capped at ₹5,000 under the Basic Savings Bank Deposit limit.',
                    'The customer bears 100% of the loss until cyber police complete investigation.',
                    'The RRB must resolve the matter within 24 hours.'
                  ],
                  correctIndex: 0,
                  correctOptionIndex: 0,
                  correctKey: 'A',
                  explanation: 'Under Paragraph 119(2) of the Master Directions for RRBs, customer has zero liability.'
                }
              ],
              quickCheck: {
                id: 'QC-P6-01',
                question: 'What statutory violation has the administrator committed under the IT Act, 2000?',
                options: [
                  'Violation of IT Act Section 72A, liable to a penalty up to ₹25 lakh.',
                  'Only an internal company disciplinary breach.',
                  'Violation of Section 66A of the IT Act.',
                  'Copyright infringement under Section 63.'
                ],
                correctIndex: 0,
                explanation: 'All statutory elements of Section 72A of the IT Act, 2000 are satisfied.'
              },
              status: 'in_progress',
              knowledgeCheckStatus: 'not_attempted'
            }
          })
        });
        return;
      }

      // POST /api/modules/:slug/progress
      if (url.includes('/progress') && method === 'POST') {
        const postData = JSON.parse(req.postData() || '{}');
        const checkIdx = postData.checkIndex || 0;
        const selected = postData.selectedIndex;
        const isCorrect = selected === 0;

        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            isCorrect,
            explanation: isCorrect ? 'Correct statutory explanation verified.' : 'Incorrect statutory reference.',
            knowledgeCheckStatus: isCorrect ? 'passed' : 'failed',
            status: isCorrect ? 'knowledge_check_passed' : 'knowledge_check_attempted',
            readCompleted: false
          })
        });
        return;
      }

      // GET /api/modules/digital-identity-foundations (Legacy single check)
      if (url.includes('/api/modules/digital-identity-foundations') && method === 'GET') {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            module: {
              order: 1,
              slug: 'digital-identity-foundations',
              title: 'Digital Identity & Authentication Foundations',
              category: 'Foundations',
              difficulty: 'Beginner',
              estimatedMinutes: 20,
              summary: 'Foundational concepts of authentication and legal identity.',
              published: true,
              sections: [{ title: 'Overview', content: 'Section content...' }],
              quickCheck: {
                question: 'Which legal provision governs electronic signatures?',
                options: [
                  'Section 3A of the IT Act, 2000',
                  'Section 66A of the IT Act, 2000',
                  'Section 420 of IPC',
                  'Section 144 of CrPC'
                ],
                correctIndex: 0,
                explanation: 'Section 3A of the IT Act provides for electronic signatures.'
              },
              status: 'in_progress',
              knowledgeCheckStatus: 'not_attempted'
            }
          })
        });
        return;
      }

      // Fallback
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
  });

  test('Module 18 renders both Quick Checks with scenarios and interactive submissions', async ({ page }) => {
    await page.goto('/modules/malware-professional-confidentiality-defensive-citizenship');

    // 1. Verify Module Title
    await expect(page.locator('h1')).toContainText('Malware Offenses');

    // 2. Verify both Quick Check Cards are present in the DOM
    const check1 = page.locator('#quick-check-1');
    const check2 = page.locator('#quick-check-2');
    await expect(check1).toBeVisible();
    await expect(check2).toBeVisible();

    // 3. Verify Quick Check 1 details (QC-P6-01)
    await expect(check1).toContainText('QC-P6-01');
    await expect(check1).toContainText('PILLAR 6: MALWARE AND CYBER THREATS');
    await expect(check1).toContainText('Statutory Scenario');
    await expect(check1).toContainText('What statutory violation has the administrator committed');

    // 4. Verify Quick Check 2 details (QC-P7-01)
    await expect(check2).toContainText('QC-P7-01');
    await expect(check2).toContainText('PILLAR 7: DEFENSIVE DIGITAL CITIZENSHIP');
    await expect(check2).toContainText('What is the customer liability and the RRB obligation');

    // 5. Select Option A on Check 1 and Submit
    const check1OptionA = check1.locator('button').filter({ hasText: 'Violation of IT Act Section 72A' });
    await check1OptionA.click();
    const check1SubmitBtn = check1.locator('button').filter({ hasText: 'Check My Answer' });
    await check1SubmitBtn.click();

    // Verify Check 1 submission dispatched checkIndex: 0
    await expect(check1).toContainText('✓ Excellent insight!');
    const req0 = submittedRequests.find(r => r.postData && r.postData.checkIndex === 0);
    expect(req0).toBeDefined();
    expect(req0.postData.selectedIndex).toBe(0);
    expect(req0.postData.action).toBe('knowledge_check');

    // 6. Select Option A on Check 2 and Submit
    const check2OptionA = check2.locator('button').filter({ hasText: 'Zero liability under Paragraph 119(2)' });
    await check2OptionA.click();
    const check2SubmitBtn = check2.locator('button').filter({ hasText: 'Check My Answer' });
    await check2SubmitBtn.click();

    // Verify Check 2 submission dispatched checkIndex: 1
    await expect(check2).toContainText('✓ Excellent insight!');
    const req1 = submittedRequests.find(r => r.postData && r.postData.checkIndex === 1);
    expect(req1).toBeDefined();
    expect(req1.postData.selectedIndex).toBe(0);
    expect(req1.postData.action).toBe('knowledge_check');

    // 7. Verify Responsive Layout (No Horizontal Overflow)
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);
  });

  test('Legacy module with single quickCheck renders seamlessly with backward compatibility', async ({ page }) => {
    await page.goto('/modules/digital-identity-foundations');

    await expect(page.locator('h1')).toContainText('Digital Identity');

    // Single check rendered
    const checkCard = page.locator('#quick-check-1');
    await expect(checkCard).toBeVisible();
    await expect(page.locator('#quick-check-2')).toHaveCount(0);

    // Verify question and options
    await expect(checkCard).toContainText('Which legal provision governs electronic signatures?');
    const optA = checkCard.locator('button').filter({ hasText: 'Section 3A of the IT Act, 2000' });
    await optA.click();

    const submitBtn = checkCard.locator('button').filter({ hasText: 'Check My Answer' });
    await submitBtn.click();

    await expect(checkCard).toContainText('✓ Excellent insight!');
    const legacyReq = submittedRequests.find(r => r.postData && r.postData.action === 'knowledge_check');
    expect(legacyReq).toBeDefined();
    expect(legacyReq.postData.selectedIndex).toBe(0);
  });
});

