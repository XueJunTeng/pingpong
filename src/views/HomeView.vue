<!-- src/views/HomeView.vue -->
<!-- src/views/HomeView.vue -->
<template>
  <div class="home-page">
    <!-- 轮播图组件 -->
    <Carousel />

    <!-- 二级导航栏组件 -->
    <SubNavbar/>
        <!-- 推荐标题 -->
        <div class="recommend-header">
      <h2 class="title">
        <span class="highlight">精选推荐</span>
        <span class="en-title">Featured Videos</span>
      </h2>
      <div class="decorative-line"></div>
    </div>
    <!-- 视频列表组件 -->
    <VideoList
      :videos="videoStore.reVideos"
      :loading="videoStore.loading"
      :error?="videoStore.error"
      @retry="videoStore.fetchcontents"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Carousel from '@/components/CarouselOne.vue'
import SubNavbar from '@/components/SubNavbar.vue'
import VideoList from '@/components/VideoList.vue'
import { useVideoStore } from '@/stores/videoStore'

const videoStore = useVideoStore()

onMounted(async () => {
  await videoStore.fetchcontents()
})
</script>

<style lang="scss" scoped>
.home-page {
  flex: 1;
  background: #f8fafc;
  padding-bottom: 40px;

  .recommend-header {
    text-align: center;
    margin: 10px 0 30px;
    position: relative;

    .title {
      font-size: 2.5rem;
      color: #2d3748;
      margin-bottom: 1rem;
      position: relative;
      display: inline-block;

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
          background: rgba(0, 174, 236, 0.2);
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

    .decorative-line {
      width: 120px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00aeec, transparent);
      margin: 0 auto;
      opacity: 0.6;
    }
  }

  // 响应式调整
  @media (max-width: 768px) {
    .recommend-header {
      margin: 30px 0 20px;

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

  :deep(.video-list-container) {
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