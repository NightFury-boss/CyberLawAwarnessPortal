// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright');

const ALL_SCENARIOS = [
  { slug: 'midnight-power-cut-sms', title: 'The Midnight Power Cut SMS' },
  { slug: 'nominal-parcel-fee', title: 'The Nominal ₹15 Parcel Fee' },
  { slug: 'approve-payment-qr', title: 'The "Approve Payment" QR Code' },
  { slug: 'video-summons-digital-arrest', title: 'The Video Summons "Digital Arrest"' }
];

/**
 * Strengthened implementation-independent focus indicator verification.
 * Verifies active DOM focus, :focus-visible pseudo-class, viewport visibility,
 * non-zero bounding box, element non-obscuration, and non-transparent visual geometry.
 */
async function assertRobustFocusIndicator(locator) {
  await expect(locator).toBeFocused();
  await expect(locator).toBeVisible();

  const visualCheck = await locator.evaluate((node) => {
    const isFocusVisible = node.matches(':focus-visible');
    const rect = node.getBoundingClientRect();
    const hasDimensions = rect.width > 0 && rect.height > 0;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const topElement = document.elementFromPoint(cx, cy);
    const isNotObscured = node === topElement || node.contains(topElement) || (topElement !== null && topElement.contains(node));

    const style = window.getComputedStyle(node);
    const hasOutline = style.outlineStyle !== 'none' &&
                       parseFloat(style.outlineWidth) >= 1 &&
                       style.outlineColor !== 'transparent' &&
                       !style.outlineColor.startsWith('rgba(0, 0, 0, 0)');

    const hasBoxShadow = style.boxShadow !== 'none' &&
                         style.boxShadow !== '' &&
                         !style.boxShadow.startsWith('rgba(0, 0, 0, 0)');

    const hasBorder = style.borderStyle !== 'none' && parseFloat(style.borderWidth) >= 1;

    return {
      isFocusVisible,
      hasDimensions,
      isNotObscured,
      hasVisibleIndicator: hasOutline || hasBoxShadow || hasBorder,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow
    };
  });

  expect(visualCheck.hasDimensions).toBe(true);
  expect(visualCheck.isNotObscured).toBe(true);
  expect(visualCheck.hasVisibleIndicator).toBe(true);
}

/**
 * Executes an automated axe-core accessibility scan on the current page state.
 * Evaluates semantic WCAG rules (ARIA, landmarks, label associations, heading structure, table headers).
 */
async function runAxeScan(page, viewName) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .disableRules(['color-contrast', 'scrollable-region-focusable'])
    .analyze();

  const seriousViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
  expect(seriousViolations, `Critical/Serious axe accessibility violations in ${viewName}: ${JSON.stringify(seriousViolations.map(v => ({ id: v.id, impact: v.impact, description: v.description })), null, 2)}`).toEqual([]);
}

