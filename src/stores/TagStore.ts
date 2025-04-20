import { defineStore } from 'pinia'
import { ref } from 'vue'
import axiosInstance from '@/api/request'
import type { AxiosError } from 'axios'

export interface Tag {
  tagId: number
  tagName: string
}

export const useNavStore = defineStore('subNavbar', () => {
  // State
  const tags = ref<Tag[]>([])
  const activeIndex = ref(-1)  // 默认-1表示未选中
  const isLoading = ref(false)

  // Actions
  const fetchTags = async () => {
    try {
      isLoading.value = true
      const { data } = await axiosInstance.get<Tag[]>('/api/tags')
      tags.value = data
    } finally {
      isLoading.value = false
    }
  }

  const setActiveIndex = (index: number) => {
    if (index >= 0 && index < tags.value.length) {
      activeIndex.value = index
    }
  }

  // 新增方法 [!code ++]
  const setActiveByTagId = (tagId: number) => {
    const index = tags.value.findIndex(t => t.tagId === tagId)
    if (index !== -1) {
      activeIndex.value = index
    }
  }

  return {
    // State
    tags,
    activeIndex,
    isLoading,

    // Actions
    fetchTags,
    setActiveIndex,
    setActiveByTagId // [!code ++]
  }
})


export const useTagStore = defineStore('tagManagement', () => {
  // State
  const tagList = ref<Tag[]>([])
  const currentPagination = ref({
    page: 1,
    pageSize: 10,
    total: 0
  })
  const searchParams = ref({
    keyword: ''
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)


  // Actions
  const fetchTags = async () => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await axiosInstance.get('/api/admin/tags', {
        params: {
          page: currentPagination.value.page,
          pageSize: currentPagination.value.pageSize,
          keyword: searchParams.value.keyword
        }
      })

      tagList.value = data.list
      currentPagination.value.total = data.total
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      error.value = axiosError.response?.data?.message || '获取标签列表失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createTag = async (tagName: string) => {
    try {
      const { data } = await axiosInstance.post('/api/admin/tags', {
        tagName
      })

      await fetchTags()
      return data
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      error.value = axiosError.response?.data?.message || '创建标签失败'
      throw err
    }
  }

  const deleteTag = async (tagId: number) => {
    try {
      await axiosInstance.delete(`/api/admin/tags/${tagId}`)
      await fetchTags()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      error.value = axiosError.response?.data?.message || '删除标签失败'
      throw err
    }
  }

  const batchDeleteTags = async (tagIds: number[]) => {
    try {
      await axiosInstance.post('/api/admin/tags/batch-delete', {
        tagIds
      })
      await fetchTags()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      error.value = axiosError.response?.data?.message || '批量删除失败'
      throw err
    }
  }

  // 更新分页参数
  const updatePagination = (page: number, pageSize: number) => {
    currentPagination.value.page = page
    currentPagination.value.pageSize = pageSize
  }

  // 更新搜索关键字
  const updateSearchKeyword = (keyword: string) => {
    searchParams.value.keyword = keyword
  }

  return {
    // State
    tagList,
    currentPagination,
    searchParams,
    isLoading,
    error,

    // Actions
    fetchTags,
    createTag,
    deleteTag,
    batchDeleteTags,
    updatePagination,
    updateSearchKeyword
  }
})
