<!-- src/views/RegisterView.vue -->
<template>
  <div class="auth-page">
    <div class="card">
      <h2>用户注册</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="form.email" type="email" required>
        </div>
        <div class="form-group">
          <label>用户名</label>
          <input v-model="form.username" type="text" required>
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="form.password" type="password" required>
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '立即注册' }}
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
      <div class="auth-links">
        <router-link :to="{ name: 'Login' }">已有账号？立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const form = ref({
  email: '',
  username: '',
  password: ''
})
const loading = ref(false)
const error = ref('')
const router = useRouter()
const authStore = useAuthStore()

const handleRegister = async () => {
  try {
    loading.value = true
    await authStore.register(form.value)
    router.push({ name: 'Home' })
  } catch (err) {
  if (err instanceof Error) {
    error.value = err.message
  } else if (typeof err === 'string') {
    error.value = err
  } else {
    error.value = '未知错误'
  }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 与LoginView相同，保持统一风格 */
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
</style>
