// API utility helper with credentials and centralized error handling

const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  // Check if browser is offline
  if (!navigator.onLine) {
    throw new Error('Device is offline. An active internet connection is required.');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Support token stored in localStorage for PWA standalone mode fallback
  const token = localStorage.getItem('chipstock_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: 'include', // Include HttpOnly cookies
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const contentType = res.headers.get('content-type');

    if (contentType && contentType.includes('text/csv')) {
      const blob = await res.blob();
      return blob;
    }

    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text && text.length < 150 ? text : `Request failed with status ${res.status}` };
    }

    if (!res.ok) {
      const error = new Error(data.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Network error. Unable to connect to server.');
    }
    throw err;
  }
}
