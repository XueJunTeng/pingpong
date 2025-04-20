import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/api/request'
import type { AxiosError, AxiosResponse } from 'axios'  // 明确导入类型

// 定义后端响应数据类型
interface ApiErrorResponse {
  message?: string
  // 其他可能的字段
  // code?: number
  // details?: Record<string, unknown>
}

export const useUploadStore = defineStore('upload', () => {
  const uploadProgress = ref(0)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  const uploadContent = async (
    formData: FormData,
    onProgress?: (progress: number) => void
  ) => {
    try {
      isSubmitting.value = true
      error.value = null

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('未授权，请登录')
      }

      const { data } = await axios.post<{ contentId: number }>(
        '/api/contents',
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              onProgress(progress)
            }
          }
        }
      )

      return data.contentId
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  const handleError = (err: unknown) => {
    // 处理Axios错误（带类型断言）
    if (isAxiosError(err)) {
      const response = err.response as AxiosResponse<ApiErrorResponse> | undefined
      error.value = response?.data?.message || err.message
    }
    // 处理标准Error
    else if (err instanceof Error) {
      error.value = err.message
    }
    // 处理未知类型
    else {
      error.value = '发生未知错误'
    }
  }

  // 类型守卫（使用官方推荐方式）
  const isAxiosError = (error: unknown): error is AxiosError => {
    return (error as AxiosError).isAxiosError === true
  }

  return { uploadProgress, isSubmitting, error, uploadContent }
})