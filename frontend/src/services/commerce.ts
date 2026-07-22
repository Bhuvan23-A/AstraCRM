import { apiClient } from './api';
import { 
  Product, Quotation, Order, 
  QuotationCreatePayload, QuotationUpdate, 
  OrderCreatePayload, OrderUpdate 
} from '../types/commerce';

export const commerceService = {
  // ── PRODUCTS ──
  getProducts: async (search?: string, activeOnly: boolean = false) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (activeOnly) params.append('active_only', 'true');
    const res = await apiClient.get<Product[]>(`/commerce/products?${params.toString()}`);
    return res.data;
  },

  createProduct: async (data: any) => {
    const res = await apiClient.post<Product>('/commerce/products', data);
    return res.data;
  },

  // ── QUOTATIONS ──
  getQuotations: async (status?: string, accountId?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (accountId) params.append('account_id', accountId);
    const res = await apiClient.get<Quotation[]>(`/commerce/quotations?${params.toString()}`);
    return res.data;
  },

  getQuotation: async (id: string) => {
    const res = await apiClient.get<Quotation>(`/commerce/quotations/${id}`);
    return res.data;
  },

  createQuotation: async (data: QuotationCreatePayload) => {
    const res = await apiClient.post<Quotation>('/commerce/quotations', data);
    return res.data;
  },

  updateQuotation: async (id: string, data: QuotationUpdate) => {
    const res = await apiClient.put<Quotation>(`/commerce/quotations/${id}`, data);
    return res.data;
  },

  deleteQuotation: async (id: string) => {
    const res = await apiClient.delete<null>(`/commerce/quotations/${id}`);
    return res.data;
  },

  approveQuotation: async (id: string, approved: boolean, notes?: string) => {
    const res = await apiClient.post<Quotation>(`/commerce/quotations/${id}/approve`, { approved, notes });
    return res.data;
  },

  convertQuotationToOrder: async (id: string) => {
    const res = await apiClient.post<Order>(`/commerce/quotations/${id}/convert`);
    return res.data;
  },

  // ── ORDERS ──
  getOrders: async (status?: string, paymentStatus?: string, accountId?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (paymentStatus) params.append('payment_status', paymentStatus);
    if (accountId) params.append('account_id', accountId);
    const res = await apiClient.get<Order[]>(`/commerce/orders?${params.toString()}`);
    return res.data;
  },

  getOrder: async (id: string) => {
    const res = await apiClient.get<Order>(`/commerce/orders/${id}`);
    return res.data;
  },

  createOrder: async (data: OrderCreatePayload) => {
    const res = await apiClient.post<Order>('/commerce/orders', data);
    return res.data;
  },

  updateOrder: async (id: string, data: OrderUpdate) => {
    const res = await apiClient.put<Order>(`/commerce/orders/${id}`, data);
    return res.data;
  },

  // ── PRINT LINKS ──
  getPrintQuotationUrl: (id: string) => {
    const token = localStorage.getItem('token') || '';
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${apiBase}/commerce/quotations/${id}/print?token=${token}`;
  },

  getPrintOrderUrl: (id: string) => {
    const token = localStorage.getItem('token') || '';
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${apiBase}/commerce/orders/${id}/print?token=${token}`;
  }
};
