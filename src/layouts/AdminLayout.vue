<!-- src/layouts/AdminLayout.vue -->
<template>
  <div class="admin-container">
    <aside class="admin-sidebar">
      <h2>管理导航</h2>
      <nav>
        <router-link
          v-for="link in adminLinks"
          :key="link.path"
          :to="link.path"
          active-class="active-link"
        >
          {{ link.name }}
        </router-link>
      </nav>
    </aside>
    <main class="admin-main">
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const adminLinks = ref([
  {
    path: '/admin/users',
    name: '用户管理',
    icon: 'fas fa-users',
    meta: { title: '用户管理' }
  },
  {
    path: '/admin/content',
    name: '内容审核',
    icon: 'fas fa-file-contract',
    meta: { title: '内容审核' }
  },
  {
    path: '/admin/tags',
    name: '标签管理',
    icon: 'fas fa-file-tags',
    meta: { title: '内容审核' }
  },
  {
    path: '/admin/analytics',
    name: '数据统计',
    icon: 'fas fa-chart-line',
    meta: { title: '数据统计' }
  }
])
</script>

<style scoped>
.admin-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f6fa;
}

.admin-sidebar {
  width: 240px;
  padding: 20px;
  background-color: #2c3e50;
  color: white;
}

.admin-sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.admin-sidebar a {
  padding: 12px;
  border-radius: 6px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.3s;
}

.admin-sidebar a:hover {
  background-color: #34495e;
}

.active-link {
  background-color: #3498db !important;
  color: white !important;
}

.admin-main {
  flex: 1;
  padding: 24px;
  background-color: white;
  margin: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>