<!-- src/components/content/ContentDetailDialog.vue -->
<template>
  <el-dialog
    :model-value="modelValue"
    :title="content.title"
    width="800px"
    custom-class="content-detail-dialog"
    @update:model-value="handleClose"
  >
    <div v-loading="loading" class="content-container">
      <!-- 元数据 -->
      <div class="metadata">
        <div class="meta-item">
          <span class="label">作者：</span>
          <span class="value">{{ content.author || '未知作者' }}</span>
        </div>
        <div class="meta-item">
          <span class="label">创建时间：</span>
          <span class="value">{{ formatTime(content.createdTime) }}</span>
        </div>
        <div class="meta-item">
          <span class="label">类型：</span>
          <el-tag :type="contentTypeTag">
            {{ getTypeLabel(content.type) }}
          </el-tag>
        </div>
        <div class="meta-item">
          <span class="label">状态：</span>
          <el-tag :type="statusTagType">
            {{ getStatusLabel(content.status) }}
          </el-tag>
        </div>
      </div>

      <!-- 封面（公共部分） -->
      <div v-if="content.coverImageUrl" class="cover-section">
        <h3 class="section-title">封面</h3>
        <el-image
          :src="content.coverImageUrl"
          fit="cover"
          class="content-cover"
          :preview-src-list="[content.coverImageUrl]"
        >
          <template #error>
            <div class="image-error">
              <el-icon><Picture /></el-icon>
              <span>封面加载失败</span>
            </div>
          </template>
        </el-image>
      </div>

      <!-- 内容主体 -->
      <div class="content-body">
        <template v-if="content.type === 'ARTICLE'">
          <h3 class="section-title">文章内容</h3>
          <div class="article-content">
            {{ content.description }}
          </div>
        </template>

        <template v-else-if="content.type === 'VIDEO'">
          <h3 class="section-title">视频信息</h3>
          <div class="video-info">
            <p>时长：{{ content.duration ? `${content.duration}秒` : '未知' }}</p>
            <p v-if="content.filePath">文件路径：{{ content.filePath }}</p>
          </div>
        </template>
      </div>

      <!-- 标签 -->
      <div class="tags-section" v-if="content.tags?.length">
        <h3 class="section-title">关联标签</h3>
        <div class="tag-list">
          <el-tag
            v-for="tag in content.tags"
            :key="tag.tagId"
            type="info"
            class="tag-item"
          >
            {{ tag.tagName }}
          </el-tag>
        </div>
      </div>

      <!-- 审核信息 -->
      <div v-if="content.status === 'REJECTED'" class="review-notes">
        <h3 class="section-title">驳回原因</h3>
        <div class="notes-content">
          {{ content.reviewNotes || '无具体说明' }}
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed} from 'vue'
import type { PropType } from 'vue'
import type { ContentItem } from '@/types/content'
import {
  Picture
} from '@element-plus/icons-vue'

const props = defineProps({
  content: {
    type: Object as PropType<ContentItem>,
    required: true
  },
  modelValue: { // 重命名 prop 为 modelValue
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:model-value']) // 更新事件名称

const handleClose = (value: boolean) => {
  emit('update:model-value', value)
}

// 类型标签样式
const contentTypeTag = computed(() => {
  return {
    VIDEO: 'danger',
    ARTICLE: 'warning'
  }[props.content.type] || 'info'
})

// 状态标签样式
const statusTagType = computed(() => {
  return {
    PENDING: 'info',
    APPROVED: 'success',
    REJECTED: 'danger'
  }[props.content.status]
})

// 类型显示文本
const getTypeLabel = (type: string) => {
  return {
    VIDEO: '视频',
    ARTICLE: '文章'
  }[type] || '未知类型'
}

// 状态显示文本
const getStatusLabel = (status: string) => {
  return {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已驳回'
  }[status] || '未知状态'
}

// 时间格式化
const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '无效时间'
  }
}
</script>

<style lang="scss" scoped>
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.content-detail-dialog {
  .content-container {
    max-height: 70vh;
    overflow-y: auto;
    padding: 0 20px;

    .metadata {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;

      .meta-item {
        display: flex;
        align-items: center;

        .label {
          color: #606266;
          min-width: 70px;
        }

        .value {
          color: #303133;
        }
      }
    }

    .section-title {
      color: #303133;
      font-size: 16px;
      margin: 20px 0 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }

    .article-content {
      line-height: 1.6;
      color: #606266;
      white-space: pre-wrap;
    }

    .content-cover {
      width: 100%;
      max-width: 400px;
      border-radius: 8px;
      overflow: hidden;

      :deep(.image-error) {
        @include flex-center;
        background: #f5f7fa;
        color: #c0c4cc;
        height: 200px;
        flex-direction: column;

        span {
          margin-top: 8px;
        }
      }
    }

    .interaction-data {
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;

        .metric-item {
          @include flex-center;
          flex-direction: column;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;

          .el-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }

          span {
            font-size: 14px;
            color: #606266;
          }
        }
      }
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .tag-item {
        margin: 4px;
      }
    }

    .review-notes {
      background: #fff6f6;
      border-radius: 8px;
      padding: 16px;
      margin-top: 20px;

      .notes-content {
        color: #f56c6c;
        line-height: 1.6;
      }
    }
  }
}
</style>