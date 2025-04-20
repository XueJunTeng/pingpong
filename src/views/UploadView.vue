<!-- src/views/UploadView.vue -->
<template>
  <div class="upload-view">
    <h1>上传内容</h1>
    <!-- 你的上传表单组件 -->
    <UploadForm />
  </div>
</template>

<script setup lang="ts">
import UploadForm from '@/components/ContentUpload.vue'
</script>

<style scoped>
.upload-view {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
