
// src/types/video.d.ts
export type ContentStatus = 'pending' | 'approved' | 'rejected'

export interface Tag {
  tagId: number
  tagName: string
}

export interface ApiVideoResponse {
  contentId: number
  title: string
  description: string
  createdTime: Date
  type: 'VIDEO' | 'ARTICLE'
  filePath: string
  coverImageUrl: string
  viewCount: number
  likeCount: number
  commentCount: number
  favoriteCount: number
  lastModifiedTime: Date
  status: ContentStatus
  tags: Tag[]
  author: string
  isLiked: boolean
  isFavorited: boolean
  authorUrl: string
}

export interface VideoItem {
  type:string
  contentId: number
  title: string
  author: string
  views: number
  cover: string
  url?: string
  duration?: number
  uploadTime: string
  status: ContentStatus
  likes: number
  comments: number
  tagsname: string[]
  tags: number[]
  favorites: number
  isLiked: boolean
  isFavorited: boolean
  description: string
  authorUrl?: string
}
export interface PaginatedContentResponse<T = VideoItem> {
  list: T[]             // 当前页数据列表
  total: number         // 总记录数
  pageNum: number       // 当前页码
  pageSize: number      // 每页数量
  pages: number         // 总页数
  hasNextPage: boolean  // 是否有下一页
}
// 类型转换函数声明
export declare function mapApiToVideoItem(apiData: ApiVideoResponse): VideoItem;

