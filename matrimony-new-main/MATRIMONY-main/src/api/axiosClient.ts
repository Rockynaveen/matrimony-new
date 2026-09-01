// Lightweight, type-safe Axios API client adapter
import { useAuthStore } from '../store/useAuthStore';

interface AxiosRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

interface AxiosResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

class AxiosClient {
  private baseURL: string;
  private isRefreshing = false;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token') || useAuthStore.getState().accessToken;
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    return headers;
  }

  private async parseResponseBody(response: Response): Promise<any> {
    const text = await response.text().catch(() => '');
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      if (response.status === 404) {
        return { message: 'API endpoint not found (404)' };
      }
      return { message: text.replace(/<[^>]*>?/gm, '').trim().substring(0, 200) || 'Server returned non-JSON response' };
    }
  }

  private workingRefreshEndpoint: string | null = null;
  private workingRefreshKey: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  private async tryRefreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token') || useAuthStore.getState().refreshToken;
    if (!refreshToken) return null;

    // Single-flight queue: If a refresh operation is already in flight, await its result!
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // 1. Try previously discovered & working refresh endpoint if available
        if (this.workingRefreshEndpoint && this.workingRefreshKey) {
          try {
            const response = await fetch(`${this.baseURL}${this.workingRefreshEndpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [this.workingRefreshKey]: refreshToken })
            });
            if (response.ok) {
              const data = await response.json();
              const newAccess = data.access || data.access_token || data.data?.access_token || data.token;
              const newRefresh = data.refresh || data.refresh_token || data.data?.refresh_token;
              if (newAccess) {
                localStorage.setItem('access_token', newAccess);
                if (newRefresh) {
                  localStorage.setItem('refresh_token', newRefresh);
                }
                useAuthStore.getState().setTokens(newAccess, newRefresh || refreshToken);
                console.log('[AxiosClient] JWT token refreshed successfully via cached endpoint');
                return newAccess;
              }
            }
          } catch {}
        }

        // 2. Discover working refresh endpoint
        const refreshEndpoints = [
          '/token/refresh',
          '/token/refresh/',
          '/token/pair/refresh',
          '/token/pair/refresh/',
          '/auth/token/refresh',
          '/auth/token/refresh/',
          '/auth/token/pair/refresh',
          '/auth/token/pair/refresh/',
          '/refresh',
          '/refresh/'
        ];

        const payloadKeys = ['refresh', 'refresh_token', 'token'];

        for (const endpoint of refreshEndpoints) {
          for (const key of payloadKeys) {
            try {
              const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: refreshToken })
              });

              if (response.ok) {
                const data = await response.json();
                const newAccess = data.access || data.access_token || data.data?.access_token || data.token;
                const newRefresh = data.refresh || data.refresh_token || data.data?.refresh_token;
                if (newAccess) {
                  this.workingRefreshEndpoint = endpoint;
                  this.workingRefreshKey = key;
                  localStorage.setItem('access_token', newAccess);
                  if (newRefresh) {
                    localStorage.setItem('refresh_token', newRefresh);
                  }
                  useAuthStore.getState().setTokens(newAccess, newRefresh || refreshToken);
                  console.log(`[AxiosClient] Discovered & synchronized JWT refresh endpoint: ${endpoint}`);
                  return newAccess;
                }
              }
            } catch {
              continue;
            }
          }
        }
      } catch (err) {
        console.warn('[AxiosClient] Refresh token error:', err);
      } finally {
        this.refreshPromise = null;
      }
      return null;
    })();

    return this.refreshPromise;
  }

  private async handleResponse<T>(
    fetchFn: () => Promise<Response>,
    isRetry = false
  ): Promise<AxiosResponse<T>> {
    const response = await fetchFn();
    const data = await this.parseResponseBody(response);
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

    if (response.status === 401 && !isRetry) {
      const isTokenInvalid =
        dataStr.includes('token_not_valid') ||
        dataStr.includes('invalid') ||
        dataStr.includes('expired') ||
        dataStr.includes('Authentication credentials') ||
        dataStr.includes('Unauthorized') ||
        dataStr.includes('detail') ||
        response.status === 401;

      if (isTokenInvalid) {
        console.log('[AxiosClient] 401 Unauthorized detected. Refreshing token...');
        const newAccessToken = await this.tryRefreshToken();
        if (newAccessToken) {
          console.log('[AxiosClient] Token refreshed. Retrying original request with new token...');
          return this.handleResponse(fetchFn, true);
        } else {
          console.warn('[AxiosClient] Token refresh failed. User session expired.');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          try {
            useAuthStore.getState().logout();
          } catch {}
        }
      }
    }

    let effectiveStatus = response.status;
    if (dataStr.includes('CSRF check Failed') || dataStr.includes('CSRF token missing')) {
      effectiveStatus = 403;
    }

    return { data, status: effectiveStatus, statusText: response.statusText };
  }

  private buildUrl(url: string, params?: Record<string, any>): string {
    const fullUrl = `${this.baseURL}${url}`;
    if (!params || Object.keys(params).length === 0) return fullUrl;
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        query.append(key, String(val));
      }
    }
    const queryString = query.toString();
    if (!queryString) return fullUrl;
    const sep = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${sep}${queryString}`;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const targetUrl = this.buildUrl(url, config?.params);
    return this.handleResponse(() =>
      fetch(targetUrl, {
        method: 'GET',
        headers: { ...this.getAuthHeaders(), ...(config?.headers || {}) }
      })
    );
  }

  async post<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (body instanceof FormData) {
      return this.postForm<T>(url, body, config);
    }
    const targetUrl = this.buildUrl(url, config?.params);
    return this.handleResponse(() =>
      fetch(targetUrl, {
        method: 'POST',
        headers: { ...this.getAuthHeaders(), ...(config?.headers || {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined
      })
    );
  }

  async patch<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const targetUrl = this.buildUrl(url, config?.params);
    return this.handleResponse(() =>
      fetch(targetUrl, {
        method: 'PATCH',
        headers: { ...this.getAuthHeaders(), ...(config?.headers || {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined
      })
    );
  }

  async put<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const targetUrl = this.buildUrl(url, config?.params);
    return this.handleResponse(() =>
      fetch(targetUrl, {
        method: 'PUT',
        headers: { ...this.getAuthHeaders(), ...(config?.headers || {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined
      })
    );
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const targetUrl = this.buildUrl(url, config?.params);
    return this.handleResponse(() =>
      fetch(targetUrl, {
        method: 'DELETE',
        headers: { ...this.getAuthHeaders(), ...(config?.headers || {}) }
      })
    );
  }

  async postForm<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const targetUrl = this.buildUrl(url, config?.params);
    return this.handleResponse(() => {
      const token = localStorage.getItem('access_token');
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = { ...(config?.headers || {}) };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      return fetch(targetUrl, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'same-origin'
      });
    });
  }
}

// In dev → '/api' (proxied by Vite)
// In production (Vercel) → direct Railway backend URL (Railway handles CORS natively)
const RAILWAY_API_URL = 'https://matrimony-production-4b00.up.railway.app/api';
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || RAILWAY_API_URL);

export const axiosClient = new AxiosClient(API_BASE_URL);
