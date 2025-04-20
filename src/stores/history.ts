// src/stores/history.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VideoItem, PaginatedContentResponse, ApiVideoResponse } from '@/types/video'
import { mapApiToVideoItem } from '@/utils/videoMapper'
import api from '@/api/request'

export type HistoryType = 'view' | 'like' | 'favorite'

export const useHistoryStore = defineStore('history', () => {
  const historyList = ref<VideoItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentType = ref<HistoryType | null>(null)

  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    pages: 0,
    hasNext: false
  })

  const fetchHistory = async (type: HistoryType, page = 1, pageSize = 10) => {
    try {
      loading.value = true
      currentType.value = type

      // 明确泛型类型为 ApiVideoResponse[]
      const response = await api.get<PaginatedContentResponse<ApiVideoResponse>>(
        `/api/history/${type}`,
        { params: { page, pageSize } }
      )

      // 使用类型转换函数
      const items = response.data.list.map(mapApiToVideoItem)

      // 分页处理逻辑
      historyList.value = page === 1
        ? items
        : [...historyList.value, ...items]

      // 更新分页状态
      pagination.value = {
        page: response.data.pageNum,
        pageSize: response.data.pageSize,
        total: response.data.total,
        pages: response.data.pages,
        hasNext: response.data.hasNextPage
      }
    } catch (err) {
      handleError(err, '获取历史记录失败')
    } finally {
      loading.value = false
    }
  }

  const handleError = (err: unknown, defaultMessage: string) => {
    const message = (err as Error)?.message || defaultMessage
    error.value = message
    ElMessage.error(message)
    console.error('API Error:', err)
  }
  const clearHistory = () => {
    historyList.value = []
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      pages: 0,
      hasNext: false
    }
  }

  return {
    historyList,
    pagination,
    loading,
    error,
    fetchHistory,
    clearHistory
  }
})