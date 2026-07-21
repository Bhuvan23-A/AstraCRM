import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole =
  | 'SUPER_ADMIN' | 'ADMIN' | 'SALES_MANAGER'
  | 'SALES_EXECUTIVE' | 'MARKETING' | 'CUSTOMER_SUPPORT' | 'FINANCE'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  avatar_url?: string | null
  phone?: string | null
  bio?: string | null
  created_at: string
  updated_at: string
  last_login_at?: string | null
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        // also write to localStorage so existing apiClient interceptor picks it up
        localStorage.setItem('token', token)
        set({ token, user, isAuthenticated: true })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'sanna-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // sync token back to localStorage on page reload
        if (state?.token) {
          localStorage.setItem('token', state.token)
        }
      },
    }
  )
)