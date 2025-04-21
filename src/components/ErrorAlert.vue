<!-- src/components/ErrorAlert.vue -->
<script setup lang="ts">
defineProps<{
  message: string
}>()

const emit = defineEmits(['dismiss'])
</script>

<template>
  <div class="error-alert">
    <span class="alert-icon">❗</span>
    <div class="alert-content">
      {{ message }}
    </div>
    <button class="close-btn" @click="emit('dismiss')">×</button>
  </div>
</template>

<style scoped>
.error-alert {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #fff6f6;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon {
  color: #dc3545;
  font-size: 18px;
}

.alert-content {
  color: #721c24;
  flex-grow: 1;
}

.close-btn {
  background: none;
  border: none;
  color: #721c24;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
}

.close-btn:hover {
  color: #dc3545;
}
</style>