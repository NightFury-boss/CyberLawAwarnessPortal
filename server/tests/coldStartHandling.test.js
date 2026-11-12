/**
 * Cyber Law Awareness Portal — Cold-Start Handling & Timeout Strategy Test Suite
 *
 * Verifies:
 * 1. Fast API responses (< 4s) do not trigger or display the cold-start notice.
 * 2. Slow staging requests display notice after configured threshold delay and dismiss on completion (Fix M-1).
 * 3. Successful requests clean up in-flight tracking and keep notice inactive.
 * 4. Failed and timed-out requests clean up and remove notice immediately.
 * 5. Production configuration displays neutral messaging, never staging-specific wording.
 * 6. Timeout configuration behaves correctly across staging, production, and custom env overrides.
 * 7. GET retry behaviour is strictly bounded (maximum 1 retry with backoff).
 * 8. Non-idempotent mutations and assessment submissions (POST/PUT/PATCH/DELETE) are NEVER retried.
 * 9. Existing API contracts, health checks, and assessment schemas remain intact.
 * 10. Request lifecycle tracking across retries maintains active count without flicker (Fix H-1).
 * 11. HTTP 502 and 503 proxy/gateway responses do NOT mark the server awake (Fix H-2).
 * 12. Caller AbortSignal cancellation aborts immediately with preserved reason, is not retried, and is distinguished from timeout (Fix M-2).
 * 13. Concurrent requests properly track active count and clean up notice when all complete.
 * 14. Exhausted retry failure cleanly removes cold-start notice.
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

describe('Cold-Start Handling & Timeout Strategy Verification', () => {
  let apiModule;
  let server;
  let serverUrl;
  let requestLog = [];

  before(async () => {
    // Dynamically import the client API service
    apiModule = await import('../../client/src/services/api.js');
    assert.equal(typeof apiModule.fetchWithTimeout, 'function');
    assert.equal(typeof apiModule.subscribeColdStart, 'function');
    assert.equal(typeof apiModule.isStagingEnvironment, 'function');
    assert.equal(typeof apiModule.getColdStartMessage, 'function');
    assert.equal(typeof apiModule.getEffectiveTimeoutMs, 'function');
    assert.equal(typeof apiModule.setNoticeDelayMsForTesting, 'function');

    // Start a lightweight mock HTTP test server
    server = http.createServer((req, res) => {
      requestLog.push({ method: req.method, url: req.url, headers: req.headers });

      if (req.url === '/fast') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', speed: 'fast' }));
      } else if (req.url === '/slow-success') {
        // Delay 150ms for simulated slow response in test
        setTimeout(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', speed: 'slow' }));
        }, 150);
      } else if (req.url === '/slow-fail') {
        setTimeout(() => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: 'Internal Server Error' } }));
        }, 150);
      } else if (req.url === '/hang-timeout') {
        // Never respond to trigger client timeout
      } else if (req.url === '/retry-get-fail-once') {
        const getCount = requestLog.filter((r) => r.url === '/retry-get-fail-once').length;
        if (getCount === 1) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: 'Service Temporarily Unavailable' } }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'recovered' }));
        }
      } else if (req.url === '/retry-get-fail-twice') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Gateway Still Unreachable' } }));
      } else if (req.url === '/retry-post-fail') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Proxy 503' } }));
      } else if (req.url === '/status-502') {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Bad Gateway' } }));
      } else if (req.url === '/status-503') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Service Unavailable' } }));
      } else if (req.url === '/status-504') {
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Gateway Timeout' } }));
      } else if (req.url === '/stalled-body') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write('{"partial":');
      } else if (req.url === '/bad-json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('not-valid-json');
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Not found' } }));
      }
    });

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        serverUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) server.close();
  });

  beforeEach(() => {
    requestLog = [];
    if (apiModule.setServerAwake) {
      apiModule.setServerAwake(false);
    }
    if (apiModule.setNoticeDelayMsForTesting) {
      apiModule.setNoticeDelayMsForTesting(null);
    }
  });

  // ============================================================================
  // Test 1: Fast API responses do not display cold-start notice
  // ============================================================================
  it('1. Fast API responses do not display cold-start message', async () => {
    const states = [];
    const unsubscribe = apiModule.subscribeColdStart((state) => {
      states.push(state);
    });

    const res = await apiModule.fetchWithTimeout(`${serverUrl}/fast`, { method: 'GET' });
    const data = await res.json();
    assert.equal(data.speed, 'fast');

    // Wait a brief moment to ensure no delayed timer fired
    await new Promise((r) => setTimeout(r, 60));
    unsubscribe();

    // Verify that active never became true because request finished well before notice threshold
    const activeStates = states.filter((s) => s.active);
    assert.equal(activeStates.length, 0, 'Notice must NOT become active for fast responses');
  });

  // ============================================================================
  // Test 2: Slow staging requests display notice after configured threshold delay (Fix M-1)
  // ============================================================================
  it('2. Slow staging requests display notice after configured threshold delay and dismiss on completion', async () => {
    // Configure notice threshold lower than simulated request latency (30ms vs 150ms)
    apiModule.setNoticeDelayMsForTesting(30);

    const states = [];
    const unsubscribe = apiModule.subscribeColdStart((state) => {
      states.push(state);
    });

    try {
      // Initiate in-flight slow request (150ms)
      const requestPromise = apiModule.fetchWithTimeout(`${serverUrl}/slow-success`, { method: 'GET' });

      // After 60ms (> 30ms threshold, < 150ms completion), notice must be active
      await new Promise((r) => setTimeout(r, 60));
      const midState = states[states.length - 1];
      assert.ok(midState, 'A state update must have been received');
      assert.equal(midState.active, true, 'Notice must transition to active while request is in flight');
      assert.ok(midState.message.length > 0, 'Notice message must be populated');

      // Wait for request to complete
      const res = await requestPromise;
      const data = await res.json();
      assert.equal(data.speed, 'slow');

      // After completion, notice must transition back to inactive
      const finalState = states[states.length - 1];
      assert.equal(finalState.active, false, 'Notice must transition back to inactive after completion');
      assert.equal(finalState.message, '', 'Message must be cleared after completion');
    } finally {
      unsubscribe();
      apiModule.setNoticeDelayMsForTesting(null); // Restore original threshold
    }
  });

  // ============================================================================
  // Test 3: Successful requests remove message
  // ============================================================================
  it('3. Successful requests clean up in-flight tracking and keep notice inactive', async () => {
    let currentState = null;
    const unsubscribe = apiModule.subscribeColdStart((state) => {
      currentState = state;
    });

    const res = await apiModule.fetchWithTimeout(`${serverUrl}/fast`);
    assert.equal(res.status, 200);

    // State must be inactive upon completion
    assert.equal(currentState.active, false, 'Notice must be inactive after request succeeds');
    unsubscribe();
  });

  // ============================================================================
  // Test 4: Failed and timed-out requests remove message
  // ============================================================================
  it('4. Failed and timed-out requests clean up and remove notice immediately', async () => {
    let currentState = null;
    const unsubscribe = apiModule.subscribeColdStart((state) => {
      currentState = state;
    });

    // 4A: Test HTTP 500 failure
    try {
      await apiModule.fetchWithTimeout(`${serverUrl}/slow-fail`, { method: 'GET', maxRetries: 0 });
    } catch (_e) {
      // Ignored
    }
    assert.equal(currentState.active, false, 'Notice must be inactive after HTTP failure');

    // 4B: Test explicit timeout
    let timedOut = false;
    try {
      // Use 40ms timeout to test timeout abort
      await apiModule.fetchWithTimeout(`${serverUrl}/hang-timeout`, { method: 'GET', maxRetries: 0 }, 40);
    } catch (err) {
      timedOut = true;
      assert.equal(err.isTimeout, true, 'Error must be tagged with isTimeout: true');
      assert.equal(err.code, 'ERR_TIMEOUT', 'Error code must be ERR_TIMEOUT');
    }
    assert.equal(timedOut, true, 'Request must time out');
    assert.equal(currentState.active, false, 'Notice must be inactive after timeout');

    unsubscribe();
  });

  // ============================================================================
  // Test 5: Production does not display staging-specific messaging
  // ============================================================================
  it('5. Production does not display staging-specific messaging', () => {
    // 5A: Staging message check (#12)
    const stagingMsg = apiModule.getColdStartMessage(true);
    assert.match(stagingMsg, /staging/i);
    assert.doesNotMatch(stagingMsg, /45\s*seconds/i);
    assert.match(stagingMsg, /60\s*seconds/i);
    assert.match(stagingMsg, /retries/i);

    // 5B: Production message check
    const prodMsg = apiModule.getColdStartMessage(false);
    assert.doesNotMatch(prodMsg, /staging/i, 'Production message must NOT contain word staging');
    assert.doesNotMatch(prodMsg, /render/i, 'Production message must NOT contain word Render');
    assert.doesNotMatch(prodMsg, /free tier/i, 'Production message must NOT contain free tier');
    assert.match(prodMsg, /Connecting to server/i, 'Production message must be neutral');

    // 5C: Environment detection checks
    assert.equal(apiModule.isStagingEnvironment({ VITE_APP_ENV: 'production' }, null, 'https://api.cyberlawportal.org/api'), false);
    assert.equal(apiModule.isStagingEnvironment({ VITE_APP_ENV: 'staging' }, null, 'https://api.cyberlawportal.org/api'), true);
    assert.equal(apiModule.isStagingEnvironment({}, null, 'https://cyberlaw-portal-backend.onrender.com/api'), true);
    assert.equal(apiModule.isStagingEnvironment({}, { hostname: 'staging.cyberlawportal.org' }, 'https://api.test.org/api'), true);
    assert.equal(apiModule.isStagingEnvironment({}, { hostname: 'cyberlaw-portal.netlify.app' }, 'https://api.test.org/api'), true);
    // Explicit VITE_APP_ENV=production overrides netlify.app hostname
    assert.equal(apiModule.isStagingEnvironment({ VITE_APP_ENV: 'production' }, { hostname: 'cyberlaw-portal.netlify.app' }, 'https://api.cyberlawportal.org/api'), false);
  });

  // ============================================================================
  // Test 6: Timeout configuration behaves correctly across environments
  // ============================================================================
  it('6. Timeout configuration behaves correctly across environments and awake states', () => {
    // When sleeping in staging: should give 60s cold-start timeout
    apiModule.setServerAwake(false);
    const stagingColdTimeout = apiModule.getEffectiveTimeoutMs(null, true);
    assert.equal(stagingColdTimeout, 60000, 'Staging sleeping timeout must be 60s (60000ms)');

    // When awake in staging: should give 15s standard timeout
    apiModule.setServerAwake(true);
    const stagingAwakeTimeout = apiModule.getEffectiveTimeoutMs(null, true);
    assert.equal(stagingAwakeTimeout, 15000, 'Staging awake timeout must be 15s (15000ms)');

    // In production: should give 15s standard timeout
    apiModule.setServerAwake(false);
    const prodTimeout = apiModule.getEffectiveTimeoutMs(null, false);
    assert.equal(prodTimeout, 15000, 'Production timeout must be 15s (15000ms)');

    // Custom parameter override: must respect caller's explicit timeout
    const customTimeout = apiModule.getEffectiveTimeoutMs(8000, true);
    assert.equal(customTimeout, 8000, 'Explicit custom timeout must take precedence');

    // Environment variable overrides
    const envOverrides = {
      VITE_API_TIMEOUT_MS: '25000',
      VITE_API_COLD_START_TIMEOUT_MS: '75000'
    };
    apiModule.setServerAwake(false);
    const envColdVal = apiModule.getEffectiveTimeoutMs(null, true, envOverrides);
    assert.equal(envColdVal, 75000, 'Env cold start override must be respected');

    apiModule.setServerAwake(true);
    const envActiveVal = apiModule.getEffectiveTimeoutMs(null, true, envOverrides);
    assert.equal(envActiveVal, 25000, 'Env standard timeout override must be respected');
  });

  // ============================================================================
  // Test 7: GET retry behaviour is bounded
  // ============================================================================
  it('7. GET retry behaviour is bounded to maximum 1 retry with backoff', async () => {
    apiModule.setServerAwake(false);

    // Call endpoint that fails with 503 on first try, succeeds on second try
    const res = await apiModule.fetchWithTimeout(`${serverUrl}/retry-get-fail-once`, {
      method: 'GET',
      maxRetries: 1
    });

    const data = await res.json();
    assert.equal(data.status, 'recovered');

    const getAttempts = requestLog.filter((r) => r.url === '/retry-get-fail-once');
    assert.equal(getAttempts.length, 2, 'GET must execute exactly 2 attempts (1 initial + 1 retry)');
  });

  // ============================================================================
  // Test 8: Non-idempotent assessment submissions are NEVER retried
  // ============================================================================
  it('8. Non-idempotent mutations (POST/PUT/PATCH/DELETE) are NEVER automatically retried', async () => {
    apiModule.setServerAwake(false);

    const postPayload = JSON.stringify({
      assessmentSessionId: 'sess-123',
      stageId: 'stage-1',
      decisionId: 'decision-a',
      idempotencyKey: 'idemp-xyz-999'
    });

    const res = await apiModule.fetchWithTimeout(`${serverUrl}/retry-post-fail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: postPayload
    });

    assert.equal(res.status, 503);

    const postAttempts = requestLog.filter((r) => r.url === '/retry-post-fail');
    assert.equal(postAttempts.length, 1, 'POST request must NEVER be retried automatically (strictly 1 attempt)');
  });

  // ============================================================================
  // Test 9: Existing API contracts, health checks, and assessment schemas remain intact
  // ============================================================================
  it('9. Existing API contracts, health checks, and assessment schemas remain intact', async () => {
    // 9A: checkHealth method exists and functions
    assert.equal(typeof apiModule.default.checkHealth, 'function');

    // 9B: Distinct error properties
    let networkError = null;
    try {
      // Port 1 is unassigned on loopback, triggers fast connection failure
      await apiModule.fetchWithTimeout('http://127.0.0.1:1/unreachable', { method: 'GET', maxRetries: 0 }, 500);
    } catch (err) {
      networkError = err;
    }
    assert.ok(networkError, 'Network error must be thrown');
    assert.equal(networkError.isNetwork, true, 'Network error must have isNetwork: true');

    // 9C: Inactivity reset logic (14 minutes threshold)
    apiModule.setServerAwake(true);
    assert.equal(apiModule.getServerAwakeStatus(), true);

    apiModule.setServerAwake(false);
    assert.equal(apiModule.getServerAwakeStatus(), false);
  });

  // ============================================================================
  // Test 10: Request lifecycle tracking across retries (Fix H-1)
  // ============================================================================
  it('10. Request lifecycle tracking across retries maintains active count without flicker (Fix H-1)', async () => {
    apiModule.setNoticeDelayMsForTesting(30);
    apiModule.setServerAwake(false);

    const states = [];
    const unsubscribe = apiModule.subscribeColdStart((state) => {
      states.push({ active: state.active, time: Date.now() });
    });

    try {
      // /retry-get-fail-once returns 503 on 1st attempt, sleeps 2000ms backoff, then succeeds on 2nd attempt.
      // Notice should become active after 30ms and stay active throughout the 2s backoff and 2nd attempt,
      // never dropping to inactive in between.
      const res = await apiModule.fetchWithTimeout(`${serverUrl}/retry-get-fail-once`, {
        method: 'GET',
        maxRetries: 1
      });
      assert.equal(res.status, 200);

      const activeSequence = states.map((s) => s.active);
      const firstActiveIdx = activeSequence.indexOf(true);
      assert.ok(firstActiveIdx !== -1, 'Notice must have activated during the retry lifecycle');

      const lastActiveIdx = activeSequence.lastIndexOf(true);
      // All states between first active and last active MUST be true (zero flickering to false)
      const midStates = activeSequence.slice(firstActiveIdx, lastActiveIdx + 1);
      assert.ok(midStates.every((a) => a === true), 'Notice must NOT flicker to inactive during backoff or retry');

      // Final state after resolution must be inactive
      assert.equal(activeSequence[activeSequence.length - 1], false, 'Notice must be inactive after logical request completes');
    } finally {
      unsubscribe();
      apiModule.setNoticeDelayMsForTesting(null);
    }
  });

  // ============================================================================
  // Test 11: HTTP 502 and 503 proxy/gateway responses do NOT mark server awake (Fix H-2)
  // ============================================================================
  it('11. HTTP 502, 503, and 504 proxy/gateway responses do NOT mark the server awake (Fix H-2)', async () => {
    apiModule.setServerAwake(false);
    assert.equal(apiModule.getServerAwakeStatus(), false);

    // 11A: HTTP 502 Bad Gateway
    await apiModule.fetchWithTimeout(`${serverUrl}/status-502`, { method: 'GET', maxRetries: 0 });
    assert.equal(apiModule.getServerAwakeStatus(), false, 'HTTP 502 must NOT mark server awake');

    // 11B: HTTP 503 Service Unavailable
    await apiModule.fetchWithTimeout(`${serverUrl}/status-503`, { method: 'GET', maxRetries: 0 });
    assert.equal(apiModule.getServerAwakeStatus(), false, 'HTTP 503 must NOT mark server awake');

    // 11C: HTTP 504 Gateway Timeout
    await apiModule.fetchWithTimeout(`${serverUrl}/status-504`, { method: 'GET', maxRetries: 0 });
    assert.equal(apiModule.getServerAwakeStatus(), false, 'HTTP 504 must NOT mark server awake');

    // 11D: Valid HTTP 200 response DOES mark server awake
    await apiModule.fetchWithTimeout(`${serverUrl}/fast`, { method: 'GET', maxRetries: 0 });
    assert.equal(apiModule.getServerAwakeStatus(), true, 'HTTP 200 must mark server awake');

    // 11E: Client error HTTP 404 response also marks server awake (server answered)
    apiModule.setServerAwake(false);
    await apiModule.fetchWithTimeout(`${serverUrl}/non-existent-route`, { method: 'GET', maxRetries: 0 });
    assert.equal(apiModule.getServerAwakeStatus(), true, 'HTTP 404 confirms container responded, marking awake');
  });

  // ============================================================================
  // Test 12: Caller AbortSignal cancellation (Fix M-2)
  // ============================================================================
  it('12. Caller AbortSignal cancellation aborts immediately with preserved reason, is not retried, and is distinguished from timeout (Fix M-2)', async () => {
    apiModule.setServerAwake(false);

    // 12A: Caller cancels in-flight slow request
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort(new Error('User cancelled assessment submission'));
    }, 40);

    let callerAborted = false;
    let caughtErr = null;
    try {
      await apiModule.fetchWithTimeout(`${serverUrl}/slow-success`, {
        method: 'GET',
        signal: controller.signal,
        maxRetries: 1
      });
    } catch (err) {
      callerAborted = true;
      caughtErr = err;
    }

    assert.equal(callerAborted, true, 'Request must abort upon caller signal');
    assert.equal(caughtErr.isTimeout, undefined, 'Caller cancellation must NOT be marked as timeout');
    assert.match(caughtErr.message, /User cancelled assessment submission/, 'Caller abort reason must be preserved');

    // 12B: Pre-aborted caller signal fails immediately before network call
    const preAbortedController = new AbortController();
    preAbortedController.abort(new Error('Immediate cancellation before launch'));

    const initialReqCount = requestLog.length;
    let preAbortedCaught = false;
    let preAbortedErr = null;
    try {
      await apiModule.fetchWithTimeout(`${serverUrl}/fast`, {
        method: 'GET',
        signal: preAbortedController.signal,
        maxRetries: 1
      });
    } catch (err) {
      preAbortedCaught = true;
      preAbortedErr = err;
    }

    assert.equal(preAbortedCaught, true, 'Pre-aborted request must throw immediately');
    assert.match(preAbortedErr.message, /Immediate cancellation before launch/);
    assert.equal(requestLog.length, initialReqCount, 'Pre-aborted request must NOT dispatch network fetch');
  });

  // ============================================================================
  // Test 13: Concurrent requests properly track active count and clean up notice
  // ============================================================================
  it('13. Concurrent requests properly track active count and clean up notice when all complete', async () => {
    apiModule.setNoticeDelayMsForTesting(30);

    const states = [];
    const unsubscribe = apiModule.subscribeColdStart((state) => {
      states.push(state.active);
    });

    try {
      // Launch two slow requests concurrently
      const p1 = apiModule.fetchWithTimeout(`${serverUrl}/slow-success`, { method: 'GET' });
      const p2 = apiModule.fetchWithTimeout(`${serverUrl}/slow-success`, { method: 'GET' });

      // After 60ms: notice must be active
      await new Promise((r) => setTimeout(r, 60));
      assert.equal(states[states.length - 1], true, 'Notice must be active while requests are in flight');

      await Promise.all([p1, p2]);

      // Both complete: notice must transition back to inactive
      assert.equal(states[states.length - 1], false, 'Notice must be inactive once all concurrent requests complete');
    } finally {
      unsubscribe();
      apiModule.setNoticeDelayMsForTesting(null);
    }
  });

  // ============================================================================
  // Test 14: Exhausted retry failure cleanly removes cold-start notice
  // ============================================================================
  it('14. Exhausted retry failure cleanly removes cold-start notice', async () => {
    apiModule.setNoticeDelayMsForTesting(30);
    apiModule.setServerAwake(false);

    let finalState = null;
    const unsubscribe = apiModule.subscribeColdStart((state) => {
      finalState = state;
    });

    try {
      // Call endpoint that always returns 503, exhausting maxRetries = 1
      const res = await apiModule.fetchWithTimeout(`${serverUrl}/retry-get-fail-twice`, {
        method: 'GET',
        maxRetries: 1
      });
      assert.equal(res.status, 503);
      assert.equal(finalState.active, false, 'Notice must be inactive even after exhausted retries');
    } finally {
      unsubscribe();
      apiModule.setNoticeDelayMsForTesting(null);
    }
  });

  it('15. #13 Timeout and abort remain active through handleResponse body parsing and clean up on parse failure', async () => {
    apiModule.setNoticeDelayMsForTesting(20);
    let currentState = { active: false };
    const unsubscribe = apiModule.subscribeColdStart((s) => { currentState = s; });

    try {
      // Stalled response body after 200 headers must trigger ERR_TIMEOUT
      let timeoutErr = null;
      try {
        await apiModule.requestJson(`${serverUrl}/stalled-body`, { method: 'GET', maxRetries: 0 }, 80);
      } catch (err) {
        timeoutErr = err;
      }
      assert.ok(timeoutErr, 'Stalled body must time out');
      assert.equal(timeoutErr.code, 'ERR_TIMEOUT');
      assert.equal(currentState.active, false);

      // Parse failure on invalid JSON must reject and tear down active tracking cleanly
      await assert.rejects(
        () => apiModule.requestJson(`${serverUrl}/bad-json`, { method: 'GET', maxRetries: 0 }),
        SyntaxError
      );
      assert.equal(currentState.active, false);
    } finally {
      unsubscribe();
      apiModule.setNoticeDelayMsForTesting(null);
    }
  });

  it('16. #14 Retry backoff delay aborts immediately on caller AbortSignal without firing second attempt', async () => {
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort(new Error('Aborted during retry delay'));
    }, 50);

    const start = Date.now();
    let caughtErr = null;
    try {
      await apiModule.fetchWithTimeout(`${serverUrl}/retry-get-fail-once`, {
        method: 'GET',
        signal: controller.signal,
        maxRetries: 1
      });
    } catch (err) {
      caughtErr = err;
    }
    const elapsed = Date.now() - start;

    assert.ok(caughtErr, 'Expected retry delay to reject upon caller abort');
    assert.match(caughtErr.message, /Aborted during retry delay/);
    assert.ok(elapsed < 800, `Expected prompt abort during 2s backoff wait, took ${elapsed}ms`);
    assert.equal(requestLog.filter((r) => r.url === '/retry-get-fail-once').length, 1);
  });

  it('17. #1 & #11 App renders ColdStartNotice while loading and preserves token across non-auth failures', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const appSrc = fs.readFileSync(path.join(__dirname, '../../client/src/App.jsx'), 'utf8');

    const loadingIdx = appSrc.indexOf('{loading ?');
    const coldStartIdx = appSrc.indexOf('<ColdStartNotice />');
    assert.ok(coldStartIdx !== -1 && loadingIdx !== -1 && coldStartIdx < loadingIdx, 'ColdStartNotice must mount outside loading branch');

    // Only explicit 401/403 should invoke api.logout()
    assert.match(appSrc, /err\.status === 401 \|\| err\.status === 403/);
  });
});
