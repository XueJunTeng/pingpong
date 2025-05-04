<template>
  <div class="video-page">
    <div class="container">
      <!-- 加载状态 -->
      <div v-if="videoStore.loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> 正在努力加载中...
      </div>

      <!-- 错误提示 -->
      <div v-else-if="videoStore.error" class="error-card">
        <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="error-message">{{ videoStore.error }}</div>
        <button @click="retry" class="bilibili-btn primary">重新加载</button>
      </div>

      <!-- 视频详情 -->
      <div v-else-if="videoStore.currentVideo" class="bilibili-container">
        <div class="detail-layout">
          <!-- 左侧主内容 -->
          <div class="main-content">
            <!-- 视频播放器 -->
            <div class="video-player-container">
              <video
                controls
                autoplay
                class="bilibili-player"
                poster="https://s1.hdslb.com/bfs/static/jinkela/video/asserts/poster.png"
              >
                <source :src="videoStore.currentVideo.url" type="video/mp4">
              </video>
            </div>

            <!-- 视频信息 -->
            <div class="video-info-container">
              <h1 class="video-title">{{ videoStore.currentVideo.title }}</h1>

              <!-- 作者行 -->
              <div class="author-row">
                <div class="author-info">
                  <img
                    :src="videoStore.currentVideo.authorUrl"
                    class="author-avatar"
                    alt="作者头像"
                  >
                  <div class="author-meta">
                    <span class="author-name">{{ videoStore.currentVideo.author }}</span>
                  </div>
                </div>
                <div class="action-buttons">
                  <button
                    class="bilibili-btn like-btn"
                    :class="{ 'active': videoStore.currentVideo.isLiked }"
                    @click="handleLike"
                  >
                    <div class="btn-icon">👍</div>
                    <div class="btn-text">
                      {{ videoStore.currentVideo.likes || '点赞' }}
                    </div>
                  </button>
                  <button
                    class="bilibili-btn favorite-btn"
                    :class="{ 'active': videoStore.currentVideo.isFavorited }"
                    @click="handleFavorite"
                  >
                    <div class="btn-icon">⭐</div>
                    <div class="btn-text">
                      {{ videoStore.currentVideo.favorites || '收藏' }}
                    </div>
                  </button>
                </div>
              </div>

              <!-- 数据信息行 -->
              <div class="stats-row">
                <div class="stats-item">
                  <i class="fas fa-play"></i>
                  播放 {{ videoStore.currentVideo.views.toLocaleString() }}
                </div>
                <div class="stats-item">
                  <i class="fas fa-clock"></i>
                  {{ videoStore.currentVideo.uploadTime || '2023-12-20' }}
                </div>
                <div class="tags">
                  <span
                    v-for="(tag, index) in videoStore.currentVideo.tagsname"
                    :key="index"
                    class="tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <!-- 简介 -->
              <div class="description" v-if="videoStore.currentVideo.description">
                {{ videoStore.currentVideo.description }}
              </div>
            </div>

            <!-- 评论区 -->
            <CommentSection
              :content-id="Number(route.params.contentId)"
              class="comment-section"
            />
          </div>

          <!-- 右侧推荐列表 -->
          <RecommendList />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useVideoStore } from '@/stores/videoStore'
import { useAuthStore } from '@/stores/auth'
import CommentSection from '@/components/CommentSection.vue'
import RecommendList from '@/components/VideoRecommendList.vue'

const route = useRoute()
const videoStore = useVideoStore()
const authStore = useAuthStore()

const retry = () => {
  videoStore.fetchVideoDetail(Number(route.params.contentId))
}

onMounted(() => {
  const contentId = Number(route.params.contentId)
  videoStore.fetchVideoDetail(contentId)
})
watch(() => route.params.contentId, (newId) => {
  videoStore.fetchVideoDetail(Number(newId));
});
const handleLike = () => {
  if (!authStore.isAuthenticated) {
    alert('请先登录后再进行点赞操作')
    return
  }
  videoStore.toggleLike(Number(route.params.contentId))
}

