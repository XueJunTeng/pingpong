<template>
  <div class="file-uploader">
    <label>
      <input
        type="file"
        :accept="accept"
        @change="handleFileChange"
        aria-describedby="fileInputDesc"
        ref="fileInput"
      />
      <span id="fileInputDesc" class="visually-hidden">
        支持格式：{{ accept }} {{ maxSize ? `，最大${maxSize}MB` : '' }}
      </span>
    </label>

    <div v-if="selectedFile" class="file-preview">
      <span>{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</span>
      <button
        @click="clearFile"
        aria-label="清除已选文件"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  accept: string
  maxSize?: number
  modelValue?: File | null
}>()

const emit = defineEmits(['update:modelValue', 'file-change'])

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)

// 双向绑定处理
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
})

const formatFileSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const validateFileType = (file: File) => {
  if (!props.accept) return true

  const patterns = props.accept.split(',').map(p => {
    const trimmed = p.trim()
    if (trimmed.startsWith('.')) {
      return new RegExp(`\\${trimmed}$`, 'i')
    }
    const [type, subtype] = trimmed.split('/')
    return subtype === '*' ?
      new RegExp(`^${type}/`) :
      new RegExp(`^${trimmed}$`)
  })

  return patterns.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(file.type) || pattern.test(file.name)
    }
    return false
  })
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  // 允许重复选择相同文件
  await nextTick()
  input.value = ''

  if (!file) return

  // 类型验证
  if (!validateFileType(file)) {
    alert(`文件格式不支持，请上传 ${props.accept} 格式的文件`)
    selectedFile.value = null
    emit('update:modelValue', null)
    emit('file-change', null)
    return
  }

  // 大小验证
  if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
    alert(`文件大小不能超过 ${props.maxSize}MB`)
    selectedFile.value = null
    emit('update:modelValue', null)
    emit('file-change', null)
    return
  }

  selectedFile.value = file
  emit('update:modelValue', file)
  emit('file-change', file)
}

const clearFile = () => {
  selectedFile.value = null
  emit('update:modelValue', null)
  emit('file-change', null)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<style scoped>
/* 保持原有样式不变 */
.file-uploader {
  margin-top: 20px;
}

.file-preview {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
}

button {
  margin-left: 10px;
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  transition: color 0.2s;
}

button:hover {
  color: #cc0000;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>