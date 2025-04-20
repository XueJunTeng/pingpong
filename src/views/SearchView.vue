<!-- components/SearchView.vue -->
<template>
  <div class="search-view">
    <div class="search-filter">
      <div class="filter-container">
        <div class="type-filter">
          <el-radio-group v-model="selectedType">
            <el-radio-button label="ALL">全部</el-radio-button>
            <el-radio-button label="VIDEO">视频</el-radio-button>
            <el-radio-button label="ARTICLE">文章</el-radio-button>
          </el-radio-group>
        </div>

        <div class="tag-filter">
          <TagSelector v-model:selected-tags="selectedTags" />
        </div>
      </div>
    </div>

    <div class="search-results">
      <el-skeleton v-if="loading" :rows="6" animated />

      <template v-else>
        <section v-if="showVideos" class="result-section">
          <h3 class="section-title">视频结果（{{ filteredVideos.length }}）</h3>
          <div class="card-grid">
            <VideoCard
              v-for="video in filteredVideos"
              :key="`video_${video.contentId}`"
              :video="video"
            />
          </div>
        </section>

        <section v-if="showArticles" class="result-section">
          <h3 class="section-title">文章结果（{{ filteredArticles.length }}）</h3>
          <div class="card-grid">
            <ArticleCard
              v-for="article in filteredArticles"
              :key="`article_${article.contentId}`"
              :article="article"
            />
          </div>
        </section>

        <el-empty
          v-if="showEmpty"
          :description="emptyText"
          class="empty-status"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useVideoStore } from '@/stores/videoStore'
import TagSelector from '@/components/TagSelector.vue'
import VideoCard from '@/components/VideoCard.vue'
import ArticleCard from '@/components/ArticleCard.vue'

const route = useRoute()
const videoStore = useVideoStore()
const { results, loading } = storeToRefs(videoStore)

// 过滤状态
const selectedType = ref<'ALL' | 'VIDEO' | 'ARTICLE'>('ALL')
const selectedTags = ref<number[]>([])

// 过滤逻辑
const filteredContents = computed(() => {
  return results.value.filter(content => {
    // 类型过滤
    const typeMatch = selectedType.value === 'ALL' ||
      content.type === selectedType.value

    // 标签过滤
    const tagMatch = selectedTags.value.length === 0 ||
      content.tags?.some(tag => selectedTags.value.includes(tag))

    return typeMatch && tagMatch
  })
})

const filteredVideos = computed(() =>
  filteredContents.value.filter(c => c.type === 'VIDEO')
)

const filteredArticles = computed(() =>
  filteredContents.value.filter(c => c.type === 'ARTICLE')
)

// 显示控制
const showVideos = computed(() => selectedType.value !== 'ARTICLE')
const showArticles = computed(() => selectedType.value !== 'VIDEO')

// 空状态
const showEmpty = computed(() => {
  return !loading.value && filteredContents.value.length === 0
})

const emptyText = computed(() => {
  if (selectedTags.value.length > 0) return '没有找到匹配的内容'
  return route.query.q ? `没有找到 "${route.query.q}" 的结果` : '请输入搜索内容'
})

// 搜索执行
const performSearch = (query: string) => {
  if (query) videoStore.fetchsearch(query)
}

// 初始加载
onMounted(() => {
  const query = route.query.q?.toString()
  if (query) performSearch(query)
})

// 路由更新监听
onBeforeRouteUpdate((to) => {
  const newQuery = to.query.q?.toString()
  if (newQuery) performSearch(newQuery)
})
</script>

<style scoped lang="scss">
.search-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.search-filter {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;

  .filter-container {
    padding: 20px;
  }

  .type-filter {
    margin-bottom: 16px;

    :deep(.el-radio-group) {
      width: 100%;
      display: flex;
    }

    :deep(.el-radio-button) {
      flex: 1;
      text-align: center;
    }
  }

  .tag-filter {
    margin-top: 12px;
  }
}

.search-results {
  .result-section {
    margin-bottom: 32px;

    .section-title {
      font-size: 18px;
      color: #333;
      margin: 0 0 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }
}

.empty-status {
  padding: 80px 0;
  background: #fff;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .search-view {
    padding: 16px;
  }

  .search-filter {
    .filter-container {
      padding: 16px;
    }

    :deep(.el-radio-group) {
      flex-direction: column;
    }

    :deep(.el-radio-button) {
      margin-bottom: 8px;
    }
  }

  .card-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>