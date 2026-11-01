const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const AFTER_DIR = path.join(__dirname, '../screenshots/responsive-audit/after');
const ARTIFACT_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\2a38735a-7985-4d0c-9744-999cb0b89167\\screenshots\\responsive-after';
fs.mkdirSync(AFTER_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function copyToArtifact(srcPath, filename) {
  const destPath = path.join(ARTIFACT_DIR, filename);
  fs.copyFileSync(srcPath, destPath);
}

const VIEWPORTS = [
  { name: '390px', width: 390, height: 844 },
  { name: '375px', width: 375, height: 812 }
];

async function checkPageOverflow(page, pageName, vpName) {
  const result = await page.evaluate((vp) => {
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const hasDocOverflow = scrollWidth > docWidth;

    const elements = Array.from(document.querySelectorAll('*'));
    const overflowing = [];

    for (const el of elements) {
      if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'].includes(el.tagName)) continue;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const rightOverflow = rect.right - docWidth;
      if (rightOverflow > 1.0) {
        let identifier = el.tagName.toLowerCase();
        if (el.id) identifier += `#${el.id}`;
        if (el.className && typeof el.className === 'string') {
          identifier += `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`;
        }
        overflowing.push({
          identifier,
          rectRight: Math.round(rect.right),
          docWidth,
          rightOverflow: Math.round(rightOverflow),
          textSnippet: (el.innerText || '').trim().slice(0, 40).replace(/\n/g, ' ')
        });
      }
    }

    return {
      docWidth,
      scrollWidth,
      hasDocOverflow,
      overflowingCount: overflowing.length,
      overflowing: overflowing.slice(0, 5)
    };
  }, vpName);

  return result;
}

async function verifyAll() {
  console.log('=== STARTING POST-FIX RESPONSIVENESS VERIFICATION ===\n');
  const browser = await chromium.launch({ headless: true });

  const summary = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================================`);
    console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================================`);

    // Public context
    const pubContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    const pubPage = await pubContext.newPage();

    // 1. Homepage
    console.log(`[1] Verifying Homepage @ ${vp.name}...`);
    await pubPage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await pubPage.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    await pubPage.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });
    await pubPage.waitForTimeout(600);

    const homeData = await checkPageOverflow(pubPage, 'Homepage', vp.name);
    console.log(`    scrollWidth: ${homeData.scrollWidth}px vs clientWidth: ${homeData.docWidth}px | Overflow: ${homeData.hasDocOverflow ? 'FAIL (+ ' + (homeData.scrollWidth - homeData.docWidth) + 'px)' : 'PASS (0px)'} | Culprits: ${homeData.overflowingCount}`);
    
    const homeShot = path.join(AFTER_DIR, `01_homepage_${vp.name}.png`);
    await pubPage.screenshot({ path: homeShot, fullPage: false });
    copyToArtifact(homeShot, `01_homepage_${vp.name}.png`);
    summary.push({ page: 'Homepage', vp: vp.name, ...homeData });

    await pubContext.close();

    // Authenticated context (Returning Demo Learner)
    const authContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    const authPage = await authContext.newPage();

    console.log(`Logging in as demo.returning@cyberlawportal.in...`);
    await authPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await authPage.waitForSelector('input[type="email"]');
    await authPage.fill('input[type="email"]', 'demo.returning@cyberlawportal.in');
    await authPage.fill('input[type="password"]', 'Password@123');
    await Promise.all([
      authPage.waitForURL('**/dashboard', { timeout: 15000 }),
      authPage.click('button[type="submit"]')
    ]);
    await authPage.waitForTimeout(1000);
    await authPage.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });

    // 2. Established Dashboard
    console.log(`[2] Verifying Established Dashboard @ ${vp.name}...`);
    const dashData = await checkPageOverflow(authPage, 'Dashboard', vp.name);
    console.log(`    scrollWidth: ${dashData.scrollWidth}px vs clientWidth: ${dashData.docWidth}px | Overflow: ${dashData.hasDocOverflow ? 'FAIL (+ ' + (dashData.scrollWidth - dashData.docWidth) + 'px)' : 'PASS (0px)'} | Culprits: ${dashData.overflowingCount}`);
    
    const dashShot = path.join(AFTER_DIR, `04_established_dashboard_${vp.name}.png`);
    await authPage.screenshot({ path: dashShot, fullPage: false });
    copyToArtifact(dashShot, `04_established_dashboard_${vp.name}.png`);
    
    const dashFullShot = path.join(AFTER_DIR, `04_established_dashboard_full_${vp.name}.png`);
    await authPage.screenshot({ path: dashFullShot, fullPage: true });
    copyToArtifact(dashFullShot, `04_established_dashboard_full_${vp.name}.png`);
    summary.push({ page: 'Dashboard', vp: vp.name, ...dashData });

    // 3. Curriculum (/modules)
    console.log(`[3] Verifying Curriculum (/modules) @ ${vp.name}...`);
    await authPage.goto('http://localhost:5173/modules', { waitUntil: 'domcontentloaded' });
    await authPage.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    await authPage.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });
    await authPage.waitForTimeout(800);

    const modData = await checkPageOverflow(authPage, 'Modules', vp.name);
    console.log(`    scrollWidth: ${modData.scrollWidth}px vs clientWidth: ${modData.docWidth}px | Overflow: ${modData.hasDocOverflow ? 'FAIL (+ ' + (modData.scrollWidth - modData.docWidth) + 'px)' : 'PASS (0px)'} | Culprits: ${modData.overflowingCount}`);
    
    const modShot = path.join(AFTER_DIR, `02_curriculum_${vp.name}.png`);
    await authPage.screenshot({ path: modShot, fullPage: false });
    copyToArtifact(modShot, `02_curriculum_${vp.name}.png`);
    summary.push({ page: 'Curriculum', vp: vp.name, ...modData });

    // 4. Quizzes (/quizzes)
    console.log(`[4] Verifying Quizzes (/quizzes) @ ${vp.name}...`);
    await authPage.goto('http://localhost:5173/quizzes', { waitUntil: 'domcontentloaded' });
    await authPage.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    await authPage.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });
    await authPage.waitForTimeout(800);

    const quizData = await checkPageOverflow(authPage, 'Quizzes', vp.name);
    console.log(`    scrollWidth: ${quizData.scrollWidth}px vs clientWidth: ${quizData.docWidth}px | Overflow: ${quizData.hasDocOverflow ? 'FAIL (+ ' + (quizData.scrollWidth - quizData.docWidth) + 'px)' : 'PASS (0px)'} | Culprits: ${quizData.overflowingCount}`);
    
    const quizShot = path.join(AFTER_DIR, `03_quizzes_${vp.name}.png`);
    await authPage.screenshot({ path: quizShot, fullPage: false });
    copyToArtifact(quizShot, `03_quizzes_${vp.name}.png`);
    summary.push({ page: 'Quizzes', vp: vp.name, ...quizData });

    // 5. Assessment Results Screen (/assessment/baseline)
    console.log(`[5] Verifying Assessment Results (/assessment/baseline) @ ${vp.name}...`);
    await authPage.goto('http://localhost:5173/assessment/baseline', { waitUntil: 'domcontentloaded' });
    await authPage.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    await authPage.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });
    await authPage.waitForTimeout(800);

    const resData = await checkPageOverflow(authPage, 'Assessment Results', vp.name);
    console.log(`    scrollWidth: ${resData.scrollWidth}px vs clientWidth: ${resData.docWidth}px | Overflow: ${resData.hasDocOverflow ? 'FAIL (+ ' + (resData.scrollWidth - resData.docWidth) + 'px)' : 'PASS (0px)'} | Culprits: ${resData.overflowingCount}`);
    
    const resShot = path.join(AFTER_DIR, `05_assessment_results_${vp.name}.png`);
    await authPage.screenshot({ path: resShot, fullPage: false });
    copyToArtifact(resShot, `05_assessment_results_${vp.name}.png`);
    summary.push({ page: 'Assessment Results', vp: vp.name, ...resData });

    await authContext.close();
  }

  await browser.close();

  console.log('\n========================================================');
  console.log('SUMMARY TABLE');
  console.log('========================================================');
  console.table(summary.map(s => ({
    Page: s.page,
    Viewport: s.vp,
    ScrollWidth: s.scrollWidth,
    ClientWidth: s.docWidth,
    OverflowPX: s.scrollWidth - s.docWidth,
    HasOverflow: s.hasDocOverflow,
    Culprits: s.overflowingCount
  })));

  fs.writeFileSync(
    path.join(__dirname, '../screenshots/responsive-audit/after_summary.json'),
    JSON.stringify(summary, null, 2)
  );
}

verifyAll().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
