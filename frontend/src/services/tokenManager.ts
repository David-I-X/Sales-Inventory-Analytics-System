let memoryAccessToken: string | null = null;
const REFRESH_TOKEN_KEY = 'sas_refresh_token';

export const tokenManager = {
  getAccessToken(): string | null {
    return memoryAccessToken;
  },

  setAccessToken(token: string): void {
    memoryAccessToken = token;
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  clearTokens(): void {
    memoryAccessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return memoryAccessToken !== null;
  }
};
