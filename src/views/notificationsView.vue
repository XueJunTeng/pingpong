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
          <span v-if="counts.replyComment > 0" class="unread-count">
            {{ counts.replyComment }}
          </span>
        </el-menu-item>

        <el-menu-item index="LIKE">
          <el-icon><Goods /></el-icon>
          <span>收到的赞</span>
          <span v-if="counts.like > 0" class="unread-count">
            {{ counts.like }}
          </span>
        </el-menu-item>

        <!-- 系统通知 -->
        <el-menu-item index="SYSTEM">
          <el-icon><Bell /></el-icon>
          <span>系统通知</span>
          <span v-if="counts.system > 0" class="unread-count">
            {{ counts.system }}
          </span>
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
            :class="{
              unread: !item.isRead,
              'system-item': activeTab === 'SYSTEM'
            }"
            @click="markAsRead(item)"
          >
            <!-- 系统通知模板 -->
            <template v-if="activeTab === 'SYSTEM'">
              <div class="system-icon">
                <el-icon :color="getSystemIconColor(item)">
                  <component :is="getSystemIcon(item)" />
                </el-icon>
              </div>
              <div class="content-wrapper">
                <div class="content-header">
                  <span class="time">{{ formatTime(item.createdTime) }}</span>
                </div>
                <div class="content-body">
                  <!-- 驳回通知标题展示 -->
                  <div v-if="item.contentStatus === 'REJECTED'" class="content-title">
                    标题：{{ item.contentTitle }}
                  </div>

                  <div class="message-text">
                    {{ item.message }}
                    <span class="status-tag">
                   （状态：{{ getStatusText(item.contentStatus) }}）
                  </span>
                  </div>

                  <!-- 正常审核通过的跳转链接 -->
                  <el-link
                    v-if="showContentLink(item)"
                    type="info"
                    class="content-link"
                    @click.stop="navigateToContent(item)"
                  >
                    查看内容：{{ item.contentTitle }}
                  </el-link>
                </div>
              </div>
            </template>

            <!-- 普通通知模板 -->
            <template v-else>
              <div class="avatar-wrapper">
                <el-avatar
                  :src="item.senderAvatarUrl || '/default-avatar.png'"
                  :size="40"
                />
                <div class="notification-icon">
                  <component
                    :is="typeIcons[item.type]"
                    v-if="typeIcons[item.type]"
                  />
                </div>
              </div>

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
                    {{ itemTypeMap[item.type as keyof ItemTypeMap] || '消息' }}
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
                    @click.stop="navigateToContent(item)"
                  >
                    查看内容：{{ item.contentTitle }}
                  </el-link>
                </div>
              </div>
            </template>
          </div>
        </template>

        <el-empty v-else description="暂时没有新通知哦~" class="text-only-empty">
          <template #image>
            <div class="text-empty-wrapper">
              <el-icon class="empty-icon"><ChatDotRound /></el-icon>
              <p class="empty-tip">去和其他玩家互动吧！</p>
            </div>
          </template>
        </el-empty>
      </div>

      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :pager-count="5"
          layout="prev, pager, next"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChatDotRound, Goods, Bell, CircleCheck, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import type { Component } from 'vue'
import request from '@/api/request'
import { useNotificationsStore } from '@/stores/notifications'

interface Notification {
  notificationId: number
  senderId: number
  receiverId: number
  contentId: number
  commentId: number | null
  type: 'LIKE' | 'REPLY' | 'COMMENT' | 'SYSTEM'
  message: string
  isRead: boolean
  createdTime: string
  senderAvatarUrl: string
  senderUsername: string
  contentTitle: string
  commentContent: string | null
  contentType: string
  contentStatus?: 'APPROVED' | 'REJECTED' | 'PENDING'
}

interface ItemTypeMap {
  COMMENT: string
  REPLY: string
}

const route = useRoute()
const router = useRouter()
const notificationsStore = useNotificationsStore()

const sessionUnreadIds = ref<Set<number>>(new Set())
const isMounted = ref(false)
let abortController: AbortController | null = null

