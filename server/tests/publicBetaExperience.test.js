/**
 * Cyber Law Awareness Portal — Public Beta Experience Verification Suite
 * 
 * Tests the Public Beta banner, Feedback modal, Footer indicator, and style integration
 * to guarantee dignified, accessible, and reliable beta communication across the portal.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client', 'src');

describe('Public Beta Experience: Component & Architectural Contracts', () => {
  const bannerPath = path.join(CLIENT_DIR, 'components', 'home', 'PublicBetaAnnouncement.jsx');
  const modalPath = path.join(CLIENT_DIR, 'components', 'common', 'FeedbackModal.jsx');
  const helpersPath = path.join(CLIENT_DIR, 'utils', 'feedbackHelpers.js');
  const footerPath = path.join(CLIENT_DIR, 'components', 'layout', 'Footer.jsx');
  const navbarPath = path.join(CLIENT_DIR, 'components', 'layout', 'Navbar.jsx');
  const homePath = path.join(CLIENT_DIR, 'pages', 'Home.jsx');
  const appPath = path.join(CLIENT_DIR, 'App.jsx');
  const cssPath = path.join(CLIENT_DIR, 'styles', 'public-beta.css');
  const mainCssPath = path.join(CLIENT_DIR, 'styles', 'main.css');

  it('1. PublicBetaAnnouncement exists and contains canonical copy and accessible markup', () => {
    assert.equal(fs.existsSync(bannerPath), true, 'PublicBetaAnnouncement.jsx must exist');
    const content = fs.readFileSync(bannerPath, 'utf8');

    // Canonical copy validation
    assert.match(content, /The Cyber Law Awareness Portal is now open for exploration/);
    assert.match(content, /We're continuously improving the learning experience/);
    assert.match(content, /Explore, learn,? and share your feedback/);

    // Storage key contract
    assert.match(content, /const STORAGE_KEY = 'cl_public_beta_banner_dismissed'/);

    // Accessibility attributes
    assert.match(content, /role="region"/);
    assert.match(content, /aria-label="Public Beta Announcement"/);
    assert.match(content, /aria-label="Dismiss public beta announcement banner"/i);

    // Feedback integration
    assert.match(content, /openFeedbackModal\(\{ source: 'homepage_banner', category: 'experience' \}\)/);
  });

  it('2. FeedbackModal & feedbackHelpers enforce honest mailto delivery, zero PII localStorage persistence, and full modal a11y', async () => {
    assert.equal(fs.existsSync(modalPath), true, 'FeedbackModal.jsx must exist');
    assert.equal(fs.existsSync(helpersPath), true, 'feedbackHelpers.js must exist');
    const modalContent = fs.readFileSync(modalPath, 'utf8');
    const helpersModule = await import('../../client/src/utils/feedbackHelpers.js');

    // Category catalog
    const categoryIds = helpersModule.FEEDBACK_CATEGORIES.map((c) => c.id);
    assert.deepEqual(categoryIds, ['experience', 'bug', 'legal', 'general']);

    // Zero browser localStorage persistence of feedback/PII (#6, #7)
    assert.equal(modalContent.includes('localStorage'), false, 'FeedbackModal must not store feedback or PII in localStorage');

    // Scroll lock & restore, email reset + timer cancel, focus trap & success focus (#2, #3, #4, #5)
    assert.match(modalContent, /const prevOverflow = document\.body\.style\.overflow;/);
    assert.match(modalContent, /document\.body\.style\.overflow = prevOverflow;/);
    assert.match(modalContent, /setEmail\(''\)/);
    assert.match(modalContent, /cancelPendingReset/);
    assert.match(modalContent, /!modalRef\.current\.contains\(document\.activeElement\)/);
    assert.match(modalContent, /successFocusRef/);
    assert.match(modalContent, /role="dialog"/);
    assert.match(modalContent, /aria-modal="true"/);
    assert.match(modalContent, /aria-labelledby="feedback-dialog-title"/);
    assert.match(modalContent, /aria-describedby="feedback-dialog-desc"/);
    assert.match(modalContent, /id="feedback-dialog-title"/);
    assert.match(modalContent, /id="feedback-dialog-desc"/);
    assert.match(modalContent, /e\.key === 'Escape'/);
    assert.match(modalContent, /window\.addEventListener\('cl:open-feedback'/);

    // Behavioral execution of validation and delivery logic with isolated storage spy (#58, #6, #7)
    const storageWrites = [];
    const origStorage = globalThis.localStorage;
    globalThis.localStorage = {
      setItem: (k, v) => storageWrites.push({ k, v }),
      getItem: () => null
    };

    try {
      const launchedUrls = [];
      const launcher = (url) => { launchedUrls.push(url); return true; };

      // Whitespace-only must fail and trigger zero launches/storage
      const wsRes = helpersModule.prepareAndLaunchMailtoFeedback({
        message: '   \t\n  ',
        email: 'learner@example.com',
        pathname: '/laws?token=secret',
        launchMailto: launcher
      });
      assert.equal(wsRes.ok, false);
      assert.ok(wsRes.validationError);
      assert.equal(launchedUrls.length, 0);

      // 7 non-whitespace characters (with surrounding spaces) must fail
      const sevenRes = helpersModule.prepareAndLaunchMailtoFeedback({
        message: '  1234567  ',
        email: 'learner@example.com',
        pathname: '/laws?token=secret',
        launchMailto: launcher
      });
      assert.equal(sevenRes.ok, false);
      assert.match(sevenRes.validationError, /8 characters/);
      assert.equal(launchedUrls.length, 0);

      // Exactly 8 valid characters succeeds cleanly, strips query strings, and never touches localStorage
      const eightRes = helpersModule.prepareAndLaunchMailtoFeedback({
        category: 'legal',
        message: '12345678',
        email: 'learner@example.com',
        learnerRole: 'student',
        pathname: '/laws?token=secret',
        launchMailto: launcher
      });
      assert.equal(eightRes.ok, true);
      assert.equal(launchedUrls.length, 1);
      assert.match(launchedUrls[0], /^mailto:feedback@cyberlawportal\.org\?/);
      const decodedUrl = decodeURIComponent(launchedUrls[0]);
      assert.match(decodedUrl, /Page: \/laws\n/);
      assert.equal(decodedUrl.includes('token=secret'), false);
      assert.equal(storageWrites.length, 0);

      // Failed email launch must NOT return ok=true; must provide fallback mailto URL
      const blockedRes = helpersModule.prepareAndLaunchMailtoFeedback({
        message: '12345678',
        pathname: '/quizzes',
        launchMailto: () => false
      });
      assert.equal(blockedRes.ok, false);
      assert.ok(blockedRes.deliveryError);
      assert.match(blockedRes.mailtoUrl, /^mailto:feedback@cyberlawportal\.org\?/);
    } finally {
      globalThis.localStorage = origStorage;
    }
  });

  it('3. Footer integrates Beta indicator, Golden Hour CFCFRMS reporting guidance, and certification disclaimer', () => {
    assert.equal(fs.existsSync(footerPath), true, 'Footer.jsx must exist');
    const content = fs.readFileSync(footerPath, 'utf8');

    // Statutory emergency guidance & disclaimer (#8, #9)
    assert.match(content, /CFCFRMS and Golden Hour reporting within 2–3 hours\./);
    assert.match(content, /without guaranteeing fund freeze or recovery/);
    assert.match(content, /statutory legal certification/);

    // Beta indicator badge and note
    assert.match(content, /footer-beta-indicator/);
    assert.match(content, /footer-beta-badge/);
    assert.match(content, /PUBLIC BETA/);
    assert.match(content, /Community evaluation release/);
    assert.match(content, /footer-beta-feedback-link/);

    // Custom event dispatch on feedback click
    assert.match(content, /cl:open-feedback/);

    // Version label in copyright
    assert.match(content, /Public Beta 1\.0/);
  });

  it('4. Navbar mobile drawer implements Tab/Shift+Tab trap and background inert containment (#10)', () => {
    assert.equal(fs.existsSync(navbarPath), true, 'Navbar.jsx must exist');
    const content = fs.readFileSync(navbarPath, 'utf8');

    assert.match(content, /role="dialog"/);
    assert.match(content, /aria-modal="true"/);
    assert.match(content, /drawerRef/);
    assert.match(content, /e\.key === 'Tab' && drawerRef\.current/);
    assert.match(content, /\.inert = true/);
    assert.match(content, /\.inert = prevInert/);
  });

  it('5. Home page mounts PublicBetaAnnouncement above hero', () => {
    assert.equal(fs.existsSync(homePath), true, 'Home.jsx must exist');
    const content = fs.readFileSync(homePath, 'utf8');

    assert.match(content, /import PublicBetaAnnouncement from '\.\.\/components\/home\/PublicBetaAnnouncement'/);
    assert.match(content, /<PublicBetaAnnouncement \/>/);
  });

  it('6. App mounts FeedbackModal globally for seamless trigger across all routes', () => {
    assert.equal(fs.existsSync(appPath), true, 'App.jsx must exist');
    const content = fs.readFileSync(appPath, 'utf8');

    assert.match(content, /import FeedbackModal from '\.\/components\/common\/FeedbackModal'/);
    assert.match(content, /<FeedbackModal \/>/);
  });

  it('7. Stylesheet public-beta.css exists, is imported in main.css, and aligns with Constitutional Atelier palette', () => {
    assert.equal(fs.existsSync(cssPath), true, 'public-beta.css must exist');
    assert.equal(fs.existsSync(mainCssPath), true, 'main.css must exist');

    const mainCss = fs.readFileSync(mainCssPath, 'utf8');
    assert.match(mainCss, /@import '\.\/public-beta\.css'/);

    const betaCss = fs.readFileSync(cssPath, 'utf8');
    assert.match(betaCss, /\.public-beta-banner/);
    assert.match(betaCss, /\.feedback-modal-backdrop/);
    assert.match(betaCss, /\.feedback-modal-dialog/);
    assert.match(betaCss, /\.footer-beta-indicator/);
    assert.match(betaCss, /@media \(max-width: 768px\)/);
  });
});
