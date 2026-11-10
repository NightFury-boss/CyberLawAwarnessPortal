// @ts-check
const { test, expect } = require('@playwright/test');

// Helper to inject mock authenticated session into localStorage and mock /api routes
async function setupAuthenticatedSession(page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock_jwt_token_learner_verified');
    localStorage.setItem('user', JSON.stringify({
      _id: 'usr_learner_123',
      fullName: 'Priya Sharma',
      email: 'priya.learner@university.edu.in',
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
            _id: 'usr_learner_123',
            fullName: 'Priya Sharma',
            email: 'priya.learner@university.edu.in',
            role: 'user'
          }
        })
      });
      return;
    }

    if (url.includes('/api/quizzes') || url.includes('/api/progress') || url.includes('/api/crimes') || url.includes('/api/laws')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
      return;
    }

    await route.continue();
  });
}

test.describe('Release Hardening Navigation & Deep-Link Verification', () => {

  test('Workspace Route: Unauthenticated access to /workspace/quizzes redirects to /login', async ({ page }) => {
    await page.goto('/workspace/quizzes');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Workspace Route: Authenticated user on /workspace/quizzes renders workspace shell and quizzes', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/workspace/quizzes');
    await expect(page).toHaveURL('/workspace/quizzes');
    // Verify Workspace sidebar is mounted
    const sidebar = page.locator('#workspace-sidebar');
    await expect(sidebar).toBeVisible();
    // Verify Page Header contains Quizzes
    const header = page.locator('h1, .page-header-title, .editorial-masthead-title');
    await expect(header.first()).toBeVisible();
  });

  test('Workspace Route: /workspace/dashboard cleanly redirects to /dashboard with workspace shell', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/workspace/dashboard');
    await expect(page).toHaveURL('/dashboard');
    const sidebar = page.locator('#workspace-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('Workspace Route: In /workspace/crimes, practice CTA links to /workspace/quizzes and keeps workspace', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/workspace/crimes');
    await expect(page).toHaveURL('/workspace/crimes');

    // Verify practice button has /workspace/quizzes target directly in catalog view
    const practiceBtn = page.locator('a[href="/workspace/quizzes"]').first();
    await expect(practiceBtn).toBeVisible();
    await practiceBtn.click();

    await expect(page).toHaveURL('/workspace/quizzes');
    await expect(page.locator('#workspace-sidebar')).toBeVisible();
  });

  test('Laws Deep-Link: Resolves legacy #sec-section-66c into Section 66C card', async ({ page }) => {
    await page.goto('/laws#sec-section-66c');
    const targetCard = page.locator('#section-card-Section-66C');
    await expect(targetCard).toBeVisible({ timeout: 5000 });
  });

  test('Laws Deep-Link: Resolves #BSA-Section-63 into Digital Evidence card', async ({ page }) => {
    await page.goto('/laws#BSA-Section-63');
    const targetCard = page.locator('#section-card-BSA-Section-63');
    await expect(targetCard).toBeVisible({ timeout: 5000 });
  });

  test('Laws Deep-Link: Resolves #Section-66D into Section 66D card', async ({ page }) => {
    await page.goto('/laws#Section-66D');
    const targetCard = page.locator('#section-card-Section-66D');
    await expect(targetCard).toBeVisible({ timeout: 5000 });
  });

  test('Prevention Query: /prevention?phase=before navigates to #protect habits', async ({ page }) => {
    await page.goto('/prevention?phase=before');
    const targetSection = page.locator('#protect');
    await expect(targetSection).toBeVisible();
  });

  test('Prevention Query: /prevention?phase=during navigates to #warning-signs', async ({ page }) => {
    await page.goto('/prevention?phase=during');
    const targetSection = page.locator('#warning-signs');
    await expect(targetSection).toBeVisible();
  });

  test('Prevention Query: /prevention?phase=after navigates to #immediately crisis actions', async ({ page }) => {
    await page.goto('/prevention?phase=after');
    const targetSection = page.locator('#immediately');
    await expect(targetSection).toBeVisible();
  });

  test('Prevention Legacy Anchors: #playbooks navigates to #immediately and Docket Generator is visible', async ({ page }) => {
    await page.goto('/prevention#playbooks');
    const targetSection = page.locator('#immediately');
    await expect(targetSection).toBeVisible();

    const docketSection = page.locator('#docket');
    await expect(docketSection).toBeVisible();
  });

  test('Crimes Handoff: Emergency box in Crimes provides handoff link to Prevention', async ({ page }) => {
    await page.goto('/crimes');
    // Open a crime card
    const firstCrime = page.locator('.crime-field-card, .crimes-curation-card').first();
    await firstCrime.click();

    const handoffLink = page.locator('.crimes-emergency-handoff-link');
    await expect(handoffLink).toBeVisible();
    await expect(handoffLink).toHaveAttribute('href', '/prevention#immediately');
  });

});
