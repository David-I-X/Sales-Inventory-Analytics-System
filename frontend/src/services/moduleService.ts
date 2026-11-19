import { api } from './api';
import type {
  ModuleCatalogResponse,
  ModuleToggleResponse,
  ModuleSettingsResponse,
  ModuleSettingValue,
} from '../types';

export const moduleService = {
  async getModules(): Promise<ModuleCatalogResponse> {
    return api.get<ModuleCatalogResponse>('/modules');
  },

  async toggleModule(slug: string, enabled?: boolean): Promise<ModuleToggleResponse> {
    return api.post<ModuleToggleResponse>(`/modules/${slug}/toggle`, { enabled });
  },

  async getModuleSettings(slug: string): Promise<ModuleSettingsResponse> {
    return api.get<ModuleSettingsResponse>(`/modules/${slug}/settings`);
  },

  async updateModuleSettings(
    slug: string,
    settings: Record<string, ModuleSettingValue>
  ): Promise<ModuleSettingsResponse> {
    return api.put<ModuleSettingsResponse>(`/modules/${slug}/settings`, { settings });
  },
};
