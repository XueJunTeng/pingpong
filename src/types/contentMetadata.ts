// contentMetadata.ts

export interface Tag {
  tagId: number
  tagName: string
}
export interface ApiContent {
  type: 'ARTICLE' | 'VIDEO';
  title: string;
  coverImageUrl: string;
  author: string;
  description: string;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  viewCount: number;
  createdTime: string; // ISO 8601 格式时间字符串
  tags: Tag[]; // 标签数组
}


export interface ApiRe {
  userId: number;
  contentId: number;
  recommendScore: number;
  strategy: string;
  expireTime: string; // ISO 8601 格式时间字符串
  createdTime: string;
  contentMetadata: ApiContent;
}


export interface contentItem {
  type:string
  contentId: number;
  title: string;
  cover: string; // 重命名字段
  author: string;
  description: string;
  likes: number;
  comments: number;
  favorites: number;
  views: number;
  createdTime?: string;
  tags: number[]; // 标签ID数组
}

export interface ReItem {
  id: number; // contentId 重命名
  userId: number;
  scorePercentage: string; // 转换后的百分比
  strategy: string;
  expireDate: string; // 格式化后的日期
  metadata: contentItem;
}

export function convertRecommendation(apiData: ApiRe): ReItem {
  const contentId = apiData.contentId;
  return {
    id: contentId,
    userId: apiData.userId,
    scorePercentage: `${(apiData.recommendScore * 100).toFixed(1)}%`,
    strategy: apiData.strategy,
    expireDate: formatDate(new Date(apiData.expireTime)),
    metadata: {
      ...convertMetadata(apiData.contentMetadata, contentId), // 传递contentId
      contentId // 直接赋值
    }
  };
}
//只保留元数据
export function convertToPureMetadata(apiData: ApiRe): contentItem {
  return {
    contentId: apiData.contentId,
    title: apiData.contentMetadata.title,
    cover: apiData.contentMetadata.coverImageUrl,
    author: apiData.contentMetadata.author,
    description: apiData.contentMetadata.description,
    likes: apiData.contentMetadata.likeCount,
    comments: apiData.contentMetadata.commentCount,
    favorites: apiData.contentMetadata.favoriteCount,
    views: apiData.contentMetadata.viewCount,
    createdTime: formatDate(new Date(apiData.contentMetadata.createdTime)),
    tags: apiData.contentMetadata.tags?.map(t => t.tagId) || [],
    type: apiData.contentMetadata.type
  };
}
// 修改元数据转换函数签名
function convertMetadata(
  metadata: ApiContent,
  contentId: number // 新增参数
): contentItem {
  return {
    contentId, // 来自上层传递
    title: metadata.title || '未知标题',
    cover: metadata.coverImageUrl,
    author: metadata.author || '匿名作者',
    description: metadata.description || '暂无描述',
    likes: metadata.likeCount || 0,
    comments: metadata.commentCount || 0,
    favorites: metadata.favoriteCount || 0,
    views: metadata.viewCount || 0,
    createdTime: formatDate(new Date(metadata.createdTime)),
    tags: metadata.tags.map(tag => tag.tagId) || [],
    type: metadata.type
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}


// 示例用法
/*
const apiData: ApiRecommendation = {
  "userId": 1,
  "contentId": 3,
  "recommendScore": 0.57775754,
  "strategy": "real-time",
  "expireTime": "2025-04-17T18:45:40.7674042",
  "createdTime": "2025-04-16T18:45:40.7674042",
  "contentMetadata": {
    "title": "3",
    "coverImageUrl": "http://localhost:8080/uploads/41c7857815034bb188f4d49ac8e17560_screenshot_250322_021906.jpg",
    "author": "laoxue",
    "description": "3"
  }
};

const appData = convertRecommendation(apiData);
console.log(appData);
*/