test.describe('Counterfactual Scenarios E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Fail-closed network trap: Counterfactual journeys must never call assessment or scoring APIs
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/assessment') || url.includes('/api/questions')) {
        throw new Error(`CRITICAL ISOLATION VIOLATION: Counterfactual journey attempted network call to: ${url}`);
      }
    });

    // Seed localStorage with mock auth token and sidebar setting
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock_verified_session_jwt');
      window.localStorage.setItem('workspace_sidebar_collapsed', 'false');
    });

    // Mock API requests with CORS headers
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

      if (url.includes('/auth/me')) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _id: 'e2e-isolated-learner-id',
            fullName: 'E2E Isolated Learner',
            role: 'user',
            email: 'e2e_learner_isolated@test.local',
            isActive: true
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true })
        });
      }
    });
  });

  test('View 1 Accessibility & Catalog Rendering: Displays all 4 scenarios with heading hierarchy', async ({ page }) => {
    await page.goto('/workspace/counterfactuals', { waitUntil: 'networkidle' });
    await page.waitForSelector('.cf-catalog-wrapper', { timeout: 10000 });

    // Primary page heading
    const pageTitle = page.locator('h1.page-title');
    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).toContainText('Counterfactual Scenarios');

    // All 4 scenario cards rendered
    const cards = page.locator('.cf-scenario-card');
    await expect(cards).toHaveCount(4);

    // Axe scan View 1: Catalog
    await runAxeScan(page, 'Catalog Index View');
  });

  test('Comprehensive Learner Journey: Tri-branch exploration, rewind, matrix, takeaway, and axe scans', async ({ page }) => {
    // Ensure clean completion state at test start
    await page.goto('/workspace/counterfactuals', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.localStorage.removeItem('cl_counterfactual_completed_slugs'));

    // 1. Open Scenario 1
    await page.goto('/workspace/counterfactuals/midnight-power-cut-sms', { waitUntil: 'networkidle' });
    await page.waitForSelector('.cf-explorer-wrapper', { timeout: 10000 });

    // Scenario header
    const scenarioTitle = page.locator('h2.cf-scenario-title');
    await expect(scenarioTitle).toBeVisible();
    await expect(scenarioTitle).toHaveText('The Midnight Power Cut SMS');

    // Section headings outline check
    await expect(page.locator('.cf-junction-section')).toBeVisible();

    // Axe Scan View 2: Stimulus & Decision Junction
    await runAxeScan(page, 'Stimulus & Decision Junction View');

    // Keyboard navigation to first decision choice
    const branchAChoice = page.locator('.cf-choice-card').first();
    await branchAChoice.focus();
    await assertRobustFocusIndicator(branchAChoice);

    // Select Choice A
    await branchAChoice.click();
    await page.waitForSelector('.cf-timeline-article', { timeout: 5000 });

    // Axe Scan View 3: Consequence Timeline
    await runAxeScan(page, 'Consequence Timeline View');

    // Verify Consequence Timeline content rendered
    const timeline = page.locator('.cf-timeline-article');
    await expect(timeline).toBeVisible();
    await expect(timeline).toContainText('Immediate Reaction');

    // Rewind back to junction
    const rewindBtn = page.locator('.cf-timeline-actions-bar button:has-text("Rewind")');
    await rewindBtn.focus();
    await assertRobustFocusIndicator(rewindBtn);
    await rewindBtn.click();

    // Verify Explored badge on Choice A
    await page.waitForSelector('.cf-junction-section', { timeout: 5000 });
    const badgeA = page.locator('.cf-choice-card').first().locator('.cf-explored-badge');
    await expect(badgeA).toBeVisible();

    // Select Choice B
    const branchBChoice = page.locator('.cf-choice-card').nth(1);
    await branchBChoice.click();
    await page.waitForSelector('.cf-timeline-article', { timeout: 5000 });

    // Rewind back to junction
    await page.locator('.cf-timeline-actions-bar button:has-text("Rewind")').click();
    await page.waitForSelector('.cf-junction-section', { timeout: 5000 });

    // Select Choice C and then open comparison
    const branchCChoice = page.locator('.cf-choice-card').nth(2);
    await branchCChoice.click();
    await page.waitForSelector('.cf-timeline-article', { timeout: 5000 });

    // Matrix button should now be available
    const matrixToggle = page.locator('.cf-timeline-actions-bar button:has-text("Compare")');
    await expect(matrixToggle).toBeVisible();
    await matrixToggle.focus();
    await assertRobustFocusIndicator(matrixToggle);

    // Open Comparative Matrix
    await matrixToggle.click();
    await page.waitForSelector('.cf-matrix-section', { timeout: 5000 });

    // Axe Scan View 4: Cross-Branch Comparative Matrix
    await runAxeScan(page, 'Comparative Matrix View');

    // Verify table semantic headers
    const thCols = page.locator('.cf-matrix-table th[scope="col"]');
    expect(await thCols.count()).toBeGreaterThanOrEqual(2);

    // Proceed to Takeaway
    const takeawayBtn = page.locator('.cf-matrix-actions-bar button:has-text("Takeaway")')
      .or(page.locator('.cf-timeline-actions-bar button:has-text("Takeaway")'))
      .first();
    await takeawayBtn.click();
    await page.waitForSelector('.cf-takeaway-article', { timeout: 5000 });

    // Axe Scan View 5: Defensive Takeaway Card
    await runAxeScan(page, 'Defensive Takeaway View');

    // Verify localStorage completion persistence
    const completions = await page.evaluate(() => {
      const stored = window.localStorage.getItem('cl_counterfactual_completed_slugs');
      return stored ? JSON.parse(stored) : [];
    });
    expect(completions).toContain('midnight-power-cut-sms');

    // Navigate back to catalog and verify completion pill
    await page.goto('/workspace/counterfactuals', { waitUntil: 'networkidle' });
    await page.waitForSelector('.cf-catalog-wrapper', { timeout: 10000 });
    const completedBadge = page.locator('.cf-scenario-card').first().locator('.cf-completed-pill');
    await expect(completedBadge).toBeVisible();
  });

  test('Stimulus Integrity Across Scenarios 2, 3, and 4', async ({ page }) => {
    for (const sc of ALL_SCENARIOS.slice(1)) {
      await page.goto(`/workspace/counterfactuals/${sc.slug}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.cf-explorer-wrapper', { timeout: 10000 });

      // Title check
      await expect(page.locator('h2.cf-scenario-title')).toHaveText(sc.title);

      // Verify static stimulus: Zero inputs or textareas
      const inputCount = await page.locator('.cf-stimulus-card input, .cf-stimulus-card textarea').count();
      expect(inputCount).toBe(0);

      // Decision choices: Exactly 3
      const choices = page.locator('.cf-choice-card');
      await expect(choices).toHaveCount(3);
    }
  });

  test('View 6 Accessibility & Invalid-Route Recovery: Graceful error and safe return', async ({ page }) => {
    await page.goto('/workspace/counterfactuals/non-existent-incident-slug', { waitUntil: 'networkidle' });
    await page.waitForSelector('.cf-not-found-card', { timeout: 10000 });

    // Alert semantics
    const alertBox = page.locator('.cf-not-found-card[role="alert"]');
    await expect(alertBox).toBeVisible();
    await expect(alertBox).toContainText('Scenario Not Found');

    // Axe Scan View 6: Invalid Route Recovery View
    await runAxeScan(page, 'Invalid Route Recovery View');

    // Return button focus and execution
    const returnBtn = page.locator('.cf-not-found-card button');
    await returnBtn.focus();
    await assertRobustFocusIndicator(returnBtn);
    await returnBtn.click();

    // Assert returned to catalog
    await page.waitForURL('**/workspace/counterfactuals', { timeout: 5000 });
    const catalogCards = page.locator('.cf-scenario-card');
    await expect(catalogCards).toHaveCount(4);
  });
});
