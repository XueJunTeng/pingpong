<template>
  <div v-if="progress > 0" class="progress-bar-container">
    <div class="progress-bar" :style="{ width: progress + '%' }"></div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  progress: {
    type: Number,
    required: true
  }
})
</script>

<style scoped>
.progress-bar-container {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-bar {
  height: 100%;
  background-color: #00aeec;
  transition: width 0.3s ease;
}
</style>
