/**
 * Normalizes and resolves the base API endpoint URL.
 * Supports:
 * - Full URLs: https://backend.onrender.com -> https://backend.onrender.com/api
 * - URLs already ending in /api: https://backend.onrender.com/api -> https://backend.onrender.com/api
 * - Relative paths: /api or /api/ -> /api
 * - Trailing slash trimming
 * - Local development fallback: http://localhost:5000/api
 * - Same-origin fallback: {window.location.origin}/api
 */
function resolveApiUrl(rawEnvUrl) {
  const envUrl = (typeof rawEnvUrl === 'string'
    ? rawEnvUrl
    : (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
        ? String(import.meta.env.VITE_API_URL)
        : '')
  ).trim();

  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  if (typeof window !== 'undefined' && window.location) {
    const isLocalDev = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000';
    if (isLocalDev) {
      return 'http://localhost:5000/api';
    }
    if (window.location.origin) {
      return `${window.location.origin}/api`;
    }
  }

  return 'http://localhost:5000/api';
}

const API_URL = resolveApiUrl();

// Cold-Start & Timeout Configuration Constants
const DEFAULT_TIMEOUT_MS = 15000;         // 15s for standard active requests
const COLD_START_TIMEOUT_MS = 60000;      // 60s to survive Render container cold start
const NOTICE_DELAY_MS = 4000;             // 4s threshold before displaying waking notice
const INACTIVITY_RESET_MS = 14 * 60 * 1000; // 14m (Render free tier spins down after 15m)

// Internal state tracking
let activeRequestsCount = 0;
let noticeTimer = null;
let isNoticeActive = false;
let isServerAwake = false;
let lastResponseTimestamp = 0;
const subscribers = new Set();

/**
 * Evaluates whether current runtime is in staging mode.
 * Safe across browser and Node.js testing environments.
 */
function isStagingEnvironment(
  env = (typeof import.meta !== 'undefined' ? import.meta.env : null),
  loc = (typeof window !== 'undefined' ? window.location : null),
  apiUrl = typeof API_URL !== 'undefined' ? API_URL : ''
) {
  if (env && env.VITE_APP_ENV) {
    if (env.VITE_APP_ENV === 'staging') return true;
    if (env.VITE_APP_ENV === 'production') return false;
  }
  if (env && env.VITE_IS_STAGING === 'true') return true;
  if (typeof apiUrl === 'string' && apiUrl.includes('onrender.com')) return true;
  if (loc && loc.hostname) {
    if (loc.hostname.includes('staging') || loc.hostname.includes('netlify.app')) return true;
  }
  return false;
}

/**
 * Returns user-facing message based on environment.
 * Guarantees zero staging-specific terminology leaks into production.
 */
function getColdStartMessage(isStaging = isStagingEnvironment()) {
  return isStaging
    ? 'Waking up staging services... Initial request may take up to 60 seconds (retries can extend the total wait) while Render spins up.'
    : 'Connecting to server... Please wait a moment.';
}

/**
 * Calculates effective timeout based on awake state, environment, and optional custom overrides.
 */
function getEffectiveTimeoutMs(
  customTimeoutMs,
  isStaging = isStagingEnvironment(),
  env = (typeof import.meta !== 'undefined' ? import.meta.env : null)
) {
  if (typeof customTimeoutMs === 'number' && customTimeoutMs > 0) {
    return customTimeoutMs;
  }

  const envTimeout = env && Number(env.VITE_API_TIMEOUT_MS);
  const envColdTimeout = env && Number(env.VITE_API_COLD_START_TIMEOUT_MS);

  // Check if inactivity has caused the server to sleep again
  if (isServerAwake && lastResponseTimestamp > 0) {
    const elapsed = Date.now() - lastResponseTimestamp;
    if (elapsed > INACTIVITY_RESET_MS) {
      isServerAwake = false;
    }
  }

  if (isStaging && !isServerAwake) {
    return (envColdTimeout && envColdTimeout > 0) ? envColdTimeout : COLD_START_TIMEOUT_MS;
  }

  return (envTimeout && envTimeout > 0) ? envTimeout : DEFAULT_TIMEOUT_MS;
}

