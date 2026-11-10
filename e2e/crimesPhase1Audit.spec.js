// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const AxeBuilder = require('@axe-core/playwright').default;
const { getSeedCrimes } = require('./loadSeedCrimes');

const AUDIT_SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/crimes-audit');
const AUDIT_METRICS_PATH = path.join(AUDIT_SCREENSHOT_DIR, 'crimes_audit_metrics.json');

// Ensure output directory exists
if (!fs.existsSync(AUDIT_SCREENSHOT_DIR)) {
  fs.mkdirSync(AUDIT_SCREENSHOT_DIR, { recursive: true });
}

// Global audit metrics store
const auditData = {
  timestamp: new Date().toISOString(),
  paletteAudit: {},
  typographyAudit: {},
  layoutMetrics: {},
  interactiveStates: {},
  responsiveMetrics: {},
  axeIssues: {},
  contrastIssues: []
};

// Calculate contrast ratio helper
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function getContrastRatio(color1, color2) {
  const rgb1 = parseRgb(color1);
  const rgb2 = parseRgb(color2);
  if (!rgb1 || !rgb2) return null;
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

test.describe('Crimes Library — Phase 1 Design Audit (Read-Only)', () => {
  let seedCrimes = [];

  test.beforeAll(async () => {
    seedCrimes = getSeedCrimes();
  });

  test.beforeEach(async ({ page }) => {
    // Intercept auth/me
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthenticated' })
      });
    });

    // Intercept crimes list
    await page.route('**/api/crimes/crimes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedCrimes)
      });
    });

    // Intercept recommendations
    await page.route('**/api/crimes/crimes/recommendations', async (route) => {
      const recs = seedCrimes.filter(c => ['phishing', 'upi-payment-fraud', 'qr-code-scams'].includes(c.slug));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recommendations: recs,
          reason: 'Start with the most common threats.'
        })
      });
    });
  });

  test('1. Desktop Directory View Audit & Screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto('/crimes');
    await page.waitForLoadState('networkidle');

    // Wait for content to settle
    await expect(page.locator('.crimes-catalog-directory')).toBeVisible();

    // 1. Capture Full Page Screenshot
    await page.screenshot({
      path: path.join(AUDIT_SCREENSHOT_DIR, 'crimes_library_desktop_1280.png'),
      fullPage: true
    });

    // 2. Collect Page Colors & Tokens
    const pageStyles = await page.evaluate(() => {
      const body = document.body;
      const header = document.querySelector('header.top-header');
      const pageTitle = document.querySelector('.editorial-page-header h1, h1');
      const recStrip = document.querySelector('.crimes-rec-strip');
      const firstEntry = document.querySelector('.crime-index-entry');
      const firstTag = document.querySelector('.crime-index-tag');
      const firstAction = document.querySelector('.crime-index-action');

      return {
        bodyBg: window.getComputedStyle(body).backgroundColor,
        bodyColor: window.getComputedStyle(body).color,
        headerBg: header ? window.getComputedStyle(header).backgroundColor : null,
        headerColor: header ? window.getComputedStyle(header).color : null,
        pageTitleFont: pageTitle ? window.getComputedStyle(pageTitle).fontFamily : null,
        pageTitleColor: pageTitle ? window.getComputedStyle(pageTitle).color : null,
        recStripBg: recStrip ? window.getComputedStyle(recStrip).backgroundColor : null,
        recStripBorder: recStrip ? window.getComputedStyle(recStrip).borderTopColor : null,
        entryBg: firstEntry ? window.getComputedStyle(firstEntry).backgroundColor : null,
        entryBorder: firstEntry ? window.getComputedStyle(firstEntry).borderColor : null,
        tagBg: firstTag ? window.getComputedStyle(firstTag).backgroundColor : null,
        tagColor: firstTag ? window.getComputedStyle(firstTag).color : null,
        tagBorder: firstTag ? window.getComputedStyle(firstTag).borderColor : null,
        actionColor: firstAction ? window.getComputedStyle(firstAction).color : null
      };
    });
    auditData.paletteAudit.directory = pageStyles;

    // 3. Category Tags Color Inventory
    const tagInventory = await page.evaluate(() => {
      const tags = document.querySelectorAll('.crime-index-entry .crime-index-tag');
      const result = [];
      const seen = new Set();
      tags.forEach(t => {
        const text = t.textContent?.trim() || '';
        if (!seen.has(text)) {
          seen.add(text);
          const s = window.getComputedStyle(t);
          result.push({
            category: text,
            color: s.color,
            backgroundColor: s.backgroundColor,
            borderColor: s.borderColor
          });
        }
      });
      return result;
    });
    auditData.paletteAudit.categoryTags = tagInventory;

    // 4. Contrast Calculations for Category Tags
    tagInventory.forEach(t => {
      const ratio = getContrastRatio(t.color, t.backgroundColor);
      if (ratio && ratio < 4.5) {
        auditData.contrastIssues.push({
          element: `Category Tag [${t.category}]`,
          foreground: t.color,
          background: t.backgroundColor,
          ratio: ratio.toFixed(2),
          required: '4.5:1 (WCAG AA)'
        });
      }
    });

    // 5. Run Axe Core Accessibility Check
    const axeResults = await new AxeBuilder({ page })
      .disableRules(['landmark-one-main'])
      .analyze();
    auditData.axeIssues.directory = {
      violationCount: axeResults.violations.length,
      violations: axeResults.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length
      }))
    };
  });

  test('2. Search & Category Filter Interaction Audit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto('/crimes');
    await page.waitForLoadState('networkidle');

    // Test Search Input
    const searchInput = page.locator('input[placeholder*="Search crimes"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('UPI');
    await page.waitForTimeout(300);

    // Verify filtered result count
    const filteredEntries = page.locator('.crime-index-entry');
    const upiCount = await filteredEntries.count();
    expect(upiCount).toBeGreaterThanOrEqual(1);

    // Capture search state screenshot
    await page.screenshot({
      path: path.join(AUDIT_SCREENSHOT_DIR, 'crimes_library_search_desktop.png')
    });

    // Clear search
    const clearBtn = page.locator('button[title*="Clear"], button[aria-label*="Clear"], .search-clear-btn');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    } else {
      await searchInput.fill('');
    }

    // Toggle Filters Drawer
    const filtersToggleBtn = page.locator('button:has-text("Filters"), button:has-text("Filter")');
    if (await filtersToggleBtn.isVisible()) {
      await filtersToggleBtn.click();
      await page.waitForTimeout(300);

      // Verify category pills visible in drawer
      const catPills = page.locator('button:has-text("Financial Fraud")');
      await expect(catPills.first()).toBeVisible();

      // Click "Financial Fraud"
      await catPills.first().click();
      await page.waitForTimeout(300);

      // Capture filtered by category screenshot
      await page.screenshot({
        path: path.join(AUDIT_SCREENSHOT_DIR, 'crimes_library_filtered_desktop.png')
      });
    }
  });

  test('3. Desktop Detail Threat Profile View Audit & Screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto('/crimes');
    await page.waitForLoadState('networkidle');

    // Click on the first crime entry (Phishing) to open Detail View
    const firstCrime = page.locator('.crime-index-entry').first();
    await firstCrime.click();
    await page.waitForTimeout(400);

    // Verify detail view rendered
    await expect(page.locator('#overview')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    // 1. Capture Full Page Detail Screenshot
    await page.screenshot({
      path: path.join(AUDIT_SCREENSHOT_DIR, 'crimes_detail_desktop_1280.png'),
      fullPage: true
    });

    // 2. Audit Detail View Layout and Elements
    const detailMetrics = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const tag = document.querySelector('.tag');
      const riskMeter = document.querySelector('span[style*="uppercase"]');
      const simulatedQuote = document.querySelector('blockquote');
      const breadcrumb = document.querySelector('.workspace-breadcrumb, nav[aria-label="Breadcrumb"]');
      const backBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Back to Safety Guides'));
      const anchorNav = document.querySelector('a[href="#overview"]')?.parentElement;
      const doAvoidGrid = document.querySelector('#prevention > div');
      const decisionSec = document.querySelector('#scenario');
      const quickCheckSec = document.querySelector('#quickcheck');

      return {
        h1Text: h1?.textContent?.trim(),
        h1Color: h1 ? window.getComputedStyle(h1).color : null,
        h1Font: h1 ? window.getComputedStyle(h1).fontFamily : null,
        tagText: tag?.textContent?.trim(),
        tagColor: tag ? window.getComputedStyle(tag).color : null,
        tagBg: tag ? window.getComputedStyle(tag).backgroundColor : null,
        hasQuote: !!simulatedQuote,
        quoteBorderLeft: simulatedQuote ? window.getComputedStyle(simulatedQuote).borderLeftColor : null,
        hasBreadcrumb: !!breadcrumb,
        hasBackBtn: !!backBtn,
        hasAnchorNav: !!anchorNav,
        hasDoAvoidGrid: !!doAvoidGrid,
        hasDecisionSection: !!decisionSec,
        hasQuickCheckSection: !!quickCheckSec
      };
    });
    auditData.layoutMetrics.detail = detailMetrics;

    // 3. Test Interactive Decision Section ("What Would You Do?")
    const scenarioOption = page.locator('#scenario button').first();
    if (await scenarioOption.isVisible()) {
      await scenarioOption.click();
      await page.waitForTimeout(200);

      const submitBtn = page.locator('button:has-text("Submit Decision")');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(300);
        // Verify feedback appeared
        const feedback = page.locator('#scenario h4');
        await expect(feedback).toBeVisible();
      }
    }

    // 4. Test Quick Check Quiz
    const qcOption = page.locator('#quickcheck button').first();
    if (await qcOption.isVisible()) {
      await qcOption.click();
      await page.waitForTimeout(200);

      const verifyBtn = page.locator('button:has-text("Verify Answers")');
      if (await verifyBtn.isVisible() && await verifyBtn.isEnabled()) {
        await verifyBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 5. Test Completion Status Toggle
    const completeToggleBtn = page.locator('button:has-text("Mark Topic Completed"), button:has-text("Mark Incomplete")');
    if (await completeToggleBtn.isVisible()) {
      const initialText = await completeToggleBtn.innerText();
      await completeToggleBtn.click();
      await page.waitForTimeout(200);
      const afterText = await completeToggleBtn.innerText();
      expect(afterText).not.toBe(initialText);
      // Toggle back
      await completeToggleBtn.click();
    }

    // 6. Run Axe Core on Detail View
    const axeResultsDetail = await new AxeBuilder({ page })
      .disableRules(['landmark-one-main'])
      .analyze();
    auditData.axeIssues.detail = {
      violationCount: axeResultsDetail.violations.length,
      violations: axeResultsDetail.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length
      }))
    };
  });

  test('4. Tablet (768px) Responsiveness & Screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/crimes');
    await page.waitForLoadState('networkidle');

    // Check overflow
    const overflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    // Capture Tablet Screenshot
    await page.screenshot({
      path: path.join(AUDIT_SCREENSHOT_DIR, 'crimes_library_tablet_768.png'),
      fullPage: true
    });
  });

  test('5. Mobile (390px) Responsiveness & Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/crimes');
    await page.waitForLoadState('networkidle');

    // Check mobile directory overflow
    const overflowDir = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });
    expect(overflowDir.scrollWidth).toBeLessThanOrEqual(overflowDir.clientWidth);

    // 1. Capture Mobile Directory Screenshot
    await page.screenshot({
      path: path.join(AUDIT_SCREENSHOT_DIR, 'crimes_library_mobile_390.png'),
      fullPage: true
    });

    // 2. Open First Crime Detail View on Mobile
    const firstCrime = page.locator('.crime-index-entry').first();
    await firstCrime.click();
    await page.waitForTimeout(400);

    // Check mobile detail overflow
    const overflowDetail = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });
    expect(overflowDetail.scrollWidth).toBeLessThanOrEqual(overflowDetail.clientWidth);

    // 3. Capture Mobile Detail Screenshot
    await page.screenshot({
      path: path.join(AUDIT_SCREENSHOT_DIR, 'crimes_detail_mobile_390.png'),
      fullPage: true
    });

    // 4. Check Mobile Touch Targets
    const touchTargets = await page.evaluate(() => {
      const interactiveEls = document.querySelectorAll('button, a.btn, .crime-index-entry');
      const smallTargets = [];
      interactiveEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.height < 44 || rect.width < 44) {
            smallTargets.push({
              tag: el.tagName,
              text: el.textContent?.trim().slice(0, 30),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            });
          }
        }
      });
      return smallTargets;
    });
    auditData.responsiveMetrics.smallTouchTargets = touchTargets;

    // Save final audit JSON data
    fs.writeFileSync(AUDIT_METRICS_PATH, JSON.stringify(auditData, null, 2));
  });
});

