const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5000/api';

// Helper to get headers
function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Timeout fetch wrapper (default 10s) to prevent hanging requests
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
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

// Helper to handle responses
async function handleResponse(response) {
  if (!response.ok) {
    let errMsg = 'Something went wrong';
    try {
      const data = await response.json();
      errMsg = data.error?.message || data.message || errMsg;
    } catch (_e) {
      // JSON parse failed
    }
    throw new Error(errMsg);
  }
  return response.json();
}

const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    localStorage.setItem('token', data.token);
    return data;
  },

  register: async (email, password, fullName) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, fullName })
    });
    const data = await handleResponse(res);
    localStorage.setItem('token', data.token);
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
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
    const res = await fetch(`${API_URL}/laws`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  searchLaws: async (query) => {
    const res = await fetch(`${API_URL}/laws/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getLaw: async (id) => {
    const res = await fetch(`${API_URL}/laws/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCrimes: async () => {
    const res = await fetch(`${API_URL}/crimes/crimes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  searchCrimes: async (query) => {
    const res = await fetch(`${API_URL}/crimes/crimes/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCrimeRecommendations: async () => {
    const res = await fetch(`${API_URL}/crimes/crimes/recommendations`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCrimeBySlug: async (slug) => {
    const res = await fetch(`${API_URL}/crimes/crimes/slug/${slug}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCrime: async (id) => {
    const res = await fetch(`${API_URL}/crimes/crimes/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCases: async () => {
    const res = await fetch(`${API_URL}/crimes/cases`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCase: async (id) => {
    const res = await fetch(`${API_URL}/crimes/cases/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCaseBySlug: async (slug) => {
    const res = await fetch(`${API_URL}/crimes/cases/slug/${slug}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  searchCases: async (query) => {
    const res = await fetch(`${API_URL}/crimes/cases/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getResources: async () => {
    const res = await fetch(`${API_URL}/crimes/resources`, {
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
    const res = await fetch(`${API_URL}/modules${queryString}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getModuleBySlug: async (slug) => {
    const res = await fetch(`${API_URL}/modules/${slug}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  recordModuleProgress: async (slug, data = { completed: true }) => {
    const res = await fetch(`${API_URL}/modules/${slug}/progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Quizzes
  getQuizzes: async () => {
    const res = await fetch(`${API_URL}/quizzes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getQuizModes: async () => {
    const res = await fetch(`${API_URL}/quizzes/modes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getQuizTopics: async () => {
    const res = await fetch(`${API_URL}/quizzes/topics`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getQuizHistory: async () => {
    const res = await fetch(`${API_URL}/quizzes/history`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getDueQuizRecalls: async () => {
    const res = await fetch(`${API_URL}/quizzes/recall/due`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitQuizRecall: async (questionId, answer) => {
    const res = await fetch(`${API_URL}/quizzes/recall/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ questionId, answer })
    });
    return handleResponse(res);
  },

  startQuizSession: async (payload = {}) => {
    const res = await fetch(`${API_URL}/quizzes/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  getQuizQuestions: async (quizId) => {
    const res = await fetch(`${API_URL}/quizzes/${quizId}/questions`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitQuiz: async (quizIdOrPayload, maybeAnswers) => {
    const body = (quizIdOrPayload && typeof quizIdOrPayload === 'object' && quizIdOrPayload.answers)
      ? quizIdOrPayload
      : { quizId: quizIdOrPayload, answers: maybeAnswers };
    const res = await fetch(`${API_URL}/quizzes/submit`, {
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

  submitAssessmentStep: async (assessmentSessionId, stageId, decisionId) => {
    const res = await fetchWithTimeout(`${API_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assessmentSessionId, stageId, decisionId })
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
    const res = await fetch(`${API_URL}/progress/pathways/step`, {
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
    const res = await fetch(`${API_URL}/progress/pathways/${pathwayId}/checkpoint?sourceSessionId=${sourceSessionId}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getPathwayCheckpointReview: async (pathwayId, sourceSessionId) => {
    const res = await fetch(`${API_URL}/progress/pathways/${pathwayId}/review?sourceSessionId=${sourceSessionId}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitPathwayCheckpoint: async (pathwayId, sourceSessionId, answers) => {
    const res = await fetch(`${API_URL}/progress/pathways/checkpoint`, {
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
    const res = await fetch(`${API_URL}/progress/pathways/reinforce`, {
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
    const res = await fetch(`${API_URL}/progress/pathways/spaced-retrieval/due`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getSpacedRetrievalQuestions: async (pathwayId, sourceSessionId = '') => {
    const url = sourceSessionId
      ? `${API_URL}/progress/pathways/${pathwayId}/spaced-retrieval?sourceSessionId=${sourceSessionId}`
      : `${API_URL}/progress/pathways/${pathwayId}/spaced-retrieval`;
    const res = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitSpacedRetrieval: async (pathwayId, sourceSessionId, answers) => {
    const res = await fetch(`${API_URL}/progress/pathways/${pathwayId}/spaced-retrieval`, {
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
    const res = await fetch(`${API_URL}/progress/portfolio`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getTrajectory: async () => {
    const res = await fetch(`${API_URL}/assessments/trajectory`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Assistant
  askAssistant: async (message) => {
    const res = await fetch(`${API_URL}/assistant/ask`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
    return handleResponse(res);
  },

  // Admin Dashboard CRUD
  adminGetAnalytics: async () => {
    const res = await fetch(`${API_URL}/admin/analytics`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  adminGetDashboardSummary: async () => {
    const res = await fetch(`${API_URL}/admin/dashboard-summary`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  adminGetUsers: async () => {
    const res = await fetch(`${API_URL}/admin/users-progress`, {
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
    const res = await fetch(`${API_URL}/admin/audit-logs${qs}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Laws CRUD
  adminCreateLaw: async (data) => {
    const res = await fetch(`${API_URL}/admin/laws`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateLaw: async (id, data) => {
    const res = await fetch(`${API_URL}/admin/laws/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteLaw: async (id) => {
    const res = await fetch(`${API_URL}/admin/laws/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Crimes CRUD
  adminCreateCrime: async (data) => {
    const res = await fetch(`${API_URL}/admin/crimes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateCrime: async (id, data) => {
    const res = await fetch(`${API_URL}/admin/crimes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteCrime: async (id) => {
    const res = await fetch(`${API_URL}/admin/crimes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Cases CRUD
  adminCreateCase: async (data) => {
    const res = await fetch(`${API_URL}/admin/cases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateCase: async (id, data) => {
    const res = await fetch(`${API_URL}/admin/cases/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteCase: async (id) => {
    const res = await fetch(`${API_URL}/admin/cases/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Quizzes & Questions Administration
  adminGetQuizzes: async () => {
    const res = await fetch(`${API_URL}/admin/quizzes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminGetQuiz: async (id) => {
    const res = await fetch(`${API_URL}/admin/quizzes/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminCreateQuiz: async (data) => {
    const res = await fetch(`${API_URL}/admin/quizzes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateQuiz: async (id, data) => {
    const res = await fetch(`${API_URL}/admin/quizzes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteQuiz: async (id) => {
    const res = await fetch(`${API_URL}/admin/quizzes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminCreateQuizQuestion: async (quizId, data) => {
    const res = await fetch(`${API_URL}/admin/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateQuizQuestion: async (quizId, questionId, data) => {
    const res = await fetch(`${API_URL}/admin/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteQuizQuestion: async (quizId, questionId) => {
    const res = await fetch(`${API_URL}/admin/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Scenarios Inspection & Integrity Audit
  adminGetScenarios: async () => {
    const res = await fetch(`${API_URL}/admin/scenarios`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminGetScenario: async (id) => {
    const res = await fetch(`${API_URL}/admin/scenarios/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminAuditScenario: async (id) => {
    const res = await fetch(`${API_URL}/admin/scenarios/${id}/audit`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Resources CRUD
  adminCreateResource: async (data) => {
    const res = await fetch(`${API_URL}/admin/resources`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateResource: async (id, data) => {
    const res = await fetch(`${API_URL}/admin/resources/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteResource: async (id) => {
    const res = await fetch(`${API_URL}/admin/resources/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Admin Learning Modules
  adminGetModules: async () => {
    const res = await fetch(`${API_URL}/modules/admin/all`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  adminCreateModule: async (data) => {
    const res = await fetch(`${API_URL}/modules/admin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateModule: async (id, data) => {
    const res = await fetch(`${API_URL}/modules/admin/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteModule: async (id) => {
    const res = await fetch(`${API_URL}/modules/admin/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};

export default api;
