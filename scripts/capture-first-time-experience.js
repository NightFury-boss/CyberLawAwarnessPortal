const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../screenshots/first-time-experience');
const ARTIFACT_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\2a38735a-7985-4d0c-9744-999cb0b89167\\screenshots';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function copyToArtifact(srcPath, filename) {
  const destPath = path.join(ARTIFACT_DIR, filename);
  fs.copyFileSync(srcPath, destPath);
}

async function api(endpoint, options = {}) {
  const url = `http://127.0.0.1:5000${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, body: data };
}

const VIEWPORTS = [
  { name: '1440px_desktop', width: 1440, height: 900 },
  { name: '1024px_laptop', width: 1024, height: 768 },
  { name: '768px_tablet', width: 768, height: 1024 },
  { name: '390px_mobile', width: 390, height: 844 },
  { name: '375px_mobile', width: 375, height: 667 }
];

async function run() {
  console.log('--- Registering fresh test learner for visual capture ---');
  const freshEmail = `visual_learner_${Date.now()}@example.com`;
  const regRes = await api('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Aarav Patel',
      email: freshEmail,
      password: 'Password123!'
    }
  });

  const token = regRes.body.token;
  const user = regRes.body.user;
  console.log(`Fresh learner registered (${freshEmail}).`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('workspace_sidebar_collapsed', 'false');

    // Suppress external dev tools overlay for pristine visual verification
    const style = document.createElement('style');
    style.innerHTML = `
      #reticle-root, [class*="reticle"], [id*="reticle"], div[data-reticle] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }, { token, user });

  const page = await context.newPage();

  // 1. Capture Case A: Fresh First-Visit Experience across all 5 viewports
  console.log('\n--- CAPTURING CASE A: FRESH FIRST-VISIT VIEWPORTS ---');
  for (const vp of VIEWPORTS) {
    console.log(`Setting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '#reticle-root, [class*="reticle"], [id*="reticle"] { display: none !important; }' });
    await page.waitForTimeout(600);

    const firstScreenFile = `firstvisit_screen_${vp.name}.png`;
    const firstScreenPath = path.join(OUTPUT_DIR, firstScreenFile);
    await page.screenshot({ path: firstScreenPath, fullPage: false });
    copyToArtifact(firstScreenPath, firstScreenFile);
    console.log(`  Saved: ${firstScreenFile}`);

    const fullPageFile = `firstvisit_full_${vp.name}.png`;
    const fullPagePath = path.join(OUTPUT_DIR, fullPageFile);
    await page.screenshot({ path: fullPagePath, fullPage: true });
    copyToArtifact(fullPagePath, fullPageFile);
    console.log(`  Saved: ${fullPageFile}`);
  }

  // 2. Capture Progressive Disclosure ("Prefer to explore portal first? ↓")
  console.log('\n--- TESTING PROGRESSIVE DISCLOSURE ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const toggleBtn = page.getByRole('button', { name: /Prefer to explore the portal first/i });
  if (await toggleBtn.isVisible()) {
    console.log('Clicking "Prefer to explore the portal first? ↓"...');
    await toggleBtn.click();
    await page.waitForTimeout(800);

    const revealedFile = 'firstvisit_revealed_studio_1440px.png';
    const revealedPath = path.join(OUTPUT_DIR, revealedFile);
    await page.screenshot({ path: revealedPath, fullPage: true });
    copyToArtifact(revealedPath, revealedFile);
    console.log(`  Saved revealed studio: ${revealedFile}`);
  }

  // 3. Start assessment via API to capture Case B (Interrupted Session State)
  console.log('\n--- TESTING CASE B: INTERRUPTED SESSION RESUMPTION ---');
  const startSessionRes = await api('/api/assessments/start', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: { scenarioCode: 'baseline' }
  });
  const stage1Id = startSessionRes.body.stage?.id;
  const sessionId = startSessionRes.body.sessionId;
  console.log(`  Session created in DB: ${sessionId}, stage: ${stage1Id}`);

  // Navigate back to Dashboard to verify Case B
  console.log('Navigating back to /dashboard to verify Case B (Interrupted)...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const resumedBanner = await page.getByText(/Assessment In Progress/i).first().isVisible();
  console.log(`Resumption banner visible on dashboard: ${resumedBanner}`);

  const interruptedFile = 'firstvisit_case_b_interrupted_1440px.png';
  const interruptedPath = path.join(OUTPUT_DIR, interruptedFile);
  await page.screenshot({ path: interruptedPath, fullPage: false });
  copyToArtifact(interruptedPath, interruptedFile);
  console.log(`  Saved Case B interrupted screen: ${interruptedFile}`);

  // Test clicking "Resume Your Digital Day"
  const resumeBtn = page.getByRole('link', { name: /Resume Your Digital Day/i }).first();
  if (await resumeBtn.isVisible()) {
    console.log('Clicking "Resume Your Digital Day"...');
    await resumeBtn.click();
    await page.waitForLoadState('networkidle');
    console.log(`Navigated to: ${page.url()}`);
    await page.waitForTimeout(1000);

    const resumedAssessmentFile = 'firstvisit_resumed_simulation_screen.png';
    const resumedAssessmentPath = path.join(OUTPUT_DIR, resumedAssessmentFile);
    await page.screenshot({ path: resumedAssessmentPath, fullPage: false });
    copyToArtifact(resumedAssessmentPath, resumedAssessmentFile);
    console.log(`  Saved resumed assessment view: ${resumedAssessmentFile}`);
  }

  await browser.close();
  console.log('\n=== FIRST-TIME LEARNER EXPERIENCE CAPTURES COMPLETE ===');
}

run().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
