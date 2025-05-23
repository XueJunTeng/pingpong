// src/stores/auth.ts
import { defineStore } from 'pinia'
import request from '@/api/request'
import type { RegisterData, LoginData, AuthResponse, UserProfileUpdate } from '@/types/auth'
import { AxiosError } from 'axios';
interface UserInfo {
  userId: number
  username: string
  role: string
  avatar?: string
  email: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // 改为从 sessionStorage 初始化
    token: sessionStorage.getItem('token') || null,
    userInfo: JSON.parse(sessionStorage.getItem('userInfo') || 'null') as UserInfo | null
  }),

  actions: {
    async userlogout() {
      // 清除当前会话的存储
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('userInfo')

      // 清除内存中的 token
      this.token = null
      this.userInfo = null

      // 清除 Cookies（如果使用）
      document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;'

      console.log('当前窗口会话已注销')
    },

    // 注册操作（保持不变）
    async register(data: RegisterData) {
      console.debug('[Auth] 注册请求参数:', data)
      try {
        const response = await request.post<AuthResponse>('/api/auth/register', data)
        this.setAuthData(response.data)
        return true
      } catch (error) {
        console.error('[Auth] 注册失败详情:', error)
        throw this.handleAuthError(error, '注册')
      }
    },

    // 登录操作（保持不变）
    async login(data: LoginData) {
      console.debug('[Auth] 登录请求凭证:', data)
      try {
        const response = await request.post<AuthResponse>('/api/auth/login', data)
        this.setAuthData(response.data)
        return true
      } catch (error) {
        console.error('[Auth] 登录失败原因:', error)
        throw this.handleAuthError(error, '登录')
      }
    },

    // 新增：用户资料更新
    async updateProfile(updateData: UserProfileUpdate) {
      console.debug('[Auth] 用户资料更新请求:', updateData)
      try {
        const response = await request.post<AuthResponse>(
          '/api/auth/profile',updateData)
        // 合并更新数据并保留未修改字段
        this.setAuthData({
          ...this.userInfo,
          ...response.data
        })

        console.info('[Auth] 资料更新成功:', response.data)
        return response.data
      } catch (error) {
        console.error('[Auth] 资料更新失败:', error)
        throw this.handleAuthError(error, '资料更新')
      }
    },

    // 新增：密码修改（单独处理）
    async changePassword(oldPassword: string, newPassword: string) {
      console.debug('[Auth] 密码修改请求')
      try {
        await request.post('/api/auth/change-password',  { oldPassword, newPassword })

        // 敏感操作后强制重新认证
        this.logout()
        return true
      } catch (error) {
        console.error('[Auth] 密码修改失败:', error)
        throw this.handleAuthError(error, '密码修改')
      }
    },

    // 新增：头像上传处理
    async uploadAvatar(file: File) {
      console.debug('[Auth] 头像上传:', file.name)
      try {
        const formData = new FormData()
        formData.append('avatar', file)

        const response = await request.post<{ avatarUrl: string }>(
          '/api/auth/upload-avatar',
          formData
        )

        // 更新本地头像信息
        this.$patch(state => {
          if (state.userInfo) {
            state.userInfo.avatar = response.data.avatarUrl
          }
        })
        this.persistToStorage()

        return response.data.avatarUrl
      } catch (error) {
        console.error('[Auth] 头像上传失败:', error)
        throw this.handleAuthError(error, '头像上传')
      }
    },

    // 改进的认证数据设置
     setAuthData(authData: AuthResponse) {
      this.token = authData.token
      this.userInfo = {
        userId: authData.userId,
        username: authData.username,
        role: authData.role,
        avatar: authData.avatarUrl,
        email: authData.email
      }
      this.persistToStorage()
    },

    // 新增：获取认证头
     getAuthHeader() {
      return this.token ? { Authorization: `Bearer ${this.token}` } : {}
    },

    // 改进的错误处理
     handleAuthError(error: unknown, action: string): Error {
      const errorMessage = this.getErrorMessage(error)
      console.error(`[Auth] ${action}失败详情:`, error)
      return new Error(`${action}失败: ${errorMessage}`)
    },

    // 修改存储方式为 sessionStorage
    persistToStorage() {
      sessionStorage.setItem('token', this.token || '')
      sessionStorage.setItem('userInfo', JSON.stringify(this.userInfo))
    },

    initializeFromStorage() {
      const storedUser = localStorage.getItem('userInfo')
      if (storedUser) {
        try {
          this.userInfo = JSON.parse(storedUser)
        } catch (error) {
          console.error('[Auth] 存储数据解析失败，执行清理', error)
          this.clearStorage()
        }
      }
    },

    logout() {
      this.token = null
      this.userInfo = null
      this.clearStorage()
      window.location.reload()
    },

    clearStorage() {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('userInfo')
    },
    getErrorMessage(error: unknown): string {
  // 处理字符串类型的错误
  if (typeof error === 'string') return error;

  // 处理 Error 实例（包括 AxiosError）
  if (error instanceof Error) {
    // 如果是 Axios 错误，尝试解析响应体
    if ('response' in error) {
      const axiosError = error as AxiosError;
      const responseData = axiosError.response?.data;

      // 检查是否是后端返回的标准错误结构
      if (
        responseData &&
        typeof responseData === 'object' &&
        'message' in responseData
      ) {
        const messages: string[] = [];
        const backendError = responseData as {
          message: string;
          data?: Record<string, string>;
        };

        // 添加顶层错误信息
        messages.push(backendError.message);

        // 添加字段级错误信息
        if (backendError.data) {
          messages.push(...Object.values(backendError.data));
        }

        return messages.join('；');
      }
    }
    return error.message;
  }

  // 处理直接传入后端错误对象的情况
  if (typeof error === 'object' && error !== null) {
    const messages: string[] = [];
    const backendError = error as { message?: string; data?: Record<string, string> };

    // 添加顶层错误信息
    if (backendError.message) {
      messages.push(backendError.message);
    }

    // 添加字段级错误信息
    if (backendError.data) {
      messages.push(...Object.values(backendError.data));
    }

    return messages.length > 0 ? messages.join('；') : '未知错误';
  }

  // 其他无法识别的错误类型
  return '未知错误';
}
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.userInfo?.role === 'ADMIN',
    currentUser: (state) => state.userInfo || null,

    // 新增：简化用户信息获取
    userAvatar: (state) => state.userInfo?.avatar || '/default-avatar.png',
    username: (state) => state.userInfo?.username || '游客'
  }
})
