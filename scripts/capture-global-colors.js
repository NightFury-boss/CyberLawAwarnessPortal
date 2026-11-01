const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, '../screenshots/global-colors');
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

async function navigateSafely(page, url, selectorToWait = null) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
  if (selectorToWait) {
    await page.waitForSelector(selectorToWait, { timeout: 8000 }).catch(() => {});
  }
  await page.addStyleTag({ content: '#reticle-root, [class*="reticle"], [id*="reticle"] { display: none !important; }' });
  await page.waitForTimeout(800);
}

async function completeBaselineAssessment(token) {
  console.log('Completing baseline assessment to establish learner state...');
  const startRes = await api('/api/assessments/start', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: { scenarioCode: 'baseline' }
  });
  if (!startRes.body?.sessionId) {
    console.log('Could not start assessment:', startRes.body);
    return;
  }
  const sessionId = startRes.body.sessionId;
  let currentStage = startRes.body.stage;
  let isCompleted = Boolean(startRes.body.isCompleted);

  while (!isCompleted && currentStage) {
    const decisionId = currentStage.decisions?.[0]?.id || currentStage.decisions?.[0]?._id;
    const subRes = await api('/api/assessments/submit-step', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: {
        assessmentSessionId: sessionId,
        stageId: currentStage.id,
        decisionId,
        timeSpentSeconds: 12
      }
    });
    if (subRes.body?.isCompleted) {
      isCompleted = true;
      console.log(`Baseline assessment completed. Final Score: ${subRes.body.finalScore}%`);
      break;
    }
    currentStage = subRes.body?.stage;
  }
}

const VIEWPORTS = [
  { name: 'desktop_1440px', width: 1440, height: 900 },
  { name: 'mobile_390px', width: 390, height: 844 }
];

