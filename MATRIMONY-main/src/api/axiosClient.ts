// Lightweight, type-safe Axios API client adapter

interface AxiosRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

interface AxiosResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

class AxiosClient {
  private baseURL: string;
  private isRefreshing = false;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
  private lastRefreshAttemptTime = 0;

  private async tryRefreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken || this.isRefreshing) return null;

    // Cooldown: prevent spamming refresh requests if attempted within last 30 seconds
    const now = Date.now();
    if (now - this.lastRefreshAttemptTime < 30000) {
      return null;
    }

    try {
      this.isRefreshing = true;
      this.lastRefreshAttemptTime = now;

      // If we already discovered the working endpoint, try it first
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
            if (newAccess) {
              localStorage.setItem('access_token', newAccess);
              if (data.refresh || data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh || data.refresh_token);
              }
              return newAccess;
            }
          }
        } catch {}
      }

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
              if (newAccess) {
                this.workingRefreshEndpoint = endpoint;
                this.workingRefreshKey = key;
                localStorage.setItem('access_token', newAccess);
                if (data.refresh || data.refresh_token) {
                  localStorage.setItem('refresh_token', data.refresh || data.refresh_token);
                }
                console.log(`[AxiosClient] Discovered & cached JWT refresh endpoint: ${endpoint}`);
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
      this.isRefreshing = false;
    }
    return null;
  }

  private async handleResponse<T>(
    fetchFn: () => Promise<Response>,
    isRetry = false
  ): Promise<AxiosResponse<T>> {
    const response = await fetchFn();
    const data = await this.parseResponseBody(response);

    if (response.status === 401 && !isRetry) {
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      const isTokenInvalid =
        dataStr.includes('token_not_valid') ||
        dataStr.includes('invalid') ||
        dataStr.includes('expired') ||
        dataStr.includes('Authentication credentials') ||
        dataStr.includes('Unauthorized');

      if (isTokenInvalid) {
        const newAccessToken = await this.tryRefreshToken();
        if (newAccessToken) {
          return this.handleResponse(fetchFn, true);
        } else {
          console.warn('[AxiosClient] Token refresh failed. Preserving session if refresh token exists.');
        }
      }
    }

    return { data, status: response.status, statusText: response.statusText };
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.handleResponse(() =>
      fetch(`${this.baseURL}${url}`, {
        method: 'GET',
        headers: { ...this.getAuthHeaders(), ...(config?.headers || {}) }
      })
    );
  }

  async post<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.handleResponse(() =>
      fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: { ...this.getAuthHeaders(), ...(config?.headers || {}) },
        body: JSON.stringify(body)
      })
    );
  }

  async patch<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.handleResponse(() =>
      fetch(`${this.baseURL}${url}`, {
        method: 'PATCH',
        headers: { ...this.getAuthHeaders(), ...(config?.headers || {}) },
        body: JSON.stringify(body)
      })
    );
  }

  async put<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.handleResponse(() =>
      fetch(`${this.baseURL}${url}`, {
        method: 'PUT',
        headers: { ...this.getAuthHeaders(), ...(config?.headers || {}) },
        body: JSON.stringify(body)
      })
    );
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.handleResponse(() =>
      fetch(`${this.baseURL}${url}`, {
        method: 'DELETE',
        headers: { ...this.getAuthHeaders(), ...(config?.headers || {}) }
      })
    );
  }

  async postForm<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.handleResponse(() => {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = { ...(config?.headers || {}) };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers,
        body: formData
      });
    });
  }
}

// In dev → '/api' (Vite proxy handles CORS)
// In prod → full backend URL
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'https://matrimony-production-e116.up.railway.app/api');
export const axiosClient = new AxiosClient(API_BASE_URL);
