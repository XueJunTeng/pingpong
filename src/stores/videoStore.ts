import { defineStore } from 'pinia'
import axiosInstance from '@/api/request'
import axios from 'axios'
import type { VideoItem, ApiVideoResponse } from '@/types/video'
import { mapApiToVideoItem } from '@/utils/videoMapper' // 使用现有映射函数
import type { LikeResponse } from '@/types/like'
import type { FavoriteResponse } from '@/types/favorite'
import {convertToPureMetadata, type ApiRe, type contentItem} from '@/types/contentMetadata';

interface VideoState {
  contents: contentItem[]
  videos: VideoItem[]
  results: VideoItem[]
  currentVideo: VideoItem | null
  loading: boolean
  error: string | null
  reVideos:contentItem[]
  reArticles:contentItem[]
  viewedContents: Set<number> // 记录已统计过浏览的内容ID
}

export const useVideoStore = defineStore('video', {
  state: (): VideoState => ({
    contents: [],
    reVideos: [],
    reArticles: [],
    videos: [],
    results:[],
    currentVideo: null,
    loading: false,
    error: null,
    viewedContents: new Set<number>(),
  }),

  actions: {
    //获取搜索结果
    async fetchsearch(query: string) {
      try {
        this.loading = true
        this.error = null
        const response = await axiosInstance.get<ApiVideoResponse[]>(`/api/contents/search/${query}`)
        this.results = response.data.map(item => mapApiToVideoItem(item))
      } catch (err: unknown) {
        this.handleError(err, '搜索失败')
        this.results = [] // 确保失败时清空列表
        throw err
      } finally {
        this.loading = false
      }
    },
       // 获取内容列表
       async fetchcontents() {
        try {
          this.loading = true;
          this.error = null;
          const response = await axiosInstance.get<ApiRe[]>('/api/recommend/real-time');

          // 转换数据并保存原始列表
          this.contents = response.data.map(item => convertToPureMetadata(item));
          // 根据 type 字段分组
          this.reArticles = this.contents.filter(item => item.type === 'ARTICLE'); // 文章列表
          this.reVideos = this.contents.filter(item => item.type === 'VIDEO');  // 视频列表
        } catch (err: unknown) {
          this.handleError(err, '内容加载失败');
          // 失败时清空两个列表
          this.reArticles = [];
          this.reVideos = [];
          throw err;
        } finally {
          this.loading = false;
        }
      },
    // 获取视频详情
    async fetchVideoDetail(contentId: number) {
      try {
        this.loading = true
        this.error = null
        const response = await axiosInstance.get<ApiVideoResponse>(
          `/api/contents/videos/${contentId}`)
      this.currentVideo = mapApiToVideoItem(response.data)
      } catch (err: unknown) {
        this.handleError(err, '详情加载失败')
        throw err
      } finally {
        this.loading = false
      }
    },
    // 获取文章详情
    async fetchArticleDetail(contentId: number){
      try {
        this.loading = true
        this.error = null
        const response = await axiosInstance.get<ApiVideoResponse>(
          `/api/contents/articles/${contentId}`)
      this.currentVideo = mapApiToVideoItem(response.data)
      } catch (err: unknown) {
        this.handleError(err, '详情加载失败')
        throw err
      } finally {
        this.loading = false
      }
    },
      // 点赞/取消点赞
      async toggleLike(contentId: number) {
        try {
          const target = this.currentVideo?.contentId === contentId ? this.currentVideo :
            this.videos.find(v => v.contentId === contentId)

          if (!target) return

          // 发送请求并获取后端返回的最新状态
          let response
          if (target.isLiked) {
            response = await axiosInstance.delete<LikeResponse>(`/api/likes/${contentId}`)
          } else {
            response = await axiosInstance.post<LikeResponse>(`/api/likes/${contentId}`)
          }

          // 使用后端返回的最新数据更新状态
          target.isLiked = response.data.isLiked
          target.likes = response.data.likeCount

          // 如果当前视频在列表中也存在，同步更新列表中的状态
          if (this.currentVideo && this.currentVideo.contentId !== contentId) {
            const listItem = this.videos.find(v => v.contentId === contentId)
            if (listItem) {
              listItem.isLiked = response.data.isLiked
              listItem.likes = response.data.likeCount
            }
          }

        } catch (err) {
          this.handleError(err, '操作失败')
          throw err
        }
      },

  // 收藏/取消收藏
  async toggleFavorite(contentId: number) {
    try {
      const target = this.currentVideo?.contentId === contentId ? this.currentVideo :
        this.videos.find(v => v.contentId === contentId)

      if (!target) return

      // ======= 新增：乐观更新 =======
      const originalIsFavorited = target.isFavorited
      const originalFavorites = target.favorites
      target.isFavorited = !originalIsFavorited
      target.favorites = originalIsFavorited ? originalFavorites - 1 : originalFavorites + 1

      // ======= 请求逻辑 =======
      let response
      if (originalIsFavorited) {
        response = await axiosInstance.delete<FavoriteResponse>(`/api/favorites/${contentId}`)
      } else {
        response = await axiosInstance.post<FavoriteResponse>(`/api/favorites/${contentId}`)
      }

      // ======= 使用后端真实数据覆盖 =======
      target.isFavorited = response.data.isFavorited
      target.favorites = response.data.favoriteCount

      // ======= 跨视图同步 =======
      if (this.currentVideo && this.currentVideo.contentId !== contentId) {
        const listItem = this.videos.find(v => v.contentId === contentId)
        if (listItem) {
          listItem.isFavorited = response.data.isFavorited
          listItem.favorites = response.data.favoriteCount
        }
      }

    } catch (err) {
      this.handleError(err, '操作失败')
      throw err
    }
  },


    // 统一错误处理
    handleError(err: unknown, prefix: string) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          this.error = '认证过期，请重新登录'
          // 触发登出逻辑（按需实现）
          // localStorage.removeItem('authToken')
          // window.location.reload()
        } else {
          this.error = `${prefix}: ${err.response?.data?.message || err.message}`
        }
      } else if (err instanceof Error) {
        this.error = `系统错误: ${err.message}`
      } else {
        this.error = '未知错误'
      }
    }
  },

  getters: {
    approvedVideos: (state) => state.videos.filter(v => v.status === 'approved')
  }
})
