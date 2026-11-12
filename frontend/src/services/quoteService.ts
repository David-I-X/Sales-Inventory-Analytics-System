import { api } from './api';
import type { Quote, QuoteCreatePayload, QuoteUpdatePayload, ConvertToInvoiceResponse } from '../types';

export const quoteService = {
  async getQuotes(status?: string, search?: string): Promise<Quote[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Quote[]>(`/quotes${query}`);
  },

  async getQuote(id: number): Promise<Quote> {
    return api.get<Quote>(`/quotes/${id}`);
  },

  async createQuote(data: QuoteCreatePayload): Promise<Quote> {
    return api.post<Quote>('/quotes', data);
  },

  async updateQuote(id: number, data: QuoteUpdatePayload): Promise<Quote> {
    return api.put<Quote>(`/quotes/${id}`, data);
  },

  async updateQuoteStatus(id: number, status: string): Promise<Quote> {
    return api.patch<Quote>(`/quotes/${id}/status`, { status });
  },

  async convertToInvoice(id: number): Promise<ConvertToInvoiceResponse> {
    return api.post<ConvertToInvoiceResponse>(`/quotes/${id}/convert-to-invoice`, {});
  }
};
