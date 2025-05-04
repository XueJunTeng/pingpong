<!-- src/views/ArticleView.vue -->
<template>
  <div class="article-page">
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

      <!-- 文章详情 -->
      <div v-else-if="videoStore.currentVideo" class="bilibili-container">
        <!-- 文章头图 -->
        <div class="article-header">
          <h1 class="article-title">{{ videoStore.currentVideo.title }}</h1>
          <img
            :src="videoStore.currentVideo.cover"
            class="cover-image"
            alt="文章封面"
          >
        </div>

        <!-- 作者信息 -->
        <div class="author-info">
          <div class="author-meta">
            <img
              :src="videoStore.currentVideo.authorUrl"
              class="author-avatar"
              alt="作者头像"
            >
            <div class="author-details">
              <span class="author-name">{{ videoStore.currentVideo.author }}</span>
              <div class="stats">
                <span class="publish-time">
                  <i class="fas fa-clock"></i>
                  {{ videoStore.currentVideo.uploadTime }}
                </span>
                <span class="read-count">
                  <i class="fas fa-eye"></i>
                  阅读 {{ videoStore.currentVideo.views.toLocaleString() }}
                </span>
              </div>
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

        <!-- 文章内容 -->
        <div class="article-content">
          <div class="content" v-html="videoStore.currentVideo.description"></div>

          <!-- 标签 -->
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

        <!-- 评论区 -->
        <CommentSection
          :content-id="Number(route.params.articleId)"
          class="comment-section"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useVideoStore } from '@/stores/videoStore'
import CommentSection from '@/components/CommentSection.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const videoStore = useVideoStore()
const authStore = useAuthStore()

const retry = () => {
  videoStore.fetchArticleDetail(Number(route.params.contentId))
}

onMounted(() => {
  const contentId = Number(route.params.contentId)
  videoStore.fetchArticleDetail(contentId)
})

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
.article-page {
  background: #f9fafb;
  min-height: 100vh;
  padding: 40px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 文章头图 */
.article-header {
  margin-bottom: 32px;

  .article-title {
    font-size: 28px;
    line-height: 1.4;
    color: #1a1a1a;
    margin-bottom: 24px;
  }

  .cover-image {
    width: 100%;
    height: 400px;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
}

/* 作者信息 */
.author-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 16px 0;
  border-bottom: 1px solid #eee;

  .author-meta {
    display: flex;
    align-items: center;
    gap: 16px;

    .author-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      background: #e7e7e7;
    }

    .author-details {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .author-name {
        font-size: 16px;
        font-weight: 500;
        color: #222;
      }

      .stats {
        display: flex;
        gap: 16px;
        color: #666;
        font-size: 13px;

        i {
          margin-right: 4px;
          color: #999;
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }
}

/* 文章内容 */
.article-content {
  background: white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 40px;

  .content {
    font-size: 16px;
    line-height: 1.8;
    color: #333;

    ::v-deep(img) {
      max-width: 100%;
      height: auto;
      margin: 24px 0;
      border-radius: 4px;
    }

    ::v-deep(h2) {
      font-size: 24px;
      margin: 32px 0 16px;
      color: #1a1a1a;
    }

    ::v-deep(p) {
      margin: 16px 0;
    }
  }

  .tags {
    margin-top: 32px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .tag {
      background: #f4f5f7;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      color: #666;
      transition: background 0.2s;

      &:hover {
        background: #e7e7e7;
      }
    }
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .container {
    padding: 0 12px;
  }

  .article-header {
    .article-title {
      font-size: 22px;
    }

    .cover-image {
      height: 200px;
    }
  }

  .author-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .action-buttons {
      width: 100%;
      justify-content: space-between;
    }
  }

  .article-content {
    padding: 20px;

    .content {
      font-size: 15px;
    }
  }

  .bilibili-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
