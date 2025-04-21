// src/stores/contentAuditStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ContentStatus, ContentItem, PaginatedContentResponse } from '@/types/content'
import { api } from '@/api'

// 新增类型定义
interface FetchParams {
  page?: number
  pageSize?: number
  keyword?: string
  contentType?: string
}

interface PaginationResponse extends PaginatedContentResponse {
  navigatePages: number
  navigatepageNums: number[]
  navigateFirstPage: number
  navigateLastPage: number
  prePage: number
  nextPage: number
  isFirstPage: boolean
  isLastPage: boolean
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export const useContentAuditStore = defineStore('contentAudit', () => {
  // 状态管理
  const pendingContents = ref<ContentItem[]>([])
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    pages: 0,
    hasNext: false
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 修改后的 API 方法，支持搜索参数
  const fetchPendingContents = async (params: FetchParams = {}) => {
    try {
      loading.value = true
      const { page = 1, pageSize = 10, keyword, contentType } = params

      const response = await api.get<PaginationResponse>('/api/admin/contents/pending', {
        params: {
          page,
          pageSize,
          keyword,
          type: contentType // 根据后端 API 字段名称调整
        }
      })

      // 处理作者信息
      const enrichedList = await Promise.all(
        response.data.list.map(async (item) => ({
          ...item,
          author: item.author,
          createdTime: formatDateTime(item.createdTime),
          lastModifiedTime: formatDateTime(item.lastModifiedTime),
          type: item.type
        }))
      )

      pendingContents.value = enrichedList
      updatePagination(response.data)
    } catch (err) {
      error.value = '获取待审内容失败'
      console.error('API Error:', err)
    } finally {
      loading.value = false
    }
  }

  // 更新分页信息（保持不变）
  const updatePagination = (data: PaginationResponse) => {
    pagination.value = {
      page: data.pageNum,
      pageSize: data.pageSize,
      total: data.total,
      pages: data.pages,
      hasNext: data.hasNextPage
    }
  }

  // 审核操作（保持原样）
  const auditContent = async (
    contentId: number,
    status: Exclude<ContentStatus, 'PENDING'>,
    reviewNotes?: string
  ) => {
    try {
      await api.post(`/api/admin/contents/${contentId}/review`, {
        status,
        reviewNotes
      })

      pendingContents.value = pendingContents.value.filter(
        item => item.contentId !== contentId
      )

      if (pagination.value.total > 0) {
        pagination.value.total -= 1
        recalculatePages()
      }
    } catch (err) {
      error.value = `内容审核${status === 'APPROVED' ? '通过' : '驳回'}失败`
      console.error('Audit Error:', err)
      throw err
    }
  }

  // 重新计算分页（保持不变）
  const recalculatePages = () => {
    pagination.value.pages = Math.ceil(pagination.value.total / pagination.value.pageSize)
    pagination.value.hasNext = pagination.value.page < pagination.value.pages
  }

  // 时间格式化（保持不变）
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch {
      return '无效时间'
    }
  }

  return {
    pendingContents,
    pagination,
    loading,
    error,
    formatDateTime,
    fetchPendingContents,
    auditContent
  }
})