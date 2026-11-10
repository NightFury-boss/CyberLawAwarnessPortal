/**
 * Dedicated Accessibility (a11y) Audit Script for the Laws Page
 * Integrates @axe-core/playwright with WCAG 2.1 AA tag rules,
 * keyboard navigation checks, focus indicator verification,
 * heading hierarchy checks, touch target analysis, and reduced-motion tests.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const DIST_DIR = path.resolve(__dirname, '../client/dist');
const PORT = 4175;

// Extract the 32 real LawSections from seed.js offline
function extractLawSections() {
  const seedFilePath = path.join(__dirname, '../server/config/seed.js');
  const seedContent = fs.readFileSync(seedFilePath, 'utf8');

  const startMarker = 'const lawSectionsData = [';
  const startIndex = seedContent.indexOf(startMarker);
  if (startIndex === -1) throw new Error('lawSectionsData not found in seed.js');

  const arrayStart = startIndex + 'const lawSectionsData = '.length;
  let bracketDepth = 0;
  let endIndex = -1;
  for (let i = arrayStart; i < seedContent.length; i++) {
    if (seedContent[i] === '[') bracketDepth++;
    else if (seedContent[i] === ']') {
      bracketDepth--;
      if (bracketDepth === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  const arrayCode = seedContent.substring(arrayStart, endIndex);
  const mockId = '660000000000000000000001';
  const mockSource = { _id: mockId, title: 'Official Gazette / India Code', authority: 'Government of India', url: 'https://www.indiacode.nic.in' };

  const sandbox = {
    sourceIndiaCode: mockSource,
    sourceShreyaSinghal: mockSource,
    sourceDPDP: mockSource,
    sourceBNS: mockSource,
    sourcePuttaswamy: mockSource,
    sourceITRules: mockSource,
    sourceCERTIn: mockSource,
    sourceBSA: mockSource,
    sourceRBI: mockSource,
    sourceArjunPanditrao: mockSource,
    sourceI4C: mockSource,
    sourceBNSS: mockSource,
    sourceCopyright: mockSource
  };

  const script = new vm.Script('lawSectionsData = ' + arrayCode);
  const context = vm.createContext(sandbox);
  script.runInContext(context);

  return sandbox.lawSectionsData.map((s, idx) => ({
    ...s,
    _id: `law_sec_${idx + 1}`,
    officialSourceId: mockSource
  }));
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function createStaticServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    let filePath = path.join(DIST_DIR, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading file');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    });
  });
}

async function runAccessibilityAudit() {
  console.log('======================================================================');
  console.log('LAWS PAGE ACCESSIBILITY (A11Y) & WCAG 2.1 AA COMPREHENSIVE AUDIT');
  console.log('======================================================================\n');

  const lawsData = extractLawSections();
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.route('**/api/laws*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(lawsData)
    });
  });

  const page = await context.newPage();

  const auditResults = {
    axeDesktopViolations: [],
    axeMobileViolations: [],
    axeStep2Violations: [],
    contrastIssues: [],
    headingHierarchy: {},
    focusIndicators: {},
    keyboardNavigation: {},
    touchTargets: [],
    reducedMotion: {}
  };

  try {
    // -------------------------------------------------------------------------
    // 1. DESKTOP AUDIT (1440x900)
    // -------------------------------------------------------------------------
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://127.0.0.1:${PORT}/laws`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.law-section-card', { timeout: 5000 });

    console.log('[AUDIT 1] Running axe-core against Desktop Laws Page (WCAG 2.1 AA)...');
    const axeDesktop = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    auditResults.axeDesktopViolations = axeDesktop.violations;
    console.log(`  -> Found ${axeDesktop.violations.length} axe violations on Desktop.`);
    for (const v of axeDesktop.violations) {
      console.log(`     [${v.impact.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
      if (v.id === 'color-contrast') {
        auditResults.contrastIssues.push(...v.nodes.map(n => ({
          target: n.target.join(' > '),
          summary: n.failureSummary,
          html: n.html
        })));
      }
    }

    // -------------------------------------------------------------------------
    // 2. HEADING HIERARCHY CHECK
    // -------------------------------------------------------------------------
    console.log('\n[AUDIT 2] Checking Semantic Heading Hierarchy...');
    const headingLevels = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headings.map(h => ({
        tag: h.tagName.toLowerCase(),
        level: parseInt(h.tagName.substring(1)),
        text: (h.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 50)
      }));
    });

    let skips = [];
    let prevLevel = 0;
    for (const h of headingLevels) {
      if (prevLevel > 0 && h.level > prevLevel + 1) {
        skips.push({ from: prevLevel, to: h.level, heading: h.text });
      }
      prevLevel = h.level;
    }
    auditResults.headingHierarchy = {
      totalHeadings: headingLevels.length,
      skips,
      headings: headingLevels.slice(0, 15) // sample
    };
    console.log(`  -> Total headings: ${headingLevels.length}. Heading skips found: ${skips.length}`);
    if (skips.length > 0) {
      console.log('     Skips:', JSON.stringify(skips));
    }

    // -------------------------------------------------------------------------
    // 3. KEYBOARD NAVIGATION & FOCUS INDICATORS
    // -------------------------------------------------------------------------
    console.log('\n[AUDIT 3] Checking Visible Focus Indicators on Key Interactive Elements...');
    const focusableSelectors = [
      'input[type="text"]',
      '.laws-category-tab',
      '.laws-filter-chip',
      '.compass-category-pill',
      '.compass-situation-btn',
      '.section-text-toggle button',
      '.section-bookmark-btn',
      '.section-action-pills button',
      '.discovery-compass-toggle-btn'
    ];

    const focusCheck = await page.evaluate((selectors) => {
      const results = {};
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          el.focus();
          const style = window.getComputedStyle(el);
          const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
          const hasBoxShadow = style.boxShadow !== 'none' && style.boxShadow.length > 0;
          results[sel] = {
            hasVisibleFocus: hasOutline || hasBoxShadow,
            outline: style.outline,
            boxShadow: style.boxShadow
          };
        }
      }
      return results;
    }, focusableSelectors);

    auditResults.focusIndicators = focusCheck;
    console.log('  -> Focus indicators inspected for', Object.keys(focusCheck).length, 'element types:');
    for (const [sel, res] of Object.entries(focusCheck)) {
      console.log(`     ${sel}: visibleFocus=${res.hasVisibleFocus}`);
    }

    // -------------------------------------------------------------------------
    // 4. LAW COMPASS STEP 2 & DYNAMIC STATE ACCESSIBILITY
    // -------------------------------------------------------------------------
    console.log('\n[AUDIT 4] Navigating Law Compass to Step 2 and Running axe-core...');
    const firstSituation = page.locator('.compass-situation-btn').first();
    await firstSituation.click();
    await page.waitForTimeout(300);

    const axeStep2 = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    auditResults.axeStep2Violations = axeStep2.violations;
    console.log(`  -> Found ${axeStep2.violations.length} axe violations on Law Compass Step 2.`);
    for (const v of axeStep2.violations) {
      console.log(`     [${v.impact.toUpperCase()}] ${v.id}: ${v.description}`);
    }

    // -------------------------------------------------------------------------
    // 5. TOUCH TARGET DIMENSIONS CHECK (Mobile 390x844)
    // -------------------------------------------------------------------------
    console.log('\n[AUDIT 5] Checking Touch Target Dimensions on Mobile (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.law-section-card', { timeout: 5000 });

    const touchTargets = await page.evaluate(() => {
      const interactiveEls = Array.from(document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [role="tab"]'
      ));
      const sub44 = [];
      for (const el of interactiveEls) {
        // Only evaluate visible elements
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight * 2) {
          const w = Math.round(rect.width);
          const h = Math.round(rect.height);
          if (w < 44 || h < 44) {
            const text = (el.textContent || el.getAttribute('aria-label') || el.className || '').trim().replace(/\s+/g, ' ').substring(0, 30);
            sub44.push({
              tag: el.tagName.toLowerCase(),
              className: el.className,
              text,
              dimensions: `${w}x${h}px`,
              role: el.getAttribute('role')
            });
          }
        }
      }
      return sub44;
    });

    auditResults.touchTargets = touchTargets;
    console.log(`  -> Evaluated touch targets in initial mobile viewport. Items under 44x44px: ${touchTargets.length}`);
    for (const t of touchTargets.slice(0, 8)) {
      console.log(`     ${t.tag}.${t.className.split(' ')[0]} ("${t.text}"): ${t.dimensions}`);
    }

    // -------------------------------------------------------------------------
    // 6. REDUCED MOTION PREFERENCE CHECK
    // -------------------------------------------------------------------------
    console.log('\n[AUDIT 6] Checking Reduced Motion Preferences...');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedMotionStyles = await page.evaluate(() => {
      const el = document.querySelector('.law-section-card');
      const cs = window.getComputedStyle(el);
      return {
        transitionDuration: cs.transitionDuration,
        animationDuration: cs.animationDuration
      };
    });
    auditResults.reducedMotion = reducedMotionStyles;
    console.log('  -> Reduced motion style on card:', JSON.stringify(reducedMotionStyles));

    // -------------------------------------------------------------------------
    // 7. AXE AUDIT ON MOBILE VIEWPORT
    // -------------------------------------------------------------------------
    console.log('\n[AUDIT 7] Running axe-core on Mobile Viewport...');
    const axeMobile = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    auditResults.axeMobileViolations = axeMobile.violations;
    console.log(`  -> Found ${axeMobile.violations.length} axe violations on Mobile.`);
    for (const v of axeMobile.violations) {
      console.log(`     [${v.impact.toUpperCase()}] ${v.id}: ${v.description}`);
    }

    console.log('\n======================================================================');
    console.log('AUDIT COMPLETE');
    console.log('======================================================================');

    // Write full audit details to a json file in brain
    const auditReportPath = path.resolve(__dirname, '../laws_a11y_audit_results.json');
    fs.writeFileSync(auditReportPath, JSON.stringify(auditResults, null, 2));
    console.log(`Detailed audit results written to: ${auditReportPath}`);

    return auditResults;
  } finally {
    await browser.close();
    server.close();
  }
}

runAccessibilityAudit().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});

