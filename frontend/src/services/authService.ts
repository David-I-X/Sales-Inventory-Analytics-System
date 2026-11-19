import { api } from './api';
import { tokenManager } from './tokenManager';
import type { User, TokenPair, CompanySignupPayload, CompanySignupResponse } from '../types';

export const authService = {
  async login(email: string, password: string, rememberMe = true): Promise<TokenPair> {
    const data = await api.post<TokenPair>('/auth/login', { email, password });
    tokenManager.setAccessToken(data.access_token);
    tokenManager.setRefreshToken(data.refresh_token, rememberMe);
    return data;
  },

  async signupCompany(
    payload: CompanySignupPayload,
    rememberMe = true
  ): Promise<CompanySignupResponse> {
    const data = await api.post<CompanySignupResponse>('/auth/signup-company', payload);
    tokenManager.setAccessToken(data.access_token);
    tokenManager.setRefreshToken(data.refresh_token, rememberMe);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed on server, clearing tokens locally anyway', e);
    } finally {
      tokenManager.clearTokens();
    }
  },

  async refreshTokens(): Promise<TokenPair> {
    const refresh_token = tokenManager.getRefreshToken();
    if (!refresh_token) {
      throw new Error('No refresh token available');
    }
    const remember = localStorage.getItem('sas_refresh_token') !== null;
    const data = await api.post<TokenPair>('/auth/refresh', { refresh_token });
    tokenManager.setAccessToken(data.access_token);
    tokenManager.setRefreshToken(data.refresh_token, remember);
    return data;
  },

  async getMe(): Promise<User> {
    return api.get<User>('/auth/me');
  },

  async registerAdmin(data: unknown): Promise<User> {
    return api.post<User>('/auth/register', data);
  },

  async createUser(data: unknown): Promise<User> {
    return api.post<User>('/auth/admin/users', data);
  },

  async listUsers(): Promise<User[]> {
    return api.get<User[]>('/auth/admin/users');
  }
};
