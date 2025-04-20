<!-- src/components/VideoCard.vue -->
<template>
  <div class="video-card"
  @click="$router.push({
  name: 'VideoDetail',
  params: { contentId: video.contentId }
})">
    <img :src="video.cover" class="cover" alt="封面">
    <div class="info">
      <h3 class="title">{{ video.title }}</h3>
      <div class="meta">
        <span class="author">@{{ video.author }}</span>
        <span class="views">👁 {{ video.views.toLocaleString() }}次播放</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {contentItem} from '@/types/contentMetadata';
defineProps<{
  video: contentItem
}>()
</script>

<style lang="scss" scoped>
.video-card {
  background: white;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-3px);
  }

  .cover {
    width: 100%;
    height: 180px;
    object-fit: cover;
    border-radius: 6px 6px 0 0;
  }

  .info {
    padding: 12px;
    .title {
      margin: 0;
      font-size: 14px;
      color: #333;
      @include ellipsis(2);
    }
    .meta {
      margin-top: 8px;
      font-size: 12px;
      color: #666;
      display: flex;
      justify-content: space-between;
    }
  }
}
</style>