<!-- src/views/ForbiddenView.vue -->
<template>
  <div class="forbidden-container">
    <div class="error-card">
      <h1 class="error-code">403</h1>
      <h2 class="error-title">访问被拒绝</h2>
      <p class="error-description">
        您没有权限访问此页面，请联系管理员获取权限
      </p>
      <div class="action-buttons">
        <router-link to="/" class="home-button">
          返回首页
        </router-link>
        <button @click="logout"  class="logout-button">
          切换账户
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()

const logout = () => {
  authStore.userlogout()
  // 跳转到登录页
  // 跳转时携带当前路径参数
  router.replace({
  name: 'Login',
  query: { redirect: '/admin' }  // 新增此行
  })
  // 显示成功提示
  ElMessage.success({
  message: '已安全退出系统',
  duration: 2000
})
}
</script>

<style scoped>
.forbidden-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.error-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.error-code {
  font-size: 72px;
  color: #e74c3c;
  margin: 0;
}

.error-title {
  color: #2c3e50;
  margin: 20px 0;
}

.error-description {
  color: #7f8c8d;
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.home-button,
.logout-button {
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s;
  cursor: pointer;
}

.home-button {
  background-color: #3498db;
  color: white;
  text-decoration: none;
}

.home-button:hover {
  background-color: #2980b9;
}

.logout-button {
  background-color: #e74c3c;
  color: white;
  border: none;
}

.logout-button:hover {
  background-color: #c0392b;
}
</style>
