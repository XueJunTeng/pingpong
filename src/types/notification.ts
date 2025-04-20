// types/notification.ts
export interface Notification {
  notificationId: number
  senderId: number
  receiverId: number
  contentId: number
  commentId: number | null
  type: 'LIKE' | 'REPLY' | 'COMMENT' | 'SYSTEM' // 根据实际类型补充
  message: string
  isRead: boolean
  createdTime: string
  senderAvatarUrl: string
  senderUsername: string
  contentTitle: string
  commentContent: string | null
}

export interface FrontendNotification {
  id: number
  type: string
  fromUser: {
    avatar: string
    nickname: string
  }
  content: string
  createTime: string
  isRead: boolean
  relatedContent?: {
    type: 'video' | 'dynamic'
    id: number
    title: string
  }
}