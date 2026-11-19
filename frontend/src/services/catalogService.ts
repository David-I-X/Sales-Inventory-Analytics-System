import { api } from './api';
import type { Product } from '../types';

export interface CatalogItemCreatePayload {
  sku?: string;
  name: string;
  description?: string;
  category?: string;
  item_type: 'product' | 'service';
  unit_measure: string;
  sale_price: number;
  cost_price?: number;
  current_stock?: number;
  min_stock?: number;
}

export const catalogService = {
  async getItems(itemType?: 'product' | 'service', search?: string): Promise<Product[]> {
    const params = new URLSearchParams();
    if (itemType) params.append('item_type', itemType);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get<Product[]>(`/catalog${qs}`);
  },

  async createItem(data: CatalogItemCreatePayload): Promise<Product> {
    return api.post<Product>('/catalog', data);
  },

  async updateItem(id: number, data: Partial<CatalogItemCreatePayload>): Promise<Product> {
    return api.patch<Product>(`/catalog/${id}`, data);
  },

  async deleteItem(id: number): Promise<void> {
    await api.delete(`/catalog/${id}`);
  },
};
