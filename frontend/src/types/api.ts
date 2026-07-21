export interface APIResponse<T = unknown> {
  success: boolean
  data: T | null
  message: string
  meta: PaginationMeta | null
}

export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface QueryParams {
  page?: number
  per_page?: number
  sort?: string
  search?: string
  [key: string]: string | number | boolean | undefined
}
