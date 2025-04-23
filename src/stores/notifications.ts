import request from '@/api/request'
import { defineStore } from 'pinia'
import axios from 'axios'

interface UnreadCounts {
  replyComment: number
  like: number
}

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    // 拆分未读数为独立字段
    counts: {
      replyComment: 0,
      like: 0
    } as UnreadCounts
  }),

  getters: {
    // 可选：计算总未读数
    totalUnread(): number {
      return this.counts.replyComment + this.counts.like
    }
  },

  actions: {
    async fetchUnreadCounts() {
      try {
        const response = await request.get<{
          code: number
          data: UnreadCounts
        }>('/api/notifications/unread-counts')

        // 严格校验响应格式
        if (
          response.status !== 200 ||
          typeof response.data.data?.replyComment !== 'number' ||
          typeof response.data.data?.like !== 'number'
        ) {
          throw new Error(`无效响应格式: ${JSON.stringify(response.data)}`)
        }

        this.updateCounts(response.data.data)
        console.log('未读数更新成功:', this.counts)

      } catch (error) {
        this.handleError(error)
        // 返回当前状态以便恢复
        return this.counts
      }
    },

    // 更新计数方法
    updateCounts(newCounts: Partial<UnreadCounts>) {
      this.counts = {
        replyComment: Math.max(0, newCounts.replyComment ?? this.counts.replyComment),
        like: Math.max(0, newCounts.like ?? this.counts.like)
      }
    },

    // 错误处理统一封装
     handleError(error: unknown) {
      console.error('未读数操作失败:', error)
      if (axios.isAxiosError(error)) {
        console.error('请求详情:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data
        })
      }
    },

    // 重置状态（可选）
    reset() {
      this.counts = { replyComment: 0, like: 0 }
    }
  }
})