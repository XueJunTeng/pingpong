<template>
  <div class="articles-page">
    <!-- 轮播图组件 -->
    <Carousel />

    <!-- 二级导航栏组件 -->
    <SubNavbar />

    <!-- 推荐标题 -->
    <div class="recommend-header">
      <div class="header-container">
        <h2 class="title">
          <span class="highlight">推荐好文</span>
          <span class="en-title">Featured Articles</span>
        </h2>
        <!-- 新增过滤开关 -->
        <div class="filter-switch">
          <span class="switch-label">过滤已观看</span>
          <BiliSwitch :modelValue="videoStore.filterViewed"
                      @update:modelValue="val => videoStore.setFilterViewed(val)" />
        </div>
      </div>
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
import { onMounted, watch } from 'vue'
import Carousel from '@/components/CarouselOne.vue'
import SubNavbar from '@/components/SubNavbar.vue'
import ArticleList from '@/components/ArticleList.vue'
import BiliSwitch from '@/components/BiliSwitch.vue'
import { useVideoStore } from '@/stores/videoStore'

const videoStore = useVideoStore()

// 监听过滤状态变化
watch(
  () => videoStore.filterViewed,
  () => {
    videoStore.fetchcontents()
  }
)

onMounted(async () => {
  await videoStore.fetchcontents()
})
</script>

<style lang="scss" scoped>
.articles-page {
  flex: 1;
  background: #f8fafc;
  padding-bottom: 40px;

  .recommend-header {
    max-width: 1280px;
    margin: 30px auto 20px;
    padding: 0 20px;
    position: relative;

    .header-container {
      position: relative;
      text-align: center;
      margin-bottom: 1rem;
    }

    .title {
      font-size: 2.5rem;
      color: #2d3748;
      display: inline-block;
      position: relative;
      margin: 0 auto;
      padding: 0 120px;

      .highlight {
        position: relative;
        z-index: 1;
        &::after {
          content: '';
          position: absolute;
          bottom: 8px;
          left: 0;
          width: 100%;
          height: 12px;
          background: rgba(79, 192, 141, 0.2);
          z-index: -1;
          border-radius: 4px;
        }
      }

      .en-title {
        display: block;
        font-size: 1rem;
        color: #718096;
        letter-spacing: 2px;
        margin-top: 8px;
        font-weight: 300;
      }
    }

    .filter-switch {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 2;

      .switch-label {
        font-size: 14px;
        color: #2d3748;
        font-weight: 500;
        white-space: nowrap;
      }
    }

    .decorative-line {
      width: 120px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #4fc08d, transparent);
      margin: 10px auto 0;
      opacity: 0.6;
    }
  }

  @media (max-width: 768px) {
    .recommend-header {
      padding: 0 15px;
      margin: 20px auto;

      .title {
        font-size: 1.8rem;
        padding: 0 90px;

        .en-title {
          font-size: 0.8rem;
        }
      }

      .filter-switch {
        padding: 6px 12px;

        .switch-label {
          font-size: 12px;
        }
      }

      .decorative-line {
        width: 80px;
      }
    }
  }

  @media (max-width: 480px) {
    .recommend-header {
      .title {
        padding: 0 60px;
        font-size: 1.5rem;
      }

      .filter-switch {
        .switch-label {
          display: none;
        }
      }
    }
  }

  :deep(.article-list-container) {
    max-width: 1280px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
      padding: 15px;
      border-radius: 8px;
    }
  }
}
</style>
