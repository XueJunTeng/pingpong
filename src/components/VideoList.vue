<template>
  <div class="video-list-page">
    <!-- 标签过滤器 -->
    <TagSelector v-model:selected-tags="selectedTags" />

    <!-- 内容展示 -->
    <div class="video-grid">
      <VideoCard
        v-for="video in filteredVideos"
        :key="video.contentId"
        :video="video"
      />
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="!filteredVideos.length"
      description="没有找到相关视频"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'
import TagSelector from '@/components/TagSelector.vue'
import VideoCard from '@/components/VideoCard.vue'
import { useTagFilter } from '@/composables/useTagFilter.ts'
import type {contentItem} from '@/types/contentMetadata';

// 视频数据
// 定义接收的props
const props = defineProps({
  videos: {
    type: Array as PropType<contentItem[]>,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})
const videoList = computed(() => props.videos)
// 过滤逻辑
const selectedTags = ref<number[]>([])
const filteredVideos = useTagFilter(videoList, selectedTags)
</script>

<style scoped>
.video-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background-color: #f5f5f5; /* 新增背景颜色 */
  border-radius: 8px;       /* 可选：添加圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 可选：添加阴影 */
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr;
  }
}
</style>