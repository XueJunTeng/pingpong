<template>
  <label class="bili-switch" :class="{ 'is-checked': checked }">
    <input
      type="checkbox"
      class="bili-switch__input"
      v-model="checked"
      @change="$emit('update:modelValue', checked)"
    />
    <div class="bili-switch__track">
      <div class="bili-switch__thumb"></div>
    </div>
  </label>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const checked = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  checked.value = newVal
})
</script>

<style scoped>
.bili-switch {
  --active-color: #00aeec; /* B站主题蓝 */
  --inactive-color: #cccccc;
  --thumb-size: 20px;
  --track-height: 24px;
  --track-width: 48px;

  display: inline-block;
  position: relative;
  cursor: pointer;
}

.bili-switch__input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.bili-switch__track {
  position: relative;
  width: var(--track-width);
  height: var(--track-height);
  border-radius: 12px;
  background-color: var(--inactive-color);
  transition: background-color 0.3s ease;
}

.bili-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: var(--thumb-size);
  height: var(--thumb-size);
  border-radius: 50%;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 激活状态 */
.bili-switch.is-checked .bili-switch__track {
  background-color: var(--active-color);
}

.bili-switch.is-checked .bili-switch__thumb {
  transform: translateX(24px); /* track-width - thumb-size - 2*offset */
}

/* 交互效果 */
.bili-switch__thumb::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
}

.bili-switch__input:focus-visible ~ .bili-switch__track {
  box-shadow: 0 0 0 3px rgba(0, 174, 236, 0.3);
}

/* 禁用状态 */
.bili-switch.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
