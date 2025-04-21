<template>
  <div class="management-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="searchParams.keyword"
            placeholder="请输入标题/作者"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="内容类型">
          <el-select
            v-model="searchParams.contentType"
            placeholder="全部类型"
            clearable
          >
            <el-option
              v-for="type in contentTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleSearch"
            :loading="auditStore.loading"
          >
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <h2>内容审核</h2>

    <!-- 加载状态 -->
    <el-skeleton :loading="auditStore.loading" animated>
      <template #template>
        <el-skeleton-item variant="rect" style="width: 100%; height: 400px" />
      </template>

      <!-- 主要内容 -->
      <template #default>
        <!-- 错误提示 -->
        <el-alert
          v-if="auditStore.error"
          :title="auditStore.error"
          type="error"
          show-icon
          @close="auditStore.error = null"
        />

        <!-- 数据表格 -->
        <el-table
          :data="processedContents"
          border
          style="width: 100%"
          empty-text="暂无待审内容"
          :header-cell-style="{ background: '#f5f7fa' }"
        >
          <el-table-column prop="title" label="标题" min-width="240">
            <template #default="{ row }">
              <div class="title-cell">
                {{ row.title }}
              </div>
            </template>
          </el-table-column>

          <!-- 封面列 -->
          <el-table-column label="浏览" min-width="140" align="center">
            <template #default="{ row }">
              <div
                :class="['cover-container', { 'video-cover-container': row.type === 'VIDEO' }]"
                @click="row.type === 'VIDEO' && handlePlayVideo(row)"
              >
                <el-image
                  :src="row.coverImageUrl || '/default-cover.jpg'"
                  fit="cover"
                  class="cover-image"
                  :preview-src-list="row.type === 'VIDEO' ? [row.coverImageUrl] : []"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>

                  <template #placeholder>
                    <div class="image-loading">
                      <el-icon class="is-loading"><Loading /></el-icon>
                    </div>
                  </template>
                </el-image>

                <!-- 视频播放按钮 -->
                <div
                  v-if="row.type === 'VIDEO'"
                  class="play-overlay"
                >
                  <el-icon :size="32"><VideoPlay /></el-icon>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="类型" min-width="120" align="center">
            <template #default="{ row }">
              <el-tag
                :type="getTypeTag(row.type)"
                effect="plain"
              >
                {{ getTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="作者" min-width="140" align="center">
            <template #default="{ row }">
              <span class="author-name">
                {{ row.author || '未知用户' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="提交时间" min-width="160" align="center">
            <template #default="{ row }">
              <time class="time-text">
                {{ formatTime(row.createdTime) }}
              </time>
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            width="220"
            align="center"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                type="success"
                size="small"
                @click="handleApprove(row.contentId)"
                :loading="processingId === row.contentId"
              >
                通过
              </el-button>
              <el-button
                type="warning"
                size="small"
                @click="handleReject(row.contentId)"
                :loading="processingId === row.contentId"
              >
                驳回
              </el-button>
              <el-button
                size="small"
                @click="viewDetail(row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
          class="pagination"
          v-model:current-page="auditStore.pagination.page"
          :page-size="auditStore.pagination.pageSize"
          :total="auditStore.pagination.total"
          layout="total, prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </template>
    </el-skeleton>

    <!-- 视频弹窗 -->
    <el-dialog
      v-model="showVideoDialog"
      title="视频预览"
      width="70%"
      @open="handleVideoOpen"
      @close="handleVideoClose"
    >
      <video
        ref="videoPlayer"
        controls
        class="video-player"
        @loadedmetadata="handleVideoLoaded"
        @error="handleVideoError"
      >
        <source :src="currentVideoUrl" type="video/mp4">
        您的浏览器不支持视频播放
      </video>
    </el-dialog>

    <!-- 驳回原因弹窗 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="请选择驳回原因"
      width="500px"
      @closed="handleRejectDialogClose"
    >
      <el-form :model="rejectReason" :rules="rejectRules" ref="rejectForm">
        <el-form-item label="驳回原因" prop="selectedReason">
          <el-select
            v-model="rejectReason.selectedReason"
            placeholder="请选择驳回原因"
            style="width: 100%"
          >
            <el-option
              v-for="reason in rejectReasons"
              :key="reason.value"
              :label="reason.label"
              :value="reason.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="rejectReason.selectedReason === 'other'"
          label="具体原因"
          prop="customReason"
        >
          <el-input
            v-model="rejectReason.customReason"
            type="textarea"
            placeholder="请输入具体驳回原因"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="handleRejectConfirm">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <content-detail-dialog
      v-model="detailVisible"
      :content="selectedContent"
      :loading="detailLoading"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { ContentItem } from '@/types/content'
import { VideoPlay, Picture, Loading } from '@element-plus/icons-vue'
import type { Rule } from 'async-validator'
import { reactive } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { useContentAuditStore } from '@/stores/contentAuditStore'
import ContentDetailDialog from '@/components/ContentDetailDialog.vue'

interface SearchParams {
  keyword: string
  contentType: string
}

// 搜索参数
const searchParams = reactive<SearchParams>({
  keyword: '',
  contentType: ''
})

// 内容类型选项
const contentTypes = [
  { value: 'VIDEO', label: '视频' },
  { value: 'ARTICLE', label: '文章' },
]

// 搜索处理
watchDebounced(
  () => ({ ...searchParams }),
  () => {
    if (searchParams.keyword.length >= 2 || searchParams.keyword === '') {
      handleSearch()
    }
  },
  { debounce: 500, deep: true }
)

const handleSearch = () => {
  auditStore.fetchPendingContents({
    page: 1,
    keyword: searchParams.keyword,
    contentType: searchParams.contentType
  })
}

// 审核相关
const auditStore = useContentAuditStore()
const processingId = ref<number | null>(null)

// 分页处理
const handlePageChange = (newPage: number) => {
  auditStore.fetchPendingContents({
    page: newPage,
    keyword: searchParams.keyword,
    contentType: searchParams.contentType
  })
}

// 内容处理
const processedContents = computed(() =>
  auditStore.pendingContents.map(item => ({
    ...item,
    tags: item.tags || []
  }))
)

// 初始化加载
onMounted(() => {
  auditStore.fetchPendingContents()
})

// 类型显示
const getTypeTag = (type: string) => {
  return {
    VIDEO: 'danger',
    ARTICLE: 'warning',
    POST: 'success',
    COMMENT: 'info'
  }[type] || ''
}

const getTypeLabel = (type: string) => {
  return {
    VIDEO: '视频',
    ARTICLE: '图文',
    POST: '帖子',
    COMMENT: '评论'
  }[type] || '未知类型'
}

// 视频播放相关
const showVideoDialog = ref(false)
const currentVideoUrl = ref('')
const videoPlayer = ref<HTMLVideoElement>()

const handlePlayVideo = (row: ContentItem) => {
  if (row.type !== 'VIDEO') return
  handleVideoClose()

  if (!row.filePath) {
    ElMessage.error('视频路径未配置')
    return
  }

  currentVideoUrl.value = `${row.filePath}?t=${Date.now()}`
  showVideoDialog.value = true
}

const handleVideoOpen = () => {
  nextTick(() => {
    if (videoPlayer.value) {
      videoPlayer.value.play().catch(err => {
        console.error('自动播放失败:', err)
      })
    }
  })
}

const handleVideoClose = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
    videoPlayer.value.removeAttribute('src')
    videoPlayer.value.load()
  }
  currentVideoUrl.value = ''
}

const handleVideoLoaded = (e: Event) => {
  const video = e.target as HTMLVideoElement
  console.log('视频元数据加载成功', {
    duration: video.duration,
    resolution: `${video.videoWidth}x${video.videoHeight}`
  })
}

const handleVideoError = (e: Event) => {
  const video = e.target as HTMLVideoElement
  ElMessage.error('视频加载失败，错误代码: ' + video.error?.code)
}

// 时间格式化
const formatTime = (isoString: string) => {
  return auditStore.formatDateTime(isoString)
}

// 审核操作
const handleApprove = async (contentId: number) => {
  try {
    processingId.value = contentId
    await auditStore.auditContent(contentId, 'APPROVED')
    ElMessage.success('内容已通过审核')
  } catch {
    ElMessage.error('操作失败，请重试')
  } finally {
    processingId.value = null
  }
}

// 驳回相关
const rejectDialogVisible = ref(false)
const currentRejectId = ref<number | null>(null)
const rejectForm = ref()
const rejectReasons = ref([
  { value: '1', label: '内容违规' },
  { value: '2', label: '内容与标题不符' },
  { value: '3', label: '内容与标签不符' },
  { value: '4', label: '包含敏感信息' },
  { value: 'other', label: '其他原因' }
])

const rejectReason = reactive({
  selectedReason: '',
  customReason: ''
})

const rejectRules = {
  selectedReason: [
    { required: true, message: '请选择驳回原因', trigger: 'change' }
  ],
  customReason: [
    {
      validator: (
        rule: Rule,
        value: string,
        callback: (error?: string) => void
      ) => {
        if (rejectReason.selectedReason === 'other' && !value.trim()) {
          callback('请输入具体驳回原因')
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleReject = (contentId: number) => {
  currentRejectId.value = contentId
  rejectDialogVisible.value = true
}

const handleRejectConfirm = async () => {
  try {
    await rejectForm.value.validate()

    if (currentRejectId.value === null) return

    const reason = rejectReason.selectedReason === 'other'
      ? rejectReason.customReason
      : rejectReasons.value.find(r => r.value === rejectReason.selectedReason)?.label

    if (!reason) {
      ElMessage.error('请填写有效驳回原因')
      return
    }

    processingId.value = currentRejectId.value
    await auditStore.auditContent(currentRejectId.value, 'REJECTED', reason)
    ElMessage.warning('内容已驳回')
    rejectDialogVisible.value = false
  } catch (err) {
    console.error('驳回操作失败:', err)
  } finally {
    processingId.value = null
  }
}

const handleRejectDialogClose = () => {
  rejectForm.value?.resetFields()
  currentRejectId.value = null
}

// 详情相关
const detailVisible = ref(false)
const selectedContent = ref<ContentItem>({} as ContentItem)
const detailLoading = ref(false)

const viewDetail = async (content: ContentItem) => {
  try {
    detailLoading.value = true
    selectedContent.value = content
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取详情失败')
    console.error('详情加载错误:', error)
  } finally {
    detailLoading.value = false
  }
}
</script>

<style scoped>
.management-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.search-bar {
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 24px;
  }

  :deep(.el-select) {
    width: 240px;
  }

  .el-input {
    width: 240px;
  }
}

/* 表格样式 */
:deep(.el-table__header) th {
  font-weight: 600;
  color: #303133;
}

.title-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.author-name {
  color: #606266;
  font-weight: 500;
}

.time-text {
  color: #909399;
  font-size: 0.9em;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  padding: 16px;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

/* 封面样式 */
.cover-container {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.video-cover-container {
  cursor: pointer;

  &:hover {
    transform: scale(1.03);

    .play-overlay {
      opacity: 1;
      background: rgba(0, 0, 0, 0.5);
    }
  }
}

.cover-image {
  width: 160px;
  height: 90px;
  background: #f0f2f5;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: all 0.3s ease;
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
}

.image-error, .image-loading {
  width: 160px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;

  .el-icon {
    color: #c0c4cc;
    font-size: 24px;
  }
}

.video-player {
  width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  background: #000;
}

/* 操作按钮间距 */
.el-button + .el-button {
  margin-left: 8px;
}
</style>