const handleFavorite = () => {
  if (!authStore.isAuthenticated) {
    alert('请先登录后再进行收藏操作')
    return
  }
  videoStore.toggleFavorite(Number(route.params.contentId))
}
</script>

<style lang="scss" scoped>
.video-page {
  background: #f4f5f7;
  min-height: 100vh;
  padding: 20px 0;
}

.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;

  .fa-spinner {
    color: #00a1d6;
    margin-right: 8px;
  }
}

.error-card {
  background: #fff;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  .error-icon {
    color: #f25d8e;
    font-size: 48px;
    margin-bottom: 20px;
  }

  .error-message {
    color: #222;
    font-size: 16px;
    margin-bottom: 24px;
  }
}

.video-player-container {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-width: 960px;
  margin: 0 auto;

  .bilibili-player {
    width: 100%;
    aspect-ratio: 16/9;
    position: relative;

    video {
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
    }
  }
}

.video-info-container {
  padding: 20px 0;
  max-width: 960px;
  margin: 0 auto;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr minmax(0, 960px) 350px;
  gap: 40px;
  justify-content: center;

}

.main-content {
  grid-column: 2;
}

.recommend-list {
  grid-column: 3;
  justify-self: end;
  width: 300px;
}

.author-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .author-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    background: #e7e7e7;
  }

  .author-meta {
    display: flex;
    flex-direction: column;

    .author-name {
      font-size: 16px;
      font-weight: 500;
      color: #212121;
    }
  }
}

/* 修改后的按钮样式 */
.bilibili-btn {
  /* 原有基础样式 */
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e7e7e7;
  background: #fff;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 72px;

  &:hover {
    background: #f8f8f8;
    border-color: #d2d2d2;
  }

  /* 增强激活状态优先级 */
  &.active {
    color: #fff !important;
    border-color: transparent !important;
    transform: scale(1.05);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);

    /* 点赞按钮 */
    &.like-btn {
      background: #00a1d6 !important;
      animation: pulse-blue 0.4s ease;
    }

    /* 收藏按钮 */
    &.favorite-btn {
      background: #ff69b4 !important;
      animation: pulse-pink 0.4s ease;
    }

    .btn-icon {
      filter: brightness(120%);
      transform: scale(1.2);
    }
  }

  .btn-icon {
    font-size: 24px;
    transition: all 0.2s ease;
  }
}

/* 添加颜色脉冲动画 */
@keyframes pulse-blue {
  0% { box-shadow: 0 0 0 0 rgba(0, 161, 214, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 161, 214, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 161, 214, 0); }
}

@keyframes pulse-pink {
  0% { box-shadow: 0 0 0 0 rgba(255, 105, 180, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 105, 180, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 105, 180, 0); }
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin: 12px 0;
  color: #666;
  font-size: 14px;

  .stats-item {
    display: flex;
    align-items: center;
    gap: 6px;

    i {
      font-size: 14px;
      color: #999;
    }
  }

  .tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .tag {
      background: #f4f5f7;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      color: #666;
      transition: background 0.2s;

      &:hover {
        background: #e7e7e7;
      }
    }
  }
}

.description {
  margin: 16px 0;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
  color: #666;
  line-height: 1.6;
  font-size: 14px;
}

.comment-section {
  margin-top: 20px;
  max-width: 960px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 1280px) {
  .detail-layout {
    grid-template-columns: 1fr;
    padding: 0 20px;

    .recommend-list {
      grid-column: 1;
      justify-self: stretch;
      width: 100%;
      margin-top: 40px;
      order: 1;
    }
  }

  .video-player-container,
  .video-info-container {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 12px;
  }

  .video-title {
    font-size: 18px;
  }

  .author-row {
    flex-wrap: wrap;
    gap: 12px;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-start;

    .bilibili-btn {
      flex-grow: 1;
      justify-content: center;
      padding: 8px 12px;
    }
  }

  .stats-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .bilibili-btn {
    font-size: 13px;
    padding: 6px 12px;
    min-width: 64px;

    .btn-icon {
      font-size: 20px;
    }
  }
}
</style>
