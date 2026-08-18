const API_URL = 'http://localhost:5000/api';

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

// Helper to handle responses
async function handleResponse(response) {
  if (!response.ok) {
    let errMsg = 'Something went wrong';
    try {
      const data = await response.json();
      errMsg = data.error?.message || data.message || errMsg;
    } catch (e) {
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

  getResources: async () => {
    const res = await fetch(`${API_URL}/crimes/resources`, {
      headers: getHeaders()
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

  submitQuiz: async (quizId, score) => {
    const res = await fetch(`${API_URL}/quizzes/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ quizId, score })
    });
    return handleResponse(res);
  },

  // Simulation / Assessments (Backend-Authoritative)
  getScenario: async (code) => {
    const res = await fetch(`${API_URL}/assessments/${code}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  startAssessment: async (scenarioCode) => {
    const res = await fetch(`${API_URL}/assessments/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ scenarioCode })
    });
    return handleResponse(res);
  },

  submitAssessmentStep: async (assessmentSessionId, stageId, decisionId) => {
    const res = await fetch(`${API_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assessmentSessionId, stageId, decisionId })
    });
    return handleResponse(res);
  },

  // Progress Dashboard
  getProgress: async () => {
    const res = await fetch(`${API_URL}/progress`, {
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

  adminGetUsers: async () => {
    const res = await fetch(`${API_URL}/admin/users-progress`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  adminGetAuditLogs: async () => {
    const res = await fetch(`${API_URL}/admin/audit-logs`, {
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

  // Quizzes CRUD
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
  }
};

export default api;
