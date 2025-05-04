<!-- src/components/VideoRecommendList.vue -->
<template>
  <div class="recommend-container">
    <h3 class="recommend-title">相关推荐</h3>
    <div class="video-list">
      <VideoCard
        v-for="video in filteredVideos"
        :key="video.contentId"
        :video="video"
        class="recommend-item"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import VideoCard from '@/components/VideoCard.vue'
import { useVideoStore } from '@/stores/videoStore'
import {computed, onMounted} from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const videoStore = useVideoStore()

onMounted(async () => {
  await videoStore.fetchRelatedVideos(Number(route.params.contentId))
})

// 过滤当前正在观看的视频
const filteredVideos = computed(() => {
  return videoStore.relatedVideos
})
</script>

<style lang="scss" scoped>
.recommend-container {
  margin-left: 30px;
  width: 320px;
  flex-shrink: 0;

  .recommend-title {
    font-size: 18px;
    color: #222;
    margin: 0 0 16px 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #00a1d6;
  }

  .video-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .recommend-item {
    transition: transform 0.2s;

    &:hover {
      transform: translateX(5px);
    }

    :deep(.cover) {
      height: 140px;
      border-radius: 4px;
    }

    :deep(.title) {
      font-size: 14px;
      line-height: 1.4;
    }
  }
}

@media (max-width: 1200px) {
  .recommend-container {
    width: 280px;
    margin-left: 20px;
  }
}

@media (max-width: 992px) {
  .recommend-container {
    width: 100%;
    margin: 30px 0 0;

    .video-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }
  }
}
</style>