function notifySubscribers(state) {
  isNoticeActive = state.active;
  subscribers.forEach((cb) => {
    try {
      cb(state);
    } catch (_e) {
      // Prevent subscriber exceptions from bubbling
    }
  });
}

/**
 * Subscribes a listener to cold-start notification state changes.
 * Returns an unsubscribe cleanup function.
 */
function subscribeColdStart(callback) {
  subscribers.add(callback);
  // Emit current state immediately to new subscriber
  try {
    const isStaging = isStagingEnvironment();
    callback({
      active: isNoticeActive,
      message: isNoticeActive ? getColdStartMessage(isStaging) : '',
      isStaging
    });
  } catch (_e) {
    // Subscriber error protection
  }
  return () => {
    subscribers.delete(callback);
  };
}

let customNoticeDelayMs = null;

/**
 * Test hook to configure notification delay dynamically.
 * Restored by passing null.
 */
function setNoticeDelayMsForTesting(delayMs) {
  customNoticeDelayMs = typeof delayMs === 'number' && delayMs >= 0 ? delayMs : null;
}

function onCallStart(options = {}) {
  if (options && options.skipNotice) return;
  activeRequestsCount++;
  if (activeRequestsCount === 1) {
    if (!isNoticeActive && !noticeTimer) {
      const delay = customNoticeDelayMs ?? ((typeof import.meta !== 'undefined' && import.meta.env && Number(import.meta.env.VITE_COLD_START_NOTICE_DELAY_MS)) || NOTICE_DELAY_MS);
      noticeTimer = setTimeout(() => {
        noticeTimer = null;
        if (activeRequestsCount > 0) {
          const isStaging = isStagingEnvironment();
          notifySubscribers({
            active: true,
            message: getColdStartMessage(isStaging),
            isStaging
          });
        }
      }, delay);
    }
  }
}

function onCallEnd(options = {}) {
  if (options && options.skipNotice) return;
  activeRequestsCount = Math.max(0, activeRequestsCount - 1);
  if (activeRequestsCount === 0) {
    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    if (isNoticeActive) {
      notifySubscribers({
        active: false,
        message: '',
        isStaging: isStagingEnvironment()
      });
    }
  }
}

function setServerAwake(awake = true) {
  isServerAwake = Boolean(awake);
  lastResponseTimestamp = awake ? Date.now() : 0;
}

function getServerAwakeStatus() {
  if (isServerAwake && lastResponseTimestamp > 0) {
    if (Date.now() - lastResponseTimestamp > INACTIVITY_RESET_MS) {
      isServerAwake = false;
    }
  }
  return isServerAwake;
}

// Helper to get headers safely in any environment
function getHeaders() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Resilient fetch wrapper with cold-start timeout handling,
 * distinct error classification, and bounded retries for idempotent GET requests.
 *
 * SAFETY CONTRACT:
 * - Mutating requests (POST, PUT, PATCH, DELETE) are NEVER automatically retried.
 * - Assessment step submissions and session transitions are strictly non-retried.
 * - Read-only GET requests may perform at most 1 bounded retry with backoff during cold starts.
 */
/**
 * Links internal timeout signal with optional caller-supplied AbortSignal.
 */
