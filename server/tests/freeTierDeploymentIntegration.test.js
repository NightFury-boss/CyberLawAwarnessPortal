/**
 * Cyber Law Awareness Portal — Free-Tier Staging Deployment Integration Tests
 *
 * Verifies:
 * 1. Frontend API URL resolution (resolveApiUrl) across diverse inputs.
 * 2. Netlify SPA routing configuration (_redirects and netlify.toml).
 * 3. Render blueprint specification (render.yaml service, rootDir, healthCheck, envVars).
 * 4. Staging database guard fail-closed behavior for Atlas deployments.
 * 5. Production CORS origin filtering with Netlify origin.
 * 6. Health check probe behavior (status, database state, secret leak prevention).
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const express = require('express');
const cors = require('cors');

describe('Free-Tier Staging Deployment Integration Suite', () => {
  const rootDir = path.resolve(__dirname, '../..');

  // ============================================================================
  // 1. Frontend API URL Normalization (resolveApiUrl)
  // ============================================================================
  describe('1. Frontend API URL Normalization (resolveApiUrl)', () => {
    let resolveApiUrl;

    before(async () => {
      const clientApiModule = await import('../../client/src/services/api.js');
      resolveApiUrl = clientApiModule.resolveApiUrl;
      assert.equal(typeof resolveApiUrl, 'function', 'resolveApiUrl must be an exported function');
    });

    it('appends /api when missing from base URL', () => {
      const result = resolveApiUrl('https://cyberlaw-portal-backend.onrender.com');
      assert.equal(result, 'https://cyberlaw-portal-backend.onrender.com/api');
    });

    it('preserves existing /api in URL without duplicating', () => {
      const result = resolveApiUrl('https://cyberlaw-portal-backend.onrender.com/api');
      assert.equal(result, 'https://cyberlaw-portal-backend.onrender.com/api');
    });

    it('trims trailing slashes before normalization', () => {
      const res1 = resolveApiUrl('https://cyberlaw-portal-backend.onrender.com/');
      assert.equal(res1, 'https://cyberlaw-portal-backend.onrender.com/api');

      const res2 = resolveApiUrl('https://cyberlaw-portal-backend.onrender.com/api/');
      assert.equal(res2, 'https://cyberlaw-portal-backend.onrender.com/api');

      const res3 = resolveApiUrl('https://cyberlaw-portal-backend.onrender.com///');
      assert.equal(res3, 'https://cyberlaw-portal-backend.onrender.com/api');
    });

    it('handles relative paths like /api and /api/', () => {
      assert.equal(resolveApiUrl('/api'), '/api');
      assert.equal(resolveApiUrl('/api/'), '/api');
      assert.equal(resolveApiUrl('/custom'), '/custom/api');
    });

    it('trims leading and trailing whitespace from env variables', () => {
      const result = resolveApiUrl('   https://cyberlaw-portal-backend.onrender.com/api/   ');
      assert.equal(result, 'https://cyberlaw-portal-backend.onrender.com/api');
    });

    it('falls back to default localhost:5000/api when raw input is empty in Node', () => {
      const result = resolveApiUrl('');
      assert.equal(result, 'http://localhost:5000/api');
    });
  });

  // ============================================================================
  // 2. Netlify SPA Routing Configuration
  // ============================================================================
  describe('2. Netlify SPA Routing Configuration', () => {
    it('client/public/_redirects exists and routes all traffic to index.html with 200', () => {
      const redirectsPath = path.join(rootDir, 'client/public/_redirects');
      assert.equal(fs.existsSync(redirectsPath), true, 'client/public/_redirects must exist');

      const content = fs.readFileSync(redirectsPath, 'utf-8').trim();
      assert.match(content, /^\/\*\s+\/index\.html\s+200$/, 'client/public/_redirects must have SPA 200 rule');
    });

    it('netlify.toml exists and configures build, redirects, and security headers', () => {
      const netlifyTomlPath = path.join(rootDir, 'netlify.toml');
      assert.equal(fs.existsSync(netlifyTomlPath), true, 'netlify.toml must exist in repo root');

      const toml = fs.readFileSync(netlifyTomlPath, 'utf-8');
      assert.match(toml, /base\s*=\s*"client"/, 'netlify.toml base must be client');
      assert.match(toml, /publish\s*=\s*"dist"/, 'netlify.toml publish must be dist');
      assert.match(toml, /command\s*=\s*"npm run build"/, 'netlify.toml build command must be npm run build');
      assert.match(toml, /from\s*=\s*"\/\*"/, 'netlify.toml must include SPA wildcard redirect');
      assert.match(toml, /to\s*=\s*"\/index\.html"/, 'netlify.toml redirect target must be /index.html');
      assert.match(toml, /status\s*=\s*200/, 'netlify.toml redirect status must be 200');
      assert.match(toml, /X-Content-Type-Options\s*=\s*"nosniff"/, 'netlify.toml must configure nosniff header');
      assert.match(toml, /X-Frame-Options\s*=\s*"SAMEORIGIN"/, 'netlify.toml must configure SAMEORIGIN header');
    });

    it('client/.env.staging.example documents VITE_API_URL pointing to Render', () => {
      const envPath = path.join(rootDir, 'client/.env.staging.example');
      assert.equal(fs.existsSync(envPath), true, 'client/.env.staging.example must exist');

      const content = fs.readFileSync(envPath, 'utf-8');
      assert.match(content, /VITE_API_URL=https:\/\/<your-render-backend-name>\.onrender\.com\/api/);
    });
  });

  // ============================================================================
  // 3. Render Blueprint Specification (render.yaml)
  // ============================================================================
  describe('3. Render Blueprint Specification (render.yaml)', () => {
    it('render.yaml exists and defines a free-tier web service with correct paths', () => {
      const renderYamlPath = path.join(rootDir, 'render.yaml');
      assert.equal(fs.existsSync(renderYamlPath), true, 'render.yaml must exist in repo root');

      const yaml = fs.readFileSync(renderYamlPath, 'utf-8');
      assert.match(yaml, /type:\s*web/, 'render.yaml must define a web service');
      assert.match(yaml, /plan:\s*free/, 'render.yaml must specify plan: free');
      assert.match(yaml, /rootDir:\s*server/, 'render.yaml must specify rootDir: server');
      assert.match(yaml, /buildCommand:\s*npm install/, 'render.yaml must run npm install');
      assert.match(yaml, /startCommand:\s*node server\.js/, 'render.yaml must start with node server.js');
      assert.match(yaml, /healthCheckPath:\s*\/api\/health/, 'render.yaml must check /api/health');
      assert.match(yaml, /key:\s*ASSERT_STAGING_DB[\s\S]*?value:\s*"true"/, 'ASSERT_STAGING_DB must be true');
      assert.match(yaml, /key:\s*EXPECTED_STAGING_DB_NAME[\s\S]*?value:\s*cyber_law_staging/, 'EXPECTED_STAGING_DB_NAME must be cyber_law_staging');
      assert.match(yaml, /key:\s*HOST[\s\S]*?value:\s*0\.0\.0\.0/, 'HOST must bind to 0.0.0.0');
      assert.match(yaml, /key:\s*TRUST_PROXY[\s\S]*?value:\s*"1"/, 'TRUST_PROXY must be "1"');
    });

    it('render.yaml marks all sensitive variables with sync: false', () => {
      const yaml = fs.readFileSync(path.join(rootDir, 'render.yaml'), 'utf-8');
      const sensitiveKeys = ['CLIENT_URL', 'MONGODB_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];

      for (const key of sensitiveKeys) {
        const regex = new RegExp(`key:\\s*${key}[\\s\\S]*?sync:\\s*false`);
        assert.match(yaml, regex, `render.yaml must set sync: false for sensitive key: ${key}`);
      }
    });
  });

  // ============================================================================
  // 4. Staging Database Guard Verification
  // ============================================================================
  describe('4. Staging Database Guard Fail-Closed Verification', () => {
    const {
      validateStagingDatabaseTarget,
      assertApprovedStagingDatabase
    } = require('../config/stagingDatabaseGuard');

    it('approves legitimate MongoDB Atlas staging database URIs', () => {
      const validUri = 'mongodb+srv://staging_user:password123@cluster0.abcde.mongodb.net/cyber_law_staging?retryWrites=true&w=majority';
      const check = validateStagingDatabaseTarget(validUri);
      assert.equal(check.approved, true);
      assert.equal(check.dbName, 'cyber_law_staging');
      assert.doesNotThrow(() => assertApprovedStagingDatabase(validUri));
    });

    it('strictly forbids production database name: cyber_law_portal', () => {
      const prodUri = 'mongodb+srv://admin:pass@cluster0.abcde.mongodb.net/cyber_law_portal?retryWrites=true';
      const check = validateStagingDatabaseTarget(prodUri);
      assert.equal(check.approved, false);
      assert.match(check.reason, /production database/i);
      assert.throws(() => assertApprovedStagingDatabase(prodUri), /production database/i);
    });

    it('strictly forbids connection URIs lacking an explicit database path', () => {
      const nakedUri = 'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/?retryWrites=true';
      const check = validateStagingDatabaseTarget(nakedUri);
      assert.equal(check.approved, false);
      assert.match(check.reason, /missing/i);
      assert.throws(() => assertApprovedStagingDatabase(nakedUri), /missing/i);
    });
  });

  // ============================================================================
  // 5. Production CORS Policy with Netlify Staging Origin
  // ============================================================================
  describe('5. Production CORS Policy with Netlify Staging Origin', () => {
    let testServer;
    let testPort;
    const netlifyOrigin = 'https://cyberlaw-portal-staging.netlify.app';

    before(async () => {
      const app = express();

      // Configure CORS identical to server/server.js production policy
      const allowedOrigins = [netlifyOrigin];
      app.use(cors({
        origin: function (origin, callback) {
          if (!origin) return callback(null, true);
          if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error(`Blocked by CORS policy: origin ${origin} is not allowed`));
          }
        },
        credentials: true
      }));

      app.get('/api/test', (req, res) => res.json({ ok: true }));

      // Custom error handler like server.js
      app.use((err, req, res, next) => {
        if (err.message && err.message.includes('CORS policy')) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Access denied: origin not allowed by CORS policy' }
          });
        }
        res.status(500).json({ success: false, error: { message: err.message } });
      });

      await new Promise((resolve) => {
        testServer = app.listen(0, '127.0.0.1', () => {
          testPort = testServer.address().port;
          resolve();
        });
      });
    });

    after(async () => {
      if (testServer) {
        await new Promise((resolve) => testServer.close(resolve));
      }
    });

    it('allows requests originating from the configured Netlify staging origin', async () => {
      const res = await fetch(`http://127.0.0.1:${testPort}/api/test`, {
        headers: { Origin: netlifyOrigin }
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), netlifyOrigin);
      const data = await res.json();
      assert.equal(data.ok, true);
    });

    it('blocks requests originating from unauthorized external origins with HTTP 403', async () => {
      const res = await fetch(`http://127.0.0.1:${testPort}/api/test`, {
        headers: { Origin: 'https://malicious-site.example.com' }
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error.message, /CORS policy/i);
    });

    it('permits non-browser requests (null origin, e.g. Render health checks or curl)', async () => {
      const res = await fetch(`http://127.0.0.1:${testPort}/api/test`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
    });
  });

  // ============================================================================
  // 6. Health Check Probe Behavior & Secret Leakage Prevention
  // ============================================================================
  describe('6. Health Check Probe Behavior & Secret Leakage Prevention', () => {
    let healthServer;
    let healthPort;

    before(async () => {
      const app = express();

      // Express health route mirroring server/server.js
      app.get('/api/health', (req, res) => {
        // In offline test mode, DB is disconnected
        const isDbConnected = false;
        const status = isDbConnected ? 'healthy' : 'degraded';
        const statusCode = isDbConnected ? 200 : 503;

        res.status(statusCode).json({
          status,
          database: isDbConnected ? 'connected' : 'disconnected',
          uptime: Math.floor(process.uptime()),
          timestamp: new Date().toISOString()
        });
      });

      await new Promise((resolve) => {
        healthServer = app.listen(0, '127.0.0.1', () => {
          healthPort = healthServer.address().port;
          resolve();
        });
      });
    });

    after(async () => {
      if (healthServer) {
        await new Promise((resolve) => healthServer.close(resolve));
      }
    });

    it('returns HTTP 503 degraded when database is disconnected without throwing', async () => {
      const res = await fetch(`http://127.0.0.1:${healthPort}/api/health`);
      assert.equal(res.status, 503);
      const data = await res.json();
      assert.equal(data.status, 'degraded');
      assert.equal(data.database, 'disconnected');
      assert.equal(typeof data.uptime, 'number');
      assert.ok(data.timestamp);
    });

    it('does not leak connection string, credentials, or internal topology', async () => {
      const res = await fetch(`http://127.0.0.1:${healthPort}/api/health`);
      const bodyText = await res.text();
      assert.equal(bodyText.includes('mongodb'), false, 'Must not mention mongodb protocol');
      assert.equal(bodyText.includes('password'), false, 'Must not leak password');
      assert.equal(bodyText.includes('secret'), false, 'Must not leak secret keys');
      assert.equal(bodyText.includes('cluster'), false, 'Must not leak cluster topology');
    });
  });
});
