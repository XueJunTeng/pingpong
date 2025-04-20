export interface ContentUploadForm {
  title: string
  description: string
  type: 'video' | 'article'
  contentFile?: File | null
  coverImage: File | null
  tagIds: number[]
}

export interface ContentUploadDTO {
  title: string
  description?: string
  type: ContentType
  tagIds: number[]
}

export interface ApiResponse<T> {
  code: number
  message: string
  data?: T
}

//内容审核状态枚举
export type ContentStatus =
  | 'PENDING'    // 待审核
  | 'APPROVED'   // 已通过
  | 'REJECTED'   // 已驳回


//内容类型枚举
//（根据后端数据定义为大写，前端显示时转换为小写）
export type ContentType =
  | 'VIDEO'     // 视频
  | 'ARTICLE'   // 文章
  | 'POST'      // 帖子
  | 'COMMENT'   // 评论


 //内容标签类型
export interface ContentTag {
  tagId: number
  name: string
  weight?: number  // 用于推荐算法的权重值
}


//内容详情类型
export interface ContentItem {
  // 核心元数据
  contentId: number
  title: string
  description: string
  userId: number

  // 时间信息
  createdTime: string       // ISO 8601 格式
  lastModifiedTime: string  // 最后修改时间

  // 内容类型相关
  type: ContentType
  filePath?: string         // 视频/文件路径
  coverImageUrl?: string   // 封面图地址
  duration?: number        // 视频时长（秒）

  // 互动数据
  viewCount: number
  likeCount: number
  commentCount: number
  favoriteCount: number

  // 审核信息
  status: ContentStatus
  reviewNotes?: string | null  // 审核备注

  // 关联数据
  tags: ContentTag[]
  author?: string | null       // 作者名称（可能为空）
}


//分页响应结构
export interface PaginatedContentResponse<T = ContentItem> {
  list: T[]             // 当前页数据列表
  total: number         // 总记录数
  pageNum: number       // 当前页码
  pageSize: number      // 每页数量
  pages: number         // 总页数
  hasNextPage: boolean  // 是否有下一页
}


//内容搜索参数
export interface ContentSearchParams {
  status?: ContentStatus    // 按状态过滤
  type?: ContentType         // 按类型过滤
  keyword?: string          // 标题/描述关键词搜索
  startDate?: string        // 创建时间范围查询（ISO 8601）
  endDate?: string
  sortBy?: 'createdTime' | 'viewCount' | 'likeCount'  // 排序字段
  order?: 'asc' | 'desc'    // 排序顺序
}


//批量操作参数
export interface BatchContentOperation {
  contentIds: number[]
  operation: 'approve' | 'reject' | 'delete'
  reviewNotes?: string  // 驳回原因
}


 //内容审核记录

export interface AuditRecord {
  contentId: number
  operatorId: number
  action: ContentStatus
  notes?: string
  operatedAt: string
}