function linkAbortSignals(timeoutSignal, callerSignal) {
  if (!callerSignal) {
    return { signal: timeoutSignal, cleanup: () => {} };
  }

  if (typeof AbortSignal.any === 'function') {
    return {
      signal: AbortSignal.any([timeoutSignal, callerSignal]),
      cleanup: () => {}
    };
  }

  const combined = new AbortController();
  const onAbort = () => {
    if (callerSignal.aborted) {
      combined.abort(callerSignal.reason);
    } else if (timeoutSignal.aborted) {
      combined.abort(timeoutSignal.reason);
    }
  };

  if (callerSignal.aborted || timeoutSignal.aborted) {
    onAbort();
    return { signal: combined.signal, cleanup: () => {} };
  }

  callerSignal.addEventListener('abort', onAbort, { once: true });
  timeoutSignal.addEventListener('abort', onAbort, { once: true });

  return {
    signal: combined.signal,
    cleanup: () => {
      callerSignal.removeEventListener('abort', onAbort);
      timeoutSignal.removeEventListener('abort', onAbort);
    }
  };
}

function createTimeoutError(effectiveTimeout, isStaging) {
  const timeoutErr = new Error(
    isStaging
      ? `Request timed out after ${Math.round(effectiveTimeout / 1000)}s. The staging server may still be spinning up. Please try again.`
      : `Request timed out after ${Math.round(effectiveTimeout / 1000)}s. Please check your connection and try again.`
  );
  timeoutErr.name = 'TimeoutError';
  timeoutErr.isTimeout = true;
  timeoutErr.code = 'ERR_TIMEOUT';
  return timeoutErr;
}

function waitWithSignal(ms, callerSignal) {
  if (callerSignal && callerSignal.aborted) {
    return Promise.reject(
      callerSignal.reason || new DOMException('The user aborted a request.', 'AbortError')
    );
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(delayTimer);
      reject(callerSignal.reason || new DOMException('The user aborted a request.', 'AbortError'));
    };
    const delayTimer = setTimeout(() => {
      if (callerSignal) {
        callerSignal.removeEventListener('abort', onAbort);
      }
      resolve();
    }, ms);
    if (callerSignal) {
      callerSignal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const { responseHandler, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const isSafeMethod = method === 'GET' || method === 'HEAD';
  const isStaging = isStagingEnvironment();
  const callerSignal = fetchOptions.signal;

  // If caller signal is already aborted, fail immediately without starting request or retrying
  if (callerSignal && callerSignal.aborted) {
    const abortError = callerSignal.reason || new DOMException('The user aborted a request.', 'AbortError');
    throw abortError;
  }

  // Staging cold-start retry: ONLY for safe GET requests, max 1 retry with backoff.
  // POST/PUT/PATCH/DELETE are strictly 0 retries.
  const maxRetries = isSafeMethod ? (fetchOptions.maxRetries ?? (isStaging && !getServerAwakeStatus() ? 1 : 0)) : 0;

  // Fix H-1: Track in-flight request lifecycle ONCE per logical request outside retry loop
  onCallStart(fetchOptions);

  try {
    let attempt = 0;

    while (true) {
      attempt++;
      const effectiveTimeout = getEffectiveTimeoutMs(timeoutMs, isStaging);
      const timeoutController = new AbortController();
      const timerId = setTimeout(() => timeoutController.abort(), effectiveTimeout);
      const { signal: combinedSignal, cleanup: signalCleanup } = linkAbortSignals(timeoutController.signal, callerSignal);
      let cleanedUp = false;
      const cleanupAttempt = () => {
        if (!cleanedUp) {
          cleanedUp = true;
          clearTimeout(timerId);
          signalCleanup();
        }
      };
      let responseReceived = false;

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: combinedSignal
        });
        responseReceived = true;

        // Fix H-2: Only mark server awake on successful or non-gateway error responses
        // 502 (proxy cannot reach container) and 503 (database disconnected) do NOT mark server awake
        const isProxyOrDegraded = response.status === 502 || response.status === 503 || response.status === 504;
        if (!isProxyOrDegraded) {
          setServerAwake(true);
        }

        // If safe GET received proxy 502/503 during cold-start boot, retry if attempts remain
        if (isSafeMethod && isProxyOrDegraded && attempt <= maxRetries) {
          try { await response.body?.cancel?.(); } catch (_e) {}
          cleanupAttempt();
          await waitWithSignal(2000, callerSignal);
          continue;
        }

        if (typeof responseHandler === 'function') {
          return await responseHandler(response);
        }

        return response;
      } catch (err) {
        // Fix M-2: If caller aborted the request, propagate immediately without retrying
        if (callerSignal && callerSignal.aborted && !err?.isHttp) {
          throw callerSignal.reason || err;
        }

        if (responseReceived) {
          if (timeoutController.signal.aborted && !err?.isHttp) {
            throw createTimeoutError(effectiveTimeout, isStaging);
          }
          throw err;
        }

        const isTimeout = timeoutController.signal.aborted;
        const isNetwork = !isTimeout;

        // Safe GET network retry if proxy dropped connection before container was listening
        if (isSafeMethod && attempt <= maxRetries && isNetwork) {
          cleanupAttempt();
          await waitWithSignal(2000, callerSignal);
          continue;
        }

        if (isTimeout) {
          throw createTimeoutError(effectiveTimeout, isStaging);
        }

        err.isNetwork = true;
        if (!err.code) err.code = 'ERR_NETWORK';
        throw err;
      } finally {
        cleanupAttempt();
      }
    }
  } finally {
    // Fix H-1: Exactly one teardown per logical API request
    onCallEnd(fetchOptions);
  }
}

