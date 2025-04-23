// src/stores/auth.ts
import { defineStore } from 'pinia'
import request from '@/api/request'
import type { RegisterData, LoginData, AuthResponse, UserProfileUpdate } from '@/types/auth'

interface UserInfo {
  userId: number
  username: string
  role: string
  avatar?: string
  email: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null') as UserInfo | null
  }),

  actions: {
    async userlogout() {
      // 清除客户端所有认证痕迹
      localStorage.removeItem('token')
      sessionStorage.clear()

      // 清除 Cookies（如果使用）
      document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;'

      // 清除内存中的 token
      this.token = null
      this.userInfo = null

      console.log('用户已注销，所有认证信息已清除')
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

    // 保持不变的存储操作方法...
    persistToStorage() {
      localStorage.setItem('token', this.token || '')
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
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
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },

    getErrorMessage(error: unknown): string {
      if (error instanceof Error) return error.message
      if (typeof error === 'string') return error
      return '未知错误'
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
