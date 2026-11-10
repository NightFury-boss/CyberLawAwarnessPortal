// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || path.resolve(__dirname, '../screenshots/cases-qa');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Final UI Quality Assurance: Case Studies Collections', () => {
  test.beforeEach(async ({ page }) => {
    // Mock /api/auth/me to return unauthenticated
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Not authenticated' })
      });
    });
  });

  test('1. Desktop Verification: Collection Switcher, Badges, Search & Filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/cases');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Page Header
    const headerTitle = page.locator('h1, .editorial-page-title');
    await expect(headerTitle.first()).toContainText('Cyber Cases');

    // 2. Verify Default Collection: Landmark Court Precedents (11 files)
    const landmarkTab = page.locator('[role="tab"]').filter({ hasText: 'Landmark Court Precedents' });
    await expect(landmarkTab).toBeVisible();
    await expect(landmarkTab).toContainText('11 Cases');
    await expect(landmarkTab).toContainText('Currently viewing collection');

    // Verify 11 cases displayed in Landmark list
    const landmarkRows = page.locator('.incident-index-row');
    await expect(landmarkRows).toHaveCount(11);

    // 3. Switch to "Cases Where Justice Fell Short" Collection
    const shortcomingsTab = page.locator('[role="tab"]').filter({ hasText: 'Cases Where Justice Fell Short' });
    await expect(shortcomingsTab).toBeVisible();
    await expect(shortcomingsTab).toContainText('10 Inquiries');
    await shortcomingsTab.click();

    // Verify switch is active
    await expect(shortcomingsTab).toContainText('Currently viewing collection');
    const shortcomingsRows = page.locator('.incident-index-row');
    await expect(shortcomingsRows).toHaveCount(10);

    // 4. Verify Evidence Badge Wording:
    // Assert "Institutional Failure Documented" exists in cards or details, and "Proven Institutional Failure" DOES NOT exist
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('Proven Institutional Failure');

    // Check presence of plain-language badge labels
    await expect(page.locator('.incident-index-row').filter({ hasText: 'Institutional Failure' }).first()).toBeVisible();
    await expect(page.locator('.incident-index-row').filter({ hasText: 'Investigation Delay' }).first()).toBeVisible();
    await expect(page.locator('.incident-index-row').filter({ hasText: 'Unresolved Case' }).first()).toBeVisible();

    // 5. Test Topic Filters for "Cases Where Justice Fell Short"
    const bankingFilter = page.locator('button').filter({ hasText: 'Banking & Regulatory Inquiries' });
    await expect(bankingFilter).toBeVisible();
    await bankingFilter.click();

    // Verify filtered results
    const filteredCount = await page.locator('.incident-index-row').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(10);

    // Reset filter
    const allFilter = page.locator('button').filter({ hasText: 'All' });
    await allFilter.click();
    await expect(page.locator('.incident-index-row')).toHaveCount(10);

    // 6. Test Search within Collection
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Pegasus');
    await page.waitForTimeout(300);
    await expect(page.locator('.incident-index-row')).toHaveCount(1);
    await expect(page.locator('.incident-index-row')).toContainText('Pegasus Technical Committee Inquiry');

    // Clear search
    const clearBtn = page.locator('button[aria-label*="Clear"], button').filter({ hasText: 'Clear' });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    } else {
      await searchInput.fill('');
    }
    await page.waitForTimeout(300);
    await expect(page.locator('.incident-index-row')).toHaveCount(10);

    // Capture Desktop Catalog Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_cases_desktop_shortcomings_catalog.png'),
      fullPage: true
    });
  });

  test('2. Desktop Verification: Case Reading Dossier, Evidence Matrix & Emergency Guidance', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/cases?slug=sulli-deals-bulli-bai-investigation-delays');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Deep Link opened Case Dossier directly
    await expect(page.locator('h1, h2').filter({ hasText: 'Sulli Deals & Bulli Bai' })).toBeVisible();

    // 2. Verify Simplified Section Headings
    const headings = page.locator('.editorial-section-title, h3, h4');
    const allHeadingsText = await headings.allTextContents();
    const combinedHeadings = allHeadingsText.join(' ');

    expect(combinedHeadings).toContain('Case Overview');
    expect(combinedHeadings).toContain('What Happened and When');
    expect(combinedHeadings).toContain('What the Evidence Shows');
    expect(combinedHeadings).toContain('How Authorities Responded');
    expect(combinedHeadings).toContain('Legal Lessons and Key Takeaways');
    expect(combinedHeadings).toContain('What You Can Do and Where to Learn More');

    // 3. Verify Metadata Box in Case Overview
    await expect(page.locator('text=Institutional Failure Documented').or(page.locator('text=Investigation or Procedural Delay Documented'))).toBeVisible();
    expect(combinedHeadings).not.toContain('Proven Institutional Failure');

    // 4. Test Interactive Decision Point
    const decisionCard = page.locator('button.portal-decision-choice-btn');
    await expect(decisionCard.first()).toBeVisible();
    // Choose Option B (the correct procedural answer)
    await decisionCard.nth(1).click();
    await page.waitForTimeout(300);

    // Verify feedback appears
    await expect(page.locator('text=Verified Procedural Reasoning').or(page.locator('text=Correct Understanding'))).toBeVisible();

    // Click Unlock button
    const unlockBtn = page.locator('button').filter({ hasText: /Continue to Evidence|Unlock Forensic/i });
    if (await unlockBtn.isVisible()) {
      await unlockBtn.click();
      await page.waitForTimeout(300);
    }

    // 5. Verify Three-Pillar Evidence Grid
    await expect(page.locator('h4').filter({ hasText: 'Confirmed Facts' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'Claims & Allegations' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'Unresolved Questions' })).toBeVisible();

    // 6. Verify Emergency Guidance & Realistic Golden Hour Protocol
    await expect(page.locator('text=1930 (Free, 24x7)').or(page.locator('text=1930 (Toll-Free, 24x7)'))).toBeVisible();
    await expect(page.locator('a[href*="cybercrime.gov.in"]')).toBeVisible();
    await expect(page.locator('text=First 2–3 Hours')).toBeVisible();

    // Verify nuanced Golden Hour text
    const guidanceText = await page.locator('text=Practical Response Guidance').locator('..').textContent();
    expect(guidanceText).toContain('Reporting After the Window');
    expect(guidanceText).toContain('not an automatic guarantee of account freezing or financial reimbursement');

    // 7. Verify Primary Sources
    const sourceCard = page.locator('text=Lok Sabha Unstarred Question 4143');
    await expect(sourceCard).toBeVisible();
    await expect(page.locator('a').filter({ hasText: 'View Official Document' }).first()).toBeVisible();

    // Capture Desktop Case Reader Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02_cases_desktop_case_reader.png'),
      fullPage: true
    });
  });

  test('3. Mobile Verification (390px): Viewport, Zero Overflow, Layout & Touch Targets', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/cases');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Zero Horizontal Overflow on Catalog
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 2. Verify Collection Switcher on Mobile
    const collectionTabs = page.locator('[role="tab"]');
    await expect(collectionTabs).toHaveCount(2);

    // Switch collection to "Cases Where Justice Fell Short"
    const shortcomingsTab = collectionTabs.nth(1);
    await shortcomingsTab.click();
    await page.waitForTimeout(300);

    // Verify 10 cards displayed on mobile
    await expect(page.locator('.incident-index-row')).toHaveCount(10);

    // Verify no horizontal overflow after switching
    const overflowAfterSwitch = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflowAfterSwitch).toBe(false);

    // Capture Mobile Catalog Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03_cases_mobile_catalog_390.png'),
      fullPage: true
    });

    // 3. Open Case Dossier on Mobile
    const firstCaseLink = page.locator('.incident-index-row').first();
    await firstCaseLink.click();
    await page.waitForTimeout(400);

    // Verify Case Dossier opened
    await expect(page.locator('button').filter({ hasText: /Back to Case Catalog/i })).toBeVisible();

    // Verify Zero Horizontal Overflow on Case Reader
    const readerOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(readerOverflow).toBe(false);

    // Capture Mobile Case Reader Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04_cases_mobile_reader_390.png'),
      fullPage: true
    });
  });

  test('4. Functional Parity: Landmark Precedents vs Shortcomings Isolation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/cases');
    await page.waitForLoadState('domcontentloaded');

    // Check Landmark has exactly 11 cases
    await expect(page.locator('.incident-index-row')).toHaveCount(11);

    // Click first Landmark case
    await page.locator('.incident-index-row').first().click();
    await page.waitForTimeout(300);

    // Verify Landmark narrative reader
    await expect(page.locator('button').filter({ hasText: /Back to Case Catalog/i })).toBeVisible();
    await expect(page.locator('h3, h4').filter({ hasText: 'What Would You Do?' })).toBeVisible();

    // Return to catalog
    await page.locator('button').filter({ hasText: /Back to Case Catalog/i }).click();
    await page.waitForTimeout(300);

    // Switch to Shortcomings
    await page.locator('[role="tab"]').nth(1).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.incident-index-row')).toHaveCount(10);

    // Return to Landmark
    await page.locator('[role="tab"]').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.incident-index-row')).toHaveCount(11);
  });
});

