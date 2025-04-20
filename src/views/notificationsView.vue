<template>
  <div class="notifications-container">
    <!-- 左侧导航 -->
    <div class="nav-sidebar">
      <div class="sidebar-header">
        <h2>消息中心</h2>
      </div>
      <el-menu
        :default-active="activeTab"
        @select="handleTabChange"
        class="notification-menu"
      >
        <el-menu-item index="REPLY_AND_COMMENT">
          <el-icon><ChatDotRound /></el-icon>
          <span>回复我的</span>
          <span v-if="counts.replyComment > 0" class="unread-count">{{ counts.replyComment }}</span>
        </el-menu-item>

        <el-menu-item index="LIKE">
          <el-icon><Goods /></el-icon>
          <span>收到的赞</span>
          <span v-if="counts.like > 0" class="unread-count">{{ counts.like }}</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧内容 -->
    <div class="content-main">
      <div v-loading="loading" class="notification-list">
        <template v-if="filteredNotifications.length > 0">
          <div
            v-for="item in filteredNotifications"
            :key="item.notificationId"
            class="notification-item"
            :class="{ unread: !item.isRead }"
          >
            <!-- 头像区域 -->
            <div class="avatar-wrapper">
              <el-avatar
                :src="item.senderAvatarUrl"
                :size="40"
              />
              <div class="notification-icon">
                <component :is="typeIcons[item.type]" />
              </div>
            </div>

            <!-- 内容区域 -->
            <div class="content-wrapper">
              <div class="content-header">
                <span class="username">{{ item.senderUsername }}</span>
                <span class="time">{{ formatTime(item.createdTime) }}</span>
                <el-tag
                  v-if="activeTab === 'REPLY_AND_COMMENT'"
                  size="small"
                  :type="item.type === 'COMMENT' ? 'primary' : 'success'"
                  class="type-tag"
                >
                  {{ item.type === 'COMMENT' ? '评论' : '回复' }}
                </el-tag>
              </div>
              <div class="content-body">
                <div class="message-text">{{ item.message }}</div>
                <template v-if="item.commentContent">
                  <div class="comment-preview">
                    {{ item.commentContent }}
                  </div>
                </template>
                <el-link
                  v-if="item.contentTitle"
                  type="info"
                  class="content-link"
                  @click="navigateToContent(item)"
                >
                  查看内容：{{ item.contentTitle }}
                </el-link>
              </div>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <el-empty v-else description="暂时没有新通知哦~" class="text-only-empty">
          <template #image>
            <div class="text-empty-wrapper">
              <el-icon class="empty-icon"><ChatDotRound /></el-icon>
              <p class="empty-tip">去和其他玩家互动吧！</p>
            </div>
          </template>
        </el-empty>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChatDotRound, Goods } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/api/request'
import { useNotificationsStore } from '@/stores/notifications'
interface Notification {
  notificationId: number
  senderId: number
  receiverId: number
  contentId: number
  commentId: number | null
  type: 'LIKE' | 'REPLY' | 'COMMENT'
  message: string
  isRead: boolean
  createdTime: string
  senderAvatarUrl: string
  senderUsername: string
  contentTitle: string
  commentContent: string | null
  total: number
  contentType: string
}

// 路由处理
const route = useRoute()
const router = useRouter()

