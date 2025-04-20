<!-- src/layouts/MainLayout.vue -->
<template>
  <div class="main-layout">
    <!-- 公共导航栏 -->
    <NavBar />
    <!-- 页面内容插槽 -->
    <main class="content">
      <router-view /> <!-- 子路由页面在此渲染 -->
    </main>
  </div>
</template>

<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .content {
    flex: 1;/* 撑满剩余空间 */
  }
}
</style>
