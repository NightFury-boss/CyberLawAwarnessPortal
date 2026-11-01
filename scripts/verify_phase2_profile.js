const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SHOT_DIR = path.join(__dirname, '../screenshots/phase2-profile');
const ARTIFACT_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\2a38735a-7985-4d0c-9744-999cb0b89167\\screenshots\\phase2-profile';

fs.mkdirSync(SHOT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function copyToArtifact(srcPath, filename) {
  const destPath = path.join(ARTIFACT_DIR, filename);
  fs.copyFileSync(srcPath, destPath);
}

const VIEWPORTS = [
  { name: '1440px_desktop', width: 1440, height: 900 },
  { name: '1024px_laptop', width: 1024, height: 768 },
  { name: '768px_tablet', width: 768, height: 1024 },
  { name: '390px_mobile', width: 390, height: 844 },
  { name: '375px_mobile_narrow', width: 375, height: 812 }
];

async function verifyPhase2Profile() {
  console.log('=== STARTING PHASE 2: DIGITAL AWARENESS PROFILE VERIFICATION ===\n');
  const browser = await chromium.launch({ headless: true });

  const summary = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================================`);
    console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();

    // 1. Authenticate as returning demo learner
    console.log(`Logging in as demo.returning@cyberlawportal.in...`);
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'demo.returning@cyberlawportal.in');
    await page.fill('input[type="password"]', 'Password@123');
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    // 2. Navigate to /assessment/baseline
    console.log(`Navigating to /assessment/baseline...`);
    await page.goto('http://localhost:5173/assessment/baseline', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.addStyleTag({ content: '#reticle-root, [class*="reticle"] { display: none !important; }' });
    await page.waitForTimeout(800);

    // 3. Verify key elements exist
    const pageText = await page.textContent('body');
    const hasTitle = pageText.includes('Your Digital Awareness Profile');
    const hasPrinciple = pageText.includes('Knowing the law is only the beginning');
    const hasStrengths = pageText.includes('What You Already Do Well');
    const hasOpportunities = pageText.includes('Where You Can Become Safer');
    const hasDimensions = pageText.includes('Understand the Six Behavioural Dimensions');
    const hasLaw = pageText.includes('How Your Habits Connect to Indian Cyber Law');
    const hasHelpline = pageText.includes('1930');
    const hasRemediation = pageText.includes('What Happens Next?');

    console.log(`  Profile Title: ${hasTitle ? 'FOUND' : 'MISSING'}`);
    console.log(`  Principle Quote: ${hasPrinciple ? 'FOUND' : 'MISSING'}`);
    console.log(`  Strengths Section: ${hasStrengths ? 'FOUND' : 'MISSING'}`);
    console.log(`  Opportunities Section: ${hasOpportunities ? 'FOUND' : 'MISSING'}`);
    console.log(`  Six Dimensions: ${hasDimensions ? 'FOUND' : 'MISSING'}`);
    console.log(`  Indian Cyber Law: ${hasLaw ? 'FOUND' : 'MISSING'}`);
    console.log(`  Helpline 1930: ${hasHelpline ? 'FOUND' : 'MISSING'}`);
    console.log(`  Remediation Pathways: ${hasRemediation ? 'FOUND' : 'MISSING'}`);

    // 4. Test interaction: Expand first decision trail item if present
    const accordionBtn = await page.$('.evidence-row-button');
    if (accordionBtn) {
      console.log('  Interacting with Decision Evidence Accordion...');
      await accordionBtn.click();
      await page.waitForTimeout(300);
      const isExpanded = await accordionBtn.getAttribute('aria-expanded');
      console.log(`  Accordion expanded state: ${isExpanded}`);
    }

    // 5. Measure horizontal document overflow
    const overflowResult = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const hasOverflow = scrollWidth > docWidth;
      return {
        docWidth,
        scrollWidth,
        overflowPx: Math.max(0, scrollWidth - docWidth),
        hasOverflow
      };
    });

    console.log(`  scrollWidth: ${overflowResult.scrollWidth}px vs clientWidth: ${overflowResult.docWidth}px | Overflow: ${overflowResult.hasOverflow ? 'FAIL (+ ' + overflowResult.overflowPx + 'px)' : 'PASS (0px)'}`);

    // 6. Capture screenshot
    const shotFilename = `phase2_profile_${vp.name}.png`;
    const shotPath = path.join(SHOT_DIR, shotFilename);
    await page.screenshot({ path: shotPath, fullPage: false });
    copyToArtifact(shotPath, shotFilename);

    const fullShotFilename = `phase2_profile_full_${vp.name}.png`;
    const fullShotPath = path.join(SHOT_DIR, fullShotFilename);
    await page.screenshot({ path: fullShotPath, fullPage: true });
    copyToArtifact(fullShotPath, fullShotFilename);

    summary.push({
      viewport: vp.name,
      ...overflowResult,
      elementsFound: hasTitle && hasStrengths && hasDimensions && hasLaw && hasHelpline
    });

    await context.close();
  }

  await browser.close();

  console.log('\n========================================================');
  console.log('PHASE 2 RESPONSIVE & VERIFICATION SUMMARY TABLE');
  console.log('========================================================');
  console.table(summary);

  const allPassed = summary.every(s => !s.hasOverflow && s.elementsFound);
  console.log(`\nOVERALL VERDICT: ${allPassed ? '100% PASS' : 'FAILURES DETECTED'}`);
}

verifyPhase2Profile().catch(err => {
  console.error('Phase 2 verification script error:', err);
  process.exit(1);
});

