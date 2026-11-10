// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Forest Cream Design System v1.1 Implementation Verification', () => {
  test('Token & Typography Verification on Home Page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Canvas Background is Cream (#F9F5E6)
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bodyBg).toBe('rgb(249, 245, 230)');

    // 2. Verify Primary Text is Charcoal (#26352B)
    const bodyColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).color;
    });
    expect(bodyColor).toBe('rgb(38, 53, 43)');

    // 3. Verify CSS Variables
    const cssVars = await page.evaluate(() => {
      const s = window.getComputedStyle(document.documentElement);
      return {
        bg: s.getPropertyValue('--color-background').trim(),
        surface: s.getPropertyValue('--color-surface-card').trim(),
        textPrimary: s.getPropertyValue('--color-text-primary').trim(),
        forest: s.getPropertyValue('--color-accent-forest').trim(),
        sunlight: s.getPropertyValue('--color-accent-gold').trim(),
        walnut: s.getPropertyValue('--color-accent-terracotta').trim(),
        serif: s.getPropertyValue('--font-serif').trim()
      };
    });
    expect(cssVars.bg.toLowerCase()).toBe('#f9f5e6');
    expect(cssVars.surface.toLowerCase()).toBe('#fffdf8');
    expect(cssVars.textPrimary.toLowerCase()).toBe('#26352b');
    expect(cssVars.forest.toLowerCase()).toBe('#1f4d3a');
    expect(cssVars.sunlight.toLowerCase()).toBe('#f6e39a');
    expect(cssVars.walnut.toLowerCase()).toBe('#805b43');
    expect(cssVars.serif).toContain('Playfair Display');
  });

  test('Statutory Accuracy & Badges on Laws Reference Center', async ({ page }) => {
    // Mock laws API so test runs deterministically with provision-level data
    await page.route('**/api/laws**', async (route) => {
      const mockLaws = [
        {
          _id: 'law_it_66c',
          sectionNumber: 'Section 66C',
          actName: 'Information Technology Act, 2000',
          officialTitle: 'Punishment for identity theft',
          role: 'Core Cyber Law',
          legalStatus: 'CURRENT',
          plainLanguageExplanation: 'Criminal penalty for identity theft.',
          officialText: 'Whoever fraudulently or dishonestly makes use of...',
          whyItMatters: 'Protects citizens.',
          exampleScenario: 'Using stolen passwords.'
        },
        {
          _id: 'law_it_66a',
          sectionNumber: 'Section 66A',
          actName: 'Information Technology Act, 2000',
          officialTitle: 'Punishment for sending offensive messages through communication service',
          role: 'Core Cyber Law',
          legalStatus: 'OMITTED',
          plainLanguageExplanation: 'Struck down provision.',
          officialText: 'Any person who sends...',
          whyItMatters: 'Unconstitutional violation of free speech.',
          exampleScenario: 'Posting critical commentary online.'
        },
        {
          _id: 'law_dpdp_s2',
          sectionNumber: 'Section 2',
          actName: 'Digital Personal Data Protection Act, 2023',
          officialTitle: 'Definitions',
          role: 'Data Protection',
          legalStatus: 'PARTIALLY_IN_FORCE',
          plainLanguageExplanation: 'Core definitions under the DPDP Act.',
          officialText: 'In this Act, unless the context otherwise requires...',
          whyItMatters: 'Defines Data Principal, Data Fiduciary, Consent Manager.',
          exampleScenario: 'Understanding who is responsible for data safety.'
        },
        {
          _id: 'law_dpdp_s6_9',
          sectionNumber: 'Section 6(9)',
          actName: 'Digital Personal Data Protection Act, 2023',
          officialTitle: 'Registration of Consent Managers',
          role: 'Data Protection',
          legalStatus: 'NOT_YET_IN_FORCE',
          plainLanguageExplanation: 'Accountability standards for Consent Managers.',
          officialText: 'Every Consent Manager shall be registered with the Board...',
          whyItMatters: 'Consent Managers act as transparent intermediaries.',
          exampleScenario: 'Managing data sharing consents across multiple apps.'
        },
        {
          _id: 'law_dpdp_s11',
          sectionNumber: 'Section 11',
          actName: 'Digital Personal Data Protection Act, 2023',
          officialTitle: 'Right to nominate, correct, and erase personal data',
          role: 'Data Protection',
          legalStatus: 'NOT_YET_IN_FORCE',
          plainLanguageExplanation: 'Rights of Data Principals to access and delete data.',
          officialText: 'A Data Principal shall have the right to correction and erasure...',
          whyItMatters: 'Enables citizens to control their digital footprint.',
          exampleScenario: 'Requesting deletion of an unused service account.'
        }
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLaws)
      });
    });

    await page.goto('/laws');
    await page.waitForLoadState('domcontentloaded');

    // Verify In-Force badge
    const inForceBadge = page.locator('text=✓ IN FORCE').first();
    await expect(inForceBadge).toBeVisible();

    // Verify Struck Down badge and notice
    const struckDownBadge = page.locator('text=✕ STRUCK DOWN (UNCONSTITUTIONAL)').first();
    await expect(struckDownBadge).toBeVisible();
    const struckNotice = page.locator('text=Struck down by the Supreme Court of India in Shreya Singhal (2015)').first();
    await expect(struckNotice).toBeVisible();

    // Verify DPDP Commenced badge
    const commencedBadge = page.locator('text=✓ COMMENCED 13 NOV 2025').first();
    await expect(commencedBadge).toBeVisible();

    // Verify DPDP Consent Manager Phase (13 Nov 2026) badge
    const consentMgrBadge = page.locator('text=⏱ COMMENCING 13 NOV 2026').first();
    await expect(consentMgrBadge).toBeVisible();

    // Verify DPDP Substantive Compliance Phase (13 May 2027) badge
    const scheduledBadge = page.locator('text=⏱ SCHEDULED 13 MAY 2027').first();
    await expect(scheduledBadge).toBeVisible();
  });

  test('Helpline 1930 & 3-Step Sequence Verification on Prevention and Resources', async ({ page }) => {
    await page.goto('/prevention');
    await page.waitForLoadState('domcontentloaded');

    // Verify 3-step sequence text
    await expect(page.locator('text=1. Report Immediately through Helpline 1930')).toBeVisible();
    await expect(page.locator('text=2. Complete Formal Complaint on cybercrime.gov.in')).toBeVisible();
    await expect(page.locator('text=3. Preserve All Evidence')).toBeVisible();

    // Verify non-guarantee disclaimer
    const disclaimer = page.locator('text=does not guarantee that funds will be frozen, reversed, or recovered');
    await expect(disclaimer.first()).toBeVisible();

    // Check Resources page as well
    await page.goto('/resources');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=National Cyber Crime Helpline (1930)')).toBeVisible();
    await expect(page.locator('text=National Cyber Crime Reporting Portal')).toBeVisible();
    await expect(page.locator('text=does not guarantee that funds will be frozen, reversed, or recovered').first()).toBeVisible();
  });

  test('Zero Horizontal Overflow on Mobile Viewports (375px & 390px)', async ({ page }) => {
    for (const width of [375, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/prevention');
      await page.waitForLoadState('domcontentloaded');

      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });

      expect(overflow.hasOverflow).toBe(false);
      expect(overflow.scrollWidth).toBeLessThanOrEqual(width);
    }
  });

  test('Workspace Sidebar Forest Green & Contrast Verification', async ({ page }) => {
    // Simulate authenticated session by setting localStorage
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock_token');
      localStorage.setItem('user', JSON.stringify({ id: 'usr_1', role: 'user', fullName: 'Verified Learner', email: 'learner@example.com' }));
    });

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/api/auth/me')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'usr_1', role: 'user', fullName: 'Verified Learner', email: 'learner@example.com' })
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hasBaseline: true,
          hasFinal: false,
          focusCount: 1,
          completedFocusCount: 0,
          primaryFocus: null,
          modules: [],
          quizzes: []
        })
      });
    });

    await page.goto('/dashboard');
    await page.waitForSelector('.workspace-sidebar', { timeout: 10000 });

    const sidebarBg = await page.locator('.workspace-sidebar').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Forest green #1F4D3A in rgb: rgb(31, 77, 58)
    expect(sidebarBg).toBe('rgb(31, 77, 58)');
  });
});
