<template>
  <div class="article-list-page">
    <!-- 标签过滤器 -->
    <TagSelector v-model:selected-tags="selectedTags" />

    <!-- 内容展示 -->
    <div class="article-grid">
      <ArticleCard
        v-for="article in filteredArticles"
        :key="article.contentId"
        :article="article"
      />
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="!filteredArticles.length"
      description="没有找到相关文章"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'
import TagSelector from '@/components/TagSelector.vue'
import ArticleCard from '@/components/ArticleCard.vue'
import { useTagFilter } from '@/composables/useTagFilter.ts'
import type { contentItem } from '@/types/contentMetadata';

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
const filteredArticles = useTagFilter(videoList, selectedTags)

</script>

<style scoped>
.article-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .article-grid {
    grid-template-columns: 1fr;
  }
}
</style>