async function requestJson(url, options = {}, timeoutMs) {
  return fetchWithTimeout(url, {
    ...options,
    responseHandler: handleResponse
  }, timeoutMs);
}

// Helper to handle responses
async function handleResponse(response) {
  if (!response.ok) {
    let errMsg = 'Something went wrong';
    let errCode = null;
    let errDetails = null;
    try {
      const data = await response.json();
      errMsg = data.error?.message || data.message || errMsg;
      errCode = data.error?.code || data.code || null;
      errDetails = data.error?.details || data.details || null;
    } catch (_e) {
      // JSON parse failed
    }
    const error = new Error(errMsg);
    error.status = response.status;
    error.isHttp = true;
    if (errCode) error.code = errCode;
    if (errDetails) error.details = errDetails;
    throw error;
  }
  return response.json();
}

const api = {
  // Authentication
  login: async (email, password) => {
    const data = await requestJson(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('token', data.token);
    return data;
  },

  register: async (email, password, fullName) => {
    const data = await requestJson(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, fullName })
    });
    localStorage.setItem('token', data.token);
    return data;
  },

  getMe: async () => {
    return requestJson(`${API_URL}/auth/me`, {
      headers: getHeaders()
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.setItem('workspace_sidebar_collapsed', 'false');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Public Resources
  getLaws: async () => {
    return requestJson(`${API_URL}/laws`, {
      headers: getHeaders()
    });
  },

  searchLaws: async (query) => {
    return requestJson(`${API_URL}/laws/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
  },

  getLaw: async (id) => {
    return requestJson(`${API_URL}/laws/${id}`, {
      headers: getHeaders()
    });
  },

  getCrimes: async () => {
    return requestJson(`${API_URL}/crimes/crimes`, {
      headers: getHeaders()
    });
  },

  searchCrimes: async (query) => {
    return requestJson(`${API_URL}/crimes/crimes/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
  },

  getCrimeRecommendations: async () => {
    return requestJson(`${API_URL}/crimes/crimes/recommendations`, {
      headers: getHeaders()
    });
  },

  getCrimeBySlug: async (slug) => {
    return requestJson(`${API_URL}/crimes/crimes/slug/${slug}`, {
      headers: getHeaders()
    });
  },

  getCrime: async (id) => {
    return requestJson(`${API_URL}/crimes/crimes/${id}`, {
      headers: getHeaders()
    });
  },

  getCases: async () => {
    return requestJson(`${API_URL}/crimes/cases`, {
      headers: getHeaders()
    });
  },

  getCase: async (id) => {
    return requestJson(`${API_URL}/crimes/cases/${id}`, {
      headers: getHeaders()
    });
  },

  getCaseBySlug: async (slug) => {
    return requestJson(`${API_URL}/crimes/cases/slug/${slug}`, {
      headers: getHeaders()
    });
  },

  searchCases: async (query) => {
    return requestJson(`${API_URL}/crimes/cases/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
  },

  getResources: async () => {
    return requestJson(`${API_URL}/crimes/resources`, {
      headers: getHeaders()
    });
  },

  // Learning Modules & Lessons
  getModules: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.difficulty && params.difficulty !== 'All') query.append('difficulty', params.difficulty);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return requestJson(`${API_URL}/modules${queryString}`, {
      headers: getHeaders()
    });
  },

  getModuleBySlug: async (slug) => {
    return requestJson(`${API_URL}/modules/${slug}`, {
      headers: getHeaders()
    });
  },

  recordModuleProgress: async (slug, data = { completed: true }) => {
    return requestJson(`${API_URL}/modules/${slug}/progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  // Quizzes
  getQuizzes: async () => {
    return requestJson(`${API_URL}/quizzes`, {
      headers: getHeaders()
    });
  },

  getQuizModes: async () => {
    return requestJson(`${API_URL}/quizzes/modes`, {
      headers: getHeaders()
    });
  },

  getQuizTopics: async () => {
    return requestJson(`${API_URL}/quizzes/topics`, {
      headers: getHeaders()
    });
  },

  getQuizHistory: async () => {
    return requestJson(`${API_URL}/quizzes/history`, {
      headers: getHeaders()
    });
  },

  getDueQuizRecalls: async () => {
    return requestJson(`${API_URL}/quizzes/recall/due`, {
      headers: getHeaders()
    });
  },

  submitQuizRecall: async (questionId, answer) => {
    return requestJson(`${API_URL}/quizzes/recall/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ questionId, answer })
    });
  },

  startQuizSession: async (payload = {}) => {
    return requestJson(`${API_URL}/quizzes/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },

  getQuizQuestions: async (quizId) => {
    return requestJson(`${API_URL}/quizzes/${quizId}/questions`, {
      headers: getHeaders()
    });
  },

  submitQuiz: async (quizIdOrPayload, maybeAnswers) => {
    const body = (quizIdOrPayload && typeof quizIdOrPayload === 'object' && quizIdOrPayload.answers)
      ? quizIdOrPayload
      : { quizId: quizIdOrPayload, answers: maybeAnswers };
    return requestJson(`${API_URL}/quizzes/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
  },

  // Simulation / Assessments (Backend-Authoritative)
  getScenario: async (code) => {
    return requestJson(`${API_URL}/assessments/${code}`, {
      headers: getHeaders()
    });
  },

  startAssessment: async (scenarioCode) => {
    return requestJson(`${API_URL}/assessments/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ scenarioCode })
    });
  },

  getAssessmentSession: async (sessionId) => {
    return requestJson(`${API_URL}/assessments/session/${sessionId}`, {
      headers: getHeaders()
    });
  },

  getAssessmentStatus: async (scenarioCode) => {
    return requestJson(`${API_URL}/assessments/status/${scenarioCode}`, {
      headers: getHeaders()
    });
  },

  submitAssessmentStep: async (assessmentSessionId, stageId, decisionId, signalProbeDecisionId, idempotencyKey) => {
    const payload = {
      assessmentSessionId,
      stageId,
      decisionId
    };
    if (signalProbeDecisionId) {
      payload.signalProbeDecisionId = signalProbeDecisionId;
    }
    if (idempotencyKey) {
      payload.idempotencyKey = idempotencyKey;
    }
    return requestJson(`${API_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },

  getAssessmentRemediation: async (sessionId) => {
    return requestJson(`${API_URL}/assessments/remediation/${sessionId}`, {
      headers: getHeaders()
    });
  },

  // Progress Dashboard
  getProgress: async () => {
    return requestJson(`${API_URL}/progress`, {
      headers: getHeaders()
    });
  },

  // Learning Pathway Progression (Phase 4)
  recordPathwayStep: async (pathwayId, sourceSessionId, step, extraData = {}) => {
    return requestJson(`${API_URL}/progress/pathways/step`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        pathwayId,
        sourceSessionId,
        step,
        ...extraData
      })
    });
  },

  getPathwayCheckpoint: async (pathwayId, sourceSessionId) => {
    return requestJson(`${API_URL}/progress/pathways/${pathwayId}/checkpoint?sourceSessionId=${sourceSessionId}`, {
      headers: getHeaders()
    });
  },

  getPathwayCheckpointReview: async (pathwayId, sourceSessionId) => {
    return requestJson(`${API_URL}/progress/pathways/${pathwayId}/review?sourceSessionId=${sourceSessionId}`, {
      headers: getHeaders()
    });
  },

  submitPathwayCheckpoint: async (pathwayId, sourceSessionId, answers) => {
    return requestJson(`${API_URL}/progress/pathways/checkpoint`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        pathwayId,
        sourceSessionId,
        answers
      })
    });
  },

  // Phase 5A: Targeted Habit Reinforcement
  reinforcePathway: async (pathwayId, sourceSessionId, answers) => {
    return requestJson(`${API_URL}/progress/pathways/reinforce`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        pathwayId,
        sourceSessionId,
        answers
      })
    });
  },

  // Spaced Retrieval & Follow-Up Learning
  getDueSpacedRetrievals: async () => {
    return requestJson(`${API_URL}/progress/pathways/spaced-retrieval/due`, {
      headers: getHeaders()
    });
  },

  getSpacedRetrievalQuestions: async (pathwayId, sourceSessionId = '') => {
    const url = sourceSessionId
      ? `${API_URL}/progress/pathways/${pathwayId}/spaced-retrieval?sourceSessionId=${sourceSessionId}`
      : `${API_URL}/progress/pathways/${pathwayId}/spaced-retrieval`;
    return requestJson(url, {
      headers: getHeaders()
    });
  },

  submitSpacedRetrieval: async (pathwayId, sourceSessionId, answers) => {
    return requestJson(`${API_URL}/progress/pathways/${pathwayId}/spaced-retrieval`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        sourceSessionId,
        answers
      })
    });
  },

  // Phase 5B: Longitudinal Evidence & Three-Pillar Portfolio
  getPortfolio: async () => {
    return requestJson(`${API_URL}/progress/portfolio`, {
      headers: getHeaders()
    });
  },

  getTrajectory: async () => {
    return requestJson(`${API_URL}/assessments/trajectory`, {
      headers: getHeaders()
    });
  },

  // Assistant
  askAssistant: async (message) => {
    return requestJson(`${API_URL}/assistant/ask`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
  },

  // Admin Dashboard CRUD
  adminGetAnalytics: async () => {
    return requestJson(`${API_URL}/admin/analytics`, {
      headers: getHeaders()
    });
  },

  adminGetDashboardSummary: async () => {
    return requestJson(`${API_URL}/admin/dashboard-summary`, {
      headers: getHeaders()
    });
  },

  adminGetUsers: async () => {
    return requestJson(`${API_URL}/admin/users-progress`, {
      headers: getHeaders()
    });
  },

  adminGetAuditLogs: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return requestJson(`${API_URL}/admin/audit-logs${qs}`, {
      headers: getHeaders()
    });
  },

  // Laws CRUD
  adminCreateLaw: async (data) => {
    return requestJson(`${API_URL}/admin/laws`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminUpdateLaw: async (id, data) => {
    return requestJson(`${API_URL}/admin/laws/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminDeleteLaw: async (id) => {
    return requestJson(`${API_URL}/admin/laws/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  // Crimes CRUD
  adminCreateCrime: async (data) => {
    return requestJson(`${API_URL}/admin/crimes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminUpdateCrime: async (id, data) => {
    return requestJson(`${API_URL}/admin/crimes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminDeleteCrime: async (id) => {
    return requestJson(`${API_URL}/admin/crimes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  // Cases CRUD
  adminCreateCase: async (data) => {
    return requestJson(`${API_URL}/admin/cases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminUpdateCase: async (id, data) => {
    return requestJson(`${API_URL}/admin/cases/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminDeleteCase: async (id) => {
    return requestJson(`${API_URL}/admin/cases/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  // Quizzes & Questions Administration
  adminGetQuizzes: async () => {
    return requestJson(`${API_URL}/admin/quizzes`, {
      headers: getHeaders()
    });
  },
  adminGetQuiz: async (id) => {
    return requestJson(`${API_URL}/admin/quizzes/${id}`, {
      headers: getHeaders()
    });
  },
  adminCreateQuiz: async (data) => {
    return requestJson(`${API_URL}/admin/quizzes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminUpdateQuiz: async (id, data) => {
    return requestJson(`${API_URL}/admin/quizzes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminDeleteQuiz: async (id) => {
    return requestJson(`${API_URL}/admin/quizzes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },
  adminCreateQuizQuestion: async (quizId, data) => {
    return requestJson(`${API_URL}/admin/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminUpdateQuizQuestion: async (quizId, questionId, data) => {
    return requestJson(`${API_URL}/admin/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminDeleteQuizQuestion: async (quizId, questionId) => {
    return requestJson(`${API_URL}/admin/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  // Scenarios Inspection & Integrity Audit
  adminGetScenarios: async () => {
    return requestJson(`${API_URL}/admin/scenarios`, {
      headers: getHeaders()
    });
  },
  adminGetScenario: async (id) => {
    return requestJson(`${API_URL}/admin/scenarios/${id}`, {
      headers: getHeaders()
    });
  },
  adminAuditScenario: async (id) => {
    return requestJson(`${API_URL}/admin/scenarios/${id}/audit`, {
      headers: getHeaders()
    });
  },

  // Resources CRUD
  adminCreateResource: async (data) => {
    return requestJson(`${API_URL}/admin/resources`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminUpdateResource: async (id, data) => {
    return requestJson(`${API_URL}/admin/resources/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminDeleteResource: async (id) => {
    return requestJson(`${API_URL}/admin/resources/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  // Admin Learning Modules
  adminGetModules: async () => {
    return requestJson(`${API_URL}/modules/admin/all`, {
      headers: getHeaders()
    });
  },
  adminCreateModule: async (data) => {
    return requestJson(`${API_URL}/modules/admin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminUpdateModule: async (id, data) => {
    return requestJson(`${API_URL}/modules/admin/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },
  adminDeleteModule: async (id) => {
    return requestJson(`${API_URL}/modules/admin/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  // Operational & Health Methods
  checkHealth: async (options = {}) => {
    try {
      return await requestJson(`${API_URL}/health`, {
        headers: getHeaders(),
        ...options
      });
    } catch (err) {
      return {
        status: 'error',
        error: err.message,
        isTimeout: Boolean(err.isTimeout),
        isNetwork: Boolean(err.isNetwork)
      };
    }
  },

  // State & Notification Helpers
  subscribeColdStart,
  setServerAwake,
  getServerAwakeStatus,
  isStagingEnvironment,
  getEffectiveTimeoutMs,
  getColdStartMessage,
  setNoticeDelayMsForTesting
};

export {
  API_URL,
  resolveApiUrl,
  fetchWithTimeout,
  handleResponse,
  requestJson,
  subscribeColdStart,
  isStagingEnvironment,
  getColdStartMessage,
  getEffectiveTimeoutMs,
  setServerAwake,
  getServerAwakeStatus,
  DEFAULT_TIMEOUT_MS,
  COLD_START_TIMEOUT_MS,
  NOTICE_DELAY_MS,
  INACTIVITY_RESET_MS,
  setNoticeDelayMsForTesting
};
export default api;
