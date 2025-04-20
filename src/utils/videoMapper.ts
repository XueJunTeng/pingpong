// src/utils/videoMapper.ts
import type { ApiVideoResponse, VideoItem } from '@/types/video';

export function mapApiToVideoItem(apiData: ApiVideoResponse): VideoItem {
  return {
    contentId: apiData.contentId,
    title: apiData.title,
    author: apiData.author,
    views: apiData.viewCount,
    cover: apiData.coverImageUrl,
    url: apiData.filePath,
    uploadTime: new Date(apiData.createdTime).toLocaleDateString('zh-CN'),
    status: apiData.status,
    likes: apiData.likeCount,
    comments: apiData.commentCount,
    favorites: apiData.favoriteCount,
    isLiked: apiData.isLiked,
    isFavorited: apiData.isFavorited,
    description: apiData.description || '',
    tagsname: apiData.tags?.map(t => t.tagName) || [],
    tags: apiData.tags?.map(t => t.tagId) || [],
    type: apiData.type,
  }
}