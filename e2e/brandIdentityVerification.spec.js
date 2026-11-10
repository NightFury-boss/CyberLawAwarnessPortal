// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\2a38735a-7985-4d0c-9744-999cb0b89167\\screenshots\\brand-identity';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const setupMockApi = async (page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mock_jwt_brand_token');
    window.localStorage.setItem('user', JSON.stringify({
      _id: 'usr_brand_qa',
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
            _id: 'usr_brand_qa',
            fullName: 'Aarav Sharma',
            email: 'aarav.sharma@cyberlawportal.test',
            role: 'user'
          }
        })
      });
      return;
    }

    if (url.includes('/api/progress') || url.includes('/api/quizzes') || url.includes('/api/crimes') || url.includes('/api/laws')) {
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
};

test.describe('Brand Identity Integration QA', () => {

  test('Desktop 1440px: Home dark header & footer logo verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Check header logo (on dark olive homepage, dark variant is used)
    const headerLogo = page.locator('.public-navbar-brand img');
    await expect(headerLogo).toBeVisible();
    await expect(headerLogo).toHaveAttribute('src', '/logo/cyber-law-logo-dark.svg');

    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);

    // Capture screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_desktop_1440_home_header.png'), clip: { x: 0, y: 0, width: 1440, height: 350 } });

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    const footer = page.locator('.portal-footer');
    const footerLogo = page.locator('.footer-logo');
    await expect(footerLogo).toBeVisible();
    await expect(footerLogo).toHaveAttribute('src', '/logo/cyber-law-logo-footer.svg');

    // Verify footer logo is wrapped in home link and redundant HTML tagline is removed
    const footerLogoLink = page.locator('.footer-logo-link');
    await expect(footerLogoLink).toBeVisible();
    await expect(page.locator('.footer-tagline')).toHaveCount(0);

    await footer.screenshot({ path: path.join(SCREENSHOT_DIR, '02_desktop_1440_home_footer.png') });
  });

  test('Desktop 1440px: About page light ivory header verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/about');

    const headerLogo = page.locator('.public-navbar-brand img');
    await expect(headerLogo).toBeVisible();
    await expect(headerLogo).toHaveAttribute('src', '/logo/cyber-law-logo-horizontal.svg');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_desktop_1440_about_light_header.png'), clip: { x: 0, y: 0, width: 1440, height: 280 } });
  });

  test('Desktop 1280px: Workspace sidebar logo verification', async ({ page }) => {
    await setupMockApi(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');

    const sidebar = page.locator('#workspace-sidebar');
    await expect(sidebar).toBeVisible();

    const sidebarLogo = page.locator('.workspace-sidebar-brand img');
    await expect(sidebarLogo).toBeVisible();
    await expect(sidebarLogo).toHaveAttribute('src', '/logo/cyber-law-logo-dark.svg');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_desktop_1280_workspace_sidebar.png') });
  });

  test('Tablet 768px: Header, drawer and footer verification', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const headerLogo = page.locator('.public-navbar-brand img');
    await expect(headerLogo).toBeVisible();

    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_tablet_768_home_header.png'), clip: { x: 0, y: 0, width: 768, height: 350 } });

    // Open mobile drawer
    const menuBtn = page.locator('.mobile-menu-trigger');
    await menuBtn.click();
    const drawer = page.locator('.mobile-drawer');
    await expect(drawer).toBeVisible();

    const drawerLogo = page.locator('.mobile-drawer-header img');
    await expect(drawerLogo).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_tablet_768_mobile_drawer.png'), clip: { x: 0, y: 0, width: 768, height: 500 } });
  });

  test('Mobile 390px: iPhone viewport brand verification', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const headerLogo = page.locator('.public-navbar-brand img');
    await expect(headerLogo).toBeVisible();

    // Verify proportions
    const box = await headerLogo.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThan(20);
      expect(box.height).toBeLessThan(45);
    }

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_mobile_390_home_header.png'), clip: { x: 0, y: 0, width: 390, height: 320 } });

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    const footer = page.locator('.portal-footer');
    await footer.screenshot({ path: path.join(SCREENSHOT_DIR, '08_mobile_390_footer.png') });
  });

  test('Mobile 375px: Compact mobile viewport brand verification', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const headerLogo = page.locator('.public-navbar-brand img');
    await expect(headerLogo).toBeVisible();

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_mobile_375_home_header.png'), clip: { x: 0, y: 0, width: 375, height: 300 } });
  });

  test('Desktop 1440px: Authenticated header with prominent Dashboard button contrast and Logout', async ({ page }) => {
    await setupMockApi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const dashboardBtn = page.locator('.nav-action-dashboard');
    await expect(dashboardBtn).toBeVisible();
    await expect(dashboardBtn).toHaveText('Dashboard');

    // Verify computed high-contrast styles on dark forest-green/olive header
    const buttonStyles = await dashboardBtn.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        bg: computed.backgroundColor,
        color: computed.color,
        border: computed.borderColor,
        fontWeight: computed.fontWeight
      };
    });

    // #FFFCF5 is rgb(255, 252, 245), warm charcoal (--et-warm-charcoal: #302F29) is rgb(48, 47, 41) -> 12.9:1 AAA contrast
    expect(buttonStyles.bg).toBe('rgb(255, 252, 245)');
    expect(buttonStyles.color).toBe('rgb(48, 47, 41)');

    const logoutBtn = page.locator('.top-header .btn-logout-quiet');
    await expect(logoutBtn).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01b_desktop_1440_home_header_authenticated.png'),
      clip: { x: 0, y: 0, width: 1440, height: 250 }
    });
  });

  test('Favicon and metadata verification', async ({ page }) => {
    await page.goto('/');
    const faviconSvg = page.locator('link[rel="icon"][type="image/svg+xml"]');
    await expect(faviconSvg).toHaveAttribute('href', '/favicon.svg');

    const favicon48 = page.locator('link[rel="icon"][sizes="48x48"]');
    await expect(favicon48).toHaveAttribute('href', '/favicon-48x48.png');

    const favicon32 = page.locator('link[rel="icon"][sizes="32x32"]');
    await expect(favicon32).toHaveAttribute('href', '/favicon-32x32.png');

    const favicon16 = page.locator('link[rel="icon"][sizes="16x16"]');
    await expect(favicon16).toHaveAttribute('href', '/favicon-16x16.png');

    const appleIcon = page.locator('link[rel="apple-touch-icon"]').first();
    await expect(appleIcon).toHaveAttribute('href', '/apple-touch-icon.png');

    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#3A2E26');
  });

  test('Homepage: Refined closing CTA with progress indicator and removed redundant brand logo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const closingCard = page.locator('.closing-cta-card');
    await expect(closingCard).toBeVisible();

    // Redundant logo must be removed
    const closingBrandLogo = page.locator('.closing-cta-brand img');
    await expect(closingBrandLogo).toHaveCount(0);

    // Progress indicator must be present and legible
    const progressTrack = page.locator('.closing-cta-card .cta-path-echo');
    await expect(progressTrack).toBeVisible();
    await expect(progressTrack).toContainText('01');
    await expect(progressTrack).toContainText('Law');
    await expect(progressTrack).toContainText('02');
    await expect(progressTrack).toContainText('Real Situation');
    await expect(progressTrack).toContainText('03');
    await expect(progressTrack).toContainText('Verification');
    await expect(progressTrack).toContainText('04');
    await expect(progressTrack).toContainText('Safer Action');

    // Active step verification
    const activeStep = page.locator('.closing-cta-card .echo-node-active');
    await expect(activeStep).toBeVisible();
    await expect(activeStep).toHaveAttribute('aria-current', 'step');
    await expect(activeStep).toContainText('04');
    await expect(activeStep).toContainText('Safer Action');

    // Headline and buttons
    await expect(page.locator('.closing-cta-title')).toContainText('Ready to learn how digital situations become safer decisions?');
    await expect(page.locator('.closing-btn-primary')).toBeVisible();
    await expect(page.locator('.closing-btn-secondary')).toBeVisible();

    await closingCard.screenshot({ path: path.join(SCREENSHOT_DIR, '10_homepage_refined_closing_cta.png') });
  });

  test('Auth Page: Brand presentation and top header navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');

    const brandHeader = page.locator('.public-navbar-brand img');
    await expect(brandHeader).toBeVisible();
    await expect(brandHeader).toHaveAttribute('src', '/logo/cyber-law-logo-horizontal.svg');

    const backLink = page.locator('.auth-back-link');
    await expect(backLink).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_auth_login_brand_layout.png') });
  });

  test('Brand Assets Directory: Canonical asset availability', async ({ request }) => {
    const assets = [
      '/brand/cyberlaw-logo-primary.svg',
      '/brand/cyberlaw-logo-primary.png',
      '/brand/cyberlaw-logo-horizontal.svg',
      '/brand/cyberlaw-logo-horizontal.png',
      '/brand/cyberlaw-logo-horizontal-dark.svg',
      '/brand/cyberlaw-logo-horizontal-dark.png',
      '/brand/cyberlaw-icon-dark.svg',
      '/brand/cyberlaw-icon-light.svg',
      '/brand/favicon-32.png',
      '/brand/favicon-16.png'
    ];

    for (const assetPath of assets) {
      const res = await request.get(assetPath);
      expect(res.status(), `Asset ${assetPath} should return 200 OK`).toBe(200);
    }
  });

});

