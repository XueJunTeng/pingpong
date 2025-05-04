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
    // src/utils/videoMapper.ts
    uploadTime: new Date(apiData.createdTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-'),
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
    authorUrl:apiData.authorUrl
  }
}
