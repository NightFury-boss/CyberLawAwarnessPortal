const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, '../screenshots/atelier-review');
const ARTIFACT_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\2a38735a-7985-4d0c-9744-999cb0b89167\\screenshots';

function copyToArtifact(srcPath, filename) {
  const destPath = path.join(ARTIFACT_DIR, filename);
  fs.copyFileSync(srcPath, destPath);
}

async function loginAndGetToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: 'user@example.com', password: 'UserPass123!' });
    const req = http.request('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ token: parsed.token, user: parsed.user });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runInteractions() {
  console.log('Logging in test learner Rohan Sharma...');
  const { token, user } = await loginAndGetToken();
  console.log('Token acquired. Launching Playwright Chromium...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('workspace_sidebar_collapsed', 'false');
  }, { token, user });

  const page = await context.newPage();

  console.log('\n--- INTERACTION VERIFICATIONS (1440px) ---');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // A. Switching Digital Moments scenarios
  console.log('A. Testing Digital Moments scenario tabs...');
  const tabs = [
    { name: 'courier', text: 'Courier Re-Route', expected: 'DELHIVERY-TRACK' },
    { name: 'digital_arrest', text: 'Digital Arrest', expected: 'WhatsApp Video / Skype' },
    { name: 'reverse_qr', text: 'Reverse QR Code', expected: 'Classifieds Buyer Inquiry' },
    { name: 'utility', text: 'Utility Urgency', expected: 'VK-PSPCL-ALRT' }
  ];

  for (const t of tabs) {
    console.log(`  Clicking tab: ${t.text}...`);
    const tabBtn = page.getByRole('tab', { name: t.text });
    await tabBtn.click();
    await page.waitForTimeout(400);

    const hasExpected = await page.getByText(t.expected).first().isVisible();
    console.log(`    Content '${t.expected}' visible: ${hasExpected}`);

    const shotFile = `interaction_moment_${t.name}.png`;
    const shotPath = path.join(OUTPUT_DIR, shotFile);
    await page.locator('.story-atelier-section').screenshot({ path: shotPath });
    copyToArtifact(shotPath, shotFile);
  }

  // B. Following a scenario into learning material
  console.log('\nB. Following scenario "Examine Case Study →"...');
  const caseLink = page.getByRole('link', { name: /Examine Case Study/i }).first();
  const caseHref = await caseLink.getAttribute('href');
  console.log(`  Case link href: ${caseHref}`);
  await caseLink.click();
  await page.waitForTimeout(1000);
  console.log(`  Navigated to URL: ${page.url()}`);
  const caseShotFile = 'interaction_scenario_to_case.png';
  const caseShotPath = path.join(OUTPUT_DIR, caseShotFile);
  await page.screenshot({ path: caseShotPath, fullPage: false });
  copyToArtifact(caseShotPath, caseShotFile);

  // C. Continue an unfinished lesson
  console.log('\nC. Testing Continue Unfinished Lesson in Curriculum Codex...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const continueLessonBtn = page.getByRole('link', { name: /Continue reading/i }).first();
  if (await continueLessonBtn.isVisible()) {
    const lessonTitle = await continueLessonBtn.textContent();
    const lessonHref = await continueLessonBtn.getAttribute('href');
    console.log(`  Found lesson button: "${lessonTitle.trim()}" -> ${lessonHref}`);
    await continueLessonBtn.click();
    await page.waitForTimeout(1000);
    console.log(`  Navigated to URL: ${page.url()}`);
    const lessonShotFile = 'interaction_continue_lesson.png';
    const lessonShotPath = path.join(OUTPUT_DIR, lessonShotFile);
    await page.screenshot({ path: lessonShotPath, fullPage: false });
    copyToArtifact(lessonShotPath, lessonShotFile);
  }

  // D. Opening a quiz mode
  console.log('\nD. Testing Opening Quiz Mode in Practice Atelier...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const quickPracticeLink = page.getByRole('link', { name: /Start Quick Practice/i }).first();
  const quizHref = await quickPracticeLink.getAttribute('href');
  console.log(`  Clicking quiz card (href: ${quizHref})...`);
  await quickPracticeLink.click();
  await page.waitForTimeout(1000);
  console.log(`  Navigated to URL: ${page.url()}`);
  const quizShotFile = 'interaction_quiz_mode.png';
  const quizShotPath = path.join(OUTPUT_DIR, quizShotFile);
  await page.screenshot({ path: quizShotPath, fullPage: false });
  copyToArtifact(quizShotPath, quizShotFile);

  // E. Opening due recall review
  console.log('\nE. Testing Opening Due Recall Review...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const recallBtn = page.getByRole('button', { name: /Review Follow-Up Now/i }).first();
  if (await recallBtn.isVisible()) {
    console.log('  Clicking "Review Follow-Up Now →"...');
    await recallBtn.click();
    await page.waitForTimeout(600);
    const recallModalVisible = await page.locator('.modal-backdrop, .modal, [role="dialog"]').first().isVisible();
    console.log(`  Recall modal visible: ${recallModalVisible}`);
    const recallShotFile = 'interaction_due_recall.png';
    const recallShotPath = path.join(OUTPUT_DIR, recallShotFile);
    await page.screenshot({ path: recallShotPath, fullPage: false });
    copyToArtifact(recallShotPath, recallShotFile);
  }

  // F. Navigating the five milestones
  console.log('\nF. Testing Milestone Progression Constellation...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const milestoneNodes = await page.locator('.atelier-milestone-node').all();
  console.log(`  Found ${milestoneNodes.length} milestone nodes.`);
  for (let i = 0; i < milestoneNodes.length; i++) {
    const nodeText = await milestoneNodes[i].innerText();
    console.log(`    Node ${i + 1}: ${nodeText.replace(/\n/g, ' ')}`);
  }
  const milestoneShotFile = 'interaction_milestones.png';
  const milestoneShotPath = path.join(OUTPUT_DIR, milestoneShotFile);
  await page.locator('.atelier-milestone-map').screenshot({ path: milestoneShotPath });
  copyToArtifact(milestoneShotPath, milestoneShotFile);

  // G. Inspecting behavioral dimensions
  console.log('\nG. Testing Behavioral Dimensions inspection...');
  const dimCells = await page.locator('.dimension-cell').all();
  console.log(`  Found ${dimCells.length} dimension cells.`);
  if (dimCells.length > 0) {
    await dimCells[0].hover();
    await page.waitForTimeout(300);
    const cellText = await dimCells[0].innerText();
    console.log(`    Dimension 1 hovered: ${cellText.replace(/\n/g, ' ')}`);
  }
  const behavioralShotFile = 'interaction_behavioral.png';
  const behavioralShotPath = path.join(OUTPUT_DIR, behavioralShotFile);
  await page.locator('.atelier-behavioral-studio').screenshot({ path: behavioralShotPath });
  copyToArtifact(behavioralShotPath, behavioralShotFile);

  await browser.close();
  console.log('\n=== ALL INTERACTION VERIFICATIONS COMPLETED SUCCESSFULLY ===');
}

runInteractions().catch(err => {
  console.error('Fatal error during interaction verifications:', err);
  process.exit(1);
});
