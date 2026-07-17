import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'wwb_access_token';
const REFRESH_TOKEN_KEY = 'wwb_refresh_token';

// Lazy-load SecureStore only on native — it crashes on web
const getSecureStore = () => {
  if (Platform.OS === 'web') return null;
  return require('expo-secure-store');
};

export async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(ACCESS_TOKEN_KEY); } catch { return null; }
  }
  return getSecureStore()?.getItemAsync(ACCESS_TOKEN_KEY) ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(REFRESH_TOKEN_KEY); } catch { return null; }
  }
  return getSecureStore()?.getItemAsync(REFRESH_TOKEN_KEY) ?? null;
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {}
    return;
  }
  const store = getSecureStore();
  await store?.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await store?.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {}
    return;
  }
  const store = getSecureStore();
  await store?.deleteItemAsync(ACCESS_TOKEN_KEY);
  await store?.deleteItemAsync(REFRESH_TOKEN_KEY);
}
