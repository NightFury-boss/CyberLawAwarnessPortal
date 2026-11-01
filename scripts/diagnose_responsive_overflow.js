const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BEFORE_DIR = path.join(__dirname, '../screenshots/responsive-audit/before');
fs.mkdirSync(BEFORE_DIR, { recursive: true });

const VIEWPORTS = [
  { name: '390px', width: 390, height: 844 },
  { name: '375px', width: 375, height: 812 }
];

async function findOverflowElements(page) {
  return await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const hasDocOverflow = scrollWidth > docWidth;

    const elements = Array.from(document.querySelectorAll('*'));
    const overflowing = [];

    for (const el of elements) {
      // Ignore scripts, styles, meta, etc.
      if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'].includes(el.tagName)) continue;
      
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      
      // Check if element is visible
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      if (rect.width === 0 || rect.height === 0) continue;

      // Element right edge exceeds viewport
      const rightOverflow = rect.right - docWidth;
      const internalScrollOverflow = el.scrollWidth - el.clientWidth;
      
      if (rightOverflow > 1.5) {
        let identifier = el.tagName.toLowerCase();
        if (el.id) identifier += `#${el.id}`;
        if (el.className && typeof el.className === 'string') {
          identifier += `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}`;
        }
        
        overflowing.push({
          identifier,
          tagName: el.tagName,
          className: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
          textSnippet: (el.innerText || el.textContent || '').trim().slice(0, 60).replace(/\n/g, ' '),
          rectRight: Math.round(rect.right),
          rectWidth: Math.round(rect.width),
          docWidth,
          rightOverflow: Math.round(rightOverflow),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          cssOverflowX: style.overflowX,
          cssWidth: style.width,
          cssMaxWidth: style.maxWidth
        });
      }
    }

    // Sort by largest rightOverflow first
    overflowing.sort((a, b) => b.rightOverflow - a.rightOverflow);

    return {
      docWidth,
      scrollWidth,
      hasDocOverflow,
      overflowingCount: overflowing.length,
      overflowing: overflowing.slice(0, 15) // Top 15 worst offenders
    };
  });
}

