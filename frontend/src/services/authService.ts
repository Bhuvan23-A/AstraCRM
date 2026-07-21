import { apiClient } from './api'
import type { AuthUser } from '../stores/authStore'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  full_name: string
  password: string
  phone?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

// Auth endpoints — backend returns plain JSON not wrapped in APIResponse
// so we call fetch directly for these
const AUTH_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api/v1'

async function authFetch<T>(endpoint: string, body: unknown): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${AUTH_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

async function authGet<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${AUTH_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

async function authPut<T>(endpoint: string, body: unknown): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${AUTH_BASE}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

async function authDelete(endpoint: string): Promise<void> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${AUTH_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
}

export const authService = {
  login: (data: LoginPayload) =>
    authFetch<TokenResponse>('/auth/login', data),

  register: (data: RegisterPayload) =>
    authFetch<AuthUser>('/auth/register', data),

  me: () => authGet<AuthUser>('/auth/me'),

  updateMe: (data: Partial<Pick<AuthUser, 'full_name' | 'phone' | 'bio' | 'avatar_url'>>) =>
    authPut<AuthUser>('/auth/me', data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    authFetch<{ message: string }>('/auth/change-password', data),
}

export const usersService = {
  list: (params?: { skip?: number; limit?: number; role?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.skip !== undefined) qs.set('skip', String(params.skip))
    if (params?.limit !== undefined) qs.set('limit', String(params.limit))
    if (params?.role) qs.set('role', params.role)
    if (params?.search) qs.set('search', params.search)
    return authGet<{ data: AuthUser[]; total: number }>(`/users?${qs}`)
  },

  create: (data: RegisterPayload & { role?: string }) =>
    authFetch<AuthUser>('/users', data),

  get: (id: string) => authGet<AuthUser>(`/users/${id}`),

  update: (id: string, data: Partial<AuthUser & { is_active: boolean }>) =>
    authPut<AuthUser>(`/users/${id}`, data),

  delete: (id: string) => authDelete(`/users/${id}`),
}