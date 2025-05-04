// src/api/request.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// 类型声明
declare module 'axios' {
  interface AxiosRequestConfig {
    noAuth?: boolean // 自定义属性用于标记不需要认证的请求
  }
}


let authStore: ReturnType<typeof useAuthStore>

export const initRequestInterceptor = () => {
  authStore = useAuthStore()
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 15000, // 延长超时时间
  withCredentials: true
})

// 智能内容类型处理
const getContentType = (data: unknown): string => {
  if (data instanceof FormData) return 'multipart/form-data'
  if (typeof data === 'object') return 'application/json'
  return 'application/x-www-form-urlencoded'
}

// 请求拦截器
instance.interceptors.request.use(config => {
  // 处理认证
  if (!config.noAuth && authStore?.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }

  // 智能设置 Content-Type
  if (!config.headers['Content-Type'] && config.data) {
    config.headers['Content-Type'] = getContentType(config.data)
  }

  // 处理 FormData 的边界问题
  if (config.data instanceof FormData && config.headers['Content-Type']) {
    delete config.headers['Content-Type'] // 让浏览器自动设置带 boundary 的 Content-Type
  }

  return config
})

// 响应拦截器
instance.interceptors.response.use(
  response => ({
    ...response,
    data: response.data // 保持数据结构但保留响应头等信息
  }),
  error => {
    const { response, config } = error

    // 统一错误处理
    const errorInfo = {
      code: response?.status || -1,
      message: response?.data?.message || error.message,
      url: config?.url,
      method: config?.method,
      data:response.data.data
    }

    console.error('API Error:', errorInfo)

    // 认证失效处理
    if (response?.status === 401 && !config.noAuth) {
      authStore?.logout()
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
    }

    return Promise.reject(errorInfo)
  }
)

export default instance
