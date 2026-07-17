const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://worker-registery-api.vercel.app/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let token = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('accessToken') || '';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Attempt token refresh on 401
  if (response.status === 401 && typeof window !== 'undefined') {
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (refreshRes.ok) {
        const json = await refreshRes.json();
        const newToken = json?.data?.accessToken || json?.accessToken;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          headers.Authorization = `Bearer ${newToken}`;
          // Retry original request
          response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
          });
        } else {
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
    } else {
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errData.error || errorMsg;
    } catch (e) {
      // Not JSON
    }
    throw new ApiError(response.status, errorMsg);
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

export const api = {
  get: (endpoint: string, options?: RequestInit) =>
    fetchWithAuth(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, data: any, options?: RequestInit) =>
    fetchWithAuth(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data: any, options?: RequestInit) =>
    fetchWithAuth(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string, options?: RequestInit) =>
    fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
};
