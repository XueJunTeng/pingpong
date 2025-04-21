<!-- src/components/ArticleCard.vue -->
<template>
  <div class="article-card"
       @click="$router.push({
         name: 'ArticleDetail',
         params: { contentId: article.contentId }
       })">
    <img :src="article.cover" class="cover" alt="文章封面">
    <div class="content">
      <h3 class="title">{{ article.title }}</h3>
      <p class="summary">{{ article.description }}</p>
      <div class="meta">
        <span class="author">@{{ article.author }}</span>
        <div class="stats">
          <span class="read">👁 {{ article.views.toLocaleString() }}</span>
          <span class="likes">👍 {{ article.likes.toLocaleString() }}</span>
          <span class="likes">⭐ {{ article.favorites.toLocaleString() }}</span>
        </div>
      </div>
      <div class="extra">
        <span class="time">{{ article.createdTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {contentItem} from '@/types/contentMetadata';
defineProps<{
  article: contentItem
}>()

</script>

<style lang="scss" scoped>
.article-card {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 20px;
  border: 1px solid #f0f0f0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.08);
    border-color: #e5e5e5;
  }

  .cover {
    width: 160px;  // 增大封面宽度
    height: 100px; // 调整高度比例
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .content {
    .title {
      font-size: 18px;
      line-height: 1.4;
      color: #1a1a1a;
      font-weight: 500;
      margin-bottom: 8px;
      @include ellipsis(2); // 允许两行标题
    }

    .summary {
      font-size: 14px;
      line-height: 1.6;
      color: #666;
      margin-bottom: 12px;
      @include ellipsis(3); // 显示更多摘要内容
    }

    .meta {
      margin-top: 12px;
      font-size: 13px;

      .author {
        color: #4a5568;
        font-weight: 500;
      }

      .stats {
        gap: 16px;
        color: #718096;

        span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .extra {
      margin-top: 12px;
      gap: 12px;

      .category {
        background: #f7fafc;
        color: #2d3748;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
      }

      .time {
        color: #a0aec0;
      }
    }
  }
}

@media (max-width: 768px) {
  .article-card {
    flex-direction: column;
    padding: 16px;
    gap: 12px;

    .cover {
      width: 100%;
      height: 160px;
    }

    .content {
      .title {
        font-size: 16px;
      }

      .summary {
        font-size: 13px;
      }
    }
  }
}
</style>