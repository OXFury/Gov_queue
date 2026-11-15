const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('gov_queue_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return res.json();
  },

  // Services & Tokens
  getServiceTypes: async () => {
    const res = await fetch(`${API_BASE}/tokens/services`);
    return res.json();
  },

  generateToken: async (data) => {
    const res = await fetch(`${API_BASE}/tokens/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getTokenStatus: async (tokenNumber) => {
    const res = await fetch(`${API_BASE}/tokens/status/${tokenNumber}`);
    return res.json();
  },

  getPublicDashboard: async () => {
    const res = await fetch(`${API_BASE}/tokens/public-dashboard`);
    return res.json();
  },

  cancelToken: async (tokenNumber) => {
    const res = await fetch(`${API_BASE}/tokens/cancel/${tokenNumber}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  // Staff Counter Operations
  callNextToken: async (counterId) => {
    const res = await fetch(`${API_BASE}/counters/call-next/${counterId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  completeToken: async (tokenId) => {
    const res = await fetch(`${API_BASE}/counters/complete/${tokenId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  markNoShow: async (tokenId) => {
    const res = await fetch(`${API_BASE}/counters/no-show/${tokenId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  toggleCounterStatus: async (counterId, status) => {
    const res = await fetch(`${API_BASE}/counters/status/${counterId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Admin Operations
  getAdminAnalytics: async () => {
    const res = await fetch(`${API_BASE}/admin/analytics`, { headers: getHeaders() });
    return res.json();
  },

  getOptimizationReport: async () => {
    const res = await fetch(`${API_BASE}/admin/optimization-report`, { headers: getHeaders() });
    return res.json();
  },

  rebalanceCounters: async (counterId, serviceTypeId) => {
    const res = await fetch(`${API_BASE}/admin/rebalance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ counterId, serviceTypeId })
    });
    return res.json();
  },

  getAllCounters: async () => {
    const res = await fetch(`${API_BASE}/admin/counters`, { headers: getHeaders() });
    return res.json();
  },

  createCounter: async (counterData) => {
    const res = await fetch(`${API_BASE}/admin/counters`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(counterData)
    });
    return res.json();
  },

  deleteCounter: async (counterId) => {
    const res = await fetch(`${API_BASE}/admin/counters/${counterId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  }
};