// 响应式状态
const activeTab = ref('REPLY_AND_COMMENT')
const loading = ref(false)
const filteredNotifications = ref<Notification[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 类型映射
const typeIcons: Record<string, Component> = {
  LIKE: Goods,
  REPLY: ChatDotRound,
  COMMENT: ChatDotRound,
  SYSTEM: Bell
}

const itemTypeMap: ItemTypeMap = {
  COMMENT: '评论',
  REPLY: '回复'
}

// 初始化计数
const counts = ref({
  replyComment: 0,
  like: 0,
  system: 0
})

// 核心数据加载
const loadData = async () => {
  if (!isMounted.value) return

  try {
    loading.value = true
    abortController?.abort()
    abortController = new AbortController()

    const [notificationsRes, countsRes] = await Promise.all([
      request.get<{
        list: Notification[]
        total: number
      }>('/api/notifications', {
        params: {
          page: currentPage.value,
          pageSize: pageSize.value,
          types: getNotificationTypes().join(',')
        },
        signal: abortController.signal
      }),
      request.get('/api/notifications/unread-counts', {
        signal: abortController.signal
      })
    ])

    if (!isMounted.value) return

    // 初始化未读ID
    const initialUnreadIds = notificationsRes.data.list
      .filter(item => !item.isRead)
      .map(item => item.notificationId)
    sessionUnreadIds.value = new Set(initialUnreadIds)

    // 处理通知列表
    filteredNotifications.value = notificationsRes.data.list.map(item => ({
      ...item,
      isRead: item.isRead,
      senderAvatarUrl: item.senderAvatarUrl || '/default-avatar.png',
      commentContent: item.commentContent || null
    }))

    total.value = notificationsRes.data.total

    // 更新计数
    const newCounts = {
      replyComment: Number(countsRes.data.data.replyComment ?? 0),
      like: Number(countsRes.data.data.like ?? 0),
      system: Number(countsRes.data.data.system ?? 0)
    }
    counts.value = newCounts
    notificationsStore.updateCounts(newCounts)

  } catch (error: unknown) {
    handleError(error)
  } finally {
    if (isMounted.value) loading.value = false
  }
}

// 系统通知相关方法
const getSystemIcon = (item: Notification): Component => {
  return item.contentStatus === 'APPROVED' ? CircleCheck : Warning
}

const getSystemIconColor = (item: Notification): string => {
  return item.contentStatus === 'APPROVED' ? '#67C23A' : '#E6A23C'
}

const showContentLink = (item: Notification): boolean => {
  // 仅审核通过且存在标题时显示链接
  return item.contentStatus === 'APPROVED' && !!item.contentTitle
}

const getStatusText = (status?: string): string => {
  switch(status?.toUpperCase()) {
    case 'APPROVED': return '已通过'
    case 'REJECTED': return '已驳回'
    case 'PENDING': return '审核中'
    default: return '未知状态'
  }
}

// 公共方法
const formatTime = (time: string) => dayjs(time).format('MM-DD HH:mm')

const handleError = (error: unknown) => {
  if (error instanceof Error && error.name === 'AbortError') return
  console.error('请求错误:', error)
  ElMessage.error(error instanceof Error ? error.message : '请求失败，请稍后重试')
}

const getNotificationTypes = (): string[] => {
  switch(activeTab.value) {
    case 'REPLY_AND_COMMENT': return ['COMMENT', 'REPLY']
    case 'LIKE': return ['LIKE']
    case 'SYSTEM': return ['SYSTEM']
    default: return []
  }
}

// 导航处理
const navigateToContent = (item: Notification) => {
  if (!item.contentId || !item.contentType) {
    return ElMessage.warning('内容参数不完整')
  }

  const routeMap: Record<string, string> = {
    article: 'ArticleDetail',
    video: 'VideoDetail',
    post: 'PostDetail'
  }

  const routeName = routeMap[item.contentType.toLowerCase()]
  if (!routeName) return ElMessage.error('未知内容类型')

  router.push({
    name: routeName,
    params: { contentId: item.contentId },
    query: { from: 'notification' }
  })
}

// 事件处理
const handleTabChange = (tab: string) => {
  if (tab === activeTab.value) return

  activeTab.value = tab
  currentPage.value = 1
  router.replace({ query: { ...route.query, type: tab } }).catch(() => {})
  loadData()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadData()
}

const markAsRead = (item: Notification) => {
  if (!item.isRead && sessionUnreadIds.value.has(item.notificationId)) {
    const updatedNotifications = filteredNotifications.value.map(n =>
      n.notificationId === item.notificationId ? { ...n, isRead: true } : n
    )
    filteredNotifications.value = updatedNotifications
    sessionUnreadIds.value.delete(item.notificationId)
  }
}

// 生命周期
onMounted(() => {
  isMounted.value = true
  const routeType = route.query.type?.toString()
  activeTab.value = routeType && ['REPLY_AND_COMMENT', 'LIKE', 'SYSTEM'].includes(routeType)
    ? routeType
    : 'REPLY_AND_COMMENT'
  loadData()
})

onUnmounted(async () => {
  isMounted.value = false
  abortController?.abort()

  try {
    if (sessionUnreadIds.value.size > 0) {
      await request.post('/api/notifications/batch-read', {
        ids: Array.from(sessionUnreadIds.value)
      })
    }
    const res = await request.get('/api/notifications/unread-counts')
    notificationsStore.updateCounts({
      replyComment: Number(res.data.replyComment ?? 0),
      like: Number(res.data.like ?? 0),
      system: Number(res.data.system ?? 0)
    })
  } catch (error) {
    console.error('退出处理失败:', error)
  }
})

// 路由监听
watch(
  () => route.query.type,
  (newType) => {
    if (newType && newType !== activeTab.value) {
      activeTab.value = newType.toString()
      currentPage.value = 1
      loadData()
    }
  }
)
</script>

<style scoped lang="scss">
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
        position: relative;

        &.unread {
          background: #f5fbff;
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

          &.system-item::before {
            background: #e6a23c;
          }
        }

        &.system-item {
          padding: 12px;
          align-items: flex-start;

          .system-icon {
            margin-right: 16px;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 8px;

            .el-icon {
              font-size: 24px;
            }
          }

          .content-wrapper {
            flex: 1;

            .message-text {
              font-weight: 500;
              color: #333;
              display: flex;
              align-items: center;

              .status-tag {
                color: #666;
                font-size: 0.9em;
                margin-left: 8px;

                &::before {
                  content: '•';
                  margin-right: 4px;
                }
              }
            }

            .content-link {
              margin-top: 8px;
            }
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
