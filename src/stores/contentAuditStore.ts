// src/stores/contentAuditStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ContentStatus, ContentItem, PaginatedContentResponse } from '@/types/content'
import { api } from '@/api'

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

  // 核心 API 方法
  const fetchPendingContents = async (page = 1, pageSize = 10) => {
    try {
      loading.value = true
      const response = await api.get<PaginationResponse>('/api/admin/contents/pending', {
        params: {
          page,
          pageSize
        }
      })

      // 处理作者信息
      const enrichedList = await Promise.all(
        response.data.list.map(async (item) => ({
          ...item,
          author: item.author,
          createdTime: formatDateTime(item.createdTime),
          lastModifiedTime: formatDateTime(item.lastModifiedTime),
          // 直接使用原始类型，无需转换
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

  // 更新分页信息
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

  // 重新计算分页
  const recalculatePages = () => {
    pagination.value.pages = Math.ceil(pagination.value.total / pagination.value.pageSize)
    pagination.value.hasNext = pagination.value.page < pagination.value.pages
  }

  // 批量审核
  const batchAudit = async (
    contentIds: number[],
    status: Exclude<ContentStatus, 'PENDING'>,
    reviewNotes?: string
  ) => {
    try {
      await api.post('/api/admin/contents/batch-review', {
        contentIds,
        status,
        reviewNotes
      })

      // 更新本地数据
      pendingContents.value = pendingContents.value.filter(
        item => !contentIds.includes(item.contentId)
      )

      // 更新分页信息
      const removedCount = contentIds.length
      if (pagination.value.total >= removedCount) {
        pagination.value.total -= removedCount
        recalculatePages()
      }
    } catch (err) {
      error.value = `批量${status === 'APPROVED' ? '通过' : '驳回'}操作失败`
      console.error('Batch Audit Error:', err)
      throw err
    }
  }

  // 时间格式化
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
    formatDateTime,  // 确保导出
    fetchPendingContents,
    auditContent,
    batchAudit
  }
})