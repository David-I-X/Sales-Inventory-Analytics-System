import { tokenManager } from './tokenManager';

export const API_BASE = '/api/v1';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = new Headers(options.headers);
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenManager.getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(url, fetchOptions);

  if (response.status === 401) {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      tokenManager.clearTokens();
      window.location.href = '/login';
      throw new Error('No refresh token available');
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Refresh failed');
        }

        const data = await refreshResponse.json();
        tokenManager.setAccessToken(data.access_token);
        if (data.refresh_token) {
            tokenManager.setRefreshToken(data.refresh_token);
        }
        
        isRefreshing = false;
        onRefreshed(data.access_token);
      } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        tokenManager.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    // Wait for refresh to complete
    return new Promise((resolve) => {
      addRefreshSubscriber(async (newToken: string) => {
        const newHeaders = new Headers(options.headers);
        if (!newHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
          newHeaders.set('Content-Type', 'application/json');
        }
        newHeaders.set('Authorization', `Bearer ${newToken}`);
        
        const retryOptions = { ...options, headers: newHeaders };
        const retryResponse = await fetch(url, retryOptions);
        
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `API Error: ${retryResponse.statusText}`);
        }
        resolve(retryResponse.json());
      });
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API Error: ${response.statusText}`);
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, data?: unknown) => 
    apiFetch<T>(endpoint, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  patch: <T>(endpoint: string, data?: unknown) => 
    apiFetch<T>(endpoint, { 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  delete: <T>(endpoint: string) => 
    apiFetch<T>(endpoint, { method: 'DELETE' }),
};
