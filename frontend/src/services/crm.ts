import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { APIResponse } from '../types/api';
import {
  Account, AccountCreateInput, AccountUpdateInput,
  Contact, ContactCreateInput, ContactUpdateInput,
  Lead, LeadCreateInput, LeadUpdateInput, LeadConvertInput,
  Tag, DuplicateWarning
} from '../types/crm';

// Helpers to build query string
function buildQueryString(params: Record<string, any>): string {
  const query = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `?${query}` : '';
}

export const crmService = {
  // ============================================
  // TAGS SERVICE
  // ============================================
  getTags: async (): Promise<APIResponse<Tag[]>> => {
    return apiGet<Tag[]>('/tags');
  },

  createTag: async (name: string, color?: string): Promise<APIResponse<Tag>> => {
    return apiPost<Tag>('/tags', { name, color });
  },

  // ============================================
  // ACCOUNTS SERVICE
  // ============================================
  getAccounts: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    industry?: string;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<APIResponse<Account[]>> => {
    const qs = buildQueryString(params);
    return apiGet<Account[]>(`/accounts${qs}`);
  },

  getAccount: async (id: string): Promise<APIResponse<Account>> => {
    return apiGet<Account>(`/accounts/${id}`);
  },

  createAccount: async (input: AccountCreateInput): Promise<APIResponse<Account>> => {
    return apiPost<Account>('/accounts', input);
  },

  updateAccount: async (id: string, input: AccountUpdateInput): Promise<APIResponse<Account>> => {
    return apiPut<Account>(`/accounts/${id}`, input);
  },

  deleteAccount: async (id: string): Promise<APIResponse<null>> => {
    return apiDelete<null>(`/accounts/${id}`);
  },

  // ============================================
  // CONTACTS SERVICE
  // ============================================
  getContacts: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    account_id?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<APIResponse<Contact[]>> => {
    const qs = buildQueryString(params);
    return apiGet<Contact[]>(`/contacts${qs}`);
  },

  getContact: async (id: string): Promise<APIResponse<Contact>> => {
    return apiGet<Contact>(`/contacts/${id}`);
  },

  createContact: async (input: ContactCreateInput): Promise<APIResponse<Contact>> => {
    return apiPost<Contact>('/contacts', input);
  },

  updateContact: async (id: string, input: ContactUpdateInput): Promise<APIResponse<Contact>> => {
    return apiPut<Contact>(`/contacts/${id}`, input);
  },

  deleteContact: async (id: string): Promise<APIResponse<null>> => {
    return apiDelete<null>(`/contacts/${id}`);
  },

  checkContactDuplicates: async (email?: string, phone?: string, excludeId?: string): Promise<APIResponse<DuplicateWarning[]>> => {
    const qs = buildQueryString({ email, phone, exclude_id: excludeId });
    return apiGet<DuplicateWarning[]>(`/contacts/check-duplicates${qs}`);
  },

  // ============================================
  // LEADS SERVICE
  // ============================================
  getLeads: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    source?: string;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<APIResponse<Lead[]>> => {
    const qs = buildQueryString(params);
    return apiGet<Lead[]>(`/leads${qs}`);
  },

  getLead: async (id: string): Promise<APIResponse<Lead>> => {
    return apiGet<Lead>(`/leads/${id}`);
  },

  createLead: async (input: LeadCreateInput): Promise<APIResponse<Lead>> => {
    return apiPost<Lead>('/leads', input);
  },

  updateLead: async (id: string, input: LeadUpdateInput): Promise<APIResponse<Lead>> => {
    return apiPut<Lead>(`/leads/${id}`, input);
  },

  deleteLead: async (id: string): Promise<APIResponse<null>> => {
    return apiDelete<null>(`/leads/${id}`);
  },

  checkLeadDuplicates: async (email?: string, phone?: string, excludeId?: string): Promise<APIResponse<DuplicateWarning[]>> => {
    const qs = buildQueryString({ email, phone, exclude_id: excludeId });
    return apiGet<DuplicateWarning[]>(`/leads/check-duplicates${qs}`);
  },

  convertLead: async (id: string, input: LeadConvertInput): Promise<APIResponse<Lead>> => {
    return apiPost<Lead>(`/leads/${id}/convert`, input);
  }
};
