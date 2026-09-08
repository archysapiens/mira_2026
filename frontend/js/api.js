const api = {
  async call(path, options = {}) {
    const token = localStorage.getItem("mira_token");

    const r = await fetch(`${MIRA_CONFIG.API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const data = await r.json();

    if (!r.ok) {
      throw new Error(data.error || "Error de comunicación");
    }

    return data;
  },

  login: (email, password) =>
    api.call("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  register: (data) =>
    api.call("/auth/register", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  createRequest: (data) =>
    api.call("/requests", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  requests: () => api.call("/requests"),

  dashboard: () => api.call("/dashboard"),

  notes: (id) => api.call(`/requests/${id}/notes`),

  addNote: (id, note) =>
    api.call(`/requests/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note })
    }),

  assign: (id, operatorId) =>
    api.call(`/requests/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ operatorId })
    }),

  claimRequests: () =>
    api.call("/requests/claim", {
      method: "POST"
    }),

  requestEmailVerification: (email) =>
    api.call("/auth/request-email-verification", {
      method: "POST",
      body: JSON.stringify({ email })
    }),

  verifyEmail: (email, code) =>
    api.call("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code })
    }),

  users: () => api.call("/users")
};


