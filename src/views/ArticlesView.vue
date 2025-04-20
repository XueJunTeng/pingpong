<!-- src/views/ArticlesView.vue -->
<template>
  <div class="article-view-page">
    <!-- 推荐标题 -->
    <div class="recommend-header">
      <h2 class="title">
        <span class="highlight">推荐好文</span>
        <span class="en-title">Featured Articles</span>
      </h2>
      <div class="decorative-line"></div>
    </div>

    <!-- 文章列表组件 -->
    <ArticleList
      :videos="videoStore.reArticles"
      :loading="videoStore.loading"
      :error?="videoStore.error"
      @retry="videoStore.fetchcontents"
     />
  </div>
</template>

<script setup lang="ts">
import ArticleList from '@/components/ArticleList.vue'
import { useVideoStore } from '@/stores/videoStore'
import { onMounted } from 'vue'
const videoStore = useVideoStore()

onMounted(async () => {
  await videoStore.fetchcontents()
})

</script>

<style lang="scss" scoped>
.article-view-page {
  background: #f8fafc;
  padding: 40px 0;
  min-height: 100vh;

  .recommend-header {
    text-align: center;
    margin-bottom: 30px;

    .title {
      font-size: 2.2rem;
      color: #2d3748;
      margin-bottom: 1rem;

      .highlight {
        position: relative;
        &::after {
          content: '';
          position: absolute;
          bottom: 6px;
          left: 0;
          width: 100%;
          height: 10px;
          background: rgba(79, 192, 141, 0.2);
        }
      }

      .en-title {
        display: block;
        font-size: 0.9rem;
        color: #718096;
        letter-spacing: 1.5px;
        margin-top: 6px;
      }
    }

    .decorative-line {
      width: 100px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #4fc08d, transparent);
      margin: 0 auto;
    }
  }

  @media (max-width: 768px) {
    padding: 30px 0;

    .recommend-header {
      .title {
        font-size: 1.8rem;

        .en-title {
          font-size: 0.8rem;
        }
      }

      .decorative-line {
        width: 80px;
      }
    }
  }
}
</style>