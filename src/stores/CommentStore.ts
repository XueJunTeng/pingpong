import { defineStore } from 'pinia'
import axios from '@/api/request'
import { ref } from 'vue'

type CommentDTO = {
  commentId: number
  content: string
  username: string
  createTime: string
  replies: CommentDTO[]
}

export const useCommentStore = defineStore('comment', () => {
  // 状态定义
  const comments = ref<CommentDTO[]>([])
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  const fetchComments = async (contentId: number) => {
    try {
      isLoading.value = true
      const { data } = await axios.get<CommentDTO[]>(`/api/contents/${contentId}/comments`)

      // 数据标准化处理
      comments.value = data.map(comment => ({
        ...comment,
        replies: comment.replies?.map(reply => ({
          ...reply,
          replies: reply.replies || [] // 嵌套处理
        })) || [] // 确保replies至少是空数组
      }))

    } catch (err) {
      error.value = (err as Error).message || '获取评论失败'
    } finally {
      isLoading.value = false
    }
  }

  // 添加评论
  const addComment = async (content: string, contentId: number, parentId?: number) => {
    try {
      isLoading.value = true
      error.value = null
      const { data } = await axios.post<CommentDTO>(
        `/api/contents/${contentId}/comments`,
        { content, parentId }
      )

      if (parentId) {
        const parent = findComment(comments.value, parentId)
        if (parent) {
          parent.replies = [...parent.replies, data]
        }
      } else {
        comments.value = [data, ...comments.value]
      }
      return data
    } catch (err) {
      error.value = (err as Error).message || '评论提交失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 查找评论
  const findComment = (comments: CommentDTO[], targetId: number): CommentDTO | undefined => {
    for (const comment of comments) {
      if (comment.commentId === targetId) return comment
      const found = findComment(comment.replies, targetId)
      if (found) return found
    }
  }

  return {
    // 状态
    comments,
    error,
    isLoading,

    // 方法
    fetchComments,
    addComment,
    findComment
  }
})