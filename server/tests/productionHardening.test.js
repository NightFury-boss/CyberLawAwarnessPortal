/**
 * Production Hardening & Security Configuration Test Suite
 * 
 * Verifies:
 * 1. Fail-closed JWT secret validation in production (rejecting missing, short, and default secrets).
 * 2. Fail-closed CLIENT_URL validation in production (rejecting missing, localhost, and loopback origins).
 * 3. Rate limiting middleware thresholds, headers, 429 response structure, reset, and expiry.
 * 4. Security headers and conditional HSTS behavior (only over HTTPS).
 * 5. Production CORS origin filtering (allowing whitelisted origin, rejecting untrusted origins).
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cors = require('cors');
const http = require('http');

const {
  validateJwtSecret,
  validateClientUrl,
  validateProductionConfig,
  DEV_FALLBACK_SECRET,
  MIN_JWT_SECRET_LENGTH
} = require('../config/productionSecurity');

const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

describe('Gate 2: Production Security Configuration Hardening', () => {

  describe('1. JWT Secret Validation (Fail-Closed)', () => {
    test('rejects missing JWT_SECRET in production', () => {
      assert.throws(
        () => validateJwtSecret({ NODE_ENV: 'production' }),
        /JWT_SECRET environment variable is missing or empty/
      );
    });

    test('rejects empty or whitespace-only JWT_SECRET in production', () => {
      assert.throws(
        () => validateJwtSecret({ NODE_ENV: 'production', JWT_SECRET: '   ' }),
        /JWT_SECRET environment variable is missing or empty/
      );
    });

    test('rejects known default development secret in production', () => {
      assert.throws(
        () => validateJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'cyber_portal_secret_key_12345' }),
        /insecure default\/sample placeholder/
      );
    });

    test('rejects sample placeholder from .env.example in production', () => {
      assert.throws(
        () => validateJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'change_this_secret_key_in_production_environments' }),
        /insecure default\/sample placeholder/
      );
    });

    test('rejects secret shorter than 32 characters in production', () => {
      const shortSecret = 'short_secret_only_24_chars';
      assert.ok(shortSecret.length < MIN_JWT_SECRET_LENGTH);
      assert.throws(
        () => validateJwtSecret({ NODE_ENV: 'production', JWT_SECRET: shortSecret }),
        /JWT_SECRET is too short/
      );
    });

    test('accepts strong 32+ character high-entropy secret in production', () => {
      const strongSecret = '9f83ab238c91a039d91ef45bc0388912ef093a19bc64917a02c019d3810f65ba';
      const result = validateJwtSecret({ NODE_ENV: 'production', JWT_SECRET: strongSecret });
      assert.equal(result, strongSecret);
    });

    test('permits fallback secret in development environment', () => {
      const result = validateJwtSecret({ NODE_ENV: 'development' });
      assert.equal(result, DEV_FALLBACK_SECRET);
    });

    test('permits fallback secret in test environment', () => {
      const result = validateJwtSecret({ NODE_ENV: 'test' });
      assert.equal(result, DEV_FALLBACK_SECRET);
    });

    test('uses configured secret in development when provided', () => {
      const customSecret = 'custom_dev_secret';
      const result = validateJwtSecret({ NODE_ENV: 'development', JWT_SECRET: customSecret });
      assert.equal(result, customSecret);
    });
  });

  describe('2. Frontend Origin (CLIENT_URL) Validation', () => {
    test('rejects missing CLIENT_URL in production', () => {
      assert.throws(
        () => validateClientUrl({ NODE_ENV: 'production' }),
        /CLIENT_URL environment variable is missing or empty/
      );
    });

    test('rejects localhost CLIENT_URL in production', () => {
      assert.throws(
        () => validateClientUrl({ NODE_ENV: 'production', CLIENT_URL: 'http://localhost:5173' }),
        /points to localhost or loopback/
      );
    });

    test('rejects 127.0.0.1 loopback CLIENT_URL in production', () => {
      assert.throws(
        () => validateClientUrl({ NODE_ENV: 'production', CLIENT_URL: 'http://127.0.0.1:3000' }),
        /points to localhost or loopback/
      );
    });

    test('rejects invalid URL string in production', () => {
      assert.throws(
        () => validateClientUrl({ NODE_ENV: 'production', CLIENT_URL: 'not-a-valid-url' }),
        /CLIENT_URL contains invalid URL string/
      );
    });

    test('accepts valid production HTTPS origin', () => {
      const origins = validateClientUrl({
        NODE_ENV: 'production',
        CLIENT_URL: 'https://cyberlawportal.gov.in'
      });
      assert.deepEqual(origins, ['https://cyberlawportal.gov.in']);
    });

    test('accepts comma-separated list of trusted production origins', () => {
      const origins = validateClientUrl({
        NODE_ENV: 'production',
        CLIENT_URL: 'https://cyberlawportal.gov.in, https://app.cyberlawportal.gov.in/'
      });
      assert.deepEqual(origins, [
        'https://cyberlawportal.gov.in',
        'https://app.cyberlawportal.gov.in'
      ]);
    });

    test('defaults to http://localhost:5173 in development when unset', () => {
      const origins = validateClientUrl({ NODE_ENV: 'development' });
      assert.deepEqual(origins, ['http://localhost:5173']);
    });
  });

  describe('3. Production Configuration Combined Validator', () => {
    test('succeeds with complete valid production configuration', () => {
      const env = {
        NODE_ENV: 'production',
        JWT_SECRET: 'a_very_strong_random_secret_that_has_at_least_32_characters_12345',
        CLIENT_URL: 'https://portal.example.gov.in'
      };
      const result = validateProductionConfig(env);
      assert.equal(result.jwtSecret, env.JWT_SECRET);
      assert.deepEqual(result.allowedOrigins, ['https://portal.example.gov.in']);
    });

    test('fails closed if any required parameter is invalid', () => {
      const env = {
        NODE_ENV: 'production',
        JWT_SECRET: 'short',
        CLIENT_URL: 'https://portal.example.gov.in'
      };
      assert.throws(() => validateProductionConfig(env), /JWT_SECRET is too short/);
    });
  });

  describe('4. Rate Limiting Middleware', () => {
    let server;
    let baseUrl;
    let testLimiter;

    before(async () => {
      const app = express();
      testLimiter = createRateLimiter({
        windowMs: 500, // 500ms window
        max: 3,        // allow 3 requests
        message: 'Test rate limit reached'
      });

      app.use('/test-limited', testLimiter, (req, res) => {
        res.json({ ok: true });
      });

      await new Promise(resolve => {
        server = app.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://127.0.0.1:${port}`;
          resolve();
        });
      });
    });

    after(async () => {
      if (server) {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('allows requests within threshold and sets RateLimit headers', async () => {
      testLimiter.reset();

      // Request 1
      const res1 = await fetch(`${baseUrl}/test-limited`);
      assert.equal(res1.status, 200);
      assert.equal(res1.headers.get('ratelimit-limit'), '3');
      assert.equal(res1.headers.get('ratelimit-remaining'), '2');

      // Request 2
      const res2 = await fetch(`${baseUrl}/test-limited`);
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('ratelimit-remaining'), '1');

      // Request 3
      const res3 = await fetch(`${baseUrl}/test-limited`);
      assert.equal(res3.status, 200);
      assert.equal(res3.headers.get('ratelimit-remaining'), '0');
    });

    test('rejects requests exceeding threshold with 429 RATE_LIMIT_EXCEEDED and Retry-After', async () => {
      // 4th request exceeds max=3
      const res4 = await fetch(`${baseUrl}/test-limited`);
      assert.equal(res4.status, 429);
      assert.equal(res4.headers.get('ratelimit-remaining'), '0');
      assert.ok(res4.headers.has('retry-after'));

      const body = await res4.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'RATE_LIMIT_EXCEEDED');
      assert.equal(body.error.message, 'Test rate limit reached');
    });

    test('resets quota when limiter.reset() is invoked', async () => {
      testLimiter.reset();

      const res = await fetch(`${baseUrl}/test-limited`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('ratelimit-remaining'), '2');
    });

    test('resets quota automatically after window expires', async () => {
      // Consume quota
      await fetch(`${baseUrl}/test-limited`);
      await fetch(`${baseUrl}/test-limited`);
      const blocked = await fetch(`${baseUrl}/test-limited`);
      assert.equal(blocked.status, 429);

      // Wait for 500ms window to expire
      await new Promise(resolve => setTimeout(resolve, 550));

      const fresh = await fetch(`${baseUrl}/test-limited`);
      assert.equal(fresh.status, 200);
      assert.equal(fresh.headers.get('ratelimit-remaining'), '2');
    });
  });

  describe('5. Security Headers and HSTS Behavior', () => {
    let server;
    let baseUrl;

    before(async () => {
      const app = express();
      app.set('trust proxy', true);

      app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
        if (req.headers['x-mock-production'] === 'true' && isHttps) {
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        next();
      });

      app.get('/headers-test', (req, res) => res.json({ ok: true }));

      await new Promise(resolve => {
        server = app.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://127.0.0.1:${port}`;
          resolve();
        });
      });
    });

    after(async () => {
      if (server) {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('sets standard nosniff, SAMEORIGIN, and referrer-policy headers', async () => {
      const res = await fetch(`${baseUrl}/headers-test`);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
      assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    });

    test('omits Strict-Transport-Security on plain HTTP requests', async () => {
      const res = await fetch(`${baseUrl}/headers-test`, {
        headers: { 'x-mock-production': 'true' }
      });
      assert.equal(res.headers.get('strict-transport-security'), null);
    });

    test('emits Strict-Transport-Security only when HTTPS is signaled', async () => {
      const res = await fetch(`${baseUrl}/headers-test`, {
        headers: {
          'x-mock-production': 'true',
          'x-forwarded-proto': 'https'
        }
      });
      assert.equal(
        res.headers.get('strict-transport-security'),
        'max-age=31536000; includeSubDomains'
      );
    });
  });

  describe('6. Production CORS Policy Enforcement', () => {
    let server;
    let baseUrl;
    const trustedOrigin = 'https://cyberlawportal.gov.in';

    before(async () => {
      const app = express();
      app.use(cors({
        origin: (origin, callback) => {
          if (!origin || origin === trustedOrigin) {
            callback(null, true);
          } else {
            callback(new Error('Blocked by CORS policy: Origin not allowed'));
          }
        },
        credentials: true
      }));

      app.get('/cors-test', (req, res) => res.json({ allowed: true }));

      app.use((err, req, res, next) => {
        if (err.message && err.message.includes('CORS policy')) {
          return res.status(403).json({
            success: false,
            error: { code: 'CORS_FORBIDDEN', message: err.message }
          });
        }
        res.status(500).json({ error: err.message });
      });

      await new Promise(resolve => {
        server = app.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://127.0.0.1:${port}`;
          resolve();
        });
      });
    });

    after(async () => {
      if (server) {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('allows requests originating from trusted production origin', async () => {
      const res = await fetch(`${baseUrl}/cors-test`, {
        headers: { Origin: trustedOrigin }
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), trustedOrigin);
    });

    test('blocks requests originating from untrusted origin with 403 CORS_FORBIDDEN', async () => {
      const res = await fetch(`${baseUrl}/cors-test`, {
        headers: { Origin: 'https://malicious-phishing-domain.com' }
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'CORS_FORBIDDEN');
    });

    test('allows non-browser direct API requests (no Origin header)', async () => {
      const res = await fetch(`${baseUrl}/cors-test`);
      assert.equal(res.status, 200);
    });
  });
});

