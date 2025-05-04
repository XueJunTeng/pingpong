<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'

const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()
const baseInterval = ref(60000) // 动态轮询间隔（60秒 -> 3分钟）
const isOnline = ref(navigator.onLine) // 网络状态
let pollingTimer: ReturnType<typeof setInterval> | null = null

// 带认证检查的请求方法
const fetchUnread = async () => {
  if (!authStore.isAuthenticated || !isOnline.value) return

  try {
    await notificationsStore.fetchUnreadCounts()
  } catch (error) {
    console.error('未读数请求失败:', error)
    isOnline.value = false // 自动进入离线状态
  }
}

// 智能轮询控制器
const resetPolling = () => {
  if (pollingTimer) clearInterval(pollingTimer)

  // 仅在认证且在线时启动
  if (authStore.isAuthenticated && isOnline.value) {
    pollingTimer = setInterval(fetchUnread, baseInterval.value)
    console.debug('轮询间隔已更新:', baseInterval.value)
  }
}

// 网络状态处理
const handleNetworkChange = () => {
  isOnline.value = navigator.onLine
  console.log(`网络状态: ${isOnline.value ? '在线' : '离线'}`)

  if (isOnline.value && authStore.isAuthenticated) {
    fetchUnread() // 网络恢复立即刷新
    resetPolling() // 重启轮询
  } else {
    if (pollingTimer) clearInterval(pollingTimer)
  }
}

// 页面可见性处理
const handleVisibilityChange = () => {
  // 页面隐藏时延长轮询间隔（3分钟），可见时恢复（3秒）
  baseInterval.value = document.hidden ? 180000 : 3000

  if (authStore.isAuthenticated) {
    resetPolling()
  }
}

// 认证状态监听器
watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated) {
    console.log('检测到用户登录，启动消息轮询')
    if (isOnline.value) fetchUnread()
    resetPolling()
  } else {
    console.log('检测到用户登出，停止消息轮询')
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }
})

// 生命周期钩子
onMounted(async () => {
  // 初始化时如果已认证
  if (authStore.isAuthenticated && isOnline.value) {
    console.log('检测到已登录用户，初始化消息轮询')
    await fetchUnread()
    resetPolling()
  }

  // 注册事件监听
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('online', handleNetworkChange)
  window.addEventListener('offline', handleNetworkChange)
})

onUnmounted(() => {
  // 清理资源
  if (pollingTimer) clearInterval(pollingTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('online', handleNetworkChange)
  window.removeEventListener('offline', handleNetworkChange)
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  min-width: 100%;
  display: flex;
  flex-direction: column;
  background: #f1f2f3;
  padding-top: 60px;

  .container {
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
  }
}
</style>
