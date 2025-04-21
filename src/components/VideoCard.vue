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
  background: hsl(0, 0%, 100%);
  border: 1px solid hsl(0, 0%, 90%); // 新增边框
  box-sizing: border-box;         // 确保边框不增加元素尺寸
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); // 可选添加悬停阴影增强效果
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