// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Earth & Terracotta Homepage Refinement Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Grant clipboard permissions for copy test
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});

    // Mock /api/auth/me to return unauthenticated by default
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Not authenticated' })
      });
    });
  });

  test('1. Earth & Terracotta Palette & Typography on Homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Check Homepage wrapper background is Warm Parchment (#F3EBDD -> rgb(243, 235, 221))
    const wrapperBg = await page.locator('.homepage-wrapper').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(wrapperBg).toBe('rgb(243, 235, 221)');

    // 2. Check Primary text in homepage wrapper is Warm Charcoal (#302F29 -> rgb(48, 47, 41))
    const wrapperColor = await page.locator('.homepage-wrapper').evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(wrapperColor).toBe('rgb(48, 47, 41)');

    // 3. Check Headline font-family contains Playfair Display and color is Deep Olive (#394B36 -> rgb(57, 75, 54))
    const headline = page.locator('.portal-hero-headline');
    await expect(headline).toBeVisible();
    const headlineStyles = await headline.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        fontFamily: s.fontFamily,
        color: s.color,
        fontWeight: s.fontWeight
      };
    });
    expect(headlineStyles.fontFamily).toContain('Playfair Display');
    expect(headlineStyles.color).toBe('rgb(57, 75, 54)');
    expect(Number(headlineStyles.fontWeight)).toBeGreaterThanOrEqual(700);

    // 4. Verify exact headline copy
    const headlineText = await headline.innerText();
    expect(headlineText).toContain('Understand the law.');
    expect(headlineText).toContain('Recognize the threat.');
    expect(headlineText).toContain('Know what to do.');
  });

  test('2. Header Earth & Terracotta Foundation & Dark Logo', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('header.top-header');
    await expect(header).toHaveClass(/header-earth-terracotta/);

    // Check header background is Deep Olive (#394B36 -> rgb(57, 75, 54))
    const headerBg = await header.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(headerBg).toBe('rgb(57, 75, 54)');

    // Check logo image points to dark variant for high contrast on Deep Olive
    const logoImg = header.locator('.public-navbar-brand img');
    await expect(logoImg).toBeVisible();
    const logoSrc = await logoImg.getAttribute('src');
    expect(logoSrc).toBe('/logo/cyber-law-logo-dark.svg');

    // Check Start Learning button in header has Deep Terracotta background (#8D4E3D -> rgb(141, 78, 61))
    const registerBtn = header.locator('.nav-action-register');
    const registerBg = await registerBtn.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(registerBg).toBe('rgb(141, 78, 61)');
  });

  test('3. Hero Minimal Editorial Layout & Progression Spine', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Competing 450px vertical list card (.hero-flow-card) must not exist
    const oldFlowCard = page.locator('.hero-flow-card');
    await expect(oldFlowCard).toHaveCount(0);

    // Eyebrow is clean plain text
    const eyebrow = page.locator('.portal-hero-eyebrow');
    await expect(eyebrow).toBeVisible();
    expect(await eyebrow.innerText()).toContain('CYBER LAW AWARENESS PORTAL');

    // Primary CTA button "Start Learning"
    const startLearningBtn = page.locator('.portal-hero-btn-primary');
    await expect(startLearningBtn).toBeVisible();
    expect(await startLearningBtn.innerText()).toContain('Start Learning');
    const primaryBg = await startLearningBtn.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(primaryBg).toBe('rgb(57, 75, 54)'); // Deep Olive

    // Secondary CTA button "Explore Cyber Laws" linking to /laws
    const exploreBtn = page.locator('.portal-hero-btn-secondary');
    await expect(exploreBtn).toBeVisible();
    expect(await exploreBtn.innerText()).toContain('Explore Cyber Laws');
    expect(await exploreBtn.getAttribute('href')).toBe('/laws');

    // Sub-tagline
    const tagline = page.locator('.portal-hero-tagline');
    await expect(tagline).toBeVisible();
    expect(await tagline.innerText()).toContain('Learn the rules. Recognize the pattern. Pause before you act.');

    // 5-Node Learning Progression Spine
    const progressionSpine = page.locator('.hero-progression-spine');
    await expect(progressionSpine).toBeVisible();
    const nodeItems = progressionSpine.locator('.spine-node-item');
    await expect(nodeItems).toHaveCount(5);

    // Verify downward progression tracks (background rail + progressive fill track)
    const bgTrack = progressionSpine.locator('.spine-vertical-track');
    await expect(bgTrack).toBeVisible();
    const fillTrack = progressionSpine.locator('.spine-fill-track');
    await expect(fillTrack).toBeVisible();

    // Verify spine-animated class settles on mount
    await expect(progressionSpine).toHaveClass(/spine-animated/);
  });

  test('4. Five-Node Progression Spine & Downward Staggered Sequence', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for downward animation to run and completely settle (mount 200ms + 1400ms delay + 400ms transition + buffer = 2600ms)
    await page.waitForTimeout(2600);

    // Verify 5 progression nodes in hero in exact downward order
    const nodes = page.locator('.spine-node-item');
    await expect(nodes).toHaveCount(5);

    await expect(nodes.nth(0)).toContainText('L');
    await expect(nodes.nth(0)).toContainText('LAW');
    await expect(nodes.nth(0)).toHaveClass(/node-step-1/);

    await expect(nodes.nth(1)).toContainText('T');
    await expect(nodes.nth(1)).toContainText('THREAT');
    await expect(nodes.nth(1)).toHaveClass(/node-step-2/);

    await expect(nodes.nth(2)).toContainText('D');
    await expect(nodes.nth(2)).toContainText('DECISION');
    await expect(nodes.nth(2)).toHaveClass(/node-step-3/);

    await expect(nodes.nth(3)).toContainText('E');
    await expect(nodes.nth(3)).toContainText('LEARNING');
    await expect(nodes.nth(3)).toHaveClass(/node-step-4/);

    await expect(nodes.nth(4)).toContainText('✓');
    await expect(nodes.nth(4)).toContainText('IMPROVEMENT');
    await expect(nodes.nth(4)).toHaveClass(/node-step-5/);

    // Verify five distinct stage colours (Earth & Terracotta Palette)
    const badgeColors = await page.evaluate(() => {
      const badges = document.querySelectorAll('.spine-node-badge');
      return Array.from(badges).map(b => window.getComputedStyle(b).backgroundColor);
    });
    expect(badgeColors[0]).toBe('rgb(57, 75, 54)');   // Node 1: LAW — Deep Olive (#394B36)
    expect(badgeColors[1]).toBe('rgb(141, 78, 61)');  // Node 2: THREAT — Deep Terracotta (#8D4E3D)
    expect(badgeColors[2]).toBe('rgb(177, 138, 98)'); // Node 3: DECISION — Antique Brass (#B18A62)
    expect(badgeColors[3]).toBe('rgb(113, 134, 106)'); // Node 4: LEARNING — Muted Sage (#71866A)
    expect(badgeColors[4]).toBe('rgb(128, 91, 67)');  // Node 5: IMPROVEMENT — Deep Walnut (#805B43)

    // Verify each stage's label matches its stage colour
    const labelColors = await page.evaluate(() => {
      const labels = document.querySelectorAll('.spine-node-label');
      return Array.from(labels).map(l => window.getComputedStyle(l).color);
    });
    expect(labelColors[0]).toBe('rgb(57, 75, 54)');   // LAW label: Deep Olive
    expect(labelColors[1]).toBe('rgb(141, 78, 61)');  // THREAT label: Deep Terracotta
    expect(labelColors[2]).toBe('rgb(177, 138, 98)'); // DECISION label: Antique Brass
    expect(labelColors[3]).toBe('rgb(113, 134, 106)'); // LEARNING label: Muted Sage
    expect(labelColors[4]).toBe('rgb(128, 91, 67)');  // IMPROVEMENT label: Deep Walnut

    // Verify vertical rail track is visible against parchment with 14px top/bottom extensions
    const railTrack = page.locator('.spine-vertical-track');
    const railStyles = await railTrack.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        backgroundColor: s.backgroundColor,
        width: s.width,
        top: s.top,
        bottom: s.bottom
      };
    });
    expect(railStyles.backgroundColor).toBe('rgb(216, 202, 178)'); // #D8CAB2
    expect(railStyles.width).toBe('2.5px');
    expect(railStyles.top).toBe('14px');
    expect(railStyles.bottom).toBe('14px');

    // Verify downward fill track CSS properties (continuous Deep Olive fill spanning extensions)
    const fillTrack = page.locator('.spine-fill-track');
    const fillStyles = await fillTrack.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        transformOrigin: s.transformOrigin,
        transitionProperty: s.transitionProperty,
        backgroundColor: s.backgroundColor,
        width: s.width,
        top: s.top,
        bottom: s.bottom
      };
    });
    // Computed transform-origin: top serializes as "1px 0px" or "1.25px 0px" (X=center, Y=top 0px)
    expect(fillStyles.transformOrigin).toMatch(/(top|0px)/);
    expect(fillStyles.backgroundColor).toBe('rgb(57, 75, 54)'); // Deep Olive
    expect(fillStyles.width).toBe('2.5px');
    expect(fillStyles.top).toBe('14px');
    expect(fillStyles.bottom).toBe('14px');

    // Verify Curriculum Directory (#explore)
    const exploreSection = page.locator('#explore');
    await expect(exploreSection).toBeVisible();

    const dirRows = exploreSection.locator('.explore-directory-row');
    await expect(dirRows).toHaveCount(5);
    await expect(dirRows.nth(0)).toContainText('Cyber Laws');
    await expect(dirRows.nth(1)).toContainText('Cyber Crimes');
    await expect(dirRows.nth(2)).toContainText('Cyber Cases');
    await expect(dirRows.nth(3)).toContainText('Prevention Centre');
    await expect(dirRows.nth(4)).toContainText('Authoritative Resources');
  });

  test('4b. Prefers-Reduced-Motion Progression Spine Accessibility', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const spine = page.locator('.hero-progression-spine');
    await expect(spine).toBeVisible();

    // In reduced motion mode, it must be immediately active without animation delays
    await expect(spine).toHaveClass(/spine-animated/);

    // Verify all 5 node badges are fully visible (opacity = 1) and carry unified Earth & Terracotta colors immediately
    const badges = page.locator('.spine-node-badge');
    await expect(badges).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const opacity = await badges.nth(i).evaluate((el) => window.getComputedStyle(el).opacity);
      expect(opacity).toBe('1');
    }
    const rmColors = await page.evaluate(() => {
      const bs = document.querySelectorAll('.spine-node-badge');
      return Array.from(bs).map(b => window.getComputedStyle(b).backgroundColor);
    });
    expect(rmColors[0]).toBe('rgb(57, 75, 54)');   // Node 1: LAW — Deep Olive (#394B36)
    expect(rmColors[1]).toBe('rgb(141, 78, 61)');  // Node 2: THREAT — Deep Terracotta (#8D4E3D)
    expect(rmColors[2]).toBe('rgb(177, 138, 98)'); // Node 3: DECISION — Antique Brass (#B18A62)
    expect(rmColors[3]).toBe('rgb(113, 134, 106)'); // Node 4: LEARNING — Muted Sage (#71866A)
    expect(rmColors[4]).toBe('rgb(128, 91, 67)');  // Node 5: IMPROVEMENT — Deep Walnut (#805B43)

    const rmLabels = await page.evaluate(() => {
      const ls = document.querySelectorAll('.spine-node-label');
      return Array.from(ls).map(l => window.getComputedStyle(l).color);
    });
    expect(rmLabels[0]).toBe('rgb(57, 75, 54)');   // LAW label: Deep Olive
    expect(rmLabels[1]).toBe('rgb(141, 78, 61)');  // THREAT label: Deep Terracotta
    expect(rmLabels[2]).toBe('rgb(118, 83, 36)'); // DECISION label: Antique Brass (High Contrast WCAG AA)
    expect(rmLabels[3]).toBe('rgb(52, 84, 49)'); // LEARNING label: Muted Sage (High Contrast WCAG AA)
    expect(rmLabels[4]).toBe('rgb(128, 91, 67)');  // IMPROVEMENT label: Deep Walnut
  });

  test('4c. Everyday Digital Situations: Synchronized Scroll-Linking & Panel Responsibilities', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const momentsSection = page.locator('.digital-moments-section');
    await expect(momentsSection).toBeVisible();

    // Verify 3 situation narratives in Panel 1 (left column)
    const narrativeItems = momentsSection.locator('.moment-story-node');
    await expect(narrativeItems).toHaveCount(3);

    // Verify Situation 1 Narrative in Panel 1
    const item1 = narrativeItems.nth(0);
    await expect(item1).toContainText('01');
    await expect(item1).toContainText('Utility Communication');
    await expect(item1).toContainText('DEAR CONSUMER: Your electricity connection will be disconnected');
    await expect(item1).toContainText('Deceptive Signal:');
    await expect(item1).toContainText('Why This Matters:');

    // Verify Panel 2: Investigate & Verify Workspace on right (Desktop)
    const workspaceStage = momentsSection.locator('.moments-evidence-stage');
    await expect(workspaceStage).toBeVisible();
    await expect(workspaceStage).toContainText('INVESTIGATE & VERIFY WORKSPACE');
    await expect(workspaceStage).toContainText('SITUATION 01 OF 03');

    // CRITICAL REQUIREMENT: Panel 2 must NOT repeat the full incoming message or duplicate quote box
    const quoteInPanel2 = workspaceStage.locator('.preview-box-quote');
    await expect(quoteInPanel2).toHaveCount(0);
    const fullMsgRepeated = await workspaceStage.innerText();
    expect(fullMsgRepeated).not.toContain('DEAR CONSUMER: Your electricity connection will be disconnected');

    // Verify Panel 2 has the 4 distinct structured verification sections
    await expect(workspaceStage).toContainText('1. VERIFICATION OBJECTIVE');
    await expect(workspaceStage).toContainText('2. INDEPENDENT VERIFICATION STEPS');
    await expect(workspaceStage).toContainText('3. EVIDENCE TO CHECK');
    await expect(workspaceStage).toContainText('4. SAFE RESPONSE');

    // Verify Situation 1 specific verification details
    await expect(workspaceStage).toContainText('Consumer Account (CA) number');
    await expect(workspaceStage).toContainText('Do:');
    await expect(workspaceStage).toContainText('Avoid:');
    await expect(workspaceStage).toContainText('Never dial private contacts');

    // Verify Sticky Rail & Viewport Constraints
    const rail = momentsSection.locator('.moments-visual-stage-rail');
    const railPos = await rail.evaluate((el) => window.getComputedStyle(el).position);
    expect(railPos).toBe('sticky');

    // 1. SCROLL TEST: Scroll down to Situation 02
    const item2 = narrativeItems.nth(1);
    await item2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Verify Situation 02 becomes active in left panel and right sticky workspace
    await expect(item2).toHaveClass(/is-active-moment/);
    await expect(workspaceStage).toContainText('SITUATION 02 OF 03');
    await expect(workspaceStage).toContainText('Logistics & Delivery');
    await expect(workspaceStage).toContainText('Air Waybill (AWB #IN-883921)');
    const panel2TextSit2 = await workspaceStage.innerText();
    expect(panel2TextSit2).not.toContain('ALERT: Your package #IN-883921 could not be delivered');

    // 2. SCROLL TEST: Scroll down to Situation 03
    const item3 = narrativeItems.nth(2);
    await item3.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Verify Situation 03 becomes active in left panel and right sticky workspace
    await expect(item3).toHaveClass(/is-active-moment/);
    await expect(workspaceStage).toContainText('SITUATION 03 OF 03');
    await expect(workspaceStage).toContainText('Financial & Government');
    await expect(workspaceStage).toContainText('eportal.incometax.gov.in');
    await expect(workspaceStage).toContainText('pre-validated bank account');
    const panel2TextSit3 = await workspaceStage.innerText();
    expect(panel2TextSit3).not.toContain('Govt of India - Income Tax Dept: An outstanding tax refund');

    // 3. SCROLL TEST: Scroll back up to Situation 01
    await item1.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(item1).toHaveClass(/is-active-moment/);
    await expect(workspaceStage).toContainText('SITUATION 01 OF 03');

    // 4. TAB CLICK INTERACTION: Click tab 02 to jump smoothly to Situation 02
    const tab2 = workspaceStage.locator('.stage-switch-btn').nth(1);
    await tab2.click();
    await page.waitForTimeout(800);
    await expect(item2).toHaveClass(/is-active-moment/);
    await expect(workspaceStage).toContainText('SITUATION 02 OF 03');
  });

  test('5. Removal of Emergency Assistance from Home & Discreet Navigation to Resources', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Prominent emergency section must NOT exist on homepage
    const homepageEmergency = page.locator('.homepage-emergency-section');
    await expect(homepageEmergency).toHaveCount(0);
    const emergencyCard = page.locator('.homepage-wrapper #emergency-assistance');
    await expect(emergencyCard).toHaveCount(0);

    // 2. Discreet navigation option near the bottom must exist
    const discreetSection = page.locator('.homepage-discreet-emergency');
    await expect(discreetSection).toBeVisible();

    // Verify exact required text
    await expect(discreetSection).toContainText('Need help with a cybercrime incident?');
    await expect(discreetSection).toContainText('Find emergency helplines, reporting instructions and practical resources.');

    // Verify discreet link
    const discreetLink = discreetSection.locator('a.discreet-emergency-link');
    await expect(discreetLink).toBeVisible();
    expect(await discreetLink.innerText()).toContain('Explore Emergency Resources');
    expect(await discreetLink.getAttribute('href')).toBe('/resources#emergency-help');

    // 3. Click discreet link and verify navigation to Resources emergency desk
    await discreetLink.click();
    await page.waitForURL('**/resources#emergency-help');

    // 4. On Resources page, verify the Golden Hour Emergency Assistance Desk
    const resourcesEmergency = page.locator('#emergency-help');
    await expect(resourcesEmergency).toBeVisible();
    await expect(resourcesEmergency).toContainText('1930');
    await expect(resourcesEmergency).toContainText('Golden Hour');

    // Verify Dial 1930 action on Resources
    const dialLink = resourcesEmergency.locator('a[href="tel:1930"]');
    await expect(dialLink).toBeVisible();

    // Verify Copy 1930 action with interactive feedback on Resources
    const copyBtn = resourcesEmergency.locator('button');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(copyBtn).toContainText('Copied');

    // Verify cybercrime.gov.in link on Resources
    const portalLink = resourcesEmergency.locator('a[href="https://cybercrime.gov.in"]').first();
    await expect(portalLink).toBeVisible();

    // Verify Statutory Non-Guarantee Disclaimer on Resources
    const disclaimer = resourcesEmergency.locator('strong:has-text("Statutory Notice:")').locator('..');
    await expect(disclaimer).toBeVisible();
    expect(await disclaimer.innerText()).toContain('does not guarantee that funds will be frozen, reversed, or recovered');
  });

  test('6. Multi-Viewport Responsive Overflow & Touch Target Audit', async ({ page }) => {
    const viewports = [
      { name: '375px (Mobile)', width: 375, height: 667 },
      { name: '390px (Mobile)', width: 390, height: 844 },
      { name: '768px (Tablet)', width: 768, height: 1024 },
      { name: '1280px (Desktop)', width: 1280, height: 800 },
      { name: '1440px (Wide)', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Check for zero horizontal overflow
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth
        };
      });
      expect(
        overflow.scrollWidth,
        `Viewport ${vp.name} had horizontal overflow (${overflow.scrollWidth} > ${overflow.clientWidth})`
      ).toBeLessThanOrEqual(overflow.clientWidth);

      // Verify touch targets on interactive CTA buttons (height >= 44px)
      const primaryBtn = page.locator('.portal-hero-btn-primary');
      const box = await primaryBtn.boundingBox();
      if (box) {
        expect(box.height, `Primary CTA height on ${vp.name} should be >= 44px`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('7. Capture Production Screenshots for Artifact Delivery', async ({ page }, testInfo) => {
    const screenshotDir = testInfo.outputPath('screenshots', 'earth-terracotta');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Set reduced motion to ensure all Reveal components render immediately
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Desktop Full Screenshot (1280px)
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 300));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage_full_desktop_1280.png'),
      fullPage: true
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage_earth_terracotta_desktop_1280.png'),
      fullPage: true
    });

    // Capture individual active scenario states in Everyday Digital Situations
    // 1. Situation 01 Active State
    await page.locator('#moment-item-utility-sms').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, 'everyday_situation_01_active_desktop.png')
    });

    // 2. Situation 02 Active State
    await page.locator('#moment-item-delivery-sms').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, 'everyday_situation_02_active_desktop.png')
    });

    // 3. Situation 03 Active State
    await page.locator('#moment-item-tax-refund-sms').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, 'everyday_situation_03_active_desktop.png')
    });

    // Mobile Full Screenshot (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 300));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage_full_mobile_390.png'),
      fullPage: true
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage_earth_terracotta_mobile_390.png'),
      fullPage: true
    });

    // Capture Mobile Individual Situation Flow
    await page.locator('#moment-item-utility-sms').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, 'everyday_situation_01_active_mobile.png')
    });
  });
});