// 响应式数据
const activeTab = ref<string>((route.query.type as string) || 'REPLY_AND_COMMENT')
const loading = ref(false)
const allNotifications = ref<Notification[]>([])
const filteredNotifications = ref<Notification[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 类型图标映射
const typeIcons = {
  LIKE: Goods,
  REPLY: ChatDotRound,
  COMMENT: ChatDotRound
}

// 未读数
const counts = ref({
  replyComment: 0,
  like: 0
})

// 生命周期
onMounted(() => {
  loadNotifications()
})

// 监听路由变化
watch(() => route.query.type, (newType) => {
  if (newType) {
    activeTab.value = newType.toString()
    filterNotifications()
  }
})

// 方法
const handleTabChange = (tab: string) => {
  activeTab.value = tab
  currentPage.value = 1
  filterNotifications()
}

const formatTime = (time: string) => {
  return dayjs(time).format('MM-DD HH:mm')
}

const navigateToContent = (item: Notification) => {
  if (!item.contentId || !item.contentType) {
    console.warn('缺少必要的内容参数', item)
    return ElMessage.warning('内容参数不完整')
  }

  const CONTENT_TYPE_ROUTES = {
    article: 'ArticleDetail',
    video: 'VideoDetail',
  } as const

  const routeName = CONTENT_TYPE_ROUTES[item.contentType.toLowerCase() as keyof typeof CONTENT_TYPE_ROUTES]

  if (!routeName) {
    console.error('未知的内容类型:', item.contentType)
    return ElMessage.error('暂不支持该内容类型')
  }

  router.push({
    name: routeName,
    params: {
      contentId: item.contentId
    }
  })
}
// 新增批量标记方法
const markBatchAsRead = async (ids: number[]) => {
  if (ids.length === 0) return

  try {
    // 调用批量标记API
    await request.post('/api/notifications/batch-read', { ids })

    // 更新本地未读数
    const currentUnread = notificationsStore.unreadTotal - ids.length
    notificationsStore.setUnreadTotal(Math.max(currentUnread, 0))

  } catch (error) {
    console.error('批量标记已读失败:', error)
    ElMessage.error('标记已读失败')
  }
}


// 修改分页切换处理
const handlePageChange = async (page: number) => {
  currentPage.value = page
  await loadNotifications() // 加载新页时自动标记
}

// 初始化加载
onMounted(() => {
  loadNotifications()
})

// 修改后的加载方法
const loadNotifications = async () => {
  try {
    loading.value = true
    const response = await request.get<{
      list: Notification[]
      total: number
    }>('/api/notifications', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })

    allNotifications.value = response.data.list
    total.value = response.data.total
    // 自动标记当前页为已读
    const currentPageIds = response.data.list.map(n => n.notificationId)
    await markBatchAsRead(currentPageIds)
    filterNotifications()
  } catch (error) {
    console.error('加载数据时发生错误:', error)
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}



const notificationsStore = useNotificationsStore()
const filterNotifications = () => {
  if (!Array.isArray(allNotifications.value)) return

  // 前端过滤逻辑保持不变
  const filtered = allNotifications.value.filter(item => {
    if (activeTab.value === 'REPLY_AND_COMMENT') {
      return item.type === 'REPLY' || item.type === 'COMMENT'
    }
    return item.type === activeTab.value
  })

  filteredNotifications.value = filtered

  // 更新未读数
  counts.value.replyComment = allNotifications.value.filter(n =>
    ['REPLY', 'COMMENT'].includes(n.type) && !n.isRead
  ).length
  counts.value.like = allNotifications.value.filter(n =>
    n.type === 'LIKE' && !n.isRead
  ).length
}
</script>

<style scoped lang="scss">
/* 样式部分保持不变 */
.notifications-container {
  display: flex;
  max-width: 1200px;
  margin: 20px auto;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,.1);

  .nav-sidebar {
    width: 240px;
    border-right: 1px solid #e7e7e7;

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #e7e7e7;

      h2 {
        margin: 0;
        font-size: 18px;
        color: #212121;
      }
    }

    .notification-menu {
      border-right: none;

      :deep(.el-menu-item) {
        height: 56px;
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #616161;
        transition: all .2s;

        &.is-active {
          color: #00a1d6;
          background: #f5fbff;
        }

        .el-icon {
          margin-right: 12px;
          font-size: 18px;
        }

        .unread-count {
          margin-left: auto;
          background: #f25d8e;
          color: #fff;
          font-size: 12px;
          min-width: 20px;
          height: 20px;
          line-height: 20px;
          text-align: center;
          border-radius: 10px;
          padding: 0 6px;
        }
      }
    }
  }

  .content-main {
    flex: 1;
    min-height: 600px;
    padding: 20px;

    .notification-list {
      .notification-item {
        display: flex;
        padding: 16px;
        border-radius: 4px;
        margin-bottom: 12px;
        transition: background .2s;
        cursor: pointer;

        &.unread {
          background: #f5fbff;
          position: relative;

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: #00a1d6;
            border-radius: 2px 0 0 2px;
          }
        }

        .avatar-wrapper {
          position: relative;
          margin-right: 16px;

          .notification-icon {
            position: absolute;
            right: -4px;
            bottom: -4px;
            background: #fff;
            border-radius: 50%;
            padding: 2px;
            box-shadow: 0 2px 4px rgba(0,0,0,.1);

            .el-icon {
              color: #00a1d6;
              font-size: 16px;
            }
          }
        }

        .content-wrapper {
          flex: 1;

          .content-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;

            .username {
              font-weight: 500;
              color: #212121;
              margin-right: 12px;
            }

            .time {
              color: #999;
              font-size: 12px;
              margin-right: 8px;
            }

            .type-tag {
              margin-left: auto;
            }
          }

          .content-body {
            color: #616161;
            line-height: 1.5;

            .message-text {
              margin-bottom: 8px;
            }

            .comment-preview {
              padding: 8px;
              background: #f5f5f5;
              border-radius: 4px;
              margin-bottom: 8px;
              font-size: 14px;
            }

            .content-link {
              display: block;
              font-size: 13px;
            }
          }
        }
      }
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }

    .text-only-empty {
      :deep(.el-empty__description) {
        margin-top: 0;
      }

      .text-empty-wrapper {
        text-align: center;

        .empty-icon {
          font-size: 48px;
          color: #999;
        }

        .empty-tip {
          margin-top: 8px;
          color: #999;
          font-size: 14px;
        }
      }
    }
  }
}
</style>