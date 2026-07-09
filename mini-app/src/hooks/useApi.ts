/**
 * apiFetch — fetch wrapper that automatically attaches the JWT Bearer token.
 *
 * Usage:
 *   import { apiFetch } from '../../hooks/useApi';
 *   const res = await apiFetch('/api/status');
 *   const data = await res.json();
 */

const TOKEN_KEY = 'token';
const LOGIN_URL = '/m/login.html';

/** Get the token from localStorage */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Store token after login */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Clear token (logout) */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Redirect to login page */
export function redirectToLogin(): void {
  window.location.href = LOGIN_URL;
}

/**
 * Enhanced fetch — adds Authorization: Bearer <token> header.
 * On 401 responses, automatically redirects to login.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };

  // Don't add auth header for the login endpoint itself
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!url.includes('/api/auth/login') && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(input, {
    ...init,
    headers,
  });

  // If unauthorized, clear token and redirect
  if (res.status === 401 && !url.includes('/api/auth/login')) {
    clearToken();
    redirectToLogin();
    // Throw to prevent further processing
    throw new Error('未授權，請重新登入');
  }

  return res;
}

/**
 * Check if user is authenticated. Redirects to login if no token.
 * Call this in AppRouter on mount.
 */
export function requireAuth(): boolean {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    return false;
  }
  return true;
}

export default apiFetch;
