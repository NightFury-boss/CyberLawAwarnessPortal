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
  const footerPath = path.join(CLIENT_DIR, 'components', 'layout', 'Footer.jsx');
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

  it('2. FeedbackModal contains valid category definitions, accessibility hooks, and storage contracts', () => {
    assert.equal(fs.existsSync(modalPath), true, 'FeedbackModal.jsx must exist');
    const content = fs.readFileSync(modalPath, 'utf8');

    // Category catalog
    assert.match(content, /id: 'experience'/);
    assert.match(content, /id: 'bug'/);
    assert.match(content, /id: 'legal'/);
    assert.match(content, /id: 'general'/);

    // Storage key contract
    assert.match(content, /const FEEDBACK_STORAGE_KEY = 'cl_public_beta_feedback'/);

    // Maximum history retention limit
    assert.match(content, /existing\.length > 30/);

    // Validation rules
    assert.match(content, /trimmedMsg\.length < 8/);

    // Accessibility contracts
    assert.match(content, /role="dialog"/);
    assert.match(content, /aria-modal="true"/);
    assert.match(content, /aria-labelledby="feedback-dialog-title"/);
    assert.match(content, /aria-describedby="feedback-dialog-desc"/);
    assert.match(content, /e\.key === 'Escape'/);

    // Event listener for decoupled triggering
    assert.match(content, /window\.addEventListener\('cl:open-feedback'/);

    // Mailto fallback link
    assert.match(content, /mailto:feedback@cyberlawportal\.org/);
  });

  it('3. Footer integrates Beta indicator and feedback trigger cleanly', () => {
    assert.equal(fs.existsSync(footerPath), true, 'Footer.jsx must exist');
    const content = fs.readFileSync(footerPath, 'utf8');

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

  it('4. Home page mounts PublicBetaAnnouncement above hero', () => {
    assert.equal(fs.existsSync(homePath), true, 'Home.jsx must exist');
    const content = fs.readFileSync(homePath, 'utf8');

    assert.match(content, /import PublicBetaAnnouncement from '\.\.\/components\/home\/PublicBetaAnnouncement'/);
    assert.match(content, /<PublicBetaAnnouncement \/>/);
  });

  it('5. App mounts FeedbackModal globally for seamless trigger across all routes', () => {
    assert.equal(fs.existsSync(appPath), true, 'App.jsx must exist');
    const content = fs.readFileSync(appPath, 'utf8');

    assert.match(content, /import FeedbackModal from '\.\/components\/common\/FeedbackModal'/);
    assert.match(content, /<FeedbackModal \/>/);
  });

  it('6. Stylesheet public-beta.css exists, is imported in main.css, and defines key classes', () => {
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
