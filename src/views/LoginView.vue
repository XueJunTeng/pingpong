<!-- src/views/LoginView.vue -->
<template>
  <div class="auth-page">
    <div class="card">
      <h2>用户登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="form.username"
            type="text"
            required
            placeholder="请输入用户名"
            autocomplete="username"
          >
        </div>
        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            required
            placeholder="请输入密码"
            autocomplete="current-password"
          >
        </div>
        <button type="submit" :disabled="loading">
          <span v-if="loading">
            <Icon icon="svg-spinners:270-ring" class="loading-icon" />
            登录中...
          </span>
          <span v-else>立即登录</span>
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
      <div class="auth-links">
  <router-link :to="{ name: 'Register' }">注册新账号</router-link>
  <div
    v-if="showAdminHint"
    class="admin-guide"
  >
    <p>管理员账号请联系系统管理员获取</p>
    <a href="mailto:admin@example.com">申请权限</a>
  </div>
</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Icon } from '@iconify/vue'

const form = ref({
  username: '',
  password: ''
})
const loading = ref(false)
const error = ref('')
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showAdminHint = computed(() => {
  return route.query.redirect?.toString().startsWith('/admin')
})

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''
    await authStore.login(form.value)

    // 动态跳转逻辑
    const redirectPath = route.query.redirect?.toString()
    const defaultPath = authStore.isAdmin ? '/admin' : '/'
    const targetPath = redirectPath || defaultPath

    // 添加跳转动画
    document.body.classList.add('page-transition')
    setTimeout(() => {
      router.push(targetPath)
    }, 300)

  } catch (err: unknown) {
    handleLoginError(err)
  } finally {
    loading.value = false
  }
}

const handleLoginError = (err: unknown) => {
  if (err instanceof Error) {
    error.value = err.message
  } else if (typeof err === 'string') {
    error.value = err
  } else {
    error.value = '登录失败，请检查网络连接'
  }

  // 清空密码字段
  form.value.password = ''
}
</script>

<style scoped>
.admin-guide {
  margin-top: 1.5rem;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  text-align: center;
}

.admin-guide p {
  color: #6c757d;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.admin-guide a {
  color: #00aeec;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.admin-guide a:hover {
  color: #0095c7;
  text-decoration: underline;
}
.auth-page {
  max-width: 400px;
  margin: 4rem auto;
  padding: 1rem;
  background: #f4f5f7;
  min-height: 100vh;
}

.card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid #e7e7e9;
}

h2 {
  color: #18191c;
  font-size: 1.8rem;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 500;
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

label {
  display: block;
  color: #61666d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e7e7e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

input:focus {
  border-color: #00aeec;
  box-shadow: 0 0 0 3px rgba(0, 174, 236, 0.12);
  background: white;
  outline: none;
}

button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #00aeec, #00a1d6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}

button:hover {
  background: linear-gradient(135deg, #00a1d6, #0095c7);
  box-shadow: 0 4px 12px rgba(0, 174, 236, 0.24);
}

button:disabled {
  background: #e7e7e9;
  cursor: not-allowed;
  box-shadow: none;
}

.error-message {
  color: #ff4444;
  background: #fff0f0;
  padding: 12px;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.9rem;
  border: 1px solid #ffd0d0;
}

.auth-links {
  margin-top: 1.5rem;
  text-align: center;
}

.auth-links a {
  color: #00aeec;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s ease;
}

.auth-links a:hover {
  color: #0095c7;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.page-transition {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.admin-hint {
  display: block;
  margin-top: 1rem;
  color: #666;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.admin-hint:hover {
  color: #00aeec;
}

/* 保持优化样式 */
input::placeholder {
  color: #999;
  font-size: 0.95rem;
}

button {
  position: relative;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

button:active {
  transform: scale(0.98);
}
</style>
