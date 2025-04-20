// src/types/api.d.ts

// 基础 API 响应结构
interface PageResponse<T> {
  currentPage: number
  pageSize: number
  total: number
  data: T[]
}

interface ApiResponse<T> {
  total: number
  code: number
  message: string
  data: T
}
