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
    ? 'Waking up staging services... Initial request may take up to 45 seconds while Render spins up.'
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

async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const method = (options.method || 'GET').toUpperCase();
  const isSafeMethod = method === 'GET' || method === 'HEAD';
  const isStaging = isStagingEnvironment();
  const callerSignal = options.signal;

  // If caller signal is already aborted, fail immediately without starting request or retrying
  if (callerSignal && callerSignal.aborted) {
    const abortError = callerSignal.reason || new DOMException('The user aborted a request.', 'AbortError');
    throw abortError;
  }

  // Staging cold-start retry: ONLY for safe GET requests, max 1 retry with backoff.
  // POST/PUT/PATCH/DELETE are strictly 0 retries.
  const maxRetries = isSafeMethod ? (options.maxRetries ?? (isStaging && !getServerAwakeStatus() ? 1 : 0)) : 0;

  // Fix H-1: Track in-flight request lifecycle ONCE per logical request outside retry loop
  onCallStart(options);

  try {
    let attempt = 0;

    while (true) {
      attempt++;
      const effectiveTimeout = getEffectiveTimeoutMs(timeoutMs, isStaging);
      const timeoutController = new AbortController();
      const timerId = setTimeout(() => timeoutController.abort(), effectiveTimeout);
      const { signal: combinedSignal, cleanup: signalCleanup } = linkAbortSignals(timeoutController.signal, callerSignal);

      try {
        const response = await fetch(url, {
          ...options,
          signal: combinedSignal
        });

        // Fix H-2: Only mark server awake on successful or non-gateway error responses
        // 502 (proxy cannot reach container) and 503 (database disconnected) do NOT mark server awake
        const isProxyOrDegraded = response.status === 502 || response.status === 503 || response.status === 504;
        if (!isProxyOrDegraded) {
          setServerAwake(true);
        }

        // If safe GET received proxy 502/503 during cold-start boot, retry if attempts remain
        if (isSafeMethod && isProxyOrDegraded && attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        return response;
      } catch (err) {
        // Fix M-2: If caller aborted the request, propagate immediately without retrying
        if (callerSignal && callerSignal.aborted) {
          throw callerSignal.reason || err;
        }

        const isTimeout = timeoutController.signal.aborted;
        const isNetwork = !isTimeout;

        // Safe GET network retry if proxy dropped connection before container was listening
        if (isSafeMethod && attempt <= maxRetries && isNetwork) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        if (isTimeout) {
          const timeoutErr = new Error(
            isStaging
              ? `Request timed out after ${Math.round(effectiveTimeout / 1000)}s. The staging server may still be spinning up. Please try again.`
              : `Request timed out after ${Math.round(effectiveTimeout / 1000)}s. Please check your connection and try again.`
          );
          timeoutErr.name = 'TimeoutError';
          timeoutErr.isTimeout = true;
          timeoutErr.code = 'ERR_TIMEOUT';
          throw timeoutErr;
        }

        err.isNetwork = true;
        if (!err.code) err.code = 'ERR_NETWORK';
        throw err;
      } finally {
        clearTimeout(timerId);
        signalCleanup();
      }
    }
  } finally {
    // Fix H-1: Exactly one teardown per logical API request
    onCallEnd(options);
  }
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
    const res = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    localStorage.setItem('token', data.token);
    return data;
  },

  register: async (email, password, fullName) => {
    const res = await fetchWithTimeout(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, fullName })
    });
    const data = await handleResponse(res);
    localStorage.setItem('token', data.token);
    return data;
  },

  getMe: async () => {
    const res = await fetchWithTimeout(`${API_URL}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
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
    const res = await fetchWithTimeout(`${API_URL}/laws`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  searchLaws: async (query) => {
    const res = await fetchWithTimeout(`${API_URL}/laws/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getLaw: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/laws/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCrimes: async () => {
    const res = await fetchWithTimeout(`${API_URL}/crimes/crimes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  searchCrimes: async (query) => {
    const res = await fetchWithTimeout(`${API_URL}/crimes/crimes/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCrimeRecommendations: async () => {
    const res = await fetchWithTimeout(`${API_URL}/crimes/crimes/recommendations`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCrimeBySlug: async (slug) => {
    const res = await fetchWithTimeout(`${API_URL}/crimes/crimes/slug/${slug}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCrime: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/crimes/crimes/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCases: async () => {
    const res = await fetchWithTimeout(`${API_URL}/crimes/cases`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCase: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/crimes/cases/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCaseBySlug: async (slug) => {
    const res = await fetchWithTimeout(`${API_URL}/crimes/cases/slug/${slug}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  searchCases: async (query) => {
    const res = await fetchWithTimeout(`${API_URL}/crimes/cases/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getResources: async () => {
    const res = await fetchWithTimeout(`${API_URL}/crimes/resources`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Learning Modules & Lessons
  getModules: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.difficulty && params.difficulty !== 'All') query.append('difficulty', params.difficulty);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithTimeout(`${API_URL}/modules${queryString}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getModuleBySlug: async (slug) => {
    const res = await fetchWithTimeout(`${API_URL}/modules/${slug}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  recordModuleProgress: async (slug, data = { completed: true }) => {
    const res = await fetchWithTimeout(`${API_URL}/modules/${slug}/progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Quizzes
  getQuizzes: async () => {
    const res = await fetchWithTimeout(`${API_URL}/quizzes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getQuizModes: async () => {
    const res = await fetchWithTimeout(`${API_URL}/quizzes/modes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getQuizTopics: async () => {
    const res = await fetchWithTimeout(`${API_URL}/quizzes/topics`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getQuizHistory: async () => {
    const res = await fetchWithTimeout(`${API_URL}/quizzes/history`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getDueQuizRecalls: async () => {
    const res = await fetchWithTimeout(`${API_URL}/quizzes/recall/due`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitQuizRecall: async (questionId, answer) => {
    const res = await fetchWithTimeout(`${API_URL}/quizzes/recall/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ questionId, answer })
    });
    return handleResponse(res);
  },

  startQuizSession: async (payload = {}) => {
    const res = await fetchWithTimeout(`${API_URL}/quizzes/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  getQuizQuestions: async (quizId) => {
    const res = await fetchWithTimeout(`${API_URL}/quizzes/${quizId}/questions`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitQuiz: async (quizIdOrPayload, maybeAnswers) => {
    const body = (quizIdOrPayload && typeof quizIdOrPayload === 'object' && quizIdOrPayload.answers)
      ? quizIdOrPayload
      : { quizId: quizIdOrPayload, answers: maybeAnswers };
    const res = await fetchWithTimeout(`${API_URL}/quizzes/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  // Simulation / Assessments (Backend-Authoritative)
  getScenario: async (code) => {
    const res = await fetchWithTimeout(`${API_URL}/assessments/${code}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  startAssessment: async (scenarioCode) => {
    const res = await fetchWithTimeout(`${API_URL}/assessments/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ scenarioCode })
    });
    return handleResponse(res);
  },

  getAssessmentSession: async (sessionId) => {
    const res = await fetchWithTimeout(`${API_URL}/assessments/session/${sessionId}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getAssessmentStatus: async (scenarioCode) => {
    const res = await fetchWithTimeout(`${API_URL}/assessments/status/${scenarioCode}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
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
    const res = await fetchWithTimeout(`${API_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  getAssessmentRemediation: async (sessionId) => {
    const res = await fetchWithTimeout(`${API_URL}/assessments/remediation/${sessionId}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Progress Dashboard
  getProgress: async () => {
    const res = await fetchWithTimeout(`${API_URL}/progress`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Learning Pathway Progression (Phase 4)
  recordPathwayStep: async (pathwayId, sourceSessionId, step, extraData = {}) => {
    const res = await fetchWithTimeout(`${API_URL}/progress/pathways/step`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        pathwayId,
        sourceSessionId,
        step,
        ...extraData
      })
    });
    return handleResponse(res);
  },

  getPathwayCheckpoint: async (pathwayId, sourceSessionId) => {
    const res = await fetchWithTimeout(`${API_URL}/progress/pathways/${pathwayId}/checkpoint?sourceSessionId=${sourceSessionId}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getPathwayCheckpointReview: async (pathwayId, sourceSessionId) => {
    const res = await fetchWithTimeout(`${API_URL}/progress/pathways/${pathwayId}/review?sourceSessionId=${sourceSessionId}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitPathwayCheckpoint: async (pathwayId, sourceSessionId, answers) => {
    const res = await fetchWithTimeout(`${API_URL}/progress/pathways/checkpoint`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        pathwayId,
        sourceSessionId,
        answers
      })
    });
    return handleResponse(res);
  },

  // Phase 5A: Targeted Habit Reinforcement
  reinforcePathway: async (pathwayId, sourceSessionId, answers) => {
    const res = await fetchWithTimeout(`${API_URL}/progress/pathways/reinforce`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        pathwayId,
        sourceSessionId,
        answers
      })
    });
    return handleResponse(res);
  },

  // Spaced Retrieval & Follow-Up Learning
  getDueSpacedRetrievals: async () => {
    const res = await fetchWithTimeout(`${API_URL}/progress/pathways/spaced-retrieval/due`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getSpacedRetrievalQuestions: async (pathwayId, sourceSessionId = '') => {
    const url = sourceSessionId
      ? `${API_URL}/progress/pathways/${pathwayId}/spaced-retrieval?sourceSessionId=${sourceSessionId}`
      : `${API_URL}/progress/pathways/${pathwayId}/spaced-retrieval`;
    const res = await fetchWithTimeout(url, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitSpacedRetrieval: async (pathwayId, sourceSessionId, answers) => {
    const res = await fetchWithTimeout(`${API_URL}/progress/pathways/${pathwayId}/spaced-retrieval`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        sourceSessionId,
        answers
      })
    });
    return handleResponse(res);
  },

  // Phase 5B: Longitudinal Evidence & Three-Pillar Portfolio
  getPortfolio: async () => {
    const res = await fetchWithTimeout(`${API_URL}/progress/portfolio`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getTrajectory: async () => {
    const res = await fetchWithTimeout(`${API_URL}/assessments/trajectory`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Assistant
  askAssistant: async (message) => {
    const res = await fetchWithTimeout(`${API_URL}/assistant/ask`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
    return handleResponse(res);
  },

  // Admin Dashboard CRUD
  adminGetAnalytics: async () => {
    const res = await fetchWithTimeout(`${API_URL}/admin/analytics`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  adminGetDashboardSummary: async () => {
    const res = await fetchWithTimeout(`${API_URL}/admin/dashboard-summary`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  adminGetUsers: async () => {
    const res = await fetchWithTimeout(`${API_URL}/admin/users-progress`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  adminGetAuditLogs: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetchWithTimeout(`${API_URL}/admin/audit-logs${qs}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Laws CRUD
  adminCreateLaw: async (data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/laws`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateLaw: async (id, data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/laws/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteLaw: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/laws/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Crimes CRUD
  adminCreateCrime: async (data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/crimes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateCrime: async (id, data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/crimes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteCrime: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/crimes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Cases CRUD
  adminCreateCase: async (data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/cases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateCase: async (id, data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/cases/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteCase: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/cases/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Quizzes & Questions Administration
  adminGetQuizzes: async () => {
    const res = await fetchWithTimeout(`${API_URL}/admin/quizzes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminGetQuiz: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/quizzes/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminCreateQuiz: async (data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/quizzes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateQuiz: async (id, data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/quizzes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteQuiz: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/quizzes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminCreateQuizQuestion: async (quizId, data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateQuizQuestion: async (quizId, questionId, data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteQuizQuestion: async (quizId, questionId) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Scenarios Inspection & Integrity Audit
  adminGetScenarios: async () => {
    const res = await fetchWithTimeout(`${API_URL}/admin/scenarios`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminGetScenario: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/scenarios/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminAuditScenario: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/scenarios/${id}/audit`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Resources CRUD
  adminCreateResource: async (data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/resources`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateResource: async (id, data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/resources/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteResource: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/resources/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Admin Learning Modules
  adminGetModules: async () => {
    const res = await fetchWithTimeout(`${API_URL}/modules/admin/all`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminCreateModule: async (data) => {
    const res = await fetchWithTimeout(`${API_URL}/modules/admin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateModule: async (id, data) => {
    const res = await fetchWithTimeout(`${API_URL}/modules/admin/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteModule: async (id) => {
    const res = await fetchWithTimeout(`${API_URL}/modules/admin/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Operational & Health Methods
  checkHealth: async (options = {}) => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/health`, {
        headers: getHeaders(),
        ...options
      });
      return handleResponse(res);
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