async function runAudit() {
  console.log('=== STARTING MOBILE RESPONSIVENESS OVERFLOW AUDIT ===\n');
  const browser = await chromium.launch({ headless: true });

  const auditReport = {};

  for (const vp of VIEWPORTS) {
    console.log(`\n============================================================`);
    console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`============================================================`);
    auditReport[vp.name] = {};

    // Context 1: Public (Homepage, Curriculum, Quizzes)
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();

    // 1. Homepage
    console.log(`\n[Audit 1: Homepage @ ${vp.name}]`);
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    await page.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });
    await page.waitForTimeout(500);

    const homeData = await findOverflowElements(page);
    auditReport[vp.name].homepage = homeData;
    console.log(`  Document scrollWidth: ${homeData.scrollWidth}px vs clientWidth: ${homeData.docWidth}px (Overflow: ${homeData.hasDocOverflow ? 'YES (+' + (homeData.scrollWidth - homeData.docWidth) + 'px)' : 'NO'})`);
    console.log(`  Overflowing elements found: ${homeData.overflowingCount}`);
    if (homeData.overflowing.length > 0) {
      console.log('  Top culprits:');
      homeData.overflowing.slice(0, 5).forEach((item, idx) => {
        console.log(`    ${idx + 1}. [${item.identifier}] exceeds by +${item.rightOverflow}px ("${item.textSnippet}")`);
      });
    }
    const homeShot = path.join(BEFORE_DIR, `01_homepage_${vp.name}.png`);
    await page.screenshot({ path: homeShot, fullPage: false });
    console.log(`  Saved screenshot: ${homeShot}`);

    // 2. Curriculum (/modules)
    console.log(`\n[Audit 2: Curriculum /modules @ ${vp.name}]`);
    await page.goto('http://localhost:5173/modules', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    await page.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });
    await page.waitForTimeout(500);

    const modulesData = await findOverflowElements(page);
    auditReport[vp.name].modules = modulesData;
    console.log(`  Document scrollWidth: ${modulesData.scrollWidth}px vs clientWidth: ${modulesData.docWidth}px (Overflow: ${modulesData.hasDocOverflow ? 'YES (+' + (modulesData.scrollWidth - modulesData.docWidth) + 'px)' : 'NO'})`);
    console.log(`  Overflowing elements found: ${modulesData.overflowingCount}`);
    if (modulesData.overflowing.length > 0) {
      console.log('  Top culprits:');
      modulesData.overflowing.slice(0, 5).forEach((item, idx) => {
        console.log(`    ${idx + 1}. [${item.identifier}] exceeds by +${item.rightOverflow}px ("${item.textSnippet}")`);
      });
    }
    const modulesShot = path.join(BEFORE_DIR, `02_curriculum_${vp.name}.png`);
    await page.screenshot({ path: modulesShot, fullPage: false });
    console.log(`  Saved screenshot: ${modulesShot}`);

    // 3. Quizzes (/quizzes)
    console.log(`\n[Audit 3: Quizzes /quizzes @ ${vp.name}]`);
    await page.goto('http://localhost:5173/quizzes', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    await page.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });
    await page.waitForTimeout(500);

    const quizzesData = await findOverflowElements(page);
    auditReport[vp.name].quizzes = quizzesData;
    console.log(`  Document scrollWidth: ${quizzesData.scrollWidth}px vs clientWidth: ${quizzesData.docWidth}px (Overflow: ${quizzesData.hasDocOverflow ? 'YES (+' + (quizzesData.scrollWidth - quizzesData.docWidth) + 'px)' : 'NO'})`);
    console.log(`  Overflowing elements found: ${quizzesData.overflowingCount}`);
    if (quizzesData.overflowing.length > 0) {
      console.log('  Top culprits:');
      quizzesData.overflowing.slice(0, 5).forEach((item, idx) => {
        console.log(`    ${idx + 1}. [${item.identifier}] exceeds by +${item.rightOverflow}px ("${item.textSnippet}")`);
      });
    }
    const quizzesShot = path.join(BEFORE_DIR, `03_quizzes_${vp.name}.png`);
    await page.screenshot({ path: quizzesShot, fullPage: false });
    console.log(`  Saved screenshot: ${quizzesShot}`);

    await context.close();

    // Context 2: Authenticated as Returning Learner (Dashboard & Baseline Results)
    const authContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    const authPage = await authContext.newPage();

    // Login
    console.log(`\n[Logging into returning demo user for dashboard and results audit...]`);
    await authPage.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await authPage.fill('input[type="email"]', 'demo.returning@cyberlawportal.in');
    await authPage.fill('input[type="password"]', 'Password@123');
    await authPage.click('button[type="submit"]');
    await authPage.waitForURL('**/dashboard', { timeout: 8000 });
    await authPage.waitForTimeout(1000);
    await authPage.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });

    // 4. Established Dashboard
    console.log(`\n[Audit 4: Established Dashboard @ ${vp.name}]`);
    const dashData = await findOverflowElements(authPage);
    auditReport[vp.name].dashboard = dashData;
    console.log(`  Document scrollWidth: ${dashData.scrollWidth}px vs clientWidth: ${dashData.docWidth}px (Overflow: ${dashData.hasDocOverflow ? 'YES (+' + (dashData.scrollWidth - dashData.docWidth) + 'px)' : 'NO'})`);
    console.log(`  Overflowing elements found: ${dashData.overflowingCount}`);
    if (dashData.overflowing.length > 0) {
      console.log('  Top culprits:');
      dashData.overflowing.slice(0, 5).forEach((item, idx) => {
        console.log(`    ${idx + 1}. [${item.identifier}] exceeds by +${item.rightOverflow}px ("${item.textSnippet}")`);
      });
    }
    const dashShot = path.join(BEFORE_DIR, `04_established_dashboard_${vp.name}.png`);
    await authPage.screenshot({ path: dashShot, fullPage: false });
    console.log(`  Saved screenshot: ${dashShot}`);

    // Also capture full page of dashboard to audit full length
    const dashFullShot = path.join(BEFORE_DIR, `04_established_dashboard_full_${vp.name}.png`);
    await authPage.screenshot({ path: dashFullShot, fullPage: true });
    console.log(`  Saved full page screenshot: ${dashFullShot}`);

    // 5. Assessment Results
    console.log(`\n[Audit 5: Assessment Results @ ${vp.name}]`);
    await authPage.goto('http://localhost:5173/assessment/baseline', { waitUntil: 'domcontentloaded' });
    await authPage.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    await authPage.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });
    await authPage.waitForTimeout(800);

    const resData = await findOverflowElements(authPage);
    auditReport[vp.name].results = resData;
    console.log(`  Document scrollWidth: ${resData.scrollWidth}px vs clientWidth: ${resData.docWidth}px (Overflow: ${resData.hasDocOverflow ? 'YES (+' + (resData.scrollWidth - resData.docWidth) + 'px)' : 'NO'})`);
    console.log(`  Overflowing elements found: ${resData.overflowingCount}`);
    if (resData.overflowing.length > 0) {
      console.log('  Top culprits:');
      resData.overflowing.slice(0, 5).forEach((item, idx) => {
        console.log(`    ${idx + 1}. [${item.identifier}] exceeds by +${item.rightOverflow}px ("${item.textSnippet}")`);
      });
    }
    const resShot = path.join(BEFORE_DIR, `05_assessment_results_${vp.name}.png`);
    await authPage.screenshot({ path: resShot, fullPage: false });
    console.log(`  Saved screenshot: ${resShot}`);

    await authContext.close();
  }

  await browser.close();

  fs.writeFileSync(
    path.join(__dirname, '../screenshots/responsive-audit/before_audit.json'),
    JSON.stringify(auditReport, null, 2)
  );

  console.log('\n=== AUDIT COMPLETE — SAVED REPORT TO screenshots/responsive-audit/before_audit.json ===');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

