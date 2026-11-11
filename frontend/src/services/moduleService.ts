import { api } from './api';
import type { ModuleCatalogResponse, ModuleToggleResponse } from '../types';

export const moduleService = {
  async getModules(): Promise<ModuleCatalogResponse> {
    return api.get<ModuleCatalogResponse>('/modules');
  },

  async toggleModule(slug: string, enabled?: boolean): Promise<ModuleToggleResponse> {
    return api.post<ModuleToggleResponse>(`/modules/${slug}/toggle`, { enabled });
  }
};
