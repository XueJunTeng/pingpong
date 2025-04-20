<!-- src/views/admin/ContentManagement.vue -->
<template>
  <div class="management-container">
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
  <el-table-column label="内容" min-width="140" align="center">
    <template #default="{ row }">
      <div v-if="row.type === 'VIDEO'" class="video-cover-container">
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

        <div class="play-overlay" @click.stop="handlePlayVideo(row)">
          <el-icon :size="32"><VideoPlay /></el-icon>
        </div>
      </div>

      <span v-else class="no-cover-text">N/A</span>
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
    <!-- 视频弹窗应放在最外层 -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useContentAuditStore } from '@/stores/contentAuditStore'
import { ElMessage } from 'element-plus'
import type { ContentItem } from '@/types/content'  // 添加类型导入
import { VideoPlay, Picture, Loading } from '@element-plus/icons-vue'


const auditStore = useContentAuditStore()
const processingId = ref<number | null>(null)

// 处理后的内容数据
const processedContents = computed(() =>
  auditStore.pendingContents.map(item => ({
    ...item,
    tags: item.tags || []
  }))
)

// 初始化加载数据
onMounted(() => {
  auditStore.fetchPendingContents()
})

// 类型标签样式
const getTypeTag = (type: string) => {
  return {
    VIDEO: 'danger',
    ARTICLE: 'warning',
    POST: 'success',
    COMMENT: 'info'
  }[type] || ''
}

// 类型显示文本
const getTypeLabel = (type: string) => {
  return {
    VIDEO: '视频',
    ARTICLE: '图文',
    POST: '帖子',
    COMMENT: '评论'
  }[type] || '未知类型'
}

// 视频播放状态
const showVideoDialog = ref(false)
const currentVideoUrl = ref('')
const videoPlayer = ref<HTMLVideoElement>() // 添加视频元素引用
  const handlePlayVideo = (row: ContentItem) => {
  console.log('播放事件触发，当前路由:', window.location.href)
  if (row.type !== 'VIDEO') return

  handleVideoClose() // 先停止之前的播放

  if (!row.filePath) {
    ElMessage.error('视频路径未配置')
    return
  }

  currentVideoUrl.value = `${row.filePath}?t=${Date.now()}`
  showVideoDialog.value = true
}

const handleVideoOpen = () => {
  // 这里可以放置视频打开后的处理逻辑，比如自动播放
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
    try {
      videoPlayer.value.pause()
      videoPlayer.value.currentTime = 0
      videoPlayer.value.removeAttribute('src') // 清除视频源
      videoPlayer.value.load()
    } catch (err) {
      console.error('停止播放失败:', err)
    }
  }
  currentVideoUrl.value = ''
}
// 新增调试方法
const handleVideoLoaded = (e: Event) => {
  const video = e.target as HTMLVideoElement
  console.log('视频元数据加载成功', {
    duration: video.duration,
    resolution: `${video.videoWidth}x${video.videoHeight}`
  })
}

const handleVideoError = (e: Event) => {
  const video = e.target as HTMLVideoElement
  console.error('视频加载错误', {
    error: video.error,
    networkState: video.networkState,
    readyState: video.readyState
  })
  ElMessage.error('视频加载失败，错误代码: ' + video.error?.code)
}

// 时间格式化
const formatTime = (isoString: string) => {
  return auditStore.formatDateTime(isoString)
}

// 分页变化处理
const handlePageChange = (newPage: number) => {
  auditStore.fetchPendingContents(newPage)
}

// 修改后的处理方法
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

const handleReject = async (contentId: number) => {
  try {
    processingId.value = contentId
    await auditStore.auditContent(contentId, 'REJECTED', '请补充驳回原因')
    ElMessage.warning('内容已驳回')
  } catch {
    ElMessage.error('操作失败，请重试')
  } finally {
    processingId.value = null
  }
}

// 查看详情
const viewDetail = (content: ContentItem) => {
  console.log('查看详情:', content.contentId, content.title)
  // 实际跳转逻辑
}
</script>

<style scoped>
/* 表格容器优化 */
.management-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

/* 表头优化 */
:deep(.el-table__header) th {
  font-weight: 600;
  color: #303133;
}

/* 单元格内容优化 */
.title-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.author-name {
  color: #606266;
  font-weight: 500;
}

.time-text {
  color: #909399;
  font-size: 0.9em;
}

/* 分页位置优化 */
.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  padding: 16px;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

/* 操作按钮间距优化 */
.el-button + .el-button {
  margin-left: 8px;
}
/* 视频封面容器 */
.video-cover-container {
  position: relative;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.03);

    .play-overlay {
      opacity: 1;
      background: rgba(0, 0, 0, 0.5);
    }
  }
  &::after {
    display: none !important; /* 临时禁用遮罩层 */
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }
}

.cover-image {
  width: 160px;
  height: 90px; /* 16:9比例 */
  background: #f0f2f5;
}

.play-overlay {
  pointer-events: auto !important;
  z-index: 1000 !important;
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
  z-index: 2; /* 确保按钮在最上层 */
  pointer-events: none; /* 穿透点击事件 */
}


.image-error, .image-loading {
  @extend .cover-image;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;

  .el-icon {
    color: #c0c4cc;
    font-size: 24px;
  }
}

.no-cover-text {
  color: #909399;
  font-size: 0.9em;
}

.video-player {
  width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  background: #000;
}
</style>