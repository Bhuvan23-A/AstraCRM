import { useState, useEffect, useCallback } from 'react';
import { crmService } from '../services/crm';
import { Account, Contact, Lead, Tag } from '../types/crm';
import { PaginationMeta } from '../types/api';
import { useToastStore } from '../stores/toastStore';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  meta: PaginationMeta | null;
  refetch: () => void;
}

export function useAccounts(params: {
  page?: number;
  per_page?: number;
  search?: string;
  industry?: string;
  sort_by?: string;
  sort_order?: string;
} = {}): FetchState<Account[]> {
  const [data, setData] = useState<Account[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await crmService.getAccounts(params);
      if (res.success && res.data) {
        setData(res.data);
        setMeta(res.meta);
      } else {
        throw new Error(res.message || 'Failed to fetch accounts');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { data, loading, error, meta, refetch: fetchAccounts };
}

export function useContacts(params: {
  page?: number;
  per_page?: number;
  search?: string;
  account_id?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
} = {}): FetchState<Contact[]> {
  const [data, setData] = useState<Contact[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await crmService.getContacts(params);
      if (res.success && res.data) {
        setData(res.data);
        setMeta(res.meta);
      } else {
        throw new Error(res.message || 'Failed to fetch contacts');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return { data, loading, error, meta, refetch: fetchContacts };
}

export function useLeads(params: {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  source?: string;
  sort_by?: string;
  sort_order?: string;
} = {}): FetchState<Lead[]> {
  const [data, setData] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await crmService.getLeads(params);
      if (res.success && res.data) {
        setData(res.data);
        setMeta(res.meta);
      } else {
        throw new Error(res.message || 'Failed to fetch leads');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { data, loading, error, meta, refetch: fetchLeads };
}

export function useTags(): {
  tags: Tag[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createTag: (name: string, color?: string) => Promise<Tag | null>;
} {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const addToast = useToastStore((state) => state.addToast);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await crmService.getTags();
      if (res.success && res.data) {
        setTags(res.data);
      } else {
        throw new Error(res.message || 'Failed to fetch tags');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTag = async (name: string, color?: string): Promise<Tag | null> => {
    try {
      const res = await crmService.createTag(name, color);
      if (res.success && res.data) {
        setTags((prev) => [...prev, res.data!]);
        addToast({
          type: 'success',
          title: 'Tag Created',
          message: `Tag "${name}" was created successfully.`
        });
        return res.data;
      } else {
        throw new Error(res.message || 'Failed to create tag');
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Tag Creation Failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
      return null;
    }
  };

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { tags, loading, error, refetch: fetchTags, createTag };
}
