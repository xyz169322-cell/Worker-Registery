import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

// Change to your PC's local IP when testing on a physical device
// e.g. 'http://192.168.1.100:3001/api'
export const API_BASE = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL}/api`
  : 'https://worker-registery-api.vercel.app/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // Handle 401 — attempt token refresh
  if (response.status === 401) {
    const refresh = await getRefreshToken();
    if (refresh) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (refreshRes.ok) {
        const json = await refreshRes.json();
        const newAccess = json?.data?.accessToken || json?.accessToken;
        const newRefresh = json?.data?.refreshToken || json?.refreshToken;
        if (newAccess) {
          await setTokens(newAccess, newRefresh || refresh);
          headers.Authorization = `Bearer ${newAccess}`;
          response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        }
      } else {
        await clearTokens();
        throw new ApiError(401, 'Session expired. Please log in again.');
      }
    } else {
      throw new ApiError(401, 'Not authenticated');
    }
  }

  if (!response.ok) {
    let msg = 'An error occurred';
    try {
      const err = await response.json();
      msg = err.message || err.error || msg;
    } catch {}
    throw new ApiError(response.status, msg);
  }

  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

export const api = {
  get: (url: string) => apiFetch(url, { method: 'GET' }),
  post: (url: string, data: any) => apiFetch(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data: any) => apiFetch(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url: string) => apiFetch(url, { method: 'DELETE' }),
};
