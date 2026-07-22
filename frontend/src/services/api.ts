import { useToastStore } from '../stores/toastStore'
import { APIResponse } from '../types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

async function fetchWithInterceptor<T>(url: string, options: RequestInit): Promise<APIResponse<T>> {
  const token = localStorage.getItem('token')
  const headers = new Headers(options.headers)
  
  headers.set('Content-Type', 'application/json')
  if (token && token !== 'undefined' && token !== 'null') {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    let response = await fetch(`${BASE_URL}${url}`, { ...options, headers })

    if (response.status === 401) {
      // Basic mock of a retry logic for 401, you could integrate a refresh token endpoint here
      const newToken = localStorage.getItem('token')
      if (newToken && newToken !== token) {
        headers.set('Authorization', `Bearer ${newToken}`)
        response = await fetch(`${BASE_URL}${url}`, { ...options, headers })
      } else {
        useToastStore.getState().addToast({
          type: 'error',
          title: 'Session Expired',
          message: 'Please log in again.'
        })
        throw new Error('Unauthorized')
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `HTTP Error ${response.status}`)
    }

    const data: APIResponse<T> = await response.json()
    return data
  } catch (error) {
    useToastStore.getState().addToast({
      type: 'error',
      title: 'Request Failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
    throw error
  }
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) => fetchWithInterceptor<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: any, options?: RequestInit) => fetchWithInterceptor<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body?: any, options?: RequestInit) => fetchWithInterceptor<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body?: any, options?: RequestInit) => fetchWithInterceptor<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestInit) => fetchWithInterceptor<T>(url, { ...options, method: 'DELETE' }),
}

export const apiGet = apiClient.get
export const apiPost = apiClient.post
export const apiPut = apiClient.put
export const apiPatch = apiClient.patch
export const apiDelete = apiClient.delete
