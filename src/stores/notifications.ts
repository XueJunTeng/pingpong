import request from '@/api/request'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    unreadTotal: 0
  }),

  actions: {
    async fetchUnreadCount() {
      try {
        const response = await request.get<{
          code: number
          data: { count: number }
        }>('/api/notifications/unread-count')

        // 严格校验响应格式
        if (
          response.status !== 200 ||
          typeof response.data.data?.count !== 'number'
        ) {
          throw new Error(`无效响应: ${JSON.stringify(response.data)}`)
        }

        this.unreadTotal = response.data.data.count
        console.log('成功更新未读数:', this.unreadTotal)

      } catch (error) {
        console.error('获取未读数失败:', error)
        if (axios.isAxiosError(error)) {
          console.error('错误响应:', {
            status: error.response?.status,
            data: error.response?.data
          })
        }
        // 保留历史值防止UI闪烁
        return this.unreadTotal
      }
    },

    setUnreadTotal(count: number) {
      this.unreadTotal = Math.max(0, count)
    }
  }
})