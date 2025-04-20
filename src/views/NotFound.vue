<!-- src/views/NotFound.vue -->
<template>
  <div class="not-found">
    <h1>404 - 页面不存在</h1>
    <router-link :to="{ name: 'Home' }">返回首页</router-link>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 100px 20px;
}
</style>