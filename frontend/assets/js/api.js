const api = {
  async request(method, endpoint, body = null, customHeaders = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(`${window.API_BASE}${endpoint}`, options);

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      return null;
    }

    if (response.status === 403) {
      alert('You do not have permission to perform this action.');
      return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.message || 'Request failed.';
      throw new Error(message);
    }

    return data;
  },

  get(endpoint) {
    return this.request('GET', endpoint);
  },

  post(endpoint, body) {
    return this.request('POST', endpoint, body);
  },

  put(endpoint, body) {
    return this.request('PUT', endpoint, body);
  },

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  },
};
