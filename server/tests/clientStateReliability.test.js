const assert = require('assert');

// Simulate client fetchWithTimeout implementation
async function fetchWithTimeout(fetchFn, url, options = {}, timeoutMs = 100) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchFn(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

// Simulate Dashboard state machine
class DashboardStateMachine {
  constructor(apiClient, user) {
    this.api = apiClient;
    this.user = user;
    this.loadState = 'IDLE'; // IDLE -> LOADING -> RESOLVED | ERROR
    this.errorMessage = '';
    this.progress = null;
    this.baselineStatus = null;
    this.renderedView = null; // 'LOADING_VIEW' | 'RETRY_ERROR_VIEW' | 'FIRST_VISIT_VIEW' | 'STUDIO_VIEW'
  }

  async loadDashboard() {
    this.loadState = 'LOADING';
    this.renderedView = 'LOADING_VIEW';
    this.errorMessage = '';

    try {
      // Authoritative calls: both must resolve
      const [prog, baseStatus] = await Promise.all([
        this.api.getProgress(),
        this.api.getAssessmentStatus('baseline')
      ]);

      this.progress = prog;
      this.baselineStatus = baseStatus;
      this.loadState = 'RESOLVED';

      const hasBaseline = prog.baselineScore !== null || Boolean(baseStatus?.hasCompletedSession);
      if (!hasBaseline) {
        this.renderedView = 'FIRST_VISIT_VIEW';
      } else {
        this.renderedView = 'STUDIO_VIEW';
      }
    } catch (err) {
      this.loadState = 'ERROR';
      this.errorMessage = err.message || 'Connection failed';
      this.renderedView = 'RETRY_ERROR_VIEW';
    }
  }

  retry() {
    return this.loadDashboard();
  }
}

async function runClientStateTests() {
  console.log('=============================================================');
  console.log('CLIENT STATE MACHINE & NETWORK RELIABILITY TESTS');
  console.log('=============================================================');

  // Test 1: fetchWithTimeout aborts when request exceeds timeoutMs
  console.log('\n[Test 1] Testing fetchWithTimeout on slow/hanging request...');
  const slowFetch = (url, options) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve({ ok: true }), 500);
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      }
    });
  };

  try {
    await fetchWithTimeout(slowFetch, 'http://api.local/slow', {}, 50);
    assert.fail('Expected fetchWithTimeout to throw on timeout');
  } catch (err) {
    assert(err.message.includes('Request timed out'), 'Must throw timeout error message');
    console.log('  ✓ Verified: fetchWithTimeout cleanly aborts with timeout message.');
  }

  // Test 2: Network failure must transition to ERROR and RETRY_ERROR_VIEW (NEVER FIRST_VISIT_VIEW)
  console.log('\n[Test 2] Testing network rejection / server 500 during dashboard load...');
  const failingApi = {
    getProgress: async () => { throw new Error('500 Internal Server Error'); },
    getAssessmentStatus: async () => ({ hasActiveSession: false, hasCompletedSession: true })
  };
  const machine = new DashboardStateMachine(failingApi, { fullName: 'Priya Sen' });
  await machine.loadDashboard();

  assert.strictEqual(machine.loadState, 'ERROR', 'loadState must be ERROR');
  assert.strictEqual(machine.renderedView, 'RETRY_ERROR_VIEW', 'Must render RETRY_ERROR_VIEW, NEVER onboarding');
  assert.strictEqual(machine.progress, null, 'Progress must remain uncommitted');
  console.log('  ✓ Verified: Network failure displays calm retry view, not new learner onboarding.');

  // Test 3: Failure of getAssessmentStatus alone must also trigger ERROR (not fall back to null)
  console.log('\n[Test 3] Testing getAssessmentStatus rejection when getProgress succeeds...');
  const statusFailingApi = {
    getProgress: async () => ({ baselineScore: null, finalScore: null }),
    getAssessmentStatus: async () => { throw new Error('Network request failed'); }
  };
  const machine2 = new DashboardStateMachine(statusFailingApi, { fullName: 'Priya Sen' });
  await machine2.loadDashboard();

  assert.strictEqual(machine2.loadState, 'ERROR');
  assert.strictEqual(machine2.renderedView, 'RETRY_ERROR_VIEW');
  console.log('  ✓ Verified: getAssessmentStatus failure triggers ERROR; never misclassifies learner as new.');

  // Test 4: Retry success restores authoritative state and renders correct view
  console.log('\n[Test 4] Testing retry recovery from transient failure...');
  let shouldFail = true;
  const transientApi = {
    getProgress: async () => {
      if (shouldFail) throw new Error('Network glitch');
      return { baselineScore: 84, finalScore: null };
    },
    getAssessmentStatus: async () => {
      if (shouldFail) throw new Error('Network glitch');
      return { hasActiveSession: false, hasCompletedSession: true };
    }
  };
  const machine3 = new DashboardStateMachine(transientApi, { fullName: 'Priya Sen' });
  await machine3.loadDashboard();
  assert.strictEqual(machine3.loadState, 'ERROR');
  assert.strictEqual(machine3.renderedView, 'RETRY_ERROR_VIEW');

  // Trigger retry with network restored
  shouldFail = false;
  await machine3.retry();
  assert.strictEqual(machine3.loadState, 'RESOLVED');
  assert.strictEqual(machine3.renderedView, 'STUDIO_VIEW');
  assert.strictEqual(machine3.progress.baselineScore, 84);
  console.log('  ✓ Verified: Retry successfully transitions from ERROR to RESOLVED with full studio restored.');

  // Test 5: Fresh learner with authoritative 200 response renders FIRST_VISIT_VIEW
  console.log('\n[Test 5] Testing legitimate fresh learner renders FIRST_VISIT_VIEW...');
  const legitimateNewApi = {
    getProgress: async () => ({ baselineScore: null, finalScore: null, completedModules: [] }),
    getAssessmentStatus: async () => ({ hasActiveSession: false, hasCompletedSession: false })
  };
  const machine4 = new DashboardStateMachine(legitimateNewApi, { fullName: 'New User' });
  await machine4.loadDashboard();
  assert.strictEqual(machine4.loadState, 'RESOLVED');
  assert.strictEqual(machine4.renderedView, 'FIRST_VISIT_VIEW');
  console.log('  ✓ Verified: Legitimate fresh learner renders FirstVisitExperience only after authoritative RESOLVED.');

  console.log('\n=============================================================');
  console.log('ALL CLIENT STATE MACHINE TESTS PASSED SUCCESSFULLY! (100%)');
  console.log('=============================================================');
}

runClientStateTests();