async function capture() {
  console.log('=== STARTING GLOBAL COLOR SYSTEM CAPTURES ===\n');

  // 1. Register & establish established learner (has completed baseline)
  const estEmail = `established_learner_${Date.now()}@example.com`;
  console.log(`Registering established learner (${estEmail})...`);
  const estRegRes = await api('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Vikramaditya Sen',
      email: estEmail,
      password: 'UserPass123!'
    }
  });
  const establishedToken = estRegRes.body?.token;
  const establishedUser = estRegRes.body?.user;
  await completeBaselineAssessment(establishedToken);
  console.log('Established learner ready with completed baseline.');

  // 2. Register fresh unassessed learner
  const freshEmail = `warm_learner_${Date.now()}@example.com`;
  console.log(`Registering fresh unassessed learner (${freshEmail})...`);
  const regRes = await api('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Ananya Deshmukh',
      email: freshEmail,
      password: 'UserPass123!'
    }
  });
  const freshToken = regRes.body?.token;
  const freshUser = regRes.body?.user;
  console.log('Fresh learner registered successfully.');

  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Capturing for Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`--------------------------------------------------`);

    // Context A: Public (unauthenticated)
    const publicContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    const publicPage = await publicContext.newPage();

    // 1. Homepage
    console.log(`[1] Capturing Homepage...`);
    await navigateSafely(publicPage, 'http://localhost:5173/');
    const homeFile = `01_homepage_${vp.name}.png`;
    const homePath = path.join(OUTPUT_DIR, homeFile);
    await publicPage.screenshot({ path: homePath, fullPage: false });
    copyToArtifact(homePath, homeFile);

    // 2. Login Page
    console.log(`[2a] Capturing Login Page...`);
    await navigateSafely(publicPage, 'http://localhost:5173/login');
    const loginFile = `02a_login_${vp.name}.png`;
    const loginPath = path.join(OUTPUT_DIR, loginFile);
    await publicPage.screenshot({ path: loginPath, fullPage: false });
    copyToArtifact(loginPath, loginFile);

    // 2b. Registration Page
    console.log(`[2b] Capturing Register Page...`);
    await navigateSafely(publicPage, 'http://localhost:5173/register');
    const regFile = `02b_register_${vp.name}.png`;
    const regPath = path.join(OUTPUT_DIR, regFile);
    await publicPage.screenshot({ path: regPath, fullPage: false });
    copyToArtifact(regPath, regFile);

    await publicContext.close();

    // Context B: Fresh Learner (First-Visit Experience)
    const freshContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    await freshContext.addInitScript(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('workspace_sidebar_collapsed', 'false');
    }, { token: freshToken, user: freshUser });
    const freshPage = await freshContext.newPage();

    // 3. First-Visit Dashboard
    console.log(`[3] Capturing First-Visit Dashboard...`);
    await navigateSafely(freshPage, 'http://localhost:5173/dashboard');
    const fvFile = `03_first_visit_dashboard_${vp.name}.png`;
    const fvPath = path.join(OUTPUT_DIR, fvFile);
    await freshPage.screenshot({ path: fvPath, fullPage: false });
    copyToArtifact(fvPath, fvFile);

    // 5. Assessment Simulation Screen (Start First Check)
    console.log(`[5] Capturing Assessment Simulation Screen...`);
    await navigateSafely(freshPage, 'http://localhost:5173/assessment/baseline');
    const simFile = `05_assessment_screen_${vp.name}.png`;
    const simPath = path.join(OUTPUT_DIR, simFile);
    await freshPage.screenshot({ path: simPath, fullPage: false });
    copyToArtifact(simPath, simFile);

    await freshContext.close();

    // Context C: Established Learner (Full Atelier Dashboard, Results, Lesson, Quizzes)
    const estContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    await estContext.addInitScript(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('workspace_sidebar_collapsed', 'false');
    }, { token: establishedToken, user: establishedUser });
    const estPage = await estContext.newPage();

    // 4. Established Learner Dashboard
    console.log(`[4] Capturing Established Learner Dashboard...`);
    await navigateSafely(estPage, 'http://localhost:5173/dashboard');
    const retryBtn = estPage.getByRole('button', { name: /Retry Connection/i });
    if (await retryBtn.isVisible()) {
      console.log('Retry button detected, clicking retry...');
      await retryBtn.click();
      await estPage.waitForTimeout(2000);
    }
    await estPage.waitForSelector('.atelier-dashboard-canvas', { timeout: 8000 }).catch(() => {});
    const estDashFile = `04_established_dashboard_${vp.name}.png`;
    const estDashPath = path.join(OUTPUT_DIR, estDashFile);
    await estPage.screenshot({ path: estDashPath, fullPage: false });
    copyToArtifact(estDashPath, estDashFile);

    // Also take full page for desktop to view the complete composition
    if (vp.name.includes('desktop')) {
      const estDashFullFile = `04_established_dashboard_full_1440px.png`;
      const estDashFullPath = path.join(OUTPUT_DIR, estDashFullFile);
      await estPage.screenshot({ path: estDashFullPath, fullPage: true });
      copyToArtifact(estDashFullPath, estDashFullFile);
    }

    // 6. Assessment Results Screen
    console.log(`[6] Capturing Assessment Results Screen...`);
    await navigateSafely(estPage, 'http://localhost:5173/assessment/baseline');
    const resultsFile = `06_assessment_results_${vp.name}.png`;
    const resultsPath = path.join(OUTPUT_DIR, resultsFile);
    await estPage.screenshot({ path: resultsPath, fullPage: false });
    copyToArtifact(resultsPath, resultsFile);

    // 7. Lesson Page (Curriculum Module)
    console.log(`[7] Capturing Lesson / Curriculum Page...`);
    await navigateSafely(estPage, 'http://localhost:5173/modules');
    const lessonFile = `07_lesson_curriculum_${vp.name}.png`;
    const lessonPath = path.join(OUTPUT_DIR, lessonFile);
    await estPage.screenshot({ path: lessonPath, fullPage: false });
    copyToArtifact(lessonPath, lessonFile);

    // 8. Quiz Page
    console.log(`[8] Capturing Quiz Page...`);
    await navigateSafely(estPage, 'http://localhost:5173/quizzes');
    const quizFile = `08_quiz_page_${vp.name}.png`;
    const quizPath = path.join(OUTPUT_DIR, quizFile);
    await estPage.screenshot({ path: quizPath, fullPage: false });
    copyToArtifact(quizPath, quizFile);

    await estContext.close();
  }

  await browser.close();
  console.log('\n=== ALL SCREENSHOTS SUCCESSFULLY CAPTURED & SAVED TO ARTIFACTS ===');
